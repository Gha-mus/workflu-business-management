import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  warehouseStock,
  qualityStandards,
  warehouseBatches,
  qualityInspections,
  inventoryConsumption,
  processingOperations,
  stockTransfers,
  inventoryAdjustments,
  type WarehouseStock,
  type QualityStandard,
  type InsertQualityStandard,
  type WarehouseBatch,
  type InsertWarehouseBatch,
  type QualityInspection,
  type InsertQualityInspection,
  type InventoryConsumption,
  type InsertInventoryConsumption,
  type ProcessingOperation,
  type InsertProcessingOperation,
  type StockTransfer,
  type InsertStockTransfer,
  type InventoryAdjustment,
  type InsertInventoryAdjustment,
} from "@shared/schema";

// Quality grading functions that need to be added to DatabaseStorage class
export const qualityGradingImplementations = `
  // Quality Standards operations
  async getQualityStandards(isActive?: boolean): Promise<QualityStandard[]> {
    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(qualityStandards.isActive, isActive));
    }
    
    return await db
      .select()
      .from(qualityStandards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityStandards.createdAt));
  }

  async getQualityStandard(id: string): Promise<QualityStandard | undefined> {
    const [result] = await db
      .select()
      .from(qualityStandards)
      .where(eq(qualityStandards.id, id));
    return result;
  }

  async createQualityStandard(standard: InsertQualityStandard): Promise<QualityStandard> {
    const [result] = await db
      .insert(qualityStandards)
      .values(standard)
      .returning();
    return result;
  }

  async updateQualityStandard(id: string, standard: Partial<InsertQualityStandard>): Promise<QualityStandard> {
    const [result] = await db
      .update(qualityStandards)
      .set({ ...standard, updatedAt: new Date() })
      .where(eq(qualityStandards.id, id))
      .returning();
    return result;
  }

  // Warehouse Batches operations
  async getWarehouseBatches(filter?: { supplierId?: string; qualityGrade?: string; isActive?: boolean }): Promise<WarehouseBatch[]> {
    const conditions = [];
    
    if (filter?.supplierId) {
      conditions.push(eq(warehouseBatches.supplierId, filter.supplierId));
    }
    if (filter?.qualityGrade) {
      conditions.push(eq(warehouseBatches.qualityGrade, filter.qualityGrade));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(warehouseBatches.isActive, filter.isActive));
    }
    
    return await db
      .select()
      .from(warehouseBatches)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(warehouseBatches.createdAt));
  }

  async getWarehouseBatch(id: string): Promise<WarehouseBatch | undefined> {
    const [result] = await db
      .select()
      .from(warehouseBatches)
      .where(eq(warehouseBatches.id, id));
    return result;
  }

  async createWarehouseBatch(batch: InsertWarehouseBatch): Promise<WarehouseBatch> {
    const [result] = await db
      .insert(warehouseBatches)
      .values(batch)
      .returning();
    return result;
  }

  async updateWarehouseBatch(id: string, batch: Partial<InsertWarehouseBatch>): Promise<WarehouseBatch> {
    const [result] = await db
      .update(warehouseBatches)
      .set({ ...batch, updatedAt: new Date() })
      .where(eq(warehouseBatches.id, id))
      .returning();
    return result;
  }

  async splitWarehouseBatch(batchId: string, splitQuantityKg: string, userId: string): Promise<{ originalBatch: WarehouseBatch; newBatch: WarehouseBatch }> {
    return await db.transaction(async (tx) => {
      const [originalBatch] = await tx
        .select()
        .from(warehouseBatches)
        .where(eq(warehouseBatches.id, batchId))
        .for('update');
      
      if (!originalBatch) {
        throw new Error('Batch not found');
      }

      const splitQuantity = parseFloat(splitQuantityKg);
      const originalQuantity = parseFloat(originalBatch.totalQuantityKg);

      if (splitQuantity >= originalQuantity) {
        throw new Error('Split quantity cannot be greater than or equal to original quantity');
      }

      // Update original batch
      const newOriginalQuantity = originalQuantity - splitQuantity;
      const [updatedOriginalBatch] = await tx
        .update(warehouseBatches)
        .set({ 
          totalQuantityKg: newOriginalQuantity.toString(),
          updatedAt: new Date() 
        })
        .where(eq(warehouseBatches.id, batchId))
        .returning();

      // Create new batch from split
      const [newBatch] = await tx
        .insert(warehouseBatches)
        .values({
          batchNumber: \`\${originalBatch.batchNumber}-SPLIT-\${Date.now()}\`,
          supplierId: originalBatch.supplierId,
          qualityGrade: originalBatch.qualityGrade,
          totalQuantityKg: splitQuantityKg,
          notes: \`Split from batch \${originalBatch.batchNumber}\`,
          createdById: userId,
        })
        .returning();

      return { originalBatch: updatedOriginalBatch, newBatch };
    });
  }

  async mergeWarehouseBatches(batchIds: string[], userId: string): Promise<WarehouseBatch> {
    return await db.transaction(async (tx) => {
      const batches = await tx
        .select()
        .from(warehouseBatches)
        .where(and(
          eq(warehouseBatches.id, batchIds[0]), // Simplified for now - should use IN
          eq(warehouseBatches.isActive, true)
        ))
        .for('update');

      if (batches.length !== batchIds.length) {
        throw new Error('Some batches not found or inactive');
      }

      // Verify all batches have same supplier and quality grade
      const firstBatch = batches[0];
      const allSameSupplier = batches.every(b => b.supplierId === firstBatch.supplierId);
      const allSameGrade = batches.every(b => b.qualityGrade === firstBatch.qualityGrade);

      if (!allSameSupplier || !allSameGrade) {
        throw new Error('Cannot merge batches with different suppliers or quality grades');
      }

      // Calculate total quantity
      const totalQuantity = batches.reduce((sum, batch) => sum + parseFloat(batch.totalQuantityKg), 0);

      // Create merged batch
      const [mergedBatch] = await tx
        .insert(warehouseBatches)
        .values({
          batchNumber: \`MERGED-\${Date.now()}\`,
          supplierId: firstBatch.supplierId,
          qualityGrade: firstBatch.qualityGrade,
          totalQuantityKg: totalQuantity.toString(),
          notes: \`Merged from batches: \${batches.map(b => b.batchNumber).join(', ')}\`,
          createdById: userId,
        })
        .returning();

      // Deactivate original batches
      for (const batchId of batchIds) {
        await tx
          .update(warehouseBatches)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(warehouseBatches.id, batchId));
      }

      return mergedBatch;
    });
  }

  // Quality Inspections operations
  async getQualityInspections(filter?: { status?: string; inspectionType?: string; batchId?: string }): Promise<QualityInspection[]> {
    const conditions = [];
    
    if (filter?.status) {
      conditions.push(eq(qualityInspections.status, filter.status));
    }
    if (filter?.inspectionType) {
      conditions.push(eq(qualityInspections.inspectionType, filter.inspectionType));
    }
    if (filter?.batchId) {
      conditions.push(eq(qualityInspections.batchId, filter.batchId));
    }
    
    return await db
      .select()
      .from(qualityInspections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityInspections.createdAt));
  }

  async getQualityInspection(id: string): Promise<QualityInspection | undefined> {
    const [result] = await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.id, id));
    return result;
  }

  async createQualityInspection(inspection: InsertQualityInspection): Promise<QualityInspection> {
    const [result] = await db
      .insert(qualityInspections)
      .values(inspection)
      .returning();
    return result;
  }

  async updateQualityInspection(id: string, inspection: Partial<InsertQualityInspection>): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set(inspection)
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async completeQualityInspection(id: string, results: {
    qualityGrade: string;
    overallScore?: string;
    testResults?: any;
    recommendations?: string;
    userId: string;
  }): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'completed',
        qualityGrade: results.qualityGrade,
        overallScore: results.overallScore,
        testResults: results.testResults,
        recommendations: results.recommendations,
        completedAt: new Date(),
        inspectedBy: results.userId,
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async approveQualityInspection(id: string, userId: string): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId,
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async rejectQualityInspection(id: string, rejectionReason: string, userId: string): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'rejected',
        rejectionReason,
        rejectedAt: new Date(),
        rejectedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  // Enhanced warehouse stock operations with quality and batch tracking
  async assignQualityGradeToStock(stockId: string, qualityGrade: string, qualityScore?: string, userId?: string): Promise<WarehouseStock> {
    const [result] = await db
      .update(warehouseStock)
      .set({
        qualityGrade,
        qualityScore,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stockId))
      .returning();
    
    if (!result) {
      throw new Error('Warehouse stock not found');
    }
    
    return result;
  }

  async assignBatchToStock(stockId: string, batchId: string, userId?: string): Promise<WarehouseStock> {
    // Verify batch exists
    const batch = await this.getWarehouseBatch(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    const [result] = await db
      .update(warehouseStock)
      .set({
        batchId,
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stockId))
      .returning();
    
    if (!result) {
      throw new Error('Warehouse stock not found');
    }
    
    return result;
  }

  async getStockWithQualityHistory(stockId: string): Promise<{
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    consumptions: InventoryConsumption[];
    transfers: StockTransfer[];
    adjustments: InventoryAdjustment[];
  }> {
    // Get the stock item
    const [stock] = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.id, stockId));

    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    // Get associated batch if exists
    let batch: WarehouseBatch | undefined;
    if (stock.batchId) {
      batch = await this.getWarehouseBatch(stock.batchId);
    }

    // Get quality inspections
    const inspections = await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.batchId, stock.batchId || ''))
      .orderBy(desc(qualityInspections.createdAt));

    // Get consumption records
    const consumptions = await db
      .select()
      .from(inventoryConsumption)
      .where(eq(inventoryConsumption.warehouseStockId, stockId))
      .orderBy(desc(inventoryConsumption.createdAt));

    // Get transfer records
    const transfers = await db
      .select()
      .from(stockTransfers)
      .where(eq(stockTransfers.warehouseStockId, stockId))
      .orderBy(desc(stockTransfers.createdAt));

    // Get adjustment records
    const adjustments = await db
      .select()
      .from(inventoryAdjustments)
      .where(eq(inventoryAdjustments.warehouseStockId, stockId))
      .orderBy(desc(inventoryAdjustments.createdAt));

    return {
      stock,
      batch,
      inspections,
      consumptions,
      transfers,
      adjustments,
    };
  }
`;