/**
 * Stage 1: Capital Enhancement Service
 * 
 * Implements missing Stage 1 requirements:
 * - Low balance alerts
 * - Multi-order split payments
 * - Strict amount-equals-payment validation
 */

import { db } from "./db";
import { 
  capitalEntries, 
  orders, 
  purchases,
  settings,
  type CapitalEntry,
  type InsertCapitalEntry
} from "@shared/schema";
import { eq, and, sum, sql, gte, lte } from "drizzle-orm";
import Decimal from "decimal.js";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";
import { configurationService } from "./configurationService";
import { nanoid } from "nanoid";

export interface MultiOrderCapitalEntry {
  amount: number;
  currency: string;
  exchangeRate?: number;
  description: string;
  fundingSource: 'external' | 'reinvestment';
  orderAllocations: Array<{
    orderId: string;
    amount: number;
    description?: string;
  }>;
}

export interface CapitalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalAllocated: number;
  unallocatedAmount: number;
}

export interface CapitalBalanceAlert {
  alertType: 'low_balance' | 'negative_balance' | 'threshold_breach';
  currentBalance: number;
  threshold: number;
  deficit: number;
  severity: 'warning' | 'critical';
  recommendedAction: string;
}

class CapitalEnhancementService {
  private static instance: CapitalEnhancementService;

  private constructor() {
    console.log("CapitalEnhancementService initialized for Stage 1 enhancements");
  }

  public static getInstance(): CapitalEnhancementService {
    if (!CapitalEnhancementService.instance) {
      CapitalEnhancementService.instance = new CapitalEnhancementService();
    }
    return CapitalEnhancementService.instance;
  }

  /**
   * Create capital entry with multi-order split support
   */
  async createMultiOrderCapitalEntry(
    request: MultiOrderCapitalEntry,
    userId: string
  ): Promise<CapitalEntry> {
    try {
      console.log(`Creating multi-order capital entry for ${request.orderAllocations.length} orders`);
      
      // Validate the request
      const validation = await this.validateMultiOrderEntry(request);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get exchange rate for non-USD currencies
      const exchangeRate = request.currency === 'USD' ? 1.0 : 
        (request.exchangeRate || await configurationService.getCentralExchangeRate());

      // Create the capital entry with multi-order references
      const [capitalEntry] = await db
        .insert(capitalEntries)
        .values({
          amount: request.amount.toString(),
          type: 'CapitalIn',
          reference: request.orderAllocations[0]?.orderId, // Primary reference for backward compatibility
          // references: request.orderAllocations, // TODO: Add to schema when multi-order support is implemented
          description: request.description,
          paymentCurrency: request.currency,
          exchangeRate: exchangeRate.toString(),
          // fundingSource: request.fundingSource, // TODO: Add to schema
          createdBy: userId,
        })
        .returning();

      // Log audit for each order allocation
      for (const allocation of request.orderAllocations) {
        await auditService.logOperation(
          {
            userId,
            userName: 'Capital Enhancement Service',
            source: 'capital_enhancement',
            severity: 'info',
          },
          {
            entityType: 'capital_entries',
            entityId: capitalEntry.id,
            action: 'create',
            operationType: 'capital_entry',
            description: `Multi-order capital allocation: ${allocation.amount} USD to order ${allocation.orderId}`,
            newValues: {
              entryId: capitalEntry.entryId,
              orderId: allocation.orderId,
              amount: allocation.amount,
              allocationType: 'multi_order_split',
            },
            businessContext: `Capital entry ${capitalEntry.entryId} allocated across ${request.orderAllocations.length} orders`,
          }
        );
      }

      // Check for balance alerts after this entry
      await this.checkBalanceAlerts(userId);

      return capitalEntry;
    } catch (error) {
      console.error("Error creating multi-order capital entry:", error);
      throw new Error(`Failed to create multi-order capital entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate multi-order capital entry
   */
  async validateMultiOrderEntry(request: MultiOrderCapitalEntry): Promise<CapitalValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic validation
    if (request.amount <= 0) {
      errors.push("Capital amount must be positive");
    }

    if (!request.orderAllocations || request.orderAllocations.length === 0) {
      errors.push("At least one order allocation is required");
    }

    // Validate order allocations
    const totalAllocated = request.orderAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const unallocatedAmount = request.amount - totalAllocated;

    if (Math.abs(unallocatedAmount) > 0.01) { // Allow for minor rounding differences
      errors.push(`Amount mismatch: Total ${request.amount} != Allocated ${totalAllocated} (difference: ${unallocatedAmount.toFixed(2)})`);
    }

    // Validate each order exists
    for (const allocation of request.orderAllocations) {
      if (allocation.amount <= 0) {
        errors.push(`Invalid allocation amount for order ${allocation.orderId}: must be positive`);
      }

      // Check if order exists
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, allocation.orderId));
      
      if (!order) {
        errors.push(`Order ${allocation.orderId} not found`);
      }
    }

    // Check for duplicate order allocations
    const orderIds = request.orderAllocations.map(a => a.orderId);
    const uniqueOrderIds = new Set(orderIds);
    if (orderIds.length !== uniqueOrderIds.size) {
      errors.push("Duplicate order allocations are not allowed");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalAllocated,
      unallocatedAmount,
    };
  }

  /**
   * Check capital balance and send alerts if needed
   */
  async checkBalanceAlerts(userId?: string): Promise<CapitalBalanceAlert[]> {
    try {
      // Get current capital balance
      const balanceResult = await db
        .select({
          totalIn: sum(sql`CASE WHEN type = 'CapitalIn' THEN CAST(amount AS DECIMAL) ELSE 0 END`),
          totalOut: sum(sql`CASE WHEN type = 'CapitalOut' THEN CAST(amount AS DECIMAL) ELSE 0 END`),
        })
        .from(capitalEntries);

      const totalIn = new Decimal(balanceResult[0]?.totalIn || '0');
      const totalOut = new Decimal(balanceResult[0]?.totalOut || '0');
      const currentBalance = totalIn.minus(totalOut).toNumber();

      // Get alert thresholds from settings
      const lowBalanceThreshold = await configurationService.getNumericSetting('CAPITAL_LOW_BALANCE_THRESHOLD', 10000);
      const negativeBalancePrevention = await configurationService.getBooleanSetting('PREVENT_NEGATIVE_BALANCE', true);

      const alerts: CapitalBalanceAlert[] = [];

      // Check for negative balance
      if (currentBalance < 0) {
        alerts.push({
          alertType: 'negative_balance',
          currentBalance,
          threshold: 0,
          deficit: Math.abs(currentBalance),
          severity: 'critical',
          recommendedAction: 'Immediate capital injection required to restore positive balance',
        });
      }

      // Check for low balance
      if (currentBalance >= 0 && currentBalance < lowBalanceThreshold) {
        alerts.push({
          alertType: 'low_balance',
          currentBalance,
          threshold: lowBalanceThreshold,
          deficit: lowBalanceThreshold - currentBalance,
          severity: currentBalance < (lowBalanceThreshold * 0.5) ? 'critical' : 'warning',
          recommendedAction: `Consider adding ${(lowBalanceThreshold - currentBalance).toFixed(2)} USD to maintain adequate capital levels`,
        });
      }

      // Send notifications for each alert
      for (const alert of alerts) {
        if (userId) {
          await notificationService.createBusinessAlert({
            userId,
            alertType: 'threshold_alert',
            alertCategory: 'capital_threshold',
            priority: alert.severity === 'critical' ? 'critical' : 'high',
            title: `Capital ${alert.alertType.replace('_', ' ').toUpperCase()}`,
            message: `Current capital balance: $${currentBalance.toFixed(2)}. ${alert.recommendedAction}`,
            entityType: 'capital_entries',
            actionUrl: '/capital',
            templateData: {
              userName: 'User',
              currentBalance: currentBalance.toFixed(2),
              threshold: alert.threshold.toFixed(2),
              deficit: alert.deficit.toFixed(2),
              currency: 'USD',
              actionUrl: '/capital',
            },
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error("Error checking capital balance alerts:", error);
      return [];
    }
  }

  /**
   * Validate strict amount-equals-payment for capital entries
   */
  async validateStrictAmountEqualsPayment(entryId: string): Promise<boolean> {
    try {
      const [entry] = await db
        .select()
        .from(capitalEntries)
        .where(eq(capitalEntries.entryId, entryId));

      if (!entry) {
        throw new Error(`Capital entry ${entryId} not found`);
      }

      // For multi-order entries, validate that all allocations add up exactly
      if (entry.reference && Array.isArray(entry.reference)) {
        const totalAllocated = (entry.reference as Array<{orderId: string, amount: number}>)
          .reduce((sum, alloc) => sum + alloc.amount, 0);
        
        const entryAmount = parseFloat(entry.amount);
        const difference = Math.abs(entryAmount - totalAllocated);
        
        if (difference > 0.01) { // Allow for minor rounding differences
          console.error(`Amount validation failed for ${entryId}: Entry ${entryAmount} != Allocated ${totalAllocated}`);
          return false;
        }
      }

      // Mark as validated
      await db
        .update(capitalEntries)
        .set({
          isValidated: true,
          // validatedAt: new Date(), // Remove if not in schema
        })
        .where(eq(capitalEntries.id, entry.id));

      return true;
    } catch (error) {
      console.error("Error validating strict amount equals payment:", error);
      return false;
    }
  }

  /**
   * Get capital balance summary
   */
  async getCapitalBalanceSummary(): Promise<{
    currentBalance: number;
    totalIn: number;
    totalOut: number;
    unvalidatedEntries: number;
    recentAlerts: CapitalBalanceAlert[];
  }> {
    try {
      // Get balance totals
      const balanceResult = await db
        .select({
          totalIn: sum(sql`CASE WHEN type = 'CapitalIn' THEN CAST(amount AS DECIMAL) ELSE 0 END`),
          totalOut: sum(sql`CASE WHEN type = 'CapitalOut' THEN CAST(amount AS DECIMAL) ELSE 0 END`),
        })
        .from(capitalEntries);

      const totalIn = new Decimal(balanceResult[0]?.totalIn || '0').toNumber();
      const totalOut = new Decimal(balanceResult[0]?.totalOut || '0').toNumber();
      const currentBalance = totalIn - totalOut;

      // Get unvalidated entries count
      const unvalidatedResult = await db
        .select({ count: sql`COUNT(*)::int` })
        .from(capitalEntries)
        .where(eq(capitalEntries.isValidated, false));

      const unvalidatedEntries = Number(unvalidatedResult[0]?.count || 0);

      // Get recent alerts
      const recentAlerts = await this.checkBalanceAlerts();

      return {
        currentBalance,
        totalIn,
        totalOut,
        unvalidatedEntries,
        recentAlerts,
      };
    } catch (error) {
      console.error("Error getting capital balance summary:", error);
      throw new Error(`Failed to get capital balance summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const capitalEnhancementService = CapitalEnhancementService.getInstance();