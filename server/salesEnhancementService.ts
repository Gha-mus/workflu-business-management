/**
 * Stage 6: Sales Enhancement Service
 * 
 * Implements missing Stage 6 requirements:
 * - Multi-order invoice support with explicit split logic
 * - Overdue receivables notifications/alerts
 * - Proper returns handling (return to original order and warehouse)
 * - Strict warehouse source rules (FIRST = non-clean only, FINAL = clean only)
 */

import { db } from "./db";
import { 
  salesOrders,
  salesOrderItems,
  customers,
  orders,
  warehouseStock,
  revenueTransactions
} from "@shared/schema";
import { eq, and, sum, sql, gte, lte, lt } from "drizzle-orm";
import Decimal from "decimal.js";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";
import { configurationService } from "./configurationService";
import { nanoid } from "nanoid";

export interface MultiOrderInvoice {
  customerId: string;
  currency: string;
  exchangeRate?: number;
  paymentTerms: string;
  orderItems: Array<{
    orderId: string;
    warehouseStockId: string;
    sourceWarehouse: 'FIRST' | 'FINAL';
    quantityKg: number;
    cartonSize: '8kg' | '20kg';
    cartonCount: number;
    pricePerCarton: number;
    description?: string;
  }>;
  shippingAddress?: string;
  salesRepId?: string;
  notes?: string;
}

export interface OverdueReceivable {
  salesOrderId: string;
  customerName: string;
  invoiceNumber: string;
  totalAmount: number;
  balanceDue: number;
  invoiceDate: Date;
  dueDate: Date;
  daysPastDue: number;
  agingCategory: '0-30' | '31-60' | '61-90' | '90+';
  severity: 'warning' | 'critical';
  recommendedAction: string;
}

export interface SalesReturn {
  originalSalesOrderId: string;
  returnedItems: Array<{
    salesOrderItemId: string;
    returnQuantityKg: number;
    returnCartonCount: number;
    returnReason: string;
    qualityIssue?: boolean;
  }>;
  returnReason: string;
  returnDate: Date;
  refundMethod: 'credit_note' | 'cash_refund' | 'customer_credit';
  approvedBy: string;
  restockLocation: 'original_warehouse' | 'quarantine' | 'non_sellable';
}

export interface WarehouseSourceValidation {
  warehouseStockId: string;
  requestedWarehouse: string;
  actualWarehouse: string;
  itemType: 'clean' | 'non_clean';
  isValidSource: boolean;
  violationReason?: string;
  correctedWarehouse?: string;
}

class SalesEnhancementService {
  private static instance: SalesEnhancementService;

  private constructor() {
    console.log("SalesEnhancementService initialized for Stage 6 enhancements");
  }

  public static getInstance(): SalesEnhancementService {
    if (!SalesEnhancementService.instance) {
      SalesEnhancementService.instance = new SalesEnhancementService();
    }
    return SalesEnhancementService.instance;
  }

  /**
   * Create multi-order invoice with explicit split logic
   */
  async createMultiOrderInvoice(
    invoiceData: MultiOrderInvoice,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Creating multi-order invoice for customer ${invoiceData.customerId} with ${invoiceData.orderItems.length} items`);

      // Validate warehouse source rules for all items
      const sourceValidations = await Promise.all(
        invoiceData.orderItems.map(item => this.validateWarehouseSource(item.warehouseStockId, item.sourceWarehouse))
      );

      const invalidSources = sourceValidations.filter(v => !v.isValidSource);
      if (invalidSources.length > 0) {
        throw new Error(`Warehouse source violations: ${invalidSources.map(v => v.violationReason).join('; ')}`);
      }

      // Calculate totals
      let subtotal = 0;
      for (const item of invoiceData.orderItems) {
        subtotal += item.cartonCount * item.pricePerCarton;
      }

      // Get exchange rate
      const exchangeRate = invoiceData.currency === 'USD' ? 1.0 : 
        (invoiceData.exchangeRate || await configurationService.getCentralExchangeRate());

      const totalUsd = invoiceData.currency === 'USD' ? subtotal : subtotal / exchangeRate;

      // Generate sales order number
      const salesOrderNumber = `INV-${nanoid(8)}`;

      // Create main sales order (invoice header)
      const [salesOrder] = await db
        .insert(salesOrders)
        .values({
          salesOrderNumber,
          customerId: invoiceData.customerId,
          orderId: null, // Multi-order invoice doesn't link to single order
          status: 'confirmed',
          currency: invoiceData.currency,
          exchangeRate: exchangeRate.toString(),
          subtotalAmount: subtotal.toString(),
          totalAmount: subtotal.toString(),
          totalAmountUsd: totalUsd.toString(),
          balanceDue: subtotal.toString(),
          paymentTerms: invoiceData.paymentTerms as any,
          shippingAddress: invoiceData.shippingAddress,
          salesRepId: invoiceData.salesRepId,
          notes: invoiceData.notes,
          confirmedAt: new Date(),
          createdBy: userId,
        })
        .returning();

      // Create invoice items for each order item
      for (const item of invoiceData.orderItems) {
        // Get warehouse stock details
        const [warehouseStockRecord] = await db
          .select()
          .from(warehouseStock)
          .where(eq(warehouseStock.id, item.warehouseStockId));

        if (!warehouseStockRecord) {
          throw new Error(`Warehouse stock ${item.warehouseStockId} not found`);
        }

        // Calculate cost and profit
        const unitCost = parseFloat(warehouseStockRecord.unitCostCleanUsd || '0');
        const totalCost = unitCost * item.quantityKg;
        const totalRevenue = item.cartonCount * item.pricePerCarton;
        const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

        // Create sales order item
        await db
          .insert(salesOrderItems)
          .values({
            salesOrderId: salesOrder.id,
            warehouseStockId: item.warehouseStockId,
            productDescription: item.description || `Coffee - ${warehouseStockRecord.qualityGrade}`,
            qualityGrade: warehouseStockRecord.qualityGrade,
            quantityKg: item.quantityKg.toString(),
            unitPrice: (item.pricePerCarton / (parseFloat(item.cartonSize) || 8)).toString(),
            totalPrice: totalRevenue.toString(),
            unitCost: unitCost.toString(),
            totalCost: totalCost.toString(),
            profitMargin: profitMargin.toString(),
            sourceWarehouse: item.sourceWarehouse,
            cartonSize: item.cartonSize,
            cartonCount: item.cartonCount,
            createdBy: userId,
          });

        // Deduct stock from warehouse
        await db
          .update(warehouseStock)
          .set({
            qtyKgClean: sql`CAST(${warehouseStock.qtyKgClean} AS DECIMAL) - ${item.quantityKg}`,
            qtyKgReserved: sql`CAST(${warehouseStock.qtyKgReserved} AS DECIMAL) - ${item.quantityKg}`,
            cartonsCount: sql`${warehouseStock.cartonsCount} - ${item.cartonCount}`,
            updatedAt: new Date(),
          })
          .where(eq(warehouseStock.id, item.warehouseStockId));
      }

      // Log multi-order invoice creation
      await auditService.logOperation(
        {
          userId,
          userName: 'Sales Enhancement Service',
          source: 'sales_enhancement',
          severity: 'info',
        },
        {
          entityType: 'sales_orders',
          entityId: salesOrder.id,
          action: 'create',
          operationType: 'sale_order',
          description: `Multi-order invoice created: ${invoiceData.orderItems.length} items from multiple orders`,
          newValues: {
            salesOrderNumber,
            customerId: invoiceData.customerId,
            itemCount: invoiceData.orderItems.length,
            totalAmount: totalUsd,
            orderIds: invoiceData.orderItems.map(item => item.orderId),
          },
          businessContext: `Multi-order invoice: ${salesOrderNumber} for customer ${invoiceData.customerId}`,
        }
      );

      return salesOrder.id;
    } catch (error) {
      console.error("Error creating multi-order invoice:", error);
      throw new Error(`Failed to create multi-order invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check for overdue receivables and send alerts
   */
  async checkOverdueReceivables(): Promise<OverdueReceivable[]> {
    try {
      // Get sales orders with outstanding balances
      const overdueOrders = await db
        .select({
          id: salesOrders.id,
          salesOrderNumber: salesOrders.salesOrderNumber,
          customerId: salesOrders.customerId,
          customerName: customers.name,
          totalAmount: salesOrders.totalAmount,
          balanceDue: salesOrders.balanceDue,
          orderDate: salesOrders.orderDate,
          paymentTerms: salesOrders.paymentTerms,
          confirmedAt: salesOrders.confirmedAt,
        })
        .from(salesOrders)
        .innerJoin(customers, eq(salesOrders.customerId, customers.id))
        .where(and(
          gte(sql`CAST(${salesOrders.balanceDue} AS DECIMAL)`, 0.01),
          eq(salesOrders.status, 'confirmed')
        ));

      const alerts: OverdueReceivable[] = [];
      const today = new Date();

      for (const order of overdueOrders) {
        // Calculate due date based on payment terms
        const confirmedDate = order.confirmedAt || order.orderDate;
        const paymentTermsDays = this.getPaymentTermsDays(order.paymentTerms);
        const dueDate = new Date(confirmedDate);
        dueDate.setDate(dueDate.getDate() + paymentTermsDays);

        const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPastDue > 0) {
          let agingCategory: '0-30' | '31-60' | '61-90' | '90+';
          let severity: 'warning' | 'critical';
          let recommendedAction: string;

          if (daysPastDue <= 30) {
            agingCategory = '0-30';
            severity = 'warning';
            recommendedAction = 'Send payment reminder to customer';
          } else if (daysPastDue <= 60) {
            agingCategory = '31-60';
            severity = 'warning';
            recommendedAction = 'Contact customer directly for payment';
          } else if (daysPastDue <= 90) {
            agingCategory = '61-90';
            severity = 'critical';
            recommendedAction = 'Escalate to collections team';
          } else {
            agingCategory = '90+';
            severity = 'critical';
            recommendedAction = 'Consider legal action or write-off';
          }

          alerts.push({
            salesOrderId: order.id,
            customerName: order.customerName,
            invoiceNumber: order.salesOrderNumber,
            totalAmount: parseFloat(order.totalAmount),
            balanceDue: parseFloat(order.balanceDue),
            invoiceDate: order.orderDate,
            dueDate,
            daysPastDue,
            agingCategory,
            severity,
            recommendedAction,
          });

          // Send notification for critical overdue amounts
          if (severity === 'critical' || parseFloat(order.balanceDue) > 5000) {
            await notificationService.createBusinessAlert({
              userId: 'system',
              alertType: 'business_alert',
              alertCategory: 'payment_due',
              priority: severity === 'critical' ? 'high' : 'medium',
              title: 'Overdue Receivable Alert',
              message: `Invoice ${order.salesOrderNumber} is ${daysPastDue} days overdue ($${order.balanceDue})`,
              entityType: 'sales_orders',
              entityId: order.id,
              actionUrl: `/sales/invoices/${order.id}`,
              templateData: {
                customerName: order.customerName,
                invoiceNumber: order.salesOrderNumber,
                balanceDue: order.balanceDue,
                daysPastDue: daysPastDue.toString(),
                actionUrl: `/sales/invoices/${order.id}`,
              },
            });
          }
        }
      }

      return alerts.sort((a, b) => b.daysPastDue - a.daysPastDue);
    } catch (error) {
      console.error("Error checking overdue receivables:", error);
      return [];
    }
  }

  /**
   * Process sales return with proper stock handling
   */
  async processSalesReturn(
    returnData: SalesReturn,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Processing sales return for order ${returnData.originalSalesOrderId}`);

      // Get original sales order
      const [originalOrder] = await db
        .select()
        .from(salesOrders)
        .where(eq(salesOrders.id, returnData.originalSalesOrderId));

      if (!originalOrder) {
        throw new Error(`Original sales order ${returnData.originalSalesOrderId} not found`);
      }

      // Process each returned item
      let totalRefundAmount = 0;
      const returnItems = [];

      for (const returnItem of returnData.returnedItems) {
        // Get original sales order item
        const [originalItem] = await db
          .select()
          .from(salesOrderItems)
          .where(eq(salesOrderItems.id, returnItem.salesOrderItemId));

        if (!originalItem) {
          throw new Error(`Original sales item ${returnItem.salesOrderItemId} not found`);
        }

        // Calculate refund amount
        const unitPrice = parseFloat(originalItem.unitPrice || '0');
        const refundAmount = unitPrice * returnItem.returnQuantityKg;
        totalRefundAmount += refundAmount;

        // Return stock to appropriate warehouse based on return reason
        let targetWarehouse: string;
        let targetStatus: string;

        if (returnItem.qualityIssue || returnData.restockLocation === 'quarantine') {
          targetWarehouse = 'FIRST';
          targetStatus = 'QUARANTINE';
        } else if (returnData.restockLocation === 'non_sellable') {
          targetWarehouse = 'FIRST';
          targetStatus = 'NON_SELLABLE';
        } else {
          // Return to original warehouse
          targetWarehouse = originalItem.sourceWarehouse || 'FINAL';
          targetStatus = 'READY_FOR_SALE';
        }

        // Get original warehouse stock record
        const [originalStock] = await db
          .select()
          .from(warehouseStock)
          .where(eq(warehouseStock.id, originalItem.warehouseStockId!));

        if (originalStock) {
          // Return stock to warehouse
          await db
            .update(warehouseStock)
            .set({
              qtyKgClean: sql`CAST(${warehouseStock.qtyKgClean} AS DECIMAL) + ${returnItem.returnQuantityKg}`,
              cartonsCount: sql`${warehouseStock.cartonsCount} + ${returnItem.returnCartonCount}`,
              status: targetStatus,
              updatedAt: new Date(),
            })
            .where(eq(warehouseStock.id, originalItem.warehouseStockId!));
        }

        returnItems.push({
          ...returnItem,
          refundAmount,
          targetWarehouse,
          targetStatus,
        });
      }

      // Create return transaction based on refund method
      const returnId = `RET-${nanoid(8)}`;

      switch (returnData.refundMethod) {
        case 'credit_note':
          // Create credit note for customer
          await db
            .update(customers)
            .set({
              creditBalance: sql`CAST(${customers.creditBalance} AS DECIMAL) + ${totalRefundAmount}`,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, originalOrder.customerId));
          break;

        case 'cash_refund':
          // Create reverse revenue transaction
          await db
            .insert(revenueTransactions)
            .values({
              transactionNumber: `${returnId}-REFUND`,
              customerId: originalOrder.customerId,
              salesOrderId: returnData.originalSalesOrderId,
              transactionType: 'customer_refund',
              amount: totalRefundAmount.toString(),
              currency: originalOrder.currency,
              exchangeRate: originalOrder.exchangeRate,
              amountUsd: (totalRefundAmount / parseFloat(originalOrder.exchangeRate || '1')).toString(),
              description: `Sales return refund: ${returnData.returnReason}`,
              createdBy: userId,
            });
          break;

        case 'customer_credit':
          // Add to customer account balance
          await db
            .update(customers)
            .set({
              totalOutstanding: sql`CAST(${customers.totalOutstanding} AS DECIMAL) - ${totalRefundAmount}`,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, originalOrder.customerId));
          break;
      }

      // Update original sales order balance
      await db
        .update(salesOrders)
        .set({
          balanceDue: sql`CAST(${salesOrders.balanceDue} AS DECIMAL) - ${totalRefundAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(salesOrders.id, returnData.originalSalesOrderId));

      // Log the return
      await auditService.logOperation(
        {
          userId,
          userName: 'Sales Enhancement Service',
          source: 'sales_enhancement',
          severity: 'info',
        },
        {
          entityType: 'sales_orders',
          entityId: returnData.originalSalesOrderId,
          action: 'update',
          operationType: 'sales_return',
          description: `Sales return processed: ${returnData.returnReason}`,
          newValues: {
            returnId,
            returnReason: returnData.returnReason,
            totalRefundAmount,
            refundMethod: returnData.refundMethod,
            returnItems,
            approvedBy: returnData.approvedBy,
          },
          businessContext: `Sales return: ${returnItems.length} items totaling $${totalRefundAmount}`,
        }
      );

      return returnId;
    } catch (error) {
      console.error("Error processing sales return:", error);
      throw new Error(`Failed to process sales return: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate warehouse source rules (FIRST = non-clean only, FINAL = clean only)
   */
  async validateWarehouseSource(
    warehouseStockId: string,
    requestedWarehouse: string
  ): Promise<WarehouseSourceValidation> {
    try {
      // Get warehouse stock details
      const [stock] = await db
        .select()
        .from(warehouseStock)
        .where(eq(warehouseStock.id, warehouseStockId));

      if (!stock) {
        return {
          warehouseStockId,
          requestedWarehouse,
          actualWarehouse: 'unknown',
          itemType: 'clean',
          isValidSource: false,
          violationReason: 'Warehouse stock not found',
        };
      }

      const actualWarehouse = stock.warehouse;
      const cleanQuantity = parseFloat(stock.qtyKgClean);
      const nonCleanQuantity = parseFloat(stock.qtyKgNonClean);
      
      // Determine item type
      const itemType = cleanQuantity > nonCleanQuantity ? 'clean' : 'non_clean';

      // Validate source rules
      let isValidSource = true;
      let violationReason: string | undefined;
      let correctedWarehouse: string | undefined;

      if (requestedWarehouse === 'FIRST' && itemType === 'clean') {
        isValidSource = false;
        violationReason = 'FIRST warehouse can only source non-clean items';
        correctedWarehouse = 'FINAL';
      } else if (requestedWarehouse === 'FINAL' && itemType === 'non_clean') {
        isValidSource = false;
        violationReason = 'FINAL warehouse can only source clean items';
        correctedWarehouse = 'FIRST';
      } else if (actualWarehouse !== requestedWarehouse) {
        isValidSource = false;
        violationReason = `Stock is in ${actualWarehouse} warehouse, not ${requestedWarehouse}`;
        correctedWarehouse = actualWarehouse;
      }

      return {
        warehouseStockId,
        requestedWarehouse,
        actualWarehouse,
        itemType,
        isValidSource,
        violationReason,
        correctedWarehouse,
      };
    } catch (error) {
      console.error("Error validating warehouse source:", error);
      return {
        warehouseStockId,
        requestedWarehouse,
        actualWarehouse: 'unknown',
        itemType: 'clean',
        isValidSource: false,
        violationReason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Helper method to get payment terms in days
  private getPaymentTermsDays(paymentTerms: string): number {
    switch (paymentTerms) {
      case 'immediate': return 0;
      case 'net_15': return 15;
      case 'net_30': return 30;
      case 'net_45': return 45;
      case 'net_60': return 60;
      case 'net_90': return 90;
      default: return 30; // Default to 30 days
    }
  }
}

// Export singleton instance
export const salesEnhancementService = SalesEnhancementService.getInstance();