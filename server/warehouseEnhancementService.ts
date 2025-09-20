/**
 * Stage 3: Warehouse Enhancement Service
 * 
 * Implements missing Stage 3 requirements:
 * - Filtering alerts (orders waiting for filtering more than X days)
 * - Detailed supplier-level filtering reports
 * - Cost redistribution validation and testing
 */

import { db } from "./db";
import { 
  warehouseStock, 
  filterRecords,
  purchases,
  suppliers,
  orders
} from "@shared/schema";
import { eq, and, sum, sql, gte, lte, lt } from "drizzle-orm";
import Decimal from "decimal.js";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";
import { configurationService } from "./configurationService";
import { nanoid } from "nanoid";

export interface FilteringAlert {
  stockId: string;
  orderId: string;
  supplierName: string;
  quantityKg: number;
  daysWaiting: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
}

export interface SupplierFilteringReport {
  supplierId: string;
  supplierName: string;
  metrics: {
    totalProcessedKg: number;
    cleanOutputKg: number;
    nonCleanOutputKg: number;
    filterYieldPercent: number;
    averageYieldPercent: number;
    totalBatches: number;
    lastFilteringDate: Date | null;
  };
  qualityTrend: 'improving' | 'stable' | 'declining';
}

export interface CostRedistributionValidation {
  orderId: string;
  originalCostPerKg: number;
  redistributedCleanCostPerKg: number;
  totalInput: number;
  cleanOutput: number;
  nonCleanOutput: number;
  filterYield: number;
  costSavingsFromNonClean: number;
  isValid: boolean;
  errors: string[];
}

class WarehouseEnhancementService {
  private static instance: WarehouseEnhancementService;

  private constructor() {
    console.log("WarehouseEnhancementService initialized for Stage 3 enhancements");
  }

  public static getInstance(): WarehouseEnhancementService {
    if (!WarehouseEnhancementService.instance) {
      WarehouseEnhancementService.instance = new WarehouseEnhancementService();
    }
    return WarehouseEnhancementService.instance;
  }

  /**
   * Check for filtering alerts and send notifications
   */
  async checkFilteringAlerts(): Promise<FilteringAlert[]> {
    try {
      const alertThresholdDays = await configurationService.getNumericSetting('FILTERING_ALERT_THRESHOLD_DAYS', 3);
      
      // Get stock items awaiting filtering for more than threshold days
      const awaitingFilteringStock = await db
        .select({
          stockId: warehouseStock.id,
          orderId: warehouseStock.orderId,
          supplierId: warehouseStock.supplierId,
          quantityKg: warehouseStock.qtyKgTotal,
          createdAt: warehouseStock.createdAt,
          supplierName: suppliers.name,
        })
        .from(warehouseStock)
        .innerJoin(suppliers, eq(warehouseStock.supplierId, suppliers.id))
        .where(and(
          eq(warehouseStock.warehouse, 'FIRST'),
          eq(warehouseStock.status, 'AWAITING_FILTER')
        ));

      const alerts: FilteringAlert[] = [];
      const now = new Date();

      for (const stock of awaitingFilteringStock) {
        const daysWaiting = Math.floor(
          (now.getTime() - stock.createdAt!.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysWaiting >= alertThresholdDays) {
          let priority: 'low' | 'medium' | 'high' | 'critical';
          let recommendedAction: string;

          if (daysWaiting >= alertThresholdDays * 3) {
            priority = 'critical';
            recommendedAction = 'Immediate filtering required - risk of quality degradation';
          } else if (daysWaiting >= alertThresholdDays * 2) {
            priority = 'high';
            recommendedAction = 'Schedule filtering within 24 hours';
          } else if (daysWaiting >= alertThresholdDays * 1.5) {
            priority = 'medium';
            recommendedAction = 'Schedule filtering this week';
          } else {
            priority = 'low';
            recommendedAction = 'Plan filtering in current schedule';
          }

          alerts.push({
            stockId: stock.stockId,
            orderId: stock.orderId,
            supplierName: stock.supplierName,
            quantityKg: parseFloat(stock.quantityKg),
            daysWaiting,
            priority,
            recommendedAction,
          });

          // Send notification for high/critical alerts
          if (priority === 'high' || priority === 'critical') {
            await notificationService.createBusinessAlert({
              userId: 'system',
              alertType: 'operational_alert',
              alertCategory: 'operational_delay',
              priority: priority === 'critical' ? 'critical' : 'high',
              title: 'Filtering Delay Alert',
              message: `Order ${stock.orderId} from ${stock.supplierName} has been waiting ${daysWaiting} days for filtering (${stock.quantityKg}kg)`,
              entityType: 'warehouse_stock',
              entityId: stock.stockId,
              actionUrl: `/warehouse/filtering`,
              templateData: {
                orderId: stock.orderId,
                supplierName: stock.supplierName,
                quantityKg: stock.quantityKg,
                daysWaiting: daysWaiting.toString(),
                actionUrl: `/warehouse/filtering`,
              },
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error("Error checking filtering alerts:", error);
      return [];
    }
  }

  /**
   * Generate detailed supplier-level filtering reports
   */
  async generateSupplierFilteringReports(
    supplierId?: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<SupplierFilteringReport[]> {
    try {
      // Build query conditions
      const conditions = [];
      if (supplierId) {
        conditions.push(eq(filterRecords.purchaseId, purchases.id));
        conditions.push(eq(purchases.supplierId, supplierId));
      }
      if (dateRange) {
        conditions.push(gte(filterRecords.createdAt, dateRange.startDate));
        conditions.push(lte(filterRecords.createdAt, dateRange.endDate));
      }

      // Get filtering data grouped by supplier
      const filteringData = await db
        .select({
          supplierId: purchases.supplierId,
          supplierName: suppliers.name,
          inputKg: filterRecords.inputKg,
          outputCleanKg: filterRecords.outputCleanKg,
          outputNonCleanKg: filterRecords.outputNonCleanKg,
          filterYield: filterRecords.filterYield,
          createdAt: filterRecords.createdAt,
        })
        .from(filterRecords)
        .innerJoin(purchases, eq(filterRecords.purchaseId, purchases.id))
        .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Group data by supplier
      const supplierGroups = new Map<string, any[]>();
      for (const record of filteringData) {
        if (!supplierGroups.has(record.supplierId)) {
          supplierGroups.set(record.supplierId, []);
        }
        supplierGroups.get(record.supplierId)!.push(record);
      }

      const reports: SupplierFilteringReport[] = [];

      for (const [supplierId, records] of supplierGroups) {
        const supplierName = records[0].supplierName;
        
        // Calculate metrics
        const totalProcessedKg = records.reduce((sum, r) => sum + parseFloat(r.inputKg), 0);
        const cleanOutputKg = records.reduce((sum, r) => sum + parseFloat(r.outputCleanKg), 0);
        const nonCleanOutputKg = records.reduce((sum, r) => sum + parseFloat(r.outputNonCleanKg), 0);
        const averageYieldPercent = records.reduce((sum, r) => sum + parseFloat(r.filterYield), 0) / records.length;
        const filterYieldPercent = totalProcessedKg > 0 ? (cleanOutputKg / totalProcessedKg) * 100 : 0;
        
        // Determine quality trend (simplified - would use historical comparison)
        let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
        if (records.length >= 3) {
          const recent = records.slice(-3).reduce((sum, r) => sum + parseFloat(r.filterYield), 0) / 3;
          const earlier = records.slice(0, -3).reduce((sum, r) => sum + parseFloat(r.filterYield), 0) / Math.max(records.length - 3, 1);
          
          if (recent > earlier + 2) qualityTrend = 'improving';
          else if (recent < earlier - 2) qualityTrend = 'declining';
        }

        reports.push({
          supplierId,
          supplierName,
          metrics: {
            totalProcessedKg,
            cleanOutputKg,
            nonCleanOutputKg,
            filterYieldPercent,
            averageYieldPercent,
            totalBatches: records.length,
            lastFilteringDate: records.length > 0 ? new Date(Math.max(...records.map(r => r.createdAt.getTime()))) : null,
          },
          qualityTrend,
        });
      }

      return reports.sort((a, b) => b.metrics.totalProcessedKg - a.metrics.totalProcessedKg);
    } catch (error) {
      console.error("Error generating supplier filtering reports:", error);
      throw new Error(`Failed to generate supplier filtering reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate cost redistribution logic
   */
  async validateCostRedistribution(orderId: string): Promise<CostRedistributionValidation> {
    try {
      // Get purchase data for the order
      const [purchase] = await db
        .select()
        .from(purchases)
        .where(eq(purchases.orderId, orderId));

      if (!purchase) {
        throw new Error(`No purchase found for order ${orderId}`);
      }

      // Get filtering record
      const [filterRecord] = await db
        .select()
        .from(filterRecords)
        .where(eq(filterRecords.purchaseId, purchase.id));

      if (!filterRecord) {
        throw new Error(`No filtering record found for purchase ${purchase.id}`);
      }

      // Get warehouse stock after filtering
      const [warehouseStockRecord] = await db
        .select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.orderId, orderId),
          eq(warehouseStock.warehouse, 'FIRST')
        ));

      if (!warehouseStockRecord) {
        throw new Error(`No warehouse stock found for order ${orderId}`);
      }

      // Calculate cost redistribution
      const originalCostPerKg = parseFloat(purchase.pricePerKg);
      const totalInput = parseFloat(filterRecord.inputKg);
      const cleanOutput = parseFloat(filterRecord.outputCleanKg);
      const nonCleanOutput = parseFloat(filterRecord.outputNonCleanKg);
      const filterYield = parseFloat(filterRecord.filterYield);

      // Cost redistribution logic: all cost goes to clean output, non-clean gets zero cost
      const redistributedCleanCostPerKg = totalInput > 0 && cleanOutput > 0 
        ? (originalCostPerKg * totalInput) / cleanOutput 
        : 0;

      const costSavingsFromNonClean = originalCostPerKg * nonCleanOutput;
      
      // Validation checks
      const errors: string[] = [];
      
      // Check if unit cost was properly updated
      const currentUnitCost = parseFloat(warehouseStockRecord.unitCostCleanUsd || '0');
      const expectedUnitCost = redistributedCleanCostPerKg;
      
      if (Math.abs(currentUnitCost - expectedUnitCost) > 0.01) {
        errors.push(`Unit cost mismatch: Expected ${expectedUnitCost.toFixed(4)}, got ${currentUnitCost.toFixed(4)}`);
      }

      // Check quantities
      const expectedCleanKg = parseFloat(warehouseStockRecord.qtyKgClean);
      if (Math.abs(expectedCleanKg - cleanOutput) > 0.01) {
        errors.push(`Clean quantity mismatch: Expected ${cleanOutput}, got ${expectedCleanKg}`);
      }

      const expectedNonCleanKg = parseFloat(warehouseStockRecord.qtyKgNonClean);
      if (Math.abs(expectedNonCleanKg - nonCleanOutput) > 0.01) {
        errors.push(`Non-clean quantity mismatch: Expected ${nonCleanOutput}, got ${expectedNonCleanKg}`);
      }

      // Check filter yield
      const calculatedYield = totalInput > 0 ? (cleanOutput / totalInput) * 100 : 0;
      if (Math.abs(calculatedYield - filterYield) > 0.01) {
        errors.push(`Filter yield mismatch: Expected ${calculatedYield.toFixed(2)}%, got ${filterYield.toFixed(2)}%`);
      }

      const validation: CostRedistributionValidation = {
        orderId,
        originalCostPerKg,
        redistributedCleanCostPerKg,
        totalInput,
        cleanOutput,
        nonCleanOutput,
        filterYield,
        costSavingsFromNonClean,
        isValid: errors.length === 0,
        errors,
      };

      // Log validation result
      await auditService.logOperation(
        {
          userId: 'system',
          userName: 'Warehouse Enhancement Service',
          source: 'warehouse_enhancement',
          severity: validation.isValid ? 'info' : 'warning',
        },
        {
          entityType: 'warehouse_stock',
          entityId: warehouseStockRecord.id,
          action: 'view',
          operationType: 'cost_redistribution_validation',
          description: `Cost redistribution validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`,
          newValues: validation,
          businessContext: `Validation of cost redistribution logic for order ${orderId}`,
        }
      );

      return validation;
    } catch (error) {
      console.error("Error validating cost redistribution:", error);
      throw new Error(`Failed to validate cost redistribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-correct cost redistribution if validation fails
   */
  async autoCorrectCostRedistribution(orderId: string, userId: string): Promise<boolean> {
    try {
      const validation = await this.validateCostRedistribution(orderId);
      
      if (validation.isValid) {
        console.log(`Cost redistribution for order ${orderId} is already valid`);
        return true;
      }

      console.log(`Auto-correcting cost redistribution for order ${orderId}`);

      // Update warehouse stock with correct unit cost
      await db
        .update(warehouseStock)
        .set({
          unitCostCleanUsd: validation.redistributedCleanCostPerKg.toString(),
          qtyKgClean: validation.cleanOutput.toString(),
          qtyKgNonClean: validation.nonCleanOutput.toString(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(warehouseStock.orderId, orderId),
          eq(warehouseStock.warehouse, 'FIRST')
        ));

      // Log the correction
      await auditService.logOperation(
        {
          userId,
          userName: 'Warehouse Enhancement Service',
          source: 'warehouse_enhancement',
          severity: 'info',
        },
        {
          entityType: 'warehouse_stock',
          entityId: orderId,
          action: 'update',
          operationType: 'cost_redistribution_correction',
          description: `Auto-corrected cost redistribution`,
          newValues: {
            correctedUnitCost: validation.redistributedCleanCostPerKg,
            correctedCleanKg: validation.cleanOutput,
            correctedNonCleanKg: validation.nonCleanOutput,
            originalErrors: validation.errors,
          },
          businessContext: `Cost redistribution auto-correction for order ${orderId}`,
        }
      );

      // Verify the correction
      const revalidation = await this.validateCostRedistribution(orderId);
      return revalidation.isValid;
    } catch (error) {
      console.error("Error auto-correcting cost redistribution:", error);
      return false;
    }
  }
}

// Export singleton instance
export const warehouseEnhancementService = WarehouseEnhancementService.getInstance();