import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { z } from "zod";
import Decimal from "decimal.js";
import { 
  insertSupplierSchema,
  insertOrderSchema,
  insertPurchaseSchema,
  insertCapitalEntrySchema,
  insertWarehouseStockSchema,
  insertFilterRecordSchema,
  insertSettingSchema,
  warehouseStatusUpdateSchema,
  warehouseFilterOperationSchema,
  warehouseMoveToFinalSchema,
  warehouseStockFilterSchema,
  dateRangeFilterSchema,
  periodFilterSchema,
  exportTypeSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', requireRole(['admin']), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const roleUpdateSchema = z.object({
        role: z.enum(['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker']),
      });
      
      const { role } = roleUpdateSchema.parse(req.body);
      const updatedUser = await storage.updateUserRole(id, role);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Settings routes
  app.get('/api/settings', requireRole(['admin', 'finance', 'purchasing', 'sales', 'warehouse']), async (req, res) => {
    try {
      const exchangeRate = await storage.getExchangeRate();
      const preventNegativeSetting = await storage.getSetting('PREVENT_NEGATIVE_BALANCE');
      const preventNegativeBalance = preventNegativeSetting?.value === 'true';
      
      res.json({ 
        exchangeRate,
        preventNegativeBalance 
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/settings', requireRole(['admin']), async (req, res) => {
    try {
      const setting = insertSettingSchema.parse(req.body);
      const result = await storage.setSetting(setting);
      res.json(result);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Capital routes
  app.get('/api/capital/entries', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const entries = await storage.getCapitalEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching capital entries:", error);
      res.status(500).json({ message: "Failed to fetch capital entries" });
    }
  });

  app.get('/api/capital/balance', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const balance = await storage.getCapitalBalance();
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching capital balance:", error);
      res.status(500).json({ message: "Failed to fetch capital balance" });
    }
  });

  app.post('/api/capital/entries', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const entryData = insertCapitalEntrySchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });
      
      // Require exchangeRate for non-USD entries
      if (entryData.paymentCurrency !== 'USD' && (!entryData.exchangeRate || entryData.exchangeRate === '0')) {
        return res.status(400).json({ 
          message: "Exchange rate is required for non-USD currencies",
          field: "exchangeRate"
        });
      }
      
      // Convert amount to USD for capital tracking normalization
      const entryAmount = new Decimal(entryData.amount);
      let amountInUsd = entryAmount;
      if (entryData.paymentCurrency === 'ETB' && entryData.exchangeRate) {
        amountInUsd = entryAmount.div(new Decimal(entryData.exchangeRate));
      }
      
      // Store USD amount with original paymentCurrency and exchangeRate as metadata
      // Use concurrency protection to prevent race conditions  
      const entry = await storage.createCapitalEntryWithConcurrencyProtection({
        ...entryData,
        amount: amountInUsd.toFixed(2), // Store normalized USD amount for accurate balance calculation
      });
      res.json(entry);
    } catch (error) {
      console.error("Error creating capital entry:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to create capital entry" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', requireRole(['admin', 'purchasing']), async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', requireRole(['admin', 'purchasing']), async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.get('/api/suppliers/:id', requireRole(['admin', 'purchasing']), async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Order routes
  app.get('/api/orders', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Purchase routes
  app.get('/api/purchases', requireRole(['admin', 'purchasing']), async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post('/api/purchases', requireRole(['admin', 'purchasing']), async (req: any, res) => {
    try {
      const purchaseData = insertPurchaseSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      // Additional validation: ensure exchange rate is provided for non-USD currencies
      if (purchaseData.currency !== 'USD' && (!purchaseData.exchangeRate || purchaseData.exchangeRate === '0')) {
        return res.status(400).json({ 
          message: "Exchange rate is required for non-USD currencies",
          field: "exchangeRate"
        });
      }

      // Calculate total and remaining using decimal-safe math
      const weight = new Decimal(purchaseData.weight);
      const pricePerKg = new Decimal(purchaseData.pricePerKg);
      const amountPaid = new Decimal(purchaseData.amountPaid || '0');
      
      const total = weight.mul(pricePerKg);
      const remaining = total.sub(amountPaid);

      // Use atomic transaction with retry logic to create purchase with all side effects
      const purchase = await storage.createPurchaseWithSideEffectsRetryable({
        ...purchaseData,
        total: total.toFixed(2),
        remaining: remaining.toFixed(2),
      }, req.user.claims.sub);

      res.json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }

      // Handle specific business logic errors from the transaction
      if (error instanceof Error && error.message.includes('Would result in negative balance')) {
        return res.status(400).json({
          message: error.message,
          field: "fundingSource",
          suggestion: "Use external funding or add more capital"
        });
      }
      
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Warehouse routes
  app.get('/api/warehouse/stock', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      let stock;
      
      // Support query filtering
      const queryParams = req.query;
      if (Object.keys(queryParams).length > 0) {
        const filterParams = warehouseStockFilterSchema.parse(queryParams);
        
        if (filterParams.status && filterParams.warehouse) {
          // This combination would need a new storage method, for now get by status
          stock = await storage.getWarehouseStockByStatus(filterParams.status);
        } else if (filterParams.status) {
          stock = await storage.getWarehouseStockByStatus(filterParams.status);
        } else if (filterParams.warehouse) {
          stock = await storage.getWarehouseStockByWarehouse(filterParams.warehouse);
        } else {
          stock = await storage.getWarehouseStock();
        }
      } else {
        stock = await storage.getWarehouseStock();
      }
      
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to fetch warehouse stock" });
    }
  });

  app.get('/api/warehouse/stock/status/:status', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stock = await storage.getWarehouseStockByStatus(req.params.status);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock by status:", error);
      res.status(500).json({ message: "Failed to fetch warehouse stock" });
    }
  });

  app.get('/api/warehouse/stock/warehouse/:warehouse', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stock = await storage.getWarehouseStockByWarehouse(req.params.warehouse);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock by warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse stock" });
    }
  });

  app.patch('/api/warehouse/stock/:id', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stockData = req.body;
      const stock = await storage.updateWarehouseStock(req.params.id, stockData);
      res.json(stock);
    } catch (error) {
      console.error("Error updating warehouse stock:", error);
      res.status(500).json({ message: "Failed to update warehouse stock" });
    }
  });

  app.patch('/api/warehouse/stock/:id/status', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Stock ID is required" });
      }

      const statusData = warehouseStatusUpdateSchema.parse(req.body);
      const stock = await storage.updateWarehouseStockStatus(id, statusData.status, req.user.claims.sub);
      
      res.json(stock);
    } catch (error) {
      console.error("Error updating warehouse stock status:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid status data",
          errors: error.errors
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update warehouse stock status" });
    }
  });

  app.post('/api/warehouse/filter', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const filterData = warehouseFilterOperationSchema.parse(req.body);
      
      const result = await storage.executeFilterOperation(
        filterData.purchaseId, 
        filterData.outputCleanKg, 
        filterData.outputNonCleanKg, 
        req.user.claims.sub
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error executing filter operation:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid filter operation data",
          errors: error.errors
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to execute filter operation" });
    }
  });

  app.post('/api/warehouse/move-to-final', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const moveData = warehouseMoveToFinalSchema.parse(req.body);
      
      const finalStock = await storage.moveStockToFinalWarehouse(moveData.stockId, req.user.claims.sub);
      res.json(finalStock);
    } catch (error) {
      console.error("Error moving stock to final warehouse:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid move operation data",
          errors: error.errors
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to move stock to final warehouse" });
    }
  });

  // Filter routes
  app.get('/api/filters', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filters = await storage.getFilterRecords();
      res.json(filters);
    } catch (error) {
      console.error("Error fetching filter records:", error);
      res.status(500).json({ message: "Failed to fetch filter records" });
    }
  });

  app.post('/api/filters', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const filterData = insertFilterRecordSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      // Calculate filter yield
      const filterYield = (parseFloat(filterData.outputCleanKg) / parseFloat(filterData.inputKg)) * 100;

      const filter = await storage.createFilterRecord({
        ...filterData,
        filterYield: filterYield.toString(),
      });

      res.json(filter);
    } catch (error) {
      console.error("Error creating filter record:", error);
      res.status(500).json({ message: "Failed to create filter record" });
    }
  });


  // REPORTING ENDPOINTS - All with proper RBAC and USD normalization

  // Financial Summary Endpoint
  app.get('/api/reports/financial/summary', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const filters = dateRangeFilterSchema.parse(req.query);
      const summary = await storage.getFinancialSummary(filters);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  // Cash Flow Analysis Endpoint
  app.get('/api/reports/financial/cashflow', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { period } = periodFilterSchema.parse(req.query);
      const cashFlow = await storage.getCashflowAnalysis(period);
      res.json(cashFlow);
    } catch (error) {
      console.error("Error fetching cash flow analysis:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to fetch cash flow analysis" });
    }
  });

  // Inventory Analytics Endpoint
  app.get('/api/reports/inventory/analytics', requireRole(['admin', 'finance', 'warehouse']), async (req, res) => {
    try {
      const analytics = await storage.getInventoryAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching inventory analytics:", error);
      res.status(500).json({ message: "Failed to fetch inventory analytics" });
    }
  });

  // Supplier Performance Endpoint
  app.get('/api/reports/suppliers/performance', requireRole(['admin', 'finance', 'purchasing']), async (req, res) => {
    try {
      const performance = await storage.getSupplierPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching supplier performance:", error);
      res.status(500).json({ message: "Failed to fetch supplier performance" });
    }
  });

  // Trading Activity Endpoint
  app.get('/api/reports/trading/activity', requireRole(['admin', 'finance', 'sales']), async (req, res) => {
    try {
      const activity = await storage.getTradingActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching trading activity:", error);
      res.status(500).json({ message: "Failed to fetch trading activity" });
    }
  });

  // Enhanced Export Endpoint with proper USD normalization
  app.get('/api/reports/export/:type', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { type } = req.params;
      const { format = 'json' } = exportTypeSchema.parse({ type, format: req.query.format });
      
      const data = await storage.exportReportData(type, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
        res.send(data);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.json`);
        res.json(data);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      if (error instanceof Error && error.message.includes('Unsupported report type')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
