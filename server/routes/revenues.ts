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

// GET /api/revenues/dual-balance-report
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