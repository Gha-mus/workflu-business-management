import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { auditService } from "../auditService";
import { supplierEnhancementService } from "../modules/purchases/supplierService";
import { insertPurchaseSchema, insertSupplierSchema, insertSupplierQualityAssessmentSchema, purchaseReturnSchema, supplierAdvanceIssueSchema, supplierAdvanceConsumeSchema } from "@shared/schema";
import { purchasePeriodGuard } from "../periodGuard";
import { requireApproval } from "../approvalMiddleware";
import { configurationService } from "../configurationService";

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
      // Stage 1 Compliance: Strip client exchangeRate and use central rate
      const { exchangeRate: clientRate, ...sanitizedData } = req.body;
      const validatedData = insertPurchaseSchema.parse(sanitizedData);
      
      // Stage 1 Compliance: Get central exchange rate for all currencies
      const centralExchangeRate = await configurationService.getCentralExchangeRate();
      
      // Generate purchase document number
      const purchaseNumber = await configurationService.generateEntityNumber('purchase', {
        prefix: 'PUR',
        suffix: new Date().getFullYear().toString().slice(-2)
      });
      
      const purchase = await storage.createPurchase({
        ...validatedData,
        purchaseNumber,
        exchangeRate: centralExchangeRate.toString(),
        createdBy: (req.user as any)?.claims?.sub || 'unknown'
      });

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'purchase_management',
          severity: 'info',
        },
        {
          entityType: 'purchases',
          entityId: purchase.id,
          action: 'create',
          operationType: 'purchase_creation',
          description: `Created purchase ${purchase.purchaseNumber} from supplier`,
          newValues: purchase
        }
      );

      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  }
);

// PATCH /api/purchases/:id
purchasesRouter.patch("/:id", 
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  requireApproval("purchase"),
  async (req, res) => {
    try {
      const purchaseId = req.params.id;
      
      // Stage 1 Compliance: Strip client exchangeRate and use central rate
      const { exchangeRate: clientRate, ...sanitizedData } = req.body;
      const validatedData = insertPurchaseSchema.parse(sanitizedData);
      
      // Stage 1 Compliance: Get central exchange rate for all currencies
      const centralExchangeRate = await configurationService.getCentralExchangeRate();
      
      // Get existing purchase for audit logging
      const existingPurchase = await storage.getPurchase(purchaseId);
      if (!existingPurchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      const updatedPurchase = await storage.updatePurchase(purchaseId, {
        ...validatedData,
        exchangeRate: centralExchangeRate.toString(),
        updatedBy: (req.user as any)?.claims?.sub || 'unknown'
      });

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'purchase_management',
          severity: 'info',
        },
        {
          entityType: 'purchases',
          entityId: purchaseId,
          action: 'update',
          operationType: 'purchase_update',
          description: `Updated purchase ${existingPurchase.purchaseNumber}`,
          oldValues: existingPurchase,
          newValues: updatedPurchase
        }
      );

      res.json(updatedPurchase);
    } catch (error) {
      console.error("Error updating purchase:", error);
      res.status(500).json({ message: "Failed to update purchase" });
    }
  }
);

// DELETE /api/purchases/:id
purchasesRouter.delete("/:id", 
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  requireApproval("purchase"),
  async (req, res) => {
    try {
      const purchaseId = req.params.id;
      
      // Get existing purchase for audit logging
      const existingPurchase = await storage.getPurchase(purchaseId);
      if (!existingPurchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // Check if purchase has payments
      const hasPayments = await storage.getPurchasePayments(purchaseId);
      if (hasPayments && hasPayments.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete purchase with existing payments. Please remove payments first." 
        });
      }
      
      await storage.deletePurchase(purchaseId);

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'purchase_management',
          severity: 'warning',
        },
        {
          entityType: 'purchases',
          entityId: purchaseId,
          action: 'delete',
          operationType: 'purchase_cancellation',
          description: `Cancelled purchase ${existingPurchase.purchaseNumber}`,
          oldValues: existingPurchase
        }
      );

      res.json({ message: "Purchase cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling purchase:", error);
      res.status(500).json({ message: "Failed to cancel purchase" });
    }
  }
);

// GET /api/purchases/:id/payments
purchasesRouter.get("/:id/payments", 
  isAuthenticated,
  async (req, res) => {
    try {
      const purchaseId = req.params.id;
      const payments = await storage.getPurchasePayments(purchaseId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching purchase payments:", error);
      res.status(500).json({ message: "Failed to fetch purchase payments" });
    }
  }
);

// POST /api/purchases/:id/payments
purchasesRouter.post("/:id/payments", 
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  async (req, res) => {
    try {
      const purchaseId = req.params.id;
      
      // Get the purchase to validate payment
      const purchase = await storage.getPurchase(purchaseId);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // Validate payment data
      const validatedData = insertPurchasePaymentSchema.parse({
        ...req.body,
        purchaseId
      });
      
      // Calculate remaining balance to check for overpayment
      const existingPayments = await storage.getPurchasePayments(purchaseId);
      const totalPaid = existingPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const purchaseTotal = parseFloat(purchase.total);
      const remaining = purchaseTotal - totalPaid;
      
      // Server-side overpayment validation
      const paymentAmount = parseFloat(validatedData.amount);
      if (paymentAmount > remaining) {
        return res.status(400).json({ 
          message: `Payment amount ($${paymentAmount}) exceeds remaining balance ($${remaining.toFixed(2)})` 
        });
      }
      
      // Create the payment
      const payment = await storage.createPurchasePayment({
        ...validatedData,
        createdBy: (req.user as any)?.claims?.sub || 'unknown'
      });
      
      // Update purchase remaining amount
      const newRemaining = remaining - paymentAmount;
      const newAmountPaid = totalPaid + paymentAmount;
      await storage.updatePurchase(purchaseId, {
        amountPaid: newAmountPaid.toString(),
        remaining: newRemaining.toString()
      });

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'purchase_payment',
          severity: 'info',
        },
        {
          entityType: 'purchase_payments',
          entityId: payment.id,
          action: 'create',
          operationType: 'payment_record',
          description: `Recorded payment for purchase ${purchase.purchaseNumber}: $${paymentAmount}`,
          newValues: payment,
          financialImpact: paymentAmount,
          currency: validatedData.currency
        }
      );

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
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
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'supplier_management',
          severity: 'info',
        },
        {
          entityType: 'suppliers',
          entityId: supplier.id,
          action: 'create',
          operationType: 'supplier_creation',
          description: `Created supplier: ${supplier.name}`,
          newValues: supplier
        }
      );

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
        (req.user as any)?.claims?.sub || 'unknown'
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

// POST /api/purchases/returns - Stage 2 Compliance: Purchase return processing with approval chain
purchasesRouter.post("/returns",
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  requireApproval("purchase_return"),
  async (req, res) => {
    try {
      // Stage 2 Compliance: Validate purchase return request
      const validatedData = purchaseReturnSchema.parse(req.body);
      
      // Generate return ID for tracking
      const returnId = await configurationService.generateEntityNumber('purchase_return', {
        prefix: 'RET',
        suffix: new Date().getFullYear().toString().slice(-2)
      });
      
      // Process the purchase return using supplier enhancement service
      const returnResult = await supplierEnhancementService.processPurchaseReturn(
        {
          ...validatedData,
          returnId,
        },
        (req.user as any)?.claims?.sub || 'unknown'
      );
      
      // Create audit log for the return operation
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'purchase_return',
          severity: 'warning',
        },
        {
          entityType: 'purchase_returns',
          entityId: returnId,
          action: 'create',
          operationType: 'purchase_return',
          description: `Processed purchase return ${returnId}: ${validatedData.returnReason}`,
          newValues: validatedData,
          financialImpact: validatedData.returnAmountUsd,
          currency: 'USD'
        }
      );
      
      res.status(201).json({
        returnId: returnId,
        status: 'processed',
        returnRequest: validatedData,
        processingResult: returnResult
      });
    } catch (error) {
      console.error("Error processing purchase return:", error);
      res.status(500).json({ message: "Failed to process purchase return" });
    }
  }
);

// POST /api/purchases/advances/issue - Stage 2 Compliance: Supplier advance issuance with capital integration
purchasesRouter.post("/advances/issue",
  isAuthenticated,
  requireRole(["admin", "finance", "purchasing"]),
  purchasePeriodGuard,
  requireApproval("supplier_advance_issue"),
  async (req, res) => {
    try {
      // Stage 2 Compliance: Validate advance issue request
      const validatedData = supplierAdvanceIssueSchema.parse(req.body);
      
      // Generate advance ID for tracking
      const advanceId = await configurationService.generateEntityNumber('supplier_advance', {
        prefix: 'ADV',
        suffix: new Date().getFullYear().toString().slice(-2)
      });
      
      // Issue the supplier advance using supplier enhancement service
      const advanceResult = await supplierEnhancementService.issueSupplierAdvance(
        {
          ...validatedData,
          advanceId,
        },
        (req.user as any)?.claims?.sub || 'unknown'
      );
      
      // Create audit log for the advance issue operation
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'supplier_advance',
          severity: 'info',
        },
        {
          entityType: 'supplier_advances',
          entityId: advanceId,
          action: 'create',
          operationType: 'advance_issue',
          description: `Issued supplier advance ${advanceId}: $${validatedData.amountUsd}`,
          newValues: validatedData,
          financialImpact: validatedData.amountUsd,
          currency: 'USD'
        }
      );
      
      res.status(201).json({
        advanceId: advanceId,
        status: 'issued',
        advanceRequest: validatedData,
        processingResult: advanceResult
      });
    } catch (error) {
      console.error("Error issuing supplier advance:", error);
      res.status(500).json({ message: "Failed to issue supplier advance" });
    }
  }
);

// POST /api/purchases/advances/consume - Stage 2 Compliance: Supplier advance consumption with purchase linking
purchasesRouter.post("/advances/consume",
  isAuthenticated,
  requireRole(["admin", "finance", "purchasing"]),
  purchasePeriodGuard,
  requireApproval("supplier_advance_consume"),
  async (req, res) => {
    try {
      // Stage 2 Compliance: Validate advance consume request
      const validatedData = supplierAdvanceConsumeSchema.parse(req.body);
      
      // Generate consumption ID for tracking
      const consumptionId = await configurationService.generateEntityNumber('supplier_advance', {
        prefix: 'CON',
        suffix: new Date().getFullYear().toString().slice(-2)
      });
      
      // Consume the supplier advance using supplier enhancement service
      const consumeResult = await supplierEnhancementService.consumeSupplierAdvance(
        {
          ...validatedData,
          consumptionId,
        },
        (req.user as any)?.claims?.sub || 'unknown'
      );
      
      // Create audit log for the advance consume operation
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'supplier_advance',
          severity: 'info',
        },
        {
          entityType: 'supplier_advances',
          entityId: consumptionId,
          action: 'consume',
          operationType: 'advance_consume',
          description: `Consumed supplier advance ${consumptionId}: $${validatedData.amountUsd}`,
          newValues: validatedData,
          financialImpact: -validatedData.amountUsd,
          currency: 'USD'
        }
      );
      
      res.status(201).json({
        consumptionId: consumptionId,
        status: 'consumed',
        consumeRequest: validatedData,
        processingResult: consumeResult
      });
    } catch (error) {
      console.error("Error consuming supplier advance:", error);
      res.status(500).json({ message: "Failed to consume supplier advance" });
    }
  }
);