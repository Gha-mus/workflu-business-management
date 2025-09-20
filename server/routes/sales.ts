import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole, validateSalesReturn } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
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
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "sales_order",
        entityId: order.id,
        description: `Created sales order: ${order.orderNumber}`,
        previousState: null,
        newState: order
      });

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
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "customer",
        entityId: customer.id,
        description: `Created customer: ${customer.name}`,
        previousState: null,
        newState: customer
      });

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
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "sales_return",
        entityId: result.id,
        description: `Processed sales return: ${req.body.returnReason}`,
        previousState: null,
        newState: result
      });

      res.json(result);
    } catch (error) {
      console.error("Error processing sales return:", error);
      res.status(500).json({ message: "Failed to process sales return" });
    }
  }
);