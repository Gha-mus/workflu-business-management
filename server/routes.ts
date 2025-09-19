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
      res.json({ exchangeRate });
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
      
      const entry = await storage.createCapitalEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating capital entry:", error);
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

      const purchase = await storage.createPurchase({
        ...purchaseData,
        total: total.toFixed(2),
        remaining: remaining.toFixed(2),
      });

      // Create capital entry if funded from capital
      if (purchaseData.fundingSource === 'capital' && amountPaid.gt(0)) {
        await storage.createCapitalEntry({
          entryId: `PUR-${purchase.id}`,
          amount: purchaseData.amountPaid || '0',
          type: 'CapitalOut',
          reference: purchase.id,
          description: `Purchase payment - ${purchaseData.weight}kg`,
          paymentCurrency: purchaseData.currency,
          exchangeRate: purchaseData.exchangeRate || undefined,
          createdBy: req.user.claims.sub,
        });
      }

      // Create warehouse stock entry
      await storage.createWarehouseStock({
        purchaseId: purchase.id,
        orderId: purchase.orderId,
        supplierId: purchase.supplierId,
        warehouse: 'FIRST',
        status: 'AWAITING_DECISION',
        qtyKgTotal: purchaseData.weight,
        qtyKgClean: purchaseData.weight,
        qtyKgNonClean: '0',
        unitCostCleanUsd: purchaseData.currency === 'USD' 
          ? purchaseData.pricePerKg 
          : pricePerKg.div(new Decimal(purchaseData.exchangeRate as string)).toFixed(4),
      });

      res.json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Warehouse routes
  app.get('/api/warehouse/stock', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stock = await storage.getWarehouseStock();
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock:", error);
      res.status(500).json({ message: "Failed to fetch warehouse stock" });
    }
  });

  app.get('/api/warehouse/stock/:status', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stock = await storage.getWarehouseStockByStatus(req.params.status);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock by status:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
