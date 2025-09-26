/**
 * Stage 5: Supply Inventory Enhancement Service
 * 
 * Implements missing Stage 5 requirements:
 * - Supply inventory management system (purchase supplies first, then deduct during packing)
 * - Consumption audit reports
 * - Automatic deduction during packing operations
 */

import { db } from "./db";
import { 
  supplyInventory,
  supplyPurchases,
  supplyConsumption,
  operatingExpenses,
  capitalEntries,
  orders
} from "@shared/schema";
import { eq, and, sum, sql, gte, lte, lt } from "drizzle-orm";
import Decimal from "decimal.js";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";
import { configurationService } from "./configurationService";
import { nanoid } from "nanoid";

export interface SupplyPurchaseRequest {
  supplierId: string;
  items: Array<{
    itemType: 'cartons' | 'tape' | 'labels' | 'other';
    itemName: string;
    itemDescription?: string;
    quantity: number;
    unitOfMeasure: string;
    unitCost: number;
  }>;
  currency: string;
  exchangeRate?: number;
  fundingSource: 'capital' | 'external';
  notes?: string;
}

export interface PackingConsumption {
  orderId: string;
  warehouseStockId?: string;
  packingOperation: 'packing' | 'labeling' | 'wrapping';
  cartonsProcessed: number;
  supplies: Array<{
    supplyInventoryId: string;
    quantityConsumed: number;
    consumptionReason?: string;
  }>;
}

export interface SupplyInventoryAlert {
  supplyInventoryId: string;
  itemName: string;
  currentStock: number;
  minimumLevel: number;
  reorderLevel: number;
  alertType: 'low_stock' | 'reorder_needed' | 'out_of_stock';
  recommendedOrderQuantity: number;
  estimatedCost: number;
}

export interface ConsumptionAuditReport {
  period: { startDate: Date; endDate: Date };
  totalConsumption: {
    totalValueUsd: number;
    totalItems: number;
    byItemType: Record<string, { quantity: number; value: number }>;
    byOperation: Record<string, { quantity: number; value: number }>;
    byOrder: Array<{ orderId: string; totalValue: number; items: number }>;
  };
  efficiencyMetrics: {
    consumptionPerCarton: number;
    costPerCarton: number;
    wastePercentage: number;
  };
  recommendations: string[];
}

class SupplyInventoryService {
  private static instance: SupplyInventoryService;

  private constructor() {
    console.log("OperatingExpenseEnhancementService initialized for Stage 5 operating expenses");
  }

  public static getInstance(): SupplyInventoryService {
    if (!SupplyInventoryService.instance) {
      SupplyInventoryService.instance = new SupplyInventoryService();
    }
    return SupplyInventoryService.instance;
  }

  /**
   * Purchase supplies and update inventory
   */
  async purchaseSupplies(
    request: SupplyPurchaseRequest,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Purchasing supplies from supplier ${request.supplierId}: ${request.items.length} items`);

      // Get exchange rate
      const exchangeRate = request.currency === 'USD' ? 1.0 : 
        (request.exchangeRate || await configurationService.getCentralExchangeRate());

      let totalAmount = 0;
      const purchaseResults = [];

      for (const item of request.items) {
        // Check if supply inventory item exists, create if not
        let [supplyItem] = await db
          .select()
          .from(supplyInventory)
          .where(and(
            eq(supplyInventory.itemType, item.itemType),
            eq(supplyInventory.itemName, item.itemName)
          ));

        if (!supplyItem) {
          // Create new supply inventory item
          [supplyItem] = await db
            .insert(supplyInventory)
            .values({
              itemType: item.itemType,
              itemName: item.itemName,
              itemDescription: item.itemDescription,
              unitOfMeasure: item.unitOfMeasure,
              currentStock: '0',
              minimumLevel: '10', // Default minimum level
              reorderLevel: '50', // Default reorder level
              unitCost: item.unitCost.toString(),
              totalValue: '0',
            })
            .returning();
        }

        const itemTotalCost = item.quantity * item.unitCost;
        const itemTotalCostUsd = request.currency === 'USD' ? itemTotalCost : itemTotalCost / exchangeRate;
        totalAmount += itemTotalCostUsd;

        // Create supply purchase record
        const purchaseNumber = `SUP-${nanoid(8)}`;
        const [purchase] = await db
          .insert(supplyPurchases)
          .values({
            purchaseNumber,
            supplierId: request.supplierId,
            supplyInventoryId: supplyItem.id,
            quantity: item.quantity.toString(),
            unitPrice: item.unitCost.toString(),
            totalAmount: itemTotalCost.toString(),
            currency: request.currency,
            exchangeRate: exchangeRate.toString(),
            amountUsd: itemTotalCostUsd.toString(),
            fundingSource: request.fundingSource,
            amountPaid: itemTotalCostUsd.toString(), // Assume paid in full
            remaining: '0',
            receivedDate: new Date(),
            createdBy: userId,
          })
          .returning();

        // Update supply inventory stock and value
        const currentStock = parseFloat(supplyItem.currentStock);
        const currentValue = parseFloat(supplyItem.totalValue);
        const newStock = currentStock + item.quantity;
        const newValue = currentValue + itemTotalCostUsd;
        const newUnitCost = newStock > 0 ? newValue / newStock : item.unitCost;

        await db
          .update(supplyInventory)
          .set({
            currentStock: newStock.toString(),
            totalValue: newValue.toString(),
            unitCost: newUnitCost.toString(),
            lastPurchaseDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(supplyInventory.id, supplyItem.id));

        purchaseResults.push({
          supplyInventoryId: supplyItem.id,
          itemName: item.itemName,
          purchaseId: purchase.id,
          quantityPurchased: item.quantity,
          costUsd: itemTotalCostUsd,
        });
      }

      // Create capital entry if funded from capital
      if (request.fundingSource === 'capital') {
        await db
          .insert(capitalEntries)
          .values({
            entryId: `SUP-${nanoid(8)}`,
            amount: totalAmount.toString(),
            type: 'CapitalOut',
            reference: `supply_purchase_${purchaseResults[0]?.purchaseId}`,
            description: `Supply purchase: ${request.items.length} items`,
            paymentCurrency: request.currency,
            exchangeRate: exchangeRate.toString(),
            fundingSource: 'external',
            isValidated: true,
            validatedBy: userId,
            validatedAt: new Date(),
            createdBy: userId,
          });
      }

      // Create operating expense record
      await db
        .insert(operatingExpenses)
        .values({
          expenseNumber: `EXP-SUP-${nanoid(8)}`,
          expenseType: 'supplies',
          amount: totalAmount.toString(),
          currency: request.currency,
          exchangeRate: exchangeRate.toString(),
          amountUsd: totalAmount.toString(),
          description: `Supply inventory purchase: ${request.items.length} items`,
          fundingSource: request.fundingSource,
          expenseDate: new Date(),
          createdBy: userId,
        });

      // Log the supply purchase
      await auditService.logOperation(
        {
          userId,
          userName: 'Supply Inventory Service',
          source: 'supply_inventory',
          severity: 'info',
        },
        {
          entityType: 'supply_purchases',
          entityId: purchaseResults[0]?.purchaseId || 'batch',
          action: 'create',
          operationType: 'supply_purchase',
          description: `Supply purchase: ${request.items.length} items totaling $${totalAmount.toFixed(2)}`,
          newValues: {
            supplierId: request.supplierId,
            itemCount: request.items.length,
            totalAmountUsd: totalAmount,
            fundingSource: request.fundingSource,
            items: purchaseResults,
          },
          businessContext: `Supply inventory purchase for ${request.items.length} different items`,
        }
      );

      return purchaseResults[0]?.purchaseId || 'batch_purchase';
    } catch (error) {
      console.error("Error purchasing supplies:", error);
      throw new Error(`Failed to purchase supplies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Consume supplies during packing operations
   */
  async consumeSuppliesDuringPacking(
    consumption: PackingConsumption,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Consuming supplies for packing operation: ${consumption.packingOperation} (Order: ${consumption.orderId})`);

      let totalConsumptionCost = 0;
      const consumptionResults = [];

      for (const supply of consumption.supplies) {
        // Get supply inventory item
        const [supplyItem] = await db
          .select()
          .from(supplyInventory)
          .where(eq(supplyInventory.id, supply.supplyInventoryId));

        if (!supplyItem) {
          throw new Error(`Supply inventory item ${supply.supplyInventoryId} not found`);
        }

        const currentStock = parseFloat(supplyItem.currentStock);
        if (currentStock < supply.quantityConsumed) {
          throw new Error(`Insufficient stock for ${supplyItem.itemName}: ${currentStock} available, ${supply.quantityConsumed} requested`);
        }

        const unitCost = parseFloat(supplyItem.unitCost);
        const consumptionCost = supply.quantityConsumed * unitCost;
        totalConsumptionCost += consumptionCost;

        // Create consumption record
        const consumptionNumber = `CON-${nanoid(8)}`;
        const [consumptionRecord] = await db
          .insert(supplyConsumption)
          .values({
            consumptionNumber,
            supplyId: supply.supplyInventoryId,
            quantityConsumed: supply.quantityConsumed.toString(),
            unitCostUsd: unitCost.toString(),
            totalCostUsd: consumptionCost.toString(),
            orderId: consumption.orderId,
            warehouseStockId: consumption.warehouseStockId,
            packingOperation: consumption.packingOperation,
            cartonsProcessed: consumption.cartonsProcessed,
            consumptionType: 'automatic',
            consumedBy: userId,
          })
          .returning();

        // Update supply inventory
        const newStock = currentStock - supply.quantityConsumed;
        const currentValue = parseFloat(supplyItem.totalValue);
        const newValue = Math.max(0, currentValue - consumptionCost);

        await db
          .update(supplyInventory)
          .set({
            currentStock: newStock.toString(),
            totalValue: newValue.toString(),
            lastUsageDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(supplyInventory.id, supply.supplyInventoryId));

        consumptionResults.push({
          supplyInventoryId: supply.supplyInventoryId,
          itemName: supplyItem.itemName,
          consumptionId: consumptionRecord.id,
          quantityConsumed: supply.quantityConsumed,
          costUsd: consumptionCost,
          remainingStock: newStock,
        });
      }

      // Log the consumption
      await auditService.logOperation(
        {
          userId,
          userName: 'Supply Inventory Service',
          source: 'supply_inventory',
          severity: 'info',
        },
        {
          entityType: 'supply_consumption',
          entityId: consumption.orderId,
          action: 'create',
          operationType: 'supply_consumption',
          description: `Supply consumption during ${consumption.packingOperation}: ${consumption.cartonsProcessed} cartons`,
          newValues: {
            orderId: consumption.orderId,
            packingOperation: consumption.packingOperation,
            cartonsProcessed: consumption.cartonsProcessed,
            totalCostUsd: totalConsumptionCost,
            items: consumptionResults,
          },
          businessContext: `Supply consumption for order ${consumption.orderId}`,
        }
      );

      // Check for low stock alerts after consumption
      await this.checkLowStockAlerts();

      return consumptionResults[0]?.consumptionId || 'batch_consumption';
    } catch (error) {
      console.error("Error consuming supplies:", error);
      throw new Error(`Failed to consume supplies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check for low stock alerts
   */
  async checkLowStockAlerts(): Promise<SupplyInventoryAlert[]> {
    try {
      const allSupplies = await db
        .select()
        .from(supplyInventory)
        .where(eq(supplyInventory.isActive, true));

      const alerts: SupplyInventoryAlert[] = [];

      for (const supply of allSupplies) {
        const currentStock = parseFloat(supply.currentStock);
        const minimumLevel = parseFloat(supply.minimumLevel);
        const reorderLevel = parseFloat(supply.reorderLevel);
        const unitCost = parseFloat(supply.unitCost);

        let alertType: 'low_stock' | 'reorder_needed' | 'out_of_stock';
        let recommendedOrderQuantity = 0;

        if (currentStock <= 0) {
          alertType = 'out_of_stock';
          recommendedOrderQuantity = reorderLevel;
        } else if (currentStock <= minimumLevel) {
          alertType = 'low_stock';
          recommendedOrderQuantity = reorderLevel - currentStock;
        } else if (currentStock <= reorderLevel) {
          alertType = 'reorder_needed';
          recommendedOrderQuantity = reorderLevel - currentStock;
        } else {
          continue; // No alert needed
        }

        const estimatedCost = recommendedOrderQuantity * unitCost;

        alerts.push({
          supplyInventoryId: supply.id,
          itemName: supply.itemName,
          currentStock,
          minimumLevel,
          reorderLevel,
          alertType,
          recommendedOrderQuantity,
          estimatedCost,
        });

        // Send notification for critical alerts
        if (alertType === 'out_of_stock' || (alertType === 'low_stock' && currentStock <= minimumLevel * 0.5)) {
          await notificationService.createBusinessAlert({
            userId: 'system',
            alertType: 'threshold_alert',
            alertCategory: 'inventory_level',
            priority: alertType === 'out_of_stock' ? 'critical' : 'high',
            title: `Supply Inventory ${alertType.replace('_', ' ').toUpperCase()}`,
            message: `${supply.itemName}: ${currentStock} ${supply.unitOfMeasure} remaining (minimum: ${minimumLevel})`,
            entityType: 'supply_inventory',
            entityId: supply.id,
            actionUrl: `/supplies/inventory`,
            templateData: {
              itemName: supply.itemName,
              currentStock: currentStock.toString(),
              minimumLevel: minimumLevel.toString(),
              recommendedOrder: recommendedOrderQuantity.toString(),
              unit: supply.unitOfMeasure,
              actionUrl: `/supplies/inventory`,
            },
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error("Error checking low stock alerts:", error);
      return [];
    }
  }

  /**
   * Generate consumption audit report
   */
  async generateConsumptionAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<ConsumptionAuditReport> {
    try {
      // Get all consumption records in the period
      const consumptionData = await db
        .select({
          consumptionId: supplyConsumption.id,
          supplyId: supplyConsumption.supplyId,
          quantityConsumed: supplyConsumption.quantityConsumed,
          totalCostUsd: supplyConsumption.totalCostUsd,
          orderId: supplyConsumption.orderId,
          packingOperation: supplyConsumption.packingOperation,
          cartonsProcessed: supplyConsumption.cartonsProcessed,
          consumedAt: supplyConsumption.consumedAt,
          itemType: supplyInventory.itemType,
          itemName: supplyInventory.itemName,
          unitOfMeasure: supplyInventory.unitOfMeasure,
        })
        .from(supplyConsumption)
        .innerJoin(supplyInventory, eq(supplyConsumption.supplyId, supplyInventory.id))
        .where(and(
          gte(supplyConsumption.consumedAt, startDate),
          lte(supplyConsumption.consumedAt, endDate)
        ));

      // Calculate totals
      const totalValueUsd = consumptionData.reduce((sum: number, item: any) => sum + parseFloat(item.totalCostUsd), 0);
      const totalItems = consumptionData.length;
      const totalCartons = consumptionData.reduce((sum: number, item: any) => sum + (item.cartonsProcessed || 0), 0);

      // Group by item type
      const byItemType: Record<string, { quantity: number; value: number }> = {};
      for (const item of consumptionData) {
        if (!byItemType[item.itemType]) {
          byItemType[item.itemType] = { quantity: 0, value: 0 };
        }
        byItemType[item.itemType].quantity += parseFloat(item.quantityConsumed);
        byItemType[item.itemType].value += parseFloat(item.totalCostUsd);
      }

      // Group by operation
      const byOperation: Record<string, { quantity: number; value: number }> = {};
      for (const item of consumptionData) {
        if (!byOperation[item.packingOperation]) {
          byOperation[item.packingOperation] = { quantity: 0, value: 0 };
        }
        byOperation[item.packingOperation].quantity += parseFloat(item.quantityConsumed);
        byOperation[item.packingOperation].value += parseFloat(item.totalCostUsd);
      }

      // Group by order
      const orderGroups = new Map<string, { totalValue: number; items: number }>();
      for (const item of consumptionData) {
        if (!orderGroups.has(item.orderId)) {
          orderGroups.set(item.orderId, { totalValue: 0, items: 0 });
        }
        const group = orderGroups.get(item.orderId)!;
        group.totalValue += parseFloat(item.totalCostUsd);
        group.items += 1;
      }

      const byOrder = Array.from(orderGroups.entries()).map(([orderId, data]) => ({
        orderId,
        totalValue: data.totalValue,
        items: data.items,
      }));

      // Calculate efficiency metrics
      const consumptionPerCarton = totalCartons > 0 ? totalItems / totalCartons : 0;
      const costPerCarton = totalCartons > 0 ? totalValueUsd / totalCartons : 0;
      const wastePercentage = 0; // Would calculate from actual waste data

      // Generate recommendations
      const recommendations: string[] = [];
      if (costPerCarton > 2.0) {
        recommendations.push("Consider bulk purchasing to reduce per-carton supply costs");
      }
      if (consumptionPerCarton > 5) {
        recommendations.push("Review packing procedures for supply efficiency");
      }
      if (Object.keys(byItemType).length > 10) {
        recommendations.push("Consider standardizing supply items to reduce inventory complexity");
      }

      return {
        period: { startDate, endDate },
        totalConsumption: {
          totalValueUsd,
          totalItems,
          byItemType,
          byOperation,
          byOrder,
        },
        efficiencyMetrics: {
          consumptionPerCarton,
          costPerCarton,
          wastePercentage,
        },
        recommendations,
      };
    } catch (error) {
      console.error("Error generating consumption audit report:", error);
      throw new Error(`Failed to generate consumption audit report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const supplyInventoryService = SupplyInventoryService.getInstance();