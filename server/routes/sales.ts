import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole, validateSalesReturn } from "../core/auth";
import { auditService } from "../auditService";
import { salesEnhancementService } from "../salesEnhancementService";
import Decimal from "decimal.js";
import { 
  insertSalesOrderSchema,
  insertCustomerSchema,
  insertCustomerCreditLimitSchema,
} from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";
import { genericPeriodGuard } from "../core/middleware/periodGuard";

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
      const userId = (req.user as any).claims?.sub || 'unknown';
      
      // CREDIT LIMIT ENFORCEMENT - Check customer credit before creating order
      if (validatedData.customerId && validatedData.totalAmountUsd) {
        const orderAmount = new Decimal(validatedData.totalAmountUsd).toNumber();
        const creditCheck = await storage.checkCreditLimitAvailability(validatedData.customerId, orderAmount);
        
        if (!creditCheck.isApproved) {
          return res.status(400).json({ 
            message: "Credit limit exceeded", 
            details: creditCheck.reason,
            availableCredit: creditCheck.availableCredit 
          });
        }
      }
      
      const order = await storage.createSalesOrder({
        ...validatedData,
        createdBy: userId
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
          description: `Created sales order: ${order.salesOrderNumber}`,
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

// GET /api/sales/analytics  
salesRouter.get("/analytics", isAuthenticated, async (req, res) => {
  try {
    const orders = await storage.getSalesOrders();
    const totalRevenueUsd = orders?.reduce((sum, order) => {
      return sum + (new Decimal(order.totalAmountUsd?.toString() || '0').toNumber());
    }, 0) || 0;
    
    res.json({ totalRevenueUsd });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({ message: "Failed to fetch sales analytics" });
  }
});

// POST /api/sales/customers
salesRouter.post("/customers",
  isAuthenticated,
  requireRole(["admin", "sales", "worker"]),
  async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse({
        ...req.body,
        createdBy: (req.user as any).claims?.sub || 'unknown',
      });
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
      const result = await storage.processSalesReturn(req.body.id, (req.user as any).claims?.sub || 'unknown');

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

// GET /api/sales/customers/:id/credit-limit
salesRouter.get("/customers/:id/credit-limit", isAuthenticated, async (req, res) => {
  try {
    const creditLimit = await storage.getCurrentCustomerCreditLimit(req.params.id);
    if (!creditLimit) {
      return res.status(404).json({ message: "Credit limit not found for customer" });
    }
    res.json(creditLimit);
  } catch (error) {
    console.error("Error fetching customer credit limit:", error);
    res.status(500).json({ message: "Failed to fetch credit limit" });
  }
});

// PUT /api/sales/customers/:id/credit-limit
salesRouter.put("/customers/:id/credit-limit",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  requireApproval("financial_adjustment"),
  async (req, res) => {
    try {
      const validatedData = insertCustomerCreditLimitSchema.parse(req.body);
      const updatedLimit = await storage.updateCustomerCreditLimit(req.params.id, validatedData);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any).claims?.sub || 'unknown',
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'sales',
          severity: 'info',
        },
        {
          entityType: 'customer_credit_limits',
          entityId: updatedLimit.id,
          action: 'update',
          operationType: 'credit_limit_change',
          description: `Updated credit limit for customer`,
          newValues: updatedLimit
        }
      );

      res.json(updatedLimit);
    } catch (error) {
      console.error("Error updating customer credit limit:", error);
      res.status(500).json({ message: "Failed to update credit limit" });
    }
  }
);

// POST /api/sales/multi-order-invoice - Stage 6 enhancement  
salesRouter.post("/multi-order-invoice",
  isAuthenticated,
  requireRole(["admin", "sales"]),
  requireApproval("sale_order"),
  genericPeriodGuard,
  async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub || 'unknown';
      const invoiceId = await salesEnhancementService.createMultiOrderInvoice(req.body, userId);

      // Create audit log
      await auditService.logOperation(
        {
          userId,
          userName: (req.user as any).claims?.email || 'Unknown',
          source: 'sales',
          severity: 'info',
        },
        {
          entityType: 'sales_orders',
          entityId: invoiceId,
          action: 'create',
          operationType: 'multi_order_invoice',
          description: `Created multi-order invoice for customer ${req.body.customerId}`,
          newValues: { customerId: req.body.customerId, itemCount: req.body.orderItems?.length || 0 }
        }
      );

      res.status(201).json({ invoiceId, message: "Multi-order invoice created successfully" });
    } catch (error) {
      console.error("Error creating multi-order invoice:", error);
      res.status(500).json({ message: "Failed to create multi-order invoice", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

// GET /api/sales/overdue-receivables - Stage 6 enhancement  
salesRouter.get("/overdue-receivables",
  isAuthenticated,
  requireRole(["admin", "sales", "finance"]),
  async (req, res) => {
    try {
      const overdueReceivables = await salesEnhancementService.checkOverdueReceivables();
      res.json(overdueReceivables);
    } catch (error) {
      console.error("Error fetching overdue receivables:", error);
      res.status(500).json({ message: "Failed to fetch overdue receivables" });
    }
  }
);

// POST /api/sales/warehouse-source-validation - Stage 6 enhancement
salesRouter.post("/warehouse-source-validation",
  isAuthenticated,
  requireRole(["admin", "sales", "warehouse"]),
  async (req, res) => {
    try {
      const { warehouseStockId, requestedWarehouse } = req.body;
      const validation = await salesEnhancementService.validateWarehouseSource(warehouseStockId, requestedWarehouse);
      res.json(validation);
    } catch (error) {
      console.error("Error validating warehouse source:", error);
      res.status(500).json({ message: "Failed to validate warehouse source" });
    }
  }
);