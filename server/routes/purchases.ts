import { Router } from "express";
import Decimal from "decimal.js";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { auditService } from "../auditService";
import { supplierEnhancementService } from "../modules/purchases/supplierService";
import { insertPurchaseSchema, insertSupplierSchema, insertSupplierQualityAssessmentSchema, purchaseReturnSchema, supplierAdvanceIssueSchema, supplierAdvanceConsumeSchema, insertPurchasePaymentSchema } from "@shared/schema";
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

// POST /api/purchases - Direct recording without approval
purchasesRouter.post("/", 
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  // NO APPROVAL REQUIRED FOR NEW PURCHASES - They should be recorded immediately
  async (req, res) => {
    try {
      // Stage 1 Compliance: Strip client exchangeRate and use central rate
      const { exchangeRate: clientRate, ...sanitizedData } = req.body;
      const validatedData = insertPurchaseSchema.parse(sanitizedData);
      
      // Use createPurchaseWithSideEffects to automatically create warehouse stock entry
      // Note: purchaseNumber and exchangeRate are handled internally by the storage layer
      const purchase = await storage.createPurchaseWithSideEffectsRetryable(
        validatedData,
        (req.user as any)?.claims?.sub || 'unknown'
      );

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

// PATCH /api/purchases/:id - Modifications require approval
purchasesRouter.patch("/:id", 
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  requireApproval("purchase_update"),  // APPROVAL REQUIRED FOR MODIFICATIONS
  async (req, res) => {
    try {
      const purchaseId = req.params.id;
      
      // Stage 1 Compliance: Strip client exchangeRate and use central rate
      const { exchangeRate: clientRate, ...sanitizedData } = req.body;
      const validatedData = insertPurchaseSchema.parse(sanitizedData);
      
      // Get existing purchase for audit logging
      const existingPurchase = await storage.getPurchase(purchaseId);
      if (!existingPurchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // Prepare contexts for storage layer
      const auditContext = {
        userId: (req.user as any)?.claims?.sub || 'unknown',
        userName: (req.user as any)?.claims?.email || 'Unknown',
        source: 'purchase_management',
        severity: 'info' as const,
      };

      const approvalContext = (req as any).approvalContext;

      // Note: exchangeRate is handled internally by the storage layer for security
      const updatedPurchase = await storage.updatePurchase(purchaseId, validatedData, auditContext, approvalContext);

      // Additional audit log (storage already creates one, this is supplementary)
      await auditService.logOperation(
        auditContext,
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

// DELETE /api/purchases/:id - Deletions require approval
purchasesRouter.delete("/:id", 
  isAuthenticated,
  requireRole(["admin", "purchasing", "finance"]),
  purchasePeriodGuard,
  requireApproval("purchase_delete"),  // APPROVAL REQUIRED FOR DELETIONS
  async (req, res) => {
    try {
      const purchaseId = req.params.id;
      
      // Get existing purchase for audit logging
      const existingPurchase = await storage.getPurchase(purchaseId);
      if (!existingPurchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // TODO: Re-enable payment checking when storage.getPurchasePayments is implemented
      // const hasPayments = await storage.getPurchasePayments(purchaseId);
      // if (hasPayments && hasPayments.length > 0) {
      //   return res.status(400).json({ 
      //     message: "Cannot delete purchase with existing payments. Please remove payments first." 
      //   });
      // }
      
      // Prepare contexts for storage layer
      const auditContext = {
        userId: (req.user as any)?.claims?.sub || 'unknown',
        userName: (req.user as any)?.claims?.email || 'Unknown',
        source: 'purchase_management',
        severity: 'warning' as const,
      };

      const approvalContext = (req as any).approvalContext;

      await storage.deletePurchase(purchaseId, auditContext, approvalContext);

      // Additional audit log (storage already creates one, this is supplementary)
      await auditService.logOperation(
        auditContext,
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
  requireApproval('purchase'),
  async (req, res) => {
    try {
      const purchaseId = req.params.id;
      
      // Get the purchase to validate payment
      const purchase = await storage.getPurchase(purchaseId);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      
      // Stage 1 Compliance: Strip client exchangeRate and use central rate
      const { exchangeRate: clientRate, ...sanitizedData } = req.body;
      
      // Validate payment data
      const validatedData = insertPurchasePaymentSchema.parse({
        ...sanitizedData,
        purchaseId
      });
      
      // Calculate remaining balance using currency normalization for precision
      const existingPayments = await storage.getPurchasePayments(purchaseId);
      const purchaseCurrency = purchase.currency || 'USD';
      
      // Normalize all amounts to purchase currency using stored exchange rates
      const config = configurationService;
      const currentUsdEtbRate = await config.getCentralExchangeRate();
      
      // Convert purchase total to base currency (USD) for normalization
      const purchaseTotalUsd = purchaseCurrency === 'ETB' 
        ? new Decimal(purchase.total).div(purchase.exchangeRate || currentUsdEtbRate)
        : new Decimal(purchase.total);
      
      // Convert all existing payments to USD
      let totalPaidUsd = new Decimal(0);
      for (const payment of existingPayments) {
        const paymentUsd = payment.currency === 'ETB'
          ? new Decimal(payment.amount).div(payment.exchangeRate || currentUsdEtbRate)
          : new Decimal(payment.amount);
        totalPaidUsd = totalPaidUsd.add(paymentUsd);
      }
      
      // Convert new payment to USD for validation
      const paymentAmountUsd = validatedData.currency === 'ETB'
        ? new Decimal(validatedData.amount).div(currentUsdEtbRate)
        : new Decimal(validatedData.amount);
      
      // Calculate remaining in USD
      const remainingUsd = purchaseTotalUsd.sub(totalPaidUsd);
      
      // Server-side overpayment validation in normalized currency
      if (paymentAmountUsd.greaterThan(remainingUsd)) {
        return res.status(400).json({ 
          message: `Payment amount (${validatedData.amount} ${validatedData.currency}) exceeds remaining balance (${remainingUsd.toFixed(2)} USD equivalent)` 
        });
      }
      
      // Prepare contexts for storage layer
      const auditContext = {
        userId: (req.user as any)?.claims?.sub || 'unknown',
        userName: (req.user as any)?.claims?.email || 'Unknown',
        source: 'purchase_payment',
        severity: 'info' as const,
      };

      const approvalContext = (req as any).approvalContext;
      
      // Create the payment
      const payment = await storage.createPurchasePayment({
        ...validatedData,
        createdBy: (req.user as any)?.claims?.sub || 'unknown'
      }, auditContext, approvalContext);
      
      // Update purchase remaining amount using normalized currency (USD)
      const newRemainingUsd = remainingUsd.sub(paymentAmountUsd);
      const newAmountPaidUsd = totalPaidUsd.add(paymentAmountUsd);
      
      // Convert back to purchase currency for storage
      const newRemainingPurchaseCurrency = purchaseCurrency === 'ETB'
        ? newRemainingUsd.mul(purchase.exchangeRate || currentUsdEtbRate)
        : newRemainingUsd;
      const newAmountPaidPurchaseCurrency = purchaseCurrency === 'ETB'
        ? newAmountPaidUsd.mul(purchase.exchangeRate || currentUsdEtbRate)
        : newAmountPaidUsd;
      
      await storage.updatePurchase(purchaseId, {
        amountPaid: newAmountPaidPurchaseCurrency.toFixed(2),
        remaining: newRemainingPurchaseCurrency.toFixed(2),
        status: newRemainingUsd.lessThanOrEqualTo(0.01) ? 'paid' : 'partial' // 1 cent tolerance for floating point
      });

      // Additional audit log (storage already creates one, this is supplementary)
      await auditService.logOperation(
        auditContext,
        {
          entityType: 'purchase_payments',
          entityId: payment.id,
          action: 'create',
          operationType: 'payment_recording',
          description: `Recorded payment of ${validatedData.amount} ${validatedData.currency} for purchase ${purchase.purchaseNumber}`,
          newValues: payment
        }
      );

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error recording payment:", error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || "Failed to record payment";
      res.status(500).json({ message: errorMessage });
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
          action: 'update',
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