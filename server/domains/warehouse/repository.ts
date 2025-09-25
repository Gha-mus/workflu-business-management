import { db } from "../../core/db";
import { 
  warehouseStock, 
  filterRecords,
  warehouseBatches,
  type WarehouseStock, 
  type InsertWarehouseStock,
  type FilterRecord,
  type InsertFilterRecord,
  type WarehouseBatch,
  type InsertWarehouseBatch
} from "@shared/schema";
import { BaseRepository } from "../../shared/base/BaseRepository";
import type { AuditContext } from "../../auditService";
import { eq, sql, and, inArray } from "drizzle-orm";

export class WarehouseRepository extends BaseRepository<WarehouseStock, InsertWarehouseStock> {
  protected table = warehouseStock;
  protected tableName = 'warehouseStock';

  async findByStatus(status: string): Promise<WarehouseStock[]> {
    const results = await db
      .select()
      .from(warehouseStock)
      .where(sql`${warehouseStock.status} = ${status}`)
      .orderBy(warehouseStock.createdAt);
    
    return results;
  }

  async findByWarehouse(warehouse: string): Promise<WarehouseStock[]> {
    const results = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.warehouse, warehouse))
      .orderBy(warehouseStock.createdAt);
    
    return results;
  }

  async findByPurchaseId(purchaseId: string): Promise<WarehouseStock[]> {
    const results = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.purchaseId, purchaseId))
      .orderBy(warehouseStock.createdAt);
    
    return results;
  }

  async updateStatus(
    id: string, 
    status: string, 
    auditContext?: AuditContext
  ): Promise<WarehouseStock> {
    // Get old values for audit
    const [oldStock] = await db.select().from(warehouseStock).where(eq(warehouseStock.id, id));
    
    const [updated] = await db
      .update(warehouseStock)
      .set({ 
        status: status as any, 
        updatedAt: new Date() 
      })
      .where(eq(warehouseStock.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Warehouse stock with id ${id} not found`);
    }

    if (auditContext) {
      await this.logAuditOperation('update', id, { status }, oldStock, auditContext);
    }

    return updated;
  }

  async moveToFinalWarehouse(
    stockId: string, 
    auditContext?: AuditContext
  ): Promise<WarehouseStock> {
    return await this.runInTransaction(async (tx) => {
      // Get current stock
      const [currentStock] = await tx
        .select()
        .from(warehouseStock)
        .where(eq(warehouseStock.id, stockId));

      if (!currentStock) {
        throw new Error(`Warehouse stock with id ${stockId} not found`);
      }

      // Update to final warehouse
      const [updated] = await tx
        .update(warehouseStock)
        .set({
          warehouse: 'final',
          status: 'ready_for_sale',
          updatedAt: new Date()
        })
        .where(eq(warehouseStock.id, stockId))
        .returning();

      if (auditContext) {
        await this.logAuditOperation(
          'update', 
          stockId, 
          { warehouse: 'final', status: 'ready_for_sale' }, 
          currentStock, 
          auditContext
        );
      }

      return updated;
    });
  }

  private async logAuditOperation(
    action: 'create' | 'update' | 'delete',
    entityId: string,
    newValues: any,
    oldValues: any,
    auditContext: AuditContext
  ): Promise<void> {
    const { auditService } = await import("../../auditService");
    
    await auditService.logOperation(auditContext, {
      entityType: this.tableName,
      entityId,
      action,
      newValues,
      oldValues,
      description: `${action} warehouse stock`,
      businessContext: `Warehouse management - ${action} stock`
    });
  }
}

export class FilterRecordRepository extends BaseRepository<FilterRecord, InsertFilterRecord> {
  protected table = filterRecords;
  protected tableName = 'filterRecords';

  async findByPurchaseId(purchaseId: string): Promise<FilterRecord[]> {
    const results = await db
      .select()
      .from(filterRecords)
      .where(eq(filterRecords.purchaseId, purchaseId))
      .orderBy(filterRecords.createdAt);
    
    return results;
  }

  async executeFilterOperation(
    purchaseId: string,
    outputCleanKg: string,
    outputNonCleanKg: string,
    userId: string,
    auditContext?: AuditContext
  ): Promise<{ filterRecord: FilterRecord; updatedStock: WarehouseStock[] }> {
    return await this.runInTransaction(async (tx) => {
      // Create filter record
      const [filterRecord] = await tx
        .insert(filterRecords)
        .values({
          purchaseId,
          outputCleanKg,
          outputNonCleanKg,
          userId,
          date: new Date(),
          notes: `Filter operation: ${outputCleanKg}kg clean, ${outputNonCleanKg}kg non-clean`
        })
        .returning();

      // Update related warehouse stock
      const updatedStock = await tx
        .update(warehouseStock)
        .set({
          cleanKg: outputCleanKg,
          nonCleanKg: outputNonCleanKg,
          status: 'filtered',
          updatedAt: new Date()
        })
        .where(eq(warehouseStock.purchaseId, purchaseId))
        .returning();

      if (auditContext) {
        const { auditService } = await import("../../auditService");
        await auditService.logOperation(auditContext, {
          entityType: this.tableName,
          entityId: filterRecord.id,
          action: 'create',
          newValues: { purchaseId, outputCleanKg, outputNonCleanKg },
          description: 'Filter operation executed',
          businessContext: 'Warehouse filtering operation'
        });
      }

      return { filterRecord, updatedStock };
    });
  }

  // Transaction-aware method for cross-domain operations
  async createWarehouseStockWithTransaction(tx: any, stockData: any): Promise<void> {
    await tx
      .insert(warehouseStock)
      .values(stockData);
  }
}

export class WarehouseBatchRepository extends BaseRepository<WarehouseBatch, InsertWarehouseBatch> {
  protected table = warehouseBatches;
  protected tableName = 'warehouseBatches';

  async findByWarehouse(warehouse: string): Promise<WarehouseBatch[]> {
    const results = await db
      .select()
      .from(warehouseBatches)
      .where(sql`${warehouseBatches.warehouseLocation} = ${warehouse}`)
      .orderBy(warehouseBatches.createdAt);
    
    return results;
  }

  async findByStatus(status: string): Promise<WarehouseBatch[]> {
    const results = await db
      .select()
      .from(warehouseBatches)
      .where(sql`${warehouseBatches.batchStatus} = ${status}`)
      .orderBy(warehouseBatches.createdAt);
    
    return results;
  }
}