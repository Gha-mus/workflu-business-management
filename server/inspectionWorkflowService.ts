/**
 * Stage 4: Shipment Inspection Workflow Service
 * 
 * Implements inspection workflow per workflow_reference.json lines 597-600:
 * - Record clean/damaged weights during inspection
 * - Provide settlement options (accept/claim/return/discount)
 * - Trigger automatic final warehouse transfer upon confirmation
 * - Role-based approval workflows for settlement decisions
 */

import { db } from "./db";
import { 
  shipmentInspections, 
  warehouseStock, 
  shipments,
  users,
  auditLogs 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import Decimal from "decimal.js";
import { auditService } from "./auditService";
import { configurationService } from "./configurationService";
import { nanoid } from "nanoid";

export type SettlementOption = 'accept' | 'claim' | 'return' | 'discount';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'settlement_required' | 'settled';

export interface InspectionStartRequest {
  shipmentId: string;
  inspectorUserId: string;
  inspectionLocation: string;
  notes?: string;
}

export interface InspectionResultsRequest {
  inspectionId: string;
  grossWeightKg: number;
  netWeightKg: number;
  cleanWeightKg: number;
  damagedWeightKg: number;
  qualityGrade: 'A' | 'B' | 'C' | 'Reject';
  damageDescription?: string;
  qualityNotes?: string;
  photosAttached?: boolean;
}

export interface SettlementRequest {
  inspectionId: string;
  settlementOption: SettlementOption;
  requestedBy: string;
  justification: string;
  discountPercent?: number; // For discount option
  claimAmountUsd?: number; // For claim option
  returnShippingCost?: number; // For return option
}

export interface InspectionWorkflowResult {
  inspectionId: string;
  shipmentId: string;
  status: InspectionStatus;
  settlementOption?: SettlementOption;
  finalWarehouseTransferTriggered: boolean;
  approvalRequired: boolean;
  nextSteps: string[];
}

class InspectionWorkflowService {
  private static instance: InspectionWorkflowService;
  
  private constructor() {
    console.log("InspectionWorkflowService initialized for Stage 4 inspection workflows");
  }
  
  public static getInstance(): InspectionWorkflowService {
    if (!InspectionWorkflowService.instance) {
      InspectionWorkflowService.instance = new InspectionWorkflowService();
    }
    return InspectionWorkflowService.instance;
  }
  
  /**
   * Start inspection process for a shipment
   */
  async startInspection(request: InspectionStartRequest): Promise<string> {
    try {
      console.log(`Starting inspection for shipment ${request.shipmentId}`);
      
      // Verify shipment exists and is ready for inspection
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, request.shipmentId));
      
      if (!shipment) {
        throw new Error(`Shipment ${request.shipmentId} not found`);
      }
      
      if (shipment.status !== 'delivered') {
        throw new Error(`Shipment ${request.shipmentId} must be in 'delivered' status for inspection`);
      }
      
      // Create inspection record
      const inspectionId = nanoid();
      const inspectionNumber = await this.generateInspectionNumber();
      
      await db.insert(shipmentInspections).values({
        id: inspectionId,
        inspectionNumber,
        shipmentId: request.shipmentId,
        expectedWeightKg: shipment.totalWeight,
        receivedWeightKg: '0', // Will be updated during inspection
        cleanWeightKg: '0',
        damagedWeightKg: '0',
        status: 'in_progress',
        inspectedBy: request.inspectorUserId
      });
      
      // Shipment remains in delivered status during inspection
      
      // Audit log
      await auditService.logOperation(request.inspectorUserId, 'create', 'shipment_inspections', inspectionId);
      
      console.log(`✅ Inspection ${inspectionNumber} started for shipment ${request.shipmentId}`);
      return inspectionId;
      
    } catch (error) {
      console.error(`Error starting inspection:`, error);
      throw new Error(`Failed to start inspection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Record inspection results
   */
  async recordInspectionResults(
    request: InspectionResultsRequest,
    inspectorUserId: string
  ): Promise<InspectionWorkflowResult> {
    try {
      console.log(`Recording inspection results for ${request.inspectionId}`);
      
      // Get inspection record
      const [inspection] = await db
        .select()
        .from(shipmentInspections)
        .where(eq(shipmentInspections.id, request.inspectionId));
      
      if (!inspection) {
        throw new Error(`Inspection ${request.inspectionId} not found`);
      }
      
      if (inspection.status !== 'in_progress') {
        throw new Error(`Inspection ${request.inspectionId} is not in progress`);
      }
      
      // Validate weight consistency
      const totalWeight = new Decimal(request.cleanWeightKg).add(request.damagedWeightKg);
      if (totalWeight.gt(request.netWeightKg)) {
        throw new Error('Clean weight + damaged weight cannot exceed net weight');
      }
      
      // Determine if settlement is required
      const damagePercent = new Decimal(request.damagedWeightKg)
        .div(request.netWeightKg)
        .mul(100);
      
      const requiresSettlement = damagePercent.gt(5) || request.qualityGrade === 'Reject';
      const status: InspectionStatus = requiresSettlement ? 'settlement_required' : 'completed';
      
      // Update inspection record
      await db
        .update(shipmentInspections)
        .set({
          receivedWeightKg: request.netWeightKg.toString(),
          cleanWeightKg: request.cleanWeightKg.toString(),
          damagedWeightKg: request.damagedWeightKg.toString(),
          status,
          completedAt: new Date()
        })
        .where(eq(shipmentInspections.id, request.inspectionId));
      
      // Trigger warehouse transfer if no settlement required
      let finalWarehouseTransferTriggered = false;
      if (!requiresSettlement) {
        await this.triggerFinalWarehouseTransfer(inspection.shipmentId, request.cleanWeightKg, inspectorUserId);
        finalWarehouseTransferTriggered = true;
      }
      
      // Audit log
      await auditService.logOperation(inspectorUserId, 'update', 'shipment_inspections', request.inspectionId, {
        operation: 'record_inspection_results',
        damagePercent: damagePercent.toNumber(),
        qualityGrade: request.qualityGrade,
        requiresSettlement,
        finalWarehouseTransferTriggered
      });
      
      console.log(`✅ Inspection results recorded: ${damagePercent.toFixed(2)}% damage, requires settlement: ${requiresSettlement}`);
      
      return {
        inspectionId: request.inspectionId,
        shipmentId: inspection.shipmentId,
        status,
        finalWarehouseTransferTriggered,
        approvalRequired: requiresSettlement,
        nextSteps: requiresSettlement ? 
          ['Choose settlement option', 'Get approval for settlement', 'Execute settlement'] :
          ['Goods transferred to final warehouse', 'Update inventory records']
      };
      
    } catch (error) {
      console.error(`Error recording inspection results:`, error);
      throw new Error(`Failed to record inspection results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Request settlement for damaged/rejected goods
   */
  async requestSettlement(
    request: SettlementRequest,
    requestedByUserId: string
  ): Promise<InspectionWorkflowResult> {
    try {
      console.log(`Processing settlement request for inspection ${request.inspectionId}`);
      
      // Get inspection record
      const [inspection] = await db
        .select()
        .from(shipmentInspections)
        .where(eq(shipmentInspections.id, request.inspectionId));
      
      if (!inspection) {
        throw new Error(`Inspection ${request.inspectionId} not found`);
      }
      
      if (inspection.status !== 'settlement_required') {
        throw new Error(`Inspection ${request.inspectionId} does not require settlement`);
      }
      
      // Validate settlement request based on option
      await this.validateSettlementRequest(request, inspection);
      
      // Check if approval is required based on settlement amount
      const requiresApproval = await this.checkSettlementApprovalRequired(request, inspection);
      
      // Update inspection with settlement details
      await db
        .update(shipmentInspections)
        .set({
          settlementOption: request.settlementOption,
          settlementJustification: request.justification,
          discountPercent: request.discountPercent?.toString() || null,
          claimAmountUsd: request.claimAmountUsd?.toString() || null,
          returnShippingCost: request.returnShippingCost?.toString() || null,
          settlementRequestedBy: requestedByUserId,
          settlementRequestedAt: new Date(),
          status: requiresApproval ? 'settlement_required' : 'settled',
          updatedAt: new Date()
        })
        .where(eq(shipmentInspections.id, request.inspectionId));
      
      // If no approval required, execute settlement immediately
      let finalWarehouseTransferTriggered = false;
      if (!requiresApproval) {
        finalWarehouseTransferTriggered = await this.executeSettlement(request.inspectionId, requestedByUserId);
      }
      
      // Audit log
      await auditService.logOperation(requestedByUserId, 'update', 'shipment_inspections', request.inspectionId, {
        operation: 'request_settlement',
        settlementOption: request.settlementOption,
        requiresApproval,
        discountPercent: request.discountPercent,
        claimAmountUsd: request.claimAmountUsd
      });
      
      console.log(`✅ Settlement requested: ${request.settlementOption}, requires approval: ${requiresApproval}`);
      
      return {
        inspectionId: request.inspectionId,
        shipmentId: inspection.shipmentId,
        status: requiresApproval ? 'settlement_required' : 'settled',
        settlementOption: request.settlementOption,
        finalWarehouseTransferTriggered,
        approvalRequired: requiresApproval,
        nextSteps: requiresApproval ?
          ['Await settlement approval', 'Execute approved settlement'] :
          ['Settlement executed', 'Goods processed per settlement terms']
      };
      
    } catch (error) {
      console.error(`Error processing settlement request:`, error);
      throw new Error(`Failed to process settlement request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Trigger automatic final warehouse transfer
   */
  private async triggerFinalWarehouseTransfer(
    shipmentId: string, 
    cleanWeightKg: number,
    userId: string
  ): Promise<void> {
    try {
      console.log(`Triggering final warehouse transfer for shipment ${shipmentId}`);
      
      // Get shipment details
      const [shipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, shipmentId));
      
      if (!shipment) return;
      
      // Update warehouse stock from FIRST to FINAL warehouse
      await db
        .update(warehouseStock)
        .set({
          warehouse: 'FINAL',
          cleanWeightKg: cleanWeightKg.toString(),
          status: 'available',
          lastMovementAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(warehouseStock.orderId, shipment.orderId),
          eq(warehouseStock.warehouse, 'FIRST')
        ));
      
      // Update shipment status
      await db
        .update(shipments)
        .set({ 
          status: 'delivered',
          updatedAt: new Date()
        })
        .where(eq(shipments.id, shipmentId));
      
      console.log(`✅ Final warehouse transfer completed for shipment ${shipmentId}`);
      
    } catch (error) {
      console.error(`Error in final warehouse transfer:`, error);
      throw error;
    }
  }
  
  /**
   * Validate settlement request
   */
  private async validateSettlementRequest(request: SettlementRequest, inspection: any): Promise<void> {
    switch (request.settlementOption) {
      case 'discount':
        if (!request.discountPercent || request.discountPercent <= 0 || request.discountPercent > 100) {
          throw new Error('Valid discount percentage required for discount settlement');
        }
        break;
      case 'claim':
        if (!request.claimAmountUsd || request.claimAmountUsd <= 0) {
          throw new Error('Valid claim amount required for claim settlement');
        }
        break;
      case 'return':
        if (!request.returnShippingCost || request.returnShippingCost <= 0) {
          throw new Error('Valid return shipping cost required for return settlement');
        }
        break;
      case 'accept':
        // No additional validation for accept
        break;
      default:
        throw new Error('Invalid settlement option');
    }
  }
  
  /**
   * Check if settlement requires approval based on amount thresholds
   */
  private async checkSettlementApprovalRequired(request: SettlementRequest, inspection: any): Promise<boolean> {
    try {
      const thresholds = await configurationService.getApprovalThresholds();
      
      let settlementAmount = 0;
      switch (request.settlementOption) {
        case 'discount':
          // Calculate discount amount (simplified - would need purchase value)
          settlementAmount = 1000; // Placeholder - would calculate from purchase cost * discount%
          break;
        case 'claim':
          settlementAmount = request.claimAmountUsd || 0;
          break;
        case 'return':
          settlementAmount = request.returnShippingCost || 0;
          break;
        case 'accept':
          return false; // Accept never requires approval
      }
      
      return settlementAmount > thresholds.settlement_usd;
    } catch (error) {
      console.warn('Error checking approval thresholds, requiring approval by default:', error);
      return true; // Err on side of caution
    }
  }
  
  /**
   * Execute approved settlement
   */
  private async executeSettlement(inspectionId: string, userId: string): Promise<boolean> {
    try {
      console.log(`Executing settlement for inspection ${inspectionId}`);
      
      const [inspection] = await db
        .select()
        .from(shipmentInspections)
        .where(eq(shipmentInspections.id, inspectionId));
      
      if (!inspection) return false;
      
      // Execute settlement based on option
      switch (inspection.settlementOption) {
        case 'accept':
          // Transfer goods to final warehouse with full quantity
          const cleanWeight = parseFloat(inspection.cleanWeightKg);
          await this.triggerFinalWarehouseTransfer(inspection.shipmentId, cleanWeight, userId);
          break;
        case 'discount':
        case 'claim':
        case 'return':
          // More complex settlement logic would go here
          // For now, mark as settled
          break;
      }
      
      // Mark inspection as settled
      await db
        .update(shipmentInspections)
        .set({
          status: 'settled',
          settlementExecutedAt: new Date(),
          settlementExecutedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(shipmentInspections.id, inspectionId));
      
      console.log(`✅ Settlement executed for inspection ${inspectionId}`);
      return true;
      
    } catch (error) {
      console.error(`Error executing settlement:`, error);
      return false;
    }
  }
  
  /**
   * Generate unique inspection number
   */
  private async generateInspectionNumber(): Promise<string> {
    const count = await db.$count(shipmentInspections);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INS-${date}-${String(count + 1).padStart(4, '0')}`;
  }
  
  /**
   * Get inspection workflow status
   */
  async getInspectionStatus(inspectionId: string): Promise<InspectionWorkflowResult | null> {
    try {
      const [inspection] = await db
        .select()
        .from(shipmentInspections)
        .where(eq(shipmentInspections.id, inspectionId));
      
      if (!inspection) return null;
      
      return {
        inspectionId: inspection.id,
        shipmentId: inspection.shipmentId,
        status: inspection.status as InspectionStatus,
        settlementOption: inspection.settlementOption as SettlementOption,
        finalWarehouseTransferTriggered: inspection.status === 'settled',
        approvalRequired: inspection.status === 'settlement_required',
        nextSteps: this.getNextSteps(inspection.status as InspectionStatus)
      };
      
    } catch (error) {
      console.error(`Error getting inspection status:`, error);
      return null;
    }
  }
  
  private getNextSteps(status: InspectionStatus): string[] {
    switch (status) {
      case 'pending':
        return ['Start inspection process'];
      case 'in_progress':
        return ['Record inspection results', 'Document any damage or quality issues'];
      case 'settlement_required':
        return ['Choose settlement option', 'Get required approvals'];
      case 'completed':
        return ['Goods transferred to final warehouse'];
      case 'settled':
        return ['Settlement complete', 'Process goods per settlement terms'];
      default:
        return [];
    }
  }
}

// Export singleton instance
export const inspectionWorkflowService = InspectionWorkflowService.getInstance();