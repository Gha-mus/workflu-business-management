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
  addShippingCostSchema,
  shipmentStatusUpdateSchema
} from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";

export const shippingRouter = Router();

// GET /api/shipping/shipments
shippingRouter.get("/shipments", isAuthenticated, async (req, res) => {
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
  requireRole(["admin", "shipping"]),
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
  requireRole(["admin", "shipping", "finance"]),
  async (req, res) => {
    try {
      const calculation = await commissionCalculationService.calculateTransferCommission(req.body);
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
  requireRole(["admin", "shipping", "warehouse"]),
  async (req, res) => {
    try {
      const inspection = await inspectionWorkflowService.createInspection(req.body, req.user!.id);
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
  requireRole(["admin", "shipping", "finance"]),
  async (req, res) => {
    try {
      const landedCost = await landedCostService.calculateLandedCost(req.body);
      res.json(landedCost);
    } catch (error) {
      console.error("Error calculating landed cost:", error);
      res.status(500).json({ message: "Failed to calculate landed cost" });
    }
  }
);