import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
import { insertRevenueTransactionSchema } from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";

export const revenuesRouter = Router();

// GET /api/revenues/transactions
revenuesRouter.get("/transactions", isAuthenticated, async (req, res) => {
  try {
    const transactions = await storage.getRevenueTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching revenue transactions:", error);
    res.status(500).json({ message: "Failed to fetch revenue transactions" });
  }
});

// POST /api/revenues/transactions
revenuesRouter.post("/transactions",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  requireApproval("financial_adjustment"),
  async (req, res) => {
    try {
      const validatedData = insertRevenueTransactionSchema.parse(req.body);
      const transaction = await storage.createRevenueTransaction({
        ...validatedData,
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "revenue_transaction",
        entityId: transaction.id,
        description: `Created revenue transaction: ${transaction.type}`,
        previousState: null,
        newState: transaction
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating revenue transaction:", error);
      res.status(500).json({ message: "Failed to create revenue transaction" });
    }
  }
);

// POST /api/revenues/reinvestment
revenuesRouter.post("/reinvestment",
  isAuthenticated,
  requireRole(["admin"]),
  requireApproval("financial_adjustment"),
  async (req, res) => {
    try {
      const result = await storage.processRevenueReinvestment({
        ...req.body,
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "revenue_reinvestment",
        entityId: result.id,
        description: `Processed revenue reinvestment: $${req.body.amount}`,
        previousState: null,
        newState: result
      });

      res.json(result);
    } catch (error) {
      console.error("Error processing revenue reinvestment:", error);
      res.status(500).json({ message: "Failed to process revenue reinvestment" });
    }
  }
);

// GET /api/revenues/balance
revenuesRouter.get("/balance", 
  isAuthenticated,
  requireRole(["admin", "finance"]),
  async (req, res) => {
    try {
      const balance = await storage.getRevenueBalance();
      res.json(balance);
    } catch (error) {
      console.error("Error fetching revenue balance:", error);
      res.status(500).json({ message: "Failed to fetch revenue balance" });
    }
  }
);

// POST /api/revenue/customer-receipt
revenuesRouter.post("/customer-receipt",
  isAuthenticated,
  requireRole(["admin", "finance", "sales"]),
  requireApproval("revenue_management"),
  async (req, res) => {
    try {
      const validatedData = insertRevenueTransactionSchema.parse({
        ...req.body,
        transactionType: 'customer_receipt',
        userId: (req.user as any)?.claims?.sub || 'unknown'
      });
      const receipt = await storage.createRevenueTransaction(validatedData);
      
      await auditService.logOperation(
        { userId: (req.user as any)?.claims?.sub, source: 'revenue_management' },
        {
          entityType: 'revenue_transactions',
          entityId: receipt.id,
          action: 'create',
          operationType: 'revenue_management',
          description: `Customer receipt recorded: $${req.body.amount}`,
          newValues: validatedData
        }
      );
      
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error creating customer receipt:", error);
      res.status(500).json({ message: "Failed to record customer receipt" });
    }
  }
);

// POST /api/revenue/customer-refund
revenuesRouter.post("/customer-refund",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  requireApproval("revenue_management"),
  async (req, res) => {
    try {
      const validatedData = insertRevenueTransactionSchema.parse({
        ...req.body,
        transactionType: 'customer_refund',
        userId: (req.user as any)?.claims?.sub || 'unknown'
      });
      const refund = await storage.createRevenueTransaction(validatedData);
      
      await auditService.logOperation(
        { userId: (req.user as any)?.claims?.sub, source: 'revenue_management' },
        {
          entityType: 'revenue_transactions',
          entityId: refund.id,
          action: 'create',
          operationType: 'revenue_management',
          description: `Customer refund processed: $${req.body.amount}`,
          newValues: validatedData
        }
      );
      
      res.status(201).json(refund);
    } catch (error) {
      console.error("Error processing customer refund:", error);
      res.status(500).json({ message: "Failed to process customer refund" });
    }
  }
);

// GET /api/revenue/withdrawals
revenuesRouter.get("/withdrawals", isAuthenticated, async (req, res) => {
  try {
    const withdrawals = await storage.getWithdrawalRecords();
    res.json(withdrawals);
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    res.status(500).json({ message: "Failed to fetch withdrawals" });
  }
});

// POST /api/revenue/withdrawals
revenuesRouter.post("/withdrawals",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  requireApproval("revenue_management"),
  async (req, res) => {
    try {
      const withdrawal = await storage.createWithdrawalRecord({
        ...req.body,
        requestedBy: (req.user as any)?.claims?.sub || 'unknown'
      });
      
      await auditService.logOperation(
        { userId: (req.user as any)?.claims?.sub, source: 'revenue_management' },
        {
          entityType: 'withdrawal_records',
          entityId: withdrawal.id,
          action: 'create',
          operationType: 'revenue_management',
          description: `Withdrawal request submitted: $${req.body.amount}`,
          newValues: withdrawal
        }
      );
      
      res.status(201).json(withdrawal);
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  }
);

// GET /api/revenue/reinvestments
revenuesRouter.get("/reinvestments", isAuthenticated, async (req, res) => {
  try {
    const reinvestments = await storage.getReinvestments();
    res.json(reinvestments);
  } catch (error) {
    console.error("Error fetching reinvestments:", error);
    res.status(500).json({ message: "Failed to fetch reinvestments" });
  }
});

// POST /api/revenue/reinvestments
revenuesRouter.post("/reinvestments",
  isAuthenticated,
  requireRole(["admin"]),
  requireApproval("revenue_management"),
  async (req, res) => {
    try {
      const reinvestment = await storage.createReinvestment({
        ...req.body,
        requestedBy: (req.user as any)?.claims?.sub || 'unknown'
      });
      
      await auditService.logOperation(
        { userId: (req.user as any)?.claims?.sub, source: 'revenue_management' },
        {
          entityType: 'reinvestments',
          entityId: reinvestment.id,
          action: 'create',
          operationType: 'revenue_management',
          description: `Reinvestment request submitted: $${req.body.amount}`,
          newValues: reinvestment
        }
      );
      
      res.status(201).json(reinvestment);
    } catch (error) {
      console.error("Error creating reinvestment:", error);
      res.status(500).json({ message: "Failed to create reinvestment request" });
    }
  }
);

// GET /api/revenue/ledger
revenuesRouter.get("/ledger", isAuthenticated, async (req, res) => {
  try {
    const ledger = await storage.getRevenueLedger();
    res.json(ledger);
  } catch (error) {
    console.error("Error fetching revenue ledger:", error);
    res.status(500).json({ message: "Failed to fetch revenue ledger" });
  }
});

// GET /api/revenue/analytics
revenuesRouter.get("/analytics", 
  isAuthenticated,
  requireRole(["admin", "finance"]),
  async (req, res) => {
    try {
      const analytics = await storage.getRevenueAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  }
);

// GET /api/revenue/dual-balance-report
revenuesRouter.get("/dual-balance-report",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  async (req, res) => {
    try {
      // This would be implemented by the revenue enhancement service
      const report = {
        accountingRevenue: { totalSales: 0, totalRefunds: 0, netAccountingRevenue: 0 },
        withdrawableBalance: { totalCollections: 0, totalWithdrawals: 0, totalReinvestments: 0, totalTransferFees: 0, netWithdrawableBalance: 0 },
        variance: { accountingVsWithdrawable: 0, outstandingReceivables: 0, uncollectedSales: 0 },
        cashFlow: { currentMonthCollections: 0, currentMonthWithdrawals: 0, projectedCollections: 0 }
      };
      res.json(report);
    } catch (error) {
      console.error("Error generating dual balance report:", error);
      res.status(500).json({ message: "Failed to generate dual balance report" });
    }
  }
);