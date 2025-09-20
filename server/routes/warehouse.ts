import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole, requireWarehouseScope } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
import { warehouseEnhancementService } from "../modules/warehouse/service";
import { 
  insertWarehouseStockSchema, 
  insertFilterRecordSchema,
  warehouseStatusUpdateSchema,
  warehouseFilterOperationSchema,
  warehouseMoveToFinalSchema,
  warehouseStockFilterSchema
} from "@shared/schema";
import { warehousePeriodGuard } from "../periodGuard";
import { requireApproval } from "../approvalMiddleware";

export const warehouseRouter = Router();

// GET /api/warehouse/stock
warehouseRouter.get("/stock", isAuthenticated, async (req, res) => {
  try {
    const stock = await storage.getWarehouseStock();
    res.json(stock);
  } catch (error) {
    console.error("Error fetching warehouse stock:", error);
    res.status(500).json({ message: "Failed to fetch warehouse stock" });
  }
});

// POST /api/warehouse/stock
warehouseRouter.post("/stock",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  warehousePeriodGuard,
  requireApproval("warehouse_operation"),
  async (req, res) => {
    try {
      const validatedData = insertWarehouseStockSchema.parse(req.body);
      const stock = await storage.createWarehouseStock({
        ...validatedData,
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "warehouse_stock",
        entityId: stock.id,
        description: `Added warehouse stock: ${stock.sourceType} - ${stock.quantityKg}kg`,
        previousState: null,
        newState: stock
      });

      res.status(201).json(stock);
    } catch (error) {
      console.error("Error creating warehouse stock:", error);
      res.status(500).json({ message: "Failed to create warehouse stock" });
    }
  }
);

// POST /api/warehouse/filter
warehouseRouter.post("/filter",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  requireWarehouseScope,
  async (req, res) => {
    try {
      const validatedData = warehouseFilterOperationSchema.parse(req.body);
      const result = await storage.filterWarehouseStock(validatedData);

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "warehouse_stock",
        entityId: validatedData.stockId,
        description: `Filtered warehouse stock: ${validatedData.cleanQuantityKg}kg clean, ${validatedData.nonCleanQuantityKg}kg non-clean`,
        previousState: null,
        newState: result
      });

      res.json(result);
    } catch (error) {
      console.error("Error filtering warehouse stock:", error);
      res.status(500).json({ message: "Failed to filter warehouse stock" });
    }
  }
);

// POST /api/warehouse/move-to-final
warehouseRouter.post("/move-to-final",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  async (req, res) => {
    try {
      const validatedData = warehouseMoveToFinalSchema.parse(req.body);
      const result = await storage.moveToFinalWarehouse(validatedData);

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "warehouse_stock",
        entityId: validatedData.stockId,
        description: `Moved ${validatedData.quantityKg}kg to final warehouse`,
        previousState: null,
        newState: result
      });

      res.json(result);
    } catch (error) {
      console.error("Error moving to final warehouse:", error);
      res.status(500).json({ message: "Failed to move to final warehouse" });
    }
  }
);

// GET /api/warehouse/filtering-alerts
warehouseRouter.get("/filtering-alerts",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  async (req, res) => {
    try {
      const alerts = await warehouseEnhancementService.getFilteringAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching filtering alerts:", error);
      res.status(500).json({ message: "Failed to fetch filtering alerts" });
    }
  }
);

// GET /api/warehouse/supplier-reports
warehouseRouter.get("/supplier-reports",
  isAuthenticated,
  requireRole(["admin", "warehouse", "purchasing"]),
  async (req, res) => {
    try {
      const reports = await warehouseEnhancementService.getSupplierFilteringReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching supplier reports:", error);
      res.status(500).json({ message: "Failed to fetch supplier reports" });
    }
  }
);