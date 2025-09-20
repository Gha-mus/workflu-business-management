import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole, validateSalesReturn } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
import { salesEnhancementService } from "../salesEnhancementService";
import { 
  insertSalesOrderSchema,
  insertCustomerSchema,
  salesOrderStatusUpdateSchema
} from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";

export const salesRouter = Router();

// GET /api/sales/orders
salesRouter.get("/orders", isAuthenticated, async (req, res) => {
  try {
    const orders = await storage.getSalesOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    res.status(500).json({ message: "Failed to fetch sales orders" });
  }
});

// POST /api/sales/orders
salesRouter.post("/orders",
  isAuthenticated,
  requireRole(["admin", "sales"]),
  requireApproval("sale_order"),
  async (req, res) => {
    try {
      const validatedData = insertSalesOrderSchema.parse(req.body);
      const order = await storage.createSalesOrder({
        ...validatedData,
        userId: (req.user as any).claims?.sub || 'unknown'
      });

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'sales',
          severity: 'info',
        },
        {
          entityType: 'sales_orders',
          entityId: order.id,
          action: 'create',
          operationType: 'sale_order',
          description: `Created sales order: ${order.orderNumber}`,
          newValues: order
        }
      );

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating sales order:", error);
      res.status(500).json({ message: "Failed to create sales order" });
    }
  }
);

// GET /api/sales/customers
salesRouter.get("/customers", isAuthenticated, async (req, res) => {
  try {
    const customers = await storage.getCustomers();
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// POST /api/sales/customers
salesRouter.post("/customers",
  isAuthenticated,
  requireRole(["admin", "sales"]),
  async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'sales',
          severity: 'info',
        },
        {
          entityType: 'customers',
          entityId: customer.id,
          action: 'create',
          operationType: 'customer_create',
          description: `Created customer: ${customer.name}`,
          newValues: customer
        }
      );

      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  }
);

// POST /api/sales/return
salesRouter.post("/return",
  isAuthenticated,
  requireRole(["admin", "sales"]),
  validateSalesReturn,
  async (req, res) => {
    try {
      const result = await storage.processSalesReturn(req.body);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'sales',
          severity: 'info',
        },
        {
          entityType: 'sales_returns',
          entityId: result.id,
          action: 'create',
          operationType: 'sales_return',
          description: `Processed sales return: ${req.body.returnReason}`,
          newValues: result
        }
      );

      res.json(result);
    } catch (error) {
      console.error("Error processing sales return:", error);
      res.status(500).json({ message: "Failed to process sales return" });
    }
  }
);