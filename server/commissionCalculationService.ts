/**
 * Stage 4: Transfer Commission Calculation Service
 * 
 * Implements commission calculations per workflow_reference.json lines 627-629:
 * - legBaseCost = rate_per_kg × chargeable_weight  
 * - commissionUsd = legBaseCost × (commission%/100) when applicable
 * - legTotalCost = legBaseCost + commissionUsd
 * 
 * Links to capital tracking when commission is funded from working capital
 */

import { db } from "./db";
import { shipmentLegs, capitalEntries } from "@shared/schema";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";
import { configurationService } from "./configurationService";
import { auditService } from "./auditService";
import { approvalWorkflowService } from "./approvalWorkflowService";
import { nanoid } from "nanoid";

export interface CommissionCalculationRequest {
  shipmentLegId: string;
  ratePerKg: number;
  chargeableWeightKg: number;
  commissionPercent?: number; // If not provided, no commission applied
  currency: string;
  fundingSource: 'capital' | 'operational' | 'supplier'; // Per workflow_reference.json line 628
}

export interface CommissionCalculationResult {
  shipmentLegId: string;
  legBaseCost: number;
  commissionPercent: number;
  commissionUsd: number;
  legTotalCost: number;
  currency: string;
  exchangeRateUsed: number;
  capitalEntryId?: string; // If funded from capital
}

class CommissionCalculationService {
  private static instance: CommissionCalculationService;
  
  private constructor() {
    console.log("CommissionCalculationService initialized for Stage 4 transfer commission calculations");
  }
  
  public static getInstance(): CommissionCalculationService {
    if (!CommissionCalculationService.instance) {
      CommissionCalculationService.instance = new CommissionCalculationService();
    }
    return CommissionCalculationService.instance;
  }
  
  /**
   * Calculate and apply transfer commission per workflow_reference.json lines 627-629
   */
  async calculateAndApplyCommission(
    request: CommissionCalculationRequest,
    userId: string
  ): Promise<CommissionCalculationResult> {
    try {
      console.log(`Calculating commission for shipment leg ${request.shipmentLegId}`);
      
      // Get current exchange rate from central configuration (USD/ETB)
      const exchangeRate = request.currency === 'ETB' ? await configurationService.getCentralExchangeRate() : 1.0;
      
      // Calculate base cost: rate_per_kg × chargeable_weight
      const ratePerKg = new Decimal(request.ratePerKg);
      const chargeableWeight = new Decimal(request.chargeableWeightKg);
      const legBaseCost = ratePerKg.mul(chargeableWeight);
      
      // Apply commission if provided
      const commissionPercent = new Decimal(request.commissionPercent || 0);
      const commissionAmount = legBaseCost.mul(commissionPercent).div(100);
      
      // Calculate total leg cost
      const legTotalCost = legBaseCost.add(commissionAmount);
      
      // Convert to USD using central exchange rate
      const legBaseCostUsd = request.currency === 'USD' 
        ? legBaseCost 
        : legBaseCost.mul(exchangeRate);
      const commissionUsd = request.currency === 'USD'
        ? commissionAmount
        : commissionAmount.mul(exchangeRate);
      const legTotalCostUsd = request.currency === 'USD'
        ? legTotalCost
        : legTotalCost.mul(exchangeRate);
      
      // Update shipment leg with calculated values (all costs in USD for consistency)
      await db
        .update(shipmentLegs)
        .set({
          legBaseCost: legBaseCostUsd.toString(), // Store in USD for consistent calculations
          transferCommissionPercent: commissionPercent.toString(),
          transferCommissionUsd: commissionUsd.toString(),
          legTotalCost: legTotalCostUsd.toString(),
          paymentCurrency: request.currency, // Track original currency for reference
          exchangeRate: exchangeRate.toString(), // Track exchange rate used
          updatedAt: new Date()
        })
        .where(eq(shipmentLegs.id, request.shipmentLegId));
      
      // Create capital entry if funded from working capital
      let capitalEntryId: string | undefined;
      if (request.fundingSource === 'capital' && commissionUsd.gt(0)) {
        capitalEntryId = await this.createCapitalEntry(
          request.shipmentLegId,
          commissionUsd.toNumber(),
          userId
        );
      }
      
      // Audit log the commission calculation
      const auditContext = {
        userId,
        userName: 'System',
        userRole: 'system',
        source: 'commission_calculation',
        severity: 'info' as const
      };
      await auditService.logOperation(auditContext, {
        entityType: 'shipment_legs',
        entityId: request.shipmentLegId,
        action: 'update',
        description: `Commission calculated: base=${legBaseCostUsd.toFixed(2)}, commission=${commissionUsd.toFixed(2)}`,
        newValues: {
          legBaseCost: legBaseCostUsd.toString(),
          transferCommissionUsd: commissionUsd.toString(),
          legTotalCost: legTotalCostUsd.toString()
        }
      });
      
      console.log(`✅ Commission calculated for leg ${request.shipmentLegId}: base=${legBaseCostUsd.toFixed(2)}, commission=${commissionUsd.toFixed(2)}, total=${legTotalCostUsd.toFixed(2)}`);
      
      return {
        shipmentLegId: request.shipmentLegId,
        legBaseCost: legBaseCostUsd.toNumber(),
        commissionPercent: commissionPercent.toNumber(),
        commissionUsd: commissionUsd.toNumber(),
        legTotalCost: legTotalCostUsd.toNumber(),
        currency: request.currency,
        exchangeRateUsed: exchangeRate,
        capitalEntryId
      };
      
    } catch (error) {
      console.error(`Error calculating commission for leg ${request.shipmentLegId}:`, error);
      throw new Error(`Failed to calculate commission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Create capital entry when commission is funded from working capital
   * Routes through approval workflow per Stage 1/10 security requirements
   */
  private async createCapitalEntry(
    shipmentLegId: string,
    commissionUsd: number,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Creating capital entry for commission ${commissionUsd} via approval workflow`);
      
      // Create capital entry via approval workflow (Stage 1 security compliance)
      const capitalEntryData = {
        type: 'CapitalOut' as const,
        amount: commissionUsd.toString(),
        currency: 'USD',
        exchangeRate: '1.0',
        amountUsd: commissionUsd.toString(),
        category: 'shipping_commission',
        description: `Transfer commission for shipment leg ${shipmentLegId}`,
        paymentMethod: 'wire_transfer',
        linkedOrderId: null,
        createdBy: userId
      };
      
      // Route through approval workflow - respects thresholds and role-based approvals
      const approvalResult = await approvalWorkflowService.createApprovalRequest({
        operationType: 'capital_entry',
        requestedBy: userId,
        description: `Shipping commission payment: ${commissionUsd} USD for leg ${shipmentLegId}`,
        operationData: capitalEntryData,
        priority: 'normal'
      });
      
      console.log(`✅ Capital entry approval request ${approvalResult.id} created for commission ${commissionUsd}`);
      console.log(`⚠️ Commission capital entry requires approval - status: ${approvalResult.status}`);
      
      return approvalResult.id; // Return approval request ID, not capital entry ID
      
    } catch (error) {
      console.error(`Error creating commission capital entry approval request:`, error);
      throw new Error(`Failed to create commission capital entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate unique capital entry number
   */
  private async generateCapitalEntryNumber(): Promise<string> {
    const count = await db.$count(capitalEntries);
    return `CAP-${String(count + 1).padStart(6, '0')}`;
  }
  
  /**
   * Recalculate commission for multiple shipment legs
   */
  async recalculateCommissions(
    requests: CommissionCalculationRequest[],
    userId: string
  ): Promise<CommissionCalculationResult[]> {
    try {
      console.log(`Recalculating commissions for ${requests.length} shipment legs`);
      
      const results: CommissionCalculationResult[] = [];
      
      for (const request of requests) {
        try {
          const result = await this.calculateAndApplyCommission(request, userId);
          results.push(result);
        } catch (error) {
          console.error(`Failed to recalculate commission for leg ${request.shipmentLegId}:`, error);
          // Continue with other legs even if one fails
        }
      }
      
      console.log(`✅ Recalculated ${results.length}/${requests.length} commission calculations`);
      return results;
      
    } catch (error) {
      console.error("Error in bulk commission recalculation:", error);
      throw new Error(`Failed to recalculate commissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get commission summary for a shipment
   */
  async getShipmentCommissionSummary(shipmentId: string): Promise<{
    totalLegs: number;
    totalBaseCost: number;
    totalCommission: number;
    totalLegCosts: number;
    commissionPercentAvg: number;
  }> {
    try {
      const legs = await db
        .select()
        .from(shipmentLegs)
        .where(eq(shipmentLegs.shipmentId, shipmentId));
      
      if (legs.length === 0) {
        return {
          totalLegs: 0,
          totalBaseCost: 0,
          totalCommission: 0,
          totalLegCosts: 0,
          commissionPercentAvg: 0
        };
      }
      
      const totalBaseCost = legs.reduce((sum: Decimal, leg: any) => 
        sum.add(new Decimal(leg.legBaseCost)), new Decimal('0'));
      
      const totalCommission = legs.reduce((sum: Decimal, leg: any) => 
        sum.add(new Decimal(leg.transferCommissionUsd || '0')), new Decimal('0'));
      
      const totalLegCosts = legs.reduce((sum: Decimal, leg: any) => 
        sum.add(new Decimal(leg.legTotalCost)), new Decimal('0'));
      
      const avgCommissionPercent = legs
        .filter(leg => parseFloat(leg.transferCommissionPercent || '0') > 0)
        .reduce((sum: Decimal, leg: any, _: number, array: any[]) => 
          sum.add(new Decimal(leg.transferCommissionPercent || '0').div(array.length)), new Decimal('0'));
      
      return {
        totalLegs: legs.length,
        totalBaseCost: totalBaseCost.toNumber(),
        totalCommission: totalCommission.toNumber(),
        totalLegCosts: totalLegCosts.toNumber(),
        commissionPercentAvg: avgCommissionPercent.toNumber()
      };
      
    } catch (error) {
      console.error(`Error getting commission summary for shipment ${shipmentId}:`, error);
      throw new Error(`Failed to get commission summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const commissionCalculationService = CommissionCalculationService.getInstance();