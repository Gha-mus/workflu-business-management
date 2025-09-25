/**
 * Stage 4: Shipping Enhancement Service
 * 
 * Implements missing Stage 4 requirements:
 * - Missing arrival cost types (storage, inland transport)
 * - Inspection settlement workflow (accept, claim, return, discount)
 * - Commission validation when funded from capital
 * - Weight mismatch alerts
 */

import { db } from "./db";
import { 
  arrivalCosts, 
  shipmentInspections,
  shipments,
  shipmentLegs,
  capitalEntries,
  warehouseStock
} from "@shared/schema";
import { eq, and, sum, sql, gte, lte } from "drizzle-orm";
import Decimal from "decimal.js";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";
import { configurationService } from "./configurationService";
import { commissionCalculationService } from "./commissionCalculationService";
import { inspectionWorkflowService } from "./inspectionWorkflowService";
import { nanoid } from "nanoid";

export interface ExtendedArrivalCost {
  shipmentId: string;
  costType: 'broker' | 'cargo_handling' | 'delivery' | 'storage' | 'inland_transport' | 'customs' | 'insurance';
  amount: number;
  currency: string;
  exchangeRate?: number;
  description: string;
  vendorName?: string;
  documentReference?: string;
}

export interface InspectionSettlement {
  inspectionId: string;
  settlementType: 'accept' | 'claim' | 'return' | 'discount';
  settlementReason: string;
  negotiatedAmount?: number;
  discountPercent?: number;
  claimDetails?: {
    claimAmount: number;
    claimReason: string;
    supportingDocuments: string[];
  };
  returnDetails?: {
    returnCost: number;
    returnMethod: string;
    returnSchedule: Date;
  };
  approvedBy: string;
  settlementDate: Date;
}

export interface CommissionValidation {
  shipmentLegId: string;
  commissionAmount: number;
  fundingSource: 'capital' | 'operational' | 'supplier';
  capitalEntryId?: string;
  isValidated: boolean;
  validationErrors: string[];
}

export interface WeightMismatchAlert {
  shipmentId: string;
  expectedWeightKg: number;
  actualWeightKg: number;
  discrepancyKg: number;
  discrepancyPercent: number;
  severity: 'minor' | 'significant' | 'critical';
  recommendedAction: string;
}

class ShippingEnhancementService {
  private static instance: ShippingEnhancementService;

  private constructor() {
    console.log("ShippingEnhancementService initialized for Stage 4 enhancements");
  }

  public static getInstance(): ShippingEnhancementService {
    if (!ShippingEnhancementService.instance) {
      ShippingEnhancementService.instance = new ShippingEnhancementService();
    }
    return ShippingEnhancementService.instance;
  }

  /**
   * Add extended arrival costs with additional cost types
   */
  async addExtendedArrivalCost(
    costData: ExtendedArrivalCost,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Adding ${costData.costType} arrival cost for shipment ${costData.shipmentId}`);

      // Get exchange rate for non-USD costs
      const exchangeRate = costData.currency === 'USD' ? 1.0 : 
        (costData.exchangeRate || await configurationService.getCentralExchangeRate());

      const amountUsd = costData.currency === 'USD' 
        ? new Decimal(costData.amount).toNumber()
        : new Decimal(costData.amount).div(new Decimal(exchangeRate)).toNumber();

      // Insert arrival cost
      const [arrivalCost] = await db
        .insert(arrivalCosts)
        .values({
          shipmentId: costData.shipmentId,
          costType: costData.costType,
          amount: new Decimal(costData.amount).div(new Decimal(exchangeRate)).toFixed(2),
          currency: costData.currency,
          exchangeRate: exchangeRate.toString(),
          description: costData.description,
          vendorName: costData.vendorName,
          documentReference: costData.documentReference,
          createdBy: userId,
        })
        .returning();

      // Log the extended arrival cost
      await auditService.logOperation(
        {
          userId,
          userName: 'Shipping Enhancement Service',
          source: 'shipping_enhancement',
          severity: 'info',
        },
        {
          entityType: 'arrival_costs',
          entityId: arrivalCost.id,
          action: 'create',
          operationType: 'shipping_operation',
          description: `Extended arrival cost added: ${costData.costType} - $${amountUsd.toFixed(2)}`,
          newValues: {
            shipmentId: costData.shipmentId,
            costType: costData.costType,
            amount: amountUsd,
            currency: costData.currency,
            exchangeRate,
            vendorName: costData.vendorName,
          },
          businessContext: `Extended arrival cost: ${costData.costType} for shipment ${costData.shipmentId}`,
        }
      );

      return arrivalCost.id;
    } catch (error) {
      console.error("Error adding extended arrival cost:", error);
      throw new Error(`Failed to add extended arrival cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process inspection settlement workflow
   */
  async processInspectionSettlement(
    settlement: InspectionSettlement,
    userId: string
  ): Promise<string> {
    try {
      console.log(`Processing ${settlement.settlementType} settlement for inspection ${settlement.inspectionId}`);

      // Get inspection details
      const [inspection] = await db
        .select()
        .from(shipmentInspections)
        .where(eq(shipmentInspections.id, settlement.inspectionId));

      if (!inspection) {
        throw new Error(`Inspection ${settlement.inspectionId} not found`);
      }

      // Process settlement based on type
      let settlementResult: any = {};

      switch (settlement.settlementType) {
        case 'accept':
          // Accept goods as-is, proceed with normal warehouse transfer
          settlementResult = await this.processAcceptSettlement(inspection, userId);
          break;

        case 'claim':
          // File claim with supplier/carrier
          if (!settlement.claimDetails) {
            throw new Error("Claim details required for claim settlement");
          }
          settlementResult = await this.processClaimSettlement(inspection, settlement.claimDetails, userId);
          break;

        case 'return':
          // Return goods to supplier
          if (!settlement.returnDetails) {
            throw new Error("Return details required for return settlement");
          }
          settlementResult = await this.processReturnSettlement(inspection, settlement.returnDetails, userId);
          break;

        case 'discount':
          // Accept with negotiated discount
          if (!settlement.discountPercent) {
            throw new Error("Discount percent required for discount settlement");
          }
          settlementResult = await this.processDiscountSettlement(inspection, settlement.discountPercent, userId);
          break;

        default:
          throw new Error(`Unsupported settlement type: ${settlement.settlementType}`);
      }

      // Update inspection with settlement details
      await db
        .update(shipmentInspections)
        .set({
          status: 'settled',
          settlementType: settlement.settlementType,
          settlementReason: settlement.settlementReason,
          settlementAmount: settlement.negotiatedAmount?.toString(),
          settlementApprovedBy: settlement.approvedBy,
          settlementDate: settlement.settlementDate,
          settlementDetails: settlementResult,
          updatedAt: new Date(),
        })
        .where(eq(shipmentInspections.id, settlement.inspectionId));

      // Log settlement
      await auditService.logOperation(
        {
          userId,
          userName: 'Shipping Enhancement Service',
          source: 'shipping_enhancement',
          severity: 'info',
        },
        {
          entityType: 'shipment_inspections',
          entityId: settlement.inspectionId,
          action: 'update',
          operationType: 'shipping_operation',
          description: `Inspection settlement processed: ${settlement.settlementType}`,
          newValues: {
            settlementType: settlement.settlementType,
            settlementReason: settlement.settlementReason,
            settlementResult,
            approvedBy: settlement.approvedBy,
          },
          businessContext: `Inspection settlement: ${settlement.settlementType} for shipment ${inspection.shipmentId}`,
        }
      );

      // Send notification
      await notificationService.createBusinessAlert({
        userId,
        alertType: 'business_alert',
        alertCategory: 'shipping_delay',
        priority: settlement.settlementType === 'return' ? 'high' : 'medium',
        title: 'Inspection Settlement Processed',
        message: `Inspection settlement completed: ${settlement.settlementType} for shipment ${inspection.shipmentId}`,
        entityType: 'shipment_inspections',
        entityId: settlement.inspectionId,
        actionUrl: `/shipping/inspections/${settlement.inspectionId}`,
        templateData: {
          shipmentId: inspection.shipmentId,
          settlementType: settlement.settlementType,
          actionUrl: `/shipping/inspections/${settlement.inspectionId}`,
        },
      });

      return settlement.inspectionId;
    } catch (error) {
      console.error("Error processing inspection settlement:", error);
      throw new Error(`Failed to process inspection settlement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate commission when funded from capital
   */
  async validateCommissionCapitalFunding(
    shipmentLegId: string,
    commissionAmount: number,
    capitalEntryId: string
  ): Promise<CommissionValidation> {
    try {
      const validationErrors: string[] = [];

      // Get capital entry details
      const [capitalEntry] = await db
        .select()
        .from(capitalEntries)
        .where(eq(capitalEntries.id, capitalEntryId));

      if (!capitalEntry) {
        validationErrors.push(`Capital entry ${capitalEntryId} not found`);
      } else {
        // Validate entry type
        if (capitalEntry.type !== 'CapitalOut') {
          validationErrors.push(`Invalid capital entry type: expected CapitalOut, got ${capitalEntry.type}`);
        }

        // Validate amount
        const entryAmount = new Decimal(capitalEntry.amount).toNumber();
        if (new Decimal(entryAmount).minus(commissionAmount).abs().gt(0.01)) {
          validationErrors.push(`Amount mismatch: Commission ${commissionAmount} != Capital entry ${entryAmount}`);
        }

        // Validate reference
        if (capitalEntry.reference !== shipmentLegId) {
          validationErrors.push(`Reference mismatch: Expected ${shipmentLegId}, got ${capitalEntry.reference}`);
        }

        // Validate funding source
        if (capitalEntry.fundingSource !== 'external') {
          validationErrors.push(`Invalid funding source: expected external for commission funding`);
        }
      }

      // Get shipment leg details
      const [shipmentLeg] = await db
        .select()
        .from(shipmentLegs)
        .where(eq(shipmentLegs.id, shipmentLegId));

      if (!shipmentLeg) {
        validationErrors.push(`Shipment leg ${shipmentLegId} not found`);
      }

      const validation: CommissionValidation = {
        shipmentLegId,
        commissionAmount,
        fundingSource: 'capital',
        capitalEntryId,
        isValidated: validationErrors.length === 0,
        validationErrors,
      };

      // Log validation result
      await auditService.logOperation(
        {
          userId: 'system',
          userName: 'Shipping Enhancement Service',
          source: 'shipping_enhancement',
          severity: validation.isValidated ? 'info' : 'warning',
        },
        {
          entityType: 'shipment_legs',
          entityId: shipmentLegId,
          action: 'view',
          operationType: 'commission_validation',
          description: `Commission capital funding validation: ${validation.isValidated ? 'PASSED' : 'FAILED'}`,
          newValues: validation,
          businessContext: `Commission validation for shipment leg ${shipmentLegId}`,
        }
      );

      return validation;
    } catch (error) {
      console.error("Error validating commission capital funding:", error);
      return {
        shipmentLegId,
        commissionAmount,
        fundingSource: 'capital',
        capitalEntryId,
        isValidated: false,
        validationErrors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Check for weight mismatches and send alerts
   */
  async checkWeightMismatches(shipmentId: string): Promise<WeightMismatchAlert[]> {
    try {
      // Get shipment details
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId));

      if (!shipment) {
        throw new Error(`Shipment ${shipmentId} not found`);
      }

      // Get inspection weights
      const inspections = await db
        .select()
        .from(shipmentInspections)
        .where(eq(shipmentInspections.shipmentId, shipmentId));

      const alerts: WeightMismatchAlert[] = [];

      for (const inspection of inspections) {
        const expectedWeight = new Decimal(shipment.totalWeight);
        const actualWeight = new Decimal(inspection.grossWeightKg || '0');
        const discrepancyKg = expectedWeight.minus(actualWeight).abs().toNumber();
        const discrepancyPercent = expectedWeight.gt(0) ? (discrepancyKg / expectedWeight.toNumber()) * 100 : 0;

        let severity: 'minor' | 'significant' | 'critical';
        let recommendedAction: string;

        if (discrepancyPercent > 10) {
          severity = 'critical';
          recommendedAction = 'Immediate investigation required - significant weight discrepancy';
        } else if (discrepancyPercent > 5) {
          severity = 'significant';
          recommendedAction = 'Investigate discrepancy and verify weight measurements';
        } else if (discrepancyPercent > 2) {
          severity = 'minor';
          recommendedAction = 'Document discrepancy and proceed with caution';
        } else {
          continue; // Skip minor discrepancies
        }

        alerts.push({
          shipmentId,
          expectedWeightKg: expectedWeight.toNumber(),
          actualWeightKg: actualWeight.toNumber(),
          discrepancyKg,
          discrepancyPercent,
          severity,
          recommendedAction,
        });

        // Send notification for significant/critical mismatches
        if (severity === 'significant' || severity === 'critical') {
          await notificationService.createBusinessAlert({
            userId: 'system',
            alertType: 'operational_alert',
            alertCategory: 'shipping_delay',
            priority: severity === 'critical' ? 'critical' : 'high',
            title: 'Weight Mismatch Alert',
            message: `Weight discrepancy detected: Expected ${expectedWeight}kg, got ${actualWeight}kg (${discrepancyPercent.toFixed(1)}% difference)`,
            entityType: 'shipment_inspections',
            entityId: inspection.id,
            actionUrl: `/shipping/inspections/${inspection.id}`,
            templateData: {
              shipmentId,
              expectedWeight: expectedWeight.toString(),
              actualWeight: actualWeight.toString(),
              discrepancyPercent: discrepancyPercent.toFixed(1),
              actionUrl: `/shipping/inspections/${inspection.id}`,
            },
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error("Error checking weight mismatches:", error);
      return [];
    }
  }

  // Private helper methods for settlement processing

  private async processAcceptSettlement(inspection: any, userId: string): Promise<any> {
    // Transfer goods to final warehouse as-is
    await inspectionWorkflowService.triggerFinalWarehouseTransfer(inspection.id, userId);
    return { action: 'goods_accepted', transferredToFinalWarehouse: true };
  }

  private async processClaimSettlement(inspection: any, claimDetails: any, userId: string): Promise<any> {
    // File claim and create claim record
    const claimId = `CLAIM-${nanoid(8)}`;
    return {
      action: 'claim_filed',
      claimId,
      claimAmount: claimDetails.claimAmount,
      claimReason: claimDetails.claimReason,
      supportingDocuments: claimDetails.supportingDocuments,
      status: 'pending_resolution',
    };
  }

  private async processReturnSettlement(inspection: any, returnDetails: any, userId: string): Promise<any> {
    // Arrange return to supplier
    const returnId = `RET-${nanoid(8)}`;
    return {
      action: 'goods_returned',
      returnId,
      returnCost: returnDetails.returnCost,
      returnMethod: returnDetails.returnMethod,
      returnSchedule: returnDetails.returnSchedule,
      status: 'return_arranged',
    };
  }

  private async processDiscountSettlement(inspection: any, discountPercent: number, userId: string): Promise<any> {
    // Apply discount and transfer goods
    const discountAmount = new Decimal(inspection.originalValue || '0').mul(discountPercent).div(100);
    await inspectionWorkflowService.triggerFinalWarehouseTransfer(inspection.id, userId);
    
    return {
      action: 'discount_applied',
      discountPercent,
      discountAmount: discountAmount.toNumber(),
      transferredToFinalWarehouse: true,
      adjustedValue: new Decimal(inspection.originalValue || '0').sub(discountAmount).toNumber(),
    };
  }
}

// Export singleton instance
export const shippingEnhancementService = ShippingEnhancementService.getInstance();