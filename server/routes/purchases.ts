import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
import { supplierEnhancementService } from "../modules/purchases/supplierService";
import { insertPurchaseSchema, insertSupplierSchema, insertSupplierQualityAssessmentSchema } from "@shared/schema";
import { purchasePeriodGuard } from "../periodGuard";
import { requireApproval } from "../approvalMiddleware";

export const purchasesRouter = Router();

// GET /api/purchases
purchasesRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const purchases = await storage.getPurchases();
    res.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
});

// POST /api/purchases
purchasesRouter.post("/", 
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  requireApproval("purchase"),
  async (req, res) => {
    try {
      const validatedData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase({
        ...validatedData,
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "purchase",
        entityId: purchase.id,
        description: `Created purchase from ${purchase.supplierName}`,
        previousState: null,
        newState: purchase
      });

      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  }
);

// GET /api/purchases/suppliers
purchasesRouter.get("/suppliers", isAuthenticated, async (req, res) => {
  try {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
});

// POST /api/purchases/suppliers
purchasesRouter.post("/suppliers",
  isAuthenticated,
  requireRole(["admin", "purchasing"]),
  async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "supplier",
        entityId: supplier.id,
        description: `Created supplier: ${supplier.name}`,
        previousState: null,
        newState: supplier
      });

      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  }
);

// POST /api/purchases/quality-assessment
purchasesRouter.post("/quality-assessment",
  isAuthenticated,
  requireRole(["admin", "purchasing", "warehouse"]),
  async (req, res) => {
    try {
      // STAGE 2 COMPLIANCE: Validate request body against quality assessment schema
      const validatedData = insertSupplierQualityAssessmentSchema.parse(req.body);
      const assessment = await supplierEnhancementService.assessSupplierQuality(
        validatedData,
        req.user!.claims.sub
      );
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating quality assessment:", error);
      res.status(500).json({ message: "Failed to create quality assessment" });
    }
  }
);

// GET /api/purchases/overdue-advances
purchasesRouter.get("/overdue-advances",
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  async (req, res) => {
    try {
      const alerts = await supplierEnhancementService.checkOverdueAdvances();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching overdue advances:", error);
      res.status(500).json({ message: "Failed to fetch overdue advances" });
    }
  }
);