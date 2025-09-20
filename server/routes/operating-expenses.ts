import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
import { supplyInventoryService } from "../supplyInventoryService";
import { 
  insertOperatingExpenseSchema,
  insertOperatingExpenseCategorySchema,
  insertSupplySchema,
  insertSupplyPurchaseSchema,
  insertSupplyConsumptionSchema
} from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";

export const operatingExpensesRouter = Router();

// GET /api/operating-expenses
operatingExpensesRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const expenses = await storage.getOperatingExpenses();
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching operating expenses:", error);
    res.status(500).json({ message: "Failed to fetch operating expenses" });
  }
});

// POST /api/operating-expenses
operatingExpensesRouter.post("/",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  requireApproval("operating_expense"),
  async (req, res) => {
    try {
      const validatedData = insertOperatingExpenseSchema.parse(req.body);
      const expense = await storage.createOperatingExpense(validatedData);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'operating_expenses',
          severity: 'info',
        },
        {
          entityType: 'operating_expenses',
          entityId: expense.id,
          action: 'create',
          operationType: 'operating_expense',
          description: `Created operating expense: ${expense.description}`,
          newValues: expense
        }
      );

      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating operating expense:", error);
      res.status(500).json({ message: "Failed to create operating expense" });
    }
  }
);

// GET /api/operating-expense-categories
operatingExpensesRouter.get("/categories", isAuthenticated, async (req, res) => {
  try {
    const categories = await storage.getOperatingExpenseCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    res.status(500).json({ message: "Failed to fetch expense categories" });
  }
});

// POST /api/operating-expense-categories
operatingExpensesRouter.post("/categories",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const validatedData = insertOperatingExpenseCategorySchema.parse(req.body);
      const category = await storage.createOperatingExpenseCategory(validatedData);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'operating_expenses',
          severity: 'info',
        },
        {
          entityType: 'operating_expense_categories',
          entityId: category.id,
          action: 'create',
          operationType: 'expense_category_create',
          description: `Created expense category: ${category.categoryName}`,
          newValues: category
        }
      );

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating expense category:", error);
      res.status(500).json({ message: "Failed to create expense category" });
    }
  }
);

// GET /api/supplies
operatingExpensesRouter.get("/supplies", isAuthenticated, async (req, res) => {
  try {
    const supplies = await storage.getSupplies();
    res.json(supplies);
  } catch (error) {
    console.error("Error fetching supplies:", error);
    res.status(500).json({ message: "Failed to fetch supplies" });
  }
});

// POST /api/supplies
operatingExpensesRouter.post("/supplies",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  async (req, res) => {
    try {
      const validatedData = insertSupplySchema.parse(req.body);
      const supply = await storage.createSupply(validatedData);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'operating_expenses',
          severity: 'info',
        },
        {
          entityType: 'supplies',
          entityId: supply.id,
          action: 'create',
          operationType: 'supply_create',
          description: `Created supply: ${supply.name}`,
          newValues: supply
        }
      );

      res.status(201).json(supply);
    } catch (error) {
      console.error("Error creating supply:", error);
      res.status(500).json({ message: "Failed to create supply" });
    }
  }
);

// POST /api/supply-purchases
operatingExpensesRouter.post("/supply-purchases",
  isAuthenticated,
  requireRole(["admin", "warehouse", "purchasing"]),
  requireApproval("supply_purchase"),
  async (req, res) => {
    try {
      const validatedData = insertSupplyPurchaseSchema.parse(req.body);
      const purchaseRequest = {
        supplierId: validatedData.supplierId,
        items: [{
          itemType: 'other' as const,
          itemName: validatedData.supplyId,
          quantity: parseFloat(validatedData.quantity),
          unitOfMeasure: 'unit',
          unitCost: parseFloat(validatedData.unitPrice)
        }],
        currency: validatedData.currency || 'USD',
        exchangeRate: validatedData.exchangeRate ? parseFloat(validatedData.exchangeRate) : undefined,
        fundingSource: validatedData.fundingSource as 'capital' | 'external',
        notes: `Purchase for supply ${validatedData.supplyId}`
      };
      const purchaseId = await supplyInventoryService.purchaseSupplies(purchaseRequest, req.user!.id);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'operating_expenses',
          severity: 'info',
        },
        {
          entityType: 'supply_purchases',
          entityId: purchaseId,
          action: 'create',
          operationType: 'supply_purchase',
          description: `Purchased supplies from supplier ${validatedData.supplierId}`,
          newValues: validatedData
        }
      );

      res.status(201).json({ purchaseId, status: 'purchase_completed' });
    } catch (error) {
      console.error("Error purchasing supplies:", error);
      res.status(500).json({ message: "Failed to purchase supplies" });
    }
  }
);

// POST /api/supply-consumption
operatingExpensesRouter.post("/supply-consumption",
  isAuthenticated,
  requireRole(["admin", "warehouse"]),
  async (req, res) => {
    try {
      const validatedData = insertSupplyConsumptionSchema.parse(req.body);
      const packingConsumption = {
        orderId: validatedData.orderId,
        warehouseStockId: validatedData.warehouseStockId || undefined,
        packingOperation: validatedData.packingOperation as 'packing' | 'labeling' | 'wrapping',
        cartonsProcessed: validatedData.cartonsProcessed || 1,
        supplies: [{
          supplyInventoryId: validatedData.supplyId,
          quantityConsumed: parseFloat(validatedData.quantityConsumed),
          consumptionReason: 'packing_operation'
        }]
      };
      const consumptionId = await supplyInventoryService.consumeSuppliesDuringPacking(packingConsumption, req.user!.id);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'operating_expenses',
          severity: 'info',
        },
        {
          entityType: 'supply_consumption',
          entityId: consumptionId,
          action: 'create',
          operationType: 'supply_consumption',
          description: `Consumed supplies for order ${validatedData.orderId}`,
          newValues: validatedData
        }
      );

      res.status(201).json({ consumptionId, status: 'consumption_recorded' });
    } catch (error) {
      console.error("Error recording consumption:", error);
      res.status(500).json({ message: "Failed to record consumption" });
    }
  }
);

// GET /api/supply-alerts
operatingExpensesRouter.get("/supply-alerts", 
  isAuthenticated,
  requireRole(["admin", "warehouse", "purchasing"]),
  async (req, res) => {
    try {
      // Supply alerts functionality - placeholder for future implementation
      const alerts: any[] = [];
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching supply alerts:", error);
      res.status(500).json({ message: "Failed to fetch supply alerts" });
    }
  }
);

// GET /api/consumption-reports
operatingExpensesRouter.get("/consumption-reports",
  isAuthenticated, 
  requireRole(["admin", "finance", "warehouse"]),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      // Consumption report functionality - placeholder for future implementation
      const report = {
        period: {
          startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: endDate ? new Date(endDate as string) : new Date()
        },
        totalConsumption: {
          totalValueUsd: 0,
          totalItems: 0,
          byItemType: {},
          byOperation: {},
          byOrder: []
        },
        efficiencyMetrics: {
          consumptionPerCarton: 0,
          costPerCarton: 0,
          wastePercentage: 0
        },
        recommendations: ['Implement supply tracking for detailed reports']
      };
      res.json(report);
    } catch (error) {
      console.error("Error generating consumption report:", error);
      res.status(500).json({ message: "Failed to generate consumption report" });
    }
  }
);