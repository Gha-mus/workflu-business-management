import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
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
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "shipment",
        entityId: shipment.id,
        description: `Created shipment: ${shipment.containerNumber}`,
        previousState: null,
        newState: shipment
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
      const calculation = await commissionCalculationService.calculateTransferCommission(validatedData);
      
      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "commission_calculation",
        entityId: calculation.id || 'N/A',
        description: `Calculated commission: ${calculation.commissionAmount}`,
        previousState: null,
        newState: calculation
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
      const inspection = await inspectionWorkflowService.createInspection(validatedData, req.user!.id);
      
      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "shipment_inspection",
        entityId: inspection.id,
        description: `Created inspection: ${inspection.inspectionNumber}`,
        previousState: null,
        newState: inspection
      });
      
      res.status(201).json(inspection);
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
      const landedCost = await landedCostService.calculateLandedCost(validatedData);
      
      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "landed_cost",
        entityId: landedCost.id || 'N/A',
        description: `Calculated landed cost: ${landedCost.totalCost}`,
        previousState: null,
        newState: landedCost
      });
      
      res.json(landedCost);
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
        req.user!.id
      );
      
      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "shipment_inspection",
        entityId: req.params.id,
        description: `Processed settlement: ${validatedData.settlementType}`,
        previousState: null,
        newState: { settlementId, ...validatedData }
      });
      
      res.status(201).json({ settlementId, status: 'settlement_processed' });
    } catch (error) {
      console.error("Error processing settlement:", error);
      res.status(500).json({ message: "Failed to process settlement" });
    }
  }
);