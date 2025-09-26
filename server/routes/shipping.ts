import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { auditService } from "../auditService";
import { commissionCalculationService } from "../commissionCalculationService";
import { inspectionWorkflowService } from "../inspectionWorkflowService";
import { landedCostService } from "../landedCostService";
import { 
  insertShipmentSchema,
  insertShipmentItemSchema,
  insertShippingCostSchema,
  insertShipmentInspectionSchema,
  insertArrivalCostSchema,
  addShippingCostSchema,
  shipmentStatusUpdateSchema,
  commissionCalculationSchema,
  landedCostCalculationSchema,
  inspectionSettlementSchema
} from "@shared/schema";
import { shippingEnhancementService } from "../modules/shipping/service";
import { requireApproval } from "../approvalMiddleware";

export const shippingRouter = Router();

// GET /api/shipping/shipments
shippingRouter.get("/shipments", isAuthenticated, requireRole(["admin", "warehouse"]), async (req, res) => {
  try {
    const shipments = await storage.getShipments();
    res.json(shipments);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({ message: "Failed to fetch shipments" });
  }
});

// POST /api/shipping/shipments
shippingRouter.post("/shipments",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  requireApproval("shipping_operation"),
  async (req, res) => {
    try {
      const validatedData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment({
        ...validatedData,
        userId: (req.user as any)?.claims?.sub
      });

      // Create audit log
      const auditContext = auditService.extractRequestContext(req);
      await auditService.logOperation(auditContext, {
        entityType: "shipments",
        entityId: shipment.id,
        action: "create",
        description: `Created shipment: ${shipment.containerNumber || shipment.id}`,
        newValues: shipment
      });

      res.status(201).json(shipment);
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ message: "Failed to create shipment" });
    }
  }
);

// POST /api/shipping/commission-calculation
shippingRouter.post("/commission-calculation",
  isAuthenticated,
  requireRole(["admin", "warehouse", "finance"]),
  async (req, res) => {
    try {
      // Validate request data
      const validatedData = commissionCalculationSchema.parse(req.body);
      const calculation = await commissionCalculationService.calculateAndApplyCommission(
        validatedData,
        (req.user as any)?.claims?.sub || 'unknown'
      );
      
      // Create audit log
      const auditContext = auditService.extractRequestContext(req);
      await auditService.logOperation(auditContext, {
        entityType: "shipment_legs",
        entityId: calculation.shipmentLegId,
        action: "update",
        description: `Calculated commission: ${calculation.commissionUsd}`,
        newValues: calculation
      });
      
      res.json(calculation);
    } catch (error) {
      console.error("Error calculating commission:", error);
      res.status(500).json({ message: "Failed to calculate commission" });
    }
  }
);

// POST /api/shipping/inspection
shippingRouter.post("/inspection",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  async (req, res) => {
    try {
      // Validate request data
      const validatedData = insertShipmentInspectionSchema.parse(req.body);
      const inspectionRequest = {
        shipmentId: validatedData.shipmentId,
        inspectorUserId: (req.user as any)?.claims?.sub || 'unknown',
        inspectionLocation: validatedData.inspectionLocation || 'Default Location',
        notes: validatedData.notes
      };
      const inspectionId = await inspectionWorkflowService.startInspection(inspectionRequest);
      
      // Create audit log
      const auditContext = auditService.extractRequestContext(req);
      await auditService.logOperation(auditContext, {
        entityType: "shipment_inspections",
        entityId: inspectionId,
        action: "create",
        description: `Started inspection for shipment: ${validatedData.shipmentId}`,
        newValues: inspectionRequest
      });
      
      res.status(201).json({ id: inspectionId, ...inspectionRequest });
    } catch (error) {
      console.error("Error creating inspection:", error);
      res.status(500).json({ message: "Failed to create inspection" });
    }
  }
);

// POST /api/shipping/landed-cost
shippingRouter.post("/landed-cost",
  isAuthenticated,
  requireRole(["admin", "warehouse", "finance"]),
  async (req, res) => {
    try {
      // Validate request data
      const validatedData = landedCostCalculationSchema.parse(req.body);
      const landedCostResults = await landedCostService.calculateLandedCost(validatedData);
      
      // Create audit log
      const auditContext = auditService.extractRequestContext(req);
      await auditService.logOperation(auditContext, {
        entityType: "landed_cost_calculations",
        entityId: validatedData.orderId || validatedData.shipmentId || 'unknown',
        action: "create",
        description: `Calculated landed cost for ${landedCostResults.length} order(s)`,
        newValues: { calculationRequest: validatedData, resultCount: landedCostResults.length }
      });
      
      res.json({ results: landedCostResults });
    } catch (error) {
      console.error("Error calculating landed cost:", error);
      res.status(500).json({ message: "Failed to calculate landed cost" });
    }
  }
);

// POST /api/shipping/inspections/:id/settlement
shippingRouter.post("/inspections/:id/settlement",
  isAuthenticated,
  requireRole(["admin", "warehouse", "finance"]),
  requireApproval("shipping_operation"),
  async (req, res) => {
    try {
      // Validate settlement data
      const validatedData = inspectionSettlementSchema.parse(req.body);
      const settlementId = await shippingEnhancementService.processInspectionSettlement(
        { ...validatedData, inspectionId: req.params.id },
        (req.user as any)?.claims?.sub || 'unknown'
      );
      
      // Create audit log
      const auditContext = auditService.extractRequestContext(req);
      await auditService.logOperation(auditContext, {
        entityType: "shipment_inspections",
        entityId: req.params.id,
        action: "update",
        description: `Processed settlement: ${validatedData.settlementType}`,
        newValues: { settlementId, ...validatedData }
      });
      
      res.status(201).json({ settlementId, status: 'settlement_processed' });
    } catch (error) {
      console.error("Error processing settlement:", error);
      res.status(500).json({ message: "Failed to process settlement" });
    }
  }
);