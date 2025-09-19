import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { aiService } from "./aiService";
import { exportService } from "./exportService";
import { 
  purchasePeriodGuard, 
  capitalEntryPeriodGuard, 
  warehousePeriodGuard, 
  genericPeriodGuard,
  strictPeriodGuard 
} from "./periodGuard";
import { z } from "zod";
import Decimal from "decimal.js";
import crypto from "crypto";
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
  aiPurchaseRecommendationRequestSchema,
  aiSupplierRecommendationRequestSchema,
  aiCapitalOptimizationRequestSchema,
  aiChatRequestSchema,
  aiContextualHelpRequestSchema,
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

  app.post('/api/capital/entries', requireRole(['admin', 'finance']), capitalEntryPeriodGuard, async (req: any, res) => {
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

  app.post('/api/suppliers', requireRole(['admin', 'purchasing']), genericPeriodGuard, async (req, res) => {
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

  app.post('/api/orders', requireRole(['admin', 'sales']), genericPeriodGuard, async (req, res) => {
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

  app.post('/api/purchases', requireRole(['admin', 'purchasing']), purchasePeriodGuard, async (req: any, res) => {
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

  app.patch('/api/warehouse/stock/:id', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req, res) => {
    try {
      const stockData = req.body;
      const stock = await storage.updateWarehouseStock(req.params.id, stockData);
      res.json(stock);
    } catch (error) {
      console.error("Error updating warehouse stock:", error);
      res.status(500).json({ message: "Failed to update warehouse stock" });
    }
  });

  app.patch('/api/warehouse/stock/:id/status', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
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

  app.post('/api/warehouse/filter', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
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

  app.post('/api/warehouse/move-to-final', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
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

  // AI Routes - Business Process Automation
  app.post('/api/ai/purchase-recommendations', requireRole(['admin', 'purchasing']), async (req: any, res) => {
    try {
      const requestData = aiPurchaseRecommendationRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      // Create cache key
      const cacheKey = `purchase_recommendations_${crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex')}`;
      
      // Check cache first
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      // Fetch business data
      const purchases = await storage.getPurchases();
      const capitalBalance = await storage.getCapitalBalance();
      
      // Generate AI recommendations
      const result = await aiService.getPurchaseRecommendations(
        purchases,
        requestData.marketConditions || {},
        capitalBalance
      );
      
      // Cache result for 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'purchase_recommendations',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ purchases, capitalBalance })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating purchase recommendations:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate purchase recommendations" 
      });
    }
  });

  app.post('/api/ai/supplier-recommendations', requireRole(['admin', 'purchasing']), async (req: any, res) => {
    try {
      const requestData = aiSupplierRecommendationRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const cacheKey = `supplier_recommendations_${crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex')}`;
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const suppliers = await storage.getSuppliers();
      const supplierPerformance = await storage.getSupplierPerformance();
      
      const result = await aiService.getSupplierRecommendations(
        suppliers,
        supplierPerformance,
        requestData
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'supplier_recommendations',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ suppliers, supplierPerformance })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating supplier recommendations:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate supplier recommendations" 
      });
    }
  });

  app.post('/api/ai/capital-optimization', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const requestData = aiCapitalOptimizationRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const cacheKey = `capital_optimization_${crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex')}`;
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const capitalEntries = await storage.getCapitalEntries();
      const financialSummary = await storage.getFinancialSummary();
      const purchases = await storage.getPurchases();
      
      // Get upcoming payments (outstanding balances)
      const upcomingPayments = purchases
        .filter(p => parseFloat(p.remaining) > 0)
        .map(p => ({
          id: p.id,
          amount: parseFloat(p.remaining),
          supplier: p.supplierId,
          dueDate: p.date
        }));
      
      const result = await aiService.getCapitalOptimizationSuggestions(
        capitalEntries,
        financialSummary,
        upcomingPayments
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'capital_optimization',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ capitalEntries, financialSummary })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating capital optimization:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate capital optimization suggestions" 
      });
    }
  });

  app.get('/api/ai/inventory-recommendations', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'inventory_recommendations_current';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const warehouseStock = await storage.getWarehouseStock();
      const filterRecords = await storage.getFilterRecords();
      const inventoryAnalytics = await storage.getInventoryAnalytics();
      
      const result = await aiService.getInventoryRecommendations(
        warehouseStock,
        filterRecords,
        inventoryAnalytics
      );
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes cache
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'inventory_recommendations',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ warehouseStock, inventoryAnalytics })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating inventory recommendations:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate inventory recommendations" 
      });
    }
  });

  // AI Routes - Financial Insights
  app.get('/api/ai/financial-trends', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'financial_trends_analysis';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const financialSummary = await storage.getFinancialSummary();
      const cashFlow = await storage.getCashflowAnalysis('last-90-days');
      const purchases = await storage.getPurchases();
      
      // Prepare historical data
      const historicalData = {
        cashFlow,
        purchases: purchases.slice(-20), // Last 20 purchases
        capitalEntries: await storage.getCapitalEntries()
      };
      
      const result = await aiService.getFinancialTrendAnalysis(
        financialSummary,
        [historicalData]
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 6);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'financial_trends',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ financialSummary, historicalData })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating financial trend analysis:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate financial trend analysis" 
      });
    }
  });

  // AI Routes - Trading Decision Support
  app.get('/api/ai/market-timing', requireRole(['admin', 'purchasing', 'sales']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'market_timing_analysis';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const purchases = await storage.getPurchases();
      const warehouseStock = await storage.getWarehouseStock();
      
      // Calculate current inventory level
      const currentInventory = warehouseStock.reduce((total, stock) => {
        return total + parseFloat(stock.qtyKgTotal);
      }, 0);
      
      // Prepare market data from historical purchases
      const marketData = {
        averagePrice: purchases.reduce((sum, p) => sum + parseFloat(p.pricePerKg), 0) / purchases.length,
        recentTrend: purchases.slice(-10).map(p => ({
          date: p.date,
          price: parseFloat(p.pricePerKg),
          volume: parseFloat(p.weight)
        }))
      };
      
      const historicalPrices = purchases.map(p => ({
        date: p.date,
        pricePerKg: parseFloat(p.pricePerKg),
        currency: p.currency
      }));
      
      const result = await aiService.getMarketTimingAnalysis(
        marketData,
        historicalPrices,
        currentInventory
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'market_timing',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ marketData, historicalPrices })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating market timing analysis:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate market timing analysis" 
      });
    }
  });

  // AI Routes - Intelligent Reporting
  app.get('/api/ai/executive-summary', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'executive_summary_current';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const [financialSummary, tradingActivity, inventoryAnalytics, supplierPerformance] = await Promise.all([
        storage.getFinancialSummary(),
        storage.getTradingActivity(),
        storage.getInventoryAnalytics(),
        storage.getSupplierPerformance()
      ]);
      
      const result = await aiService.generateExecutiveSummary(
        financialSummary,
        tradingActivity,
        inventoryAnalytics,
        supplierPerformance
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 12);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'executive_summary',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({
          financialSummary, tradingActivity, inventoryAnalytics, supplierPerformance
        })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating executive summary:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate executive summary" 
      });
    }
  });

  app.get('/api/ai/anomaly-detection', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'anomaly_detection_current';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      // Get recent data (last 30 days) vs historical baseline (last 6 months)
      const allPurchases = await storage.getPurchases();
      const allCapitalEntries = await storage.getCapitalEntries();
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentData = {
        purchases: allPurchases.filter(p => new Date(p.date) >= thirtyDaysAgo),
        capitalEntries: allCapitalEntries.filter(c => new Date(c.date) >= thirtyDaysAgo)
      };
      
      const historicalBaseline = {
        purchases: allPurchases.filter(p => new Date(p.date) >= sixMonthsAgo && new Date(p.date) < thirtyDaysAgo),
        capitalEntries: allCapitalEntries.filter(c => new Date(c.date) >= sixMonthsAgo && new Date(c.date) < thirtyDaysAgo)
      };
      
      const result = await aiService.detectAnomalies(
        [recentData],
        [historicalBaseline]
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'anomaly_detection',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ recentData, historicalBaseline })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to detect anomalies" 
      });
    }
  });

  // AI Chat Assistant
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const requestData = aiChatRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Generate session ID if not provided
      const sessionId = requestData.conversationId || `session_${userId}_${Date.now()}`;
      
      // Get conversation history
      let conversation = await storage.getAiConversation(sessionId, userId);
      const conversationHistory = conversation?.messages as Array<{ role: 'user' | 'assistant'; content: string }> || [];
      
      // Prepare business context
      const businessContext = {
        userRole: user?.role,
        recentActivity: {
          purchases: (await storage.getPurchases()).slice(-5),
          capitalBalance: await storage.getCapitalBalance(),
          warehouseStock: (await storage.getWarehouseStock()).slice(0, 10)
        },
        ...requestData.context
      };
      
      // Get AI response
      const result = await aiService.chatAssistant(
        requestData.message,
        conversationHistory,
        businessContext
      );
      
      // Update conversation history
      const updatedMessages = [
        ...conversationHistory,
        { role: 'user' as const, content: requestData.message },
        { role: 'assistant' as const, content: result.response }
      ];
      
      // Save conversation (keep last 20 messages)
      await storage.createOrUpdateAiConversation({
        sessionId,
        userId,
        messages: updatedMessages.slice(-20),
        context: businessContext
      });
      
      res.json({
        ...result,
        conversationId: sessionId
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to process chat request" 
      });
    }
  });

  // Contextual Help
  app.post('/api/ai/contextual-help', isAuthenticated, async (req: any, res) => {
    try {
      const requestData = aiContextualHelpRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const result = await aiService.getContextualHelp(
        requestData.currentPage,
        user?.role || 'worker',
        requestData.currentData || {}
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error getting contextual help:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to get contextual help" 
      });
    }
  });

  // AI conversation history
  app.get('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const conversations = await storage.getRecentAiConversations(userId, limit);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching AI conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Clean up expired AI cache (can be called periodically)
  app.post('/api/ai/cleanup-cache', requireRole(['admin']), async (req, res) => {
    try {
      await storage.deleteExpiredInsightsCache();
      res.json({ message: "Cache cleanup completed" });
    } catch (error) {
      console.error("Error cleaning up AI cache:", error);
      res.status(500).json({ message: "Failed to cleanup cache" });
    }
  });

  // ======================================
  // WORKFLOW VALIDATION ENDPOINTS
  // ======================================

  // Initiate workflow validation against business document
  app.post('/api/ai/validate-workflow', requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Basic rate limiting: check if validation was run recently
      const recentValidation = await storage.getLatestWorkflowValidation(userId);
      if (recentValidation) {
        const timeSinceLastValidation = new Date().getTime() - new Date(recentValidation.createdAt).getTime();
        const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
        
        if (timeSinceLastValidation < cooldownPeriod) {
          return res.status(429).json({
            message: 'Validation was run recently. Please wait before running again.',
            nextAllowedTime: new Date(new Date(recentValidation.createdAt).getTime() + cooldownPeriod).toISOString()
          });
        }
      }

      console.log(`Starting workflow validation for user ${userId}`);
      
      // Generate hashes for caching
      const documentPath = 'attached_assets/workflu_1758260129381.docx';
      const documentHash = crypto.createHash('md5').update(documentPath + Date.now()).digest('hex');
      const systemSpecHash = crypto.createHash('md5').update(JSON.stringify({
        timestamp: Date.now(),
        version: '1.0'
      })).digest('hex');

      // Run the complete validation pipeline
      const gapReport = await aiService.validateWorkflowAgainstDocument();

      // Store validation results
      const validationResult = await storage.createWorkflowValidation({
        userId,
        documentPath,
        documentHash,
        systemSpecHash,
        overallStatus: gapReport.overallStatus,
        gapReport: gapReport,
        stageResults: gapReport.stages,
        summary: gapReport.summary,
        validationMetadata: {
          aiModel: 'gpt-5',
          processingTime: Date.now(),
          version: '1.0'
        }
      });

      // Also create export history entry for compliance tracking
      await storage.createExportRequest({
        userId,
        exportType: 'compliance_report',
        format: 'json',
        fileName: `workflow_validation_${Date.now()}.json`,
        parameters: {
          validationId: validationResult.id,
          documentPath,
          overallStatus: gapReport.overallStatus
        }
      });

      console.log(`Workflow validation completed for user ${userId}. Status: ${gapReport.overallStatus}`);
      
      res.json({
        validationId: validationResult.id,
        overallStatus: gapReport.overallStatus,
        summary: gapReport.summary,
        completedAt: validationResult.completedAt,
        stages: Object.keys(gapReport.stages),
        message: 'Workflow validation completed successfully'
      });
    } catch (error) {
      console.error("Error validating workflow:", error);
      
      if (error.message.includes('OpenAI API key')) {
        return res.status(500).json({
          message: "AI service not configured. Please set OPENAI_API_KEY environment variable."
        });
      }
      
      if (error.message.includes('Document appears to be empty')) {
        return res.status(400).json({
          message: "Business document is invalid or corrupted. Please check the document file."
        });
      }
      
      res.status(500).json({
        message: "Failed to validate workflow",
        error: error.message
      });
    }
  });

  // Get latest workflow validation results
  app.get('/api/ai/validation/latest', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.query.global === 'true' ? undefined : req.user.claims.sub;
      const validation = await storage.getLatestWorkflowValidation(userId);
      
      if (!validation) {
        return res.status(404).json({
          message: 'No validation results found. Please run a validation first.'
        });
      }

      res.json({
        validationId: validation.id,
        overallStatus: validation.overallStatus,
        gapReport: validation.gapReport,
        summary: validation.summary,
        createdAt: validation.createdAt,
        completedAt: validation.completedAt,
        documentPath: validation.documentPath,
        isLatest: validation.isLatest
      });
    } catch (error) {
      console.error("Error fetching latest validation:", error);
      res.status(500).json({ message: "Failed to fetch validation results" });
    }
  });

  // Get validation history
  app.get('/api/ai/validation/history', requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = req.query.userId as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const validations = await storage.getWorkflowValidations(userId, limit);
      
      res.json(validations.map(validation => ({
        validationId: validation.id,
        overallStatus: validation.overallStatus,
        summary: validation.summary,
        createdAt: validation.createdAt,
        completedAt: validation.completedAt,
        isLatest: validation.isLatest
      })));
    } catch (error) {
      console.error("Error fetching validation history:", error);
      res.status(500).json({ message: "Failed to fetch validation history" });
    }
  });

  // Export validation results
  app.post('/api/ai/validation/:id/export', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.body;
      const userId = req.user.claims.sub;
      
      const validations = await storage.getWorkflowValidations(undefined, 100);
      const validation = validations.find(v => v.id === id);
      
      if (!validation) {
        return res.status(404).json({ message: 'Validation not found' });
      }

      // Create export request
      const exportRequest = await storage.createExportRequest({
        userId,
        exportType: 'compliance_report',
        format,
        fileName: `validation_report_${id}.${format}`,
        parameters: {
          validationId: id,
          format,
          includeDetails: true
        }
      });

      // For immediate download, return the validation data
      if (format === 'json') {
        res.json({
          exportId: exportRequest.id,
          validationReport: {
            validationId: validation.id,
            overallStatus: validation.overallStatus,
            gapReport: validation.gapReport,
            summary: validation.summary,
            createdAt: validation.createdAt,
            completedAt: validation.completedAt,
            documentPath: validation.documentPath
          }
        });
      } else {
        res.json({
          exportId: exportRequest.id,
          message: `Export in ${format} format has been queued`,
          downloadUrl: `/api/exports/${exportRequest.id}/download`
        });
      }
    } catch (error) {
      console.error("Error exporting validation results:", error);
      res.status(500).json({ message: "Failed to export validation results" });
    }
  });

  // Initialize scheduler service
  const { schedulerService } = await import('./schedulerService');
  await schedulerService.initialize();

  // Export job management routes
  app.get('/api/export-jobs', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getExportJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching export jobs:", error);
      res.status(500).json({ message: "Failed to fetch export jobs" });
    }
  });

  app.post('/api/export-jobs', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobData = {
        ...req.body,
        userId
      };
      
      const validation = exportService.validateExportParams(jobData);
      if (!validation.valid) {
        return res.status(400).json({
          message: "Invalid export job parameters",
          errors: validation.errors
        });
      }

      const job = await schedulerService.createScheduledJob(jobData);
      res.json(job);
    } catch (error) {
      console.error("Error creating export job:", error);
      res.status(500).json({ message: "Failed to create export job" });
    }
  });

  app.patch('/api/export-jobs/:id', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const job = await schedulerService.updateScheduledJob(id, updates);
      res.json(job);
    } catch (error) {
      console.error("Error updating export job:", error);
      res.status(500).json({ message: "Failed to update export job" });
    }
  });

  app.delete('/api/export-jobs/:id', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      await schedulerService.deleteScheduledJob(id);
      res.json({ message: "Export job deleted successfully" });
    } catch (error) {
      console.error("Error deleting export job:", error);
      res.status(500).json({ message: "Failed to delete export job" });
    }
  });

  // Enhanced export routes with real file generation
  app.post('/api/exports', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exportParams = {
        ...req.body,
        userId
      };

      const validation = exportService.validateExportParams(exportParams);
      if (!validation.valid) {
        return res.status(400).json({
          message: "Invalid export parameters",
          errors: validation.errors
        });
      }

      const exportRecord = await exportService.createExport(exportParams);
      res.json(exportRecord);
    } catch (error) {
      console.error("Error creating export:", error);
      res.status(500).json({ message: "Failed to create export" });
    }
  });

  app.get('/api/exports/history', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const history = await storage.getExportHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching export history:", error);
      res.status(500).json({ message: "Failed to fetch export history" });
    }
  });

  app.get('/api/exports/download/:id', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const exportRecord = await storage.getExportJob(id);
      
      if (!exportRecord || !exportRecord.filePath) {
        return res.status(404).json({ message: "Export file not found" });
      }

      if (exportRecord.status !== 'completed') {
        return res.status(400).json({ 
          message: "Export is not ready for download",
          status: exportRecord.status
        });
      }

      // Increment download count
      await storage.incrementDownloadCount(id);

      // Set appropriate headers and send file
      res.download(exportRecord.filePath, exportRecord.fileName);
    } catch (error) {
      console.error("Error downloading export:", error);
      res.status(500).json({ message: "Failed to download export" });
    }
  });

  // Enhanced period management routes with compliance integration
  app.get('/api/periods', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const periods = await storage.getPeriods();
      res.json(periods);
    } catch (error) {
      console.error("Error fetching periods:", error);
      res.status(500).json({ message: "Failed to fetch periods" });
    }
  });

  app.post('/api/periods', requireRole(['admin']), async (req, res) => {
    try {
      const periodData = req.body;
      const period = await storage.createPeriod(periodData);
      res.json(period);
    } catch (error) {
      console.error("Error creating period:", error);
      res.status(500).json({ message: "Failed to create period" });
    }
  });

  app.post('/api/periods/:id/close', requireRole(['admin']), strictPeriodGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { adjustments, requireCompliance = true } = req.body;

      // Compliance validation - require successful AI validation before closing
      if (requireCompliance) {
        const latestValidation = await storage.getLatestWorkflowValidation(userId);
        
        if (!latestValidation) {
          return res.status(400).json({
            message: "Period closing requires compliance validation. Please run workflow validation first.",
            error: "COMPLIANCE_VALIDATION_REQUIRED"
          });
        }

        const validationAge = Date.now() - new Date(latestValidation.createdAt).getTime();
        const maxValidationAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (validationAge > maxValidationAge) {
          return res.status(400).json({
            message: "Compliance validation is outdated. Please run a fresh validation before closing the period.",
            error: "COMPLIANCE_VALIDATION_EXPIRED"
          });
        }

        if (latestValidation.overallStatus !== 'matched') {
          return res.status(400).json({
            message: `Period closing blocked due to compliance issues. Validation status: ${latestValidation.overallStatus}`,
            error: "COMPLIANCE_VALIDATION_FAILED",
            validationDetails: latestValidation.summary
          });
        }
      }

      // Close the period with enhanced audit logging
      const closedPeriod = await storage.closePeriodWithCompliance(id, userId, adjustments, {
        complianceValidationId: requireCompliance ? (await storage.getLatestWorkflowValidation(userId))?.id : null,
        aiValidationStatus: requireCompliance ? 'passed' : 'skipped'
      });

      res.json(closedPeriod);
    } catch (error) {
      console.error("Error closing period:", error);
      res.status(500).json({ message: "Failed to close period" });
    }
  });

  app.post('/api/periods/:id/reopen', requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Reason is required for reopening a period" });
      }

      const reopenedPeriod = await storage.reopenPeriodWithAudit(id, userId, reason);
      res.json(reopenedPeriod);
    } catch (error) {
      console.error("Error reopening period:", error);
      res.status(500).json({ message: "Failed to reopen period" });
    }
  });

  app.get('/api/periods/:id/logs', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const logs = await storage.getPeriodClosingLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching period logs:", error);
      res.status(500).json({ message: "Failed to fetch period logs" });
    }
  });

  app.get('/api/periods/:id/adjustments', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const adjustments = await storage.getPeriodAdjustments(id);
      res.json(adjustments);
    } catch (error) {
      console.error("Error fetching period adjustments:", error);
      res.status(500).json({ message: "Failed to fetch period adjustments" });
    }
  });

  app.post('/api/periods/:id/adjustments/:adjustmentId/approve', requireRole(['admin']), async (req: any, res) => {
    try {
      const { adjustmentId } = req.params;
      const userId = req.user.claims.sub;
      
      const approvedAdjustment = await storage.approvePeriodAdjustment(adjustmentId, userId);
      res.json(approvedAdjustment);
    } catch (error) {
      console.error("Error approving period adjustment:", error);
      res.status(500).json({ message: "Failed to approve period adjustment" });
    }
  });

  // Scheduler status route
  app.get('/api/scheduler/status', requireRole(['admin']), async (req, res) => {
    try {
      const status = schedulerService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching scheduler status:", error);
      res.status(500).json({ message: "Failed to fetch scheduler status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
