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
  requireWarehouseScope,
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
  warehousePeriodGuard,
  requireApproval("warehouse_operation"),
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
  warehousePeriodGuard,
  requireApproval("warehouse_operation"),
  requireWarehouseScope,
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
      const alerts = await warehouseEnhancementService.checkFilteringAlerts();
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
      const reports = await warehouseEnhancementService.generateSupplierFilteringReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching supplier reports:", error);
      res.status(500).json({ message: "Failed to fetch supplier reports" });
    }
  }
);

// POST /api/warehouse/validate-cost-redistribution - Stage 3 Compliance: Cost redistribution validation
warehouseRouter.post("/validate-cost-redistribution",
  isAuthenticated,
  requireRole(["admin", "warehouse", "finance"]),
  warehousePeriodGuard,
  requireApproval("warehouse_cost_validation"),
  async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
      }
      
      const validation = await warehouseEnhancementService.validateCostRedistribution(orderId);
      
      // Create audit log for cost redistribution validation
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'warehouse_enhancement',
          severity: validation.isValid ? 'info' : 'warning',
        },
        {
          entityType: 'warehouse_stock',
          entityId: orderId,
          action: 'validate',
          operationType: 'cost_redistribution_validation',
          description: `Cost redistribution validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`,
          newValues: {
            validationResult: validation,
            errorsCount: validation.errors.length,
            isValid: validation.isValid
          },
          businessContext: `Cost redistribution validation for order ${orderId}`,
        }
      );
      
      res.json({
        orderId,
        validationResult: validation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error validating cost redistribution:", error);
      res.status(500).json({ message: "Failed to validate cost redistribution" });
    }
  }
);

// POST /api/warehouse/auto-correct-cost-redistribution - Stage 3 Compliance: Auto-correction of cost redistribution
warehouseRouter.post("/auto-correct-cost-redistribution",
  isAuthenticated,
  requireRole(["admin", "warehouse", "finance"]),
  warehousePeriodGuard,
  requireApproval("warehouse_cost_correction"),
  async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
      }
      
      const success = await warehouseEnhancementService.autoCorrectCostRedistribution(
        orderId,
        (req.user as any)?.claims?.sub || 'unknown'
      );
      
      // Create audit log for auto-correction attempt
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'warehouse_enhancement',
          severity: success ? 'info' : 'error',
        },
        {
          entityType: 'warehouse_stock',
          entityId: orderId,
          action: 'auto_correct',
          operationType: 'cost_redistribution_correction',
          description: `Auto-correction attempt: ${success ? 'SUCCESS' : 'FAILED'}`,
          newValues: {
            correctionSuccess: success,
            orderId,
          },
          businessContext: `Auto-correction attempt for order ${orderId}`,
        }
      );
      
      res.json({
        orderId,
        success,
        message: success 
          ? 'Cost redistribution corrected successfully' 
          : 'Auto-correction failed - manual intervention required',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error auto-correcting cost redistribution:", error);
      res.status(500).json({ message: "Failed to auto-correct cost redistribution" });
    }
  }
);