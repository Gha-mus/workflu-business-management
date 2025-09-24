import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import type { AuthenticatedRequest } from "../core/auth/types";
import { auditService } from "../auditService";
import { capitalEnhancementService } from "../capitalEnhancementService";
import { insertCapitalEntrySchema } from "@shared/schema";
import { capitalEntryPeriodGuard } from "../periodGuard";
import { requireApproval } from "../approvalMiddleware";
import { configurationService } from "../configurationService";

export const capitalRouter = Router();

// GET /api/capital/entries
capitalRouter.get("/entries", isAuthenticated, async (req: AuthenticatedRequest, res, next) => {
  try {
    const entries = await storage.getCapitalEntries();
    res.json(entries);
  } catch (error) {
    // Pass error to the global error handler instead of handling it directly
    // The error handler will properly map the error to appropriate HTTP status code
    next(error);
  }
});

// POST /api/capital/entries
capitalRouter.post("/entries", 
  isAuthenticated,
  requireRole(["admin", "finance"]),
  capitalEntryPeriodGuard,
  requireApproval("capital_entry"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertCapitalEntrySchema.parse(req.body);
      // Stage 1 Compliance: Enforce central FX only - strip any client-provided FX
      const { exchangeRate: clientFx, ...sanitizedData } = validatedData;
      
      // Get central exchange rate from settings
      const centralExchangeRate = await configurationService.getCentralExchangeRate();
      
      // Stage 1 Compliance: Prevent Negative Balance check for CapitalOut transactions
      if (sanitizedData.type === 'CapitalOut') {
        const isNegativeAllowed = await configurationService.isNegativeBalanceAllowed();
        if (!isNegativeAllowed) {
          const currentBalance = await storage.getCapitalBalance();
          const outAmount = parseFloat(sanitizedData.amount);
          if (currentBalance < outAmount) {
            return res.status(400).json({
              message: `Transaction blocked: Insufficient balance. Current: $${currentBalance.toFixed(2)}, Requested: $${outAmount.toFixed(2)}. Negative balance prevention is enabled.`
            });
          }
        }
      }
      
      // Generate document number using Stage 1 numbering system
      const documentNumber = await configurationService.generateEntityNumber('capital_entry', {
        prefix: 'CAP',
        suffix: new Date().getFullYear().toString().slice(-2)
      });
      
      const entry = await storage.createCapitalEntry({
        ...sanitizedData,
        entryId: documentNumber,
        exchangeRate: centralExchangeRate.toString(),
        createdBy: req.user.id
      });

      // Create audit log using new interface
      await auditService.logOperation(
        {
          userId: req.user.id,
          userName: req.user.email || 'Capital Management',
          source: 'capital_management',
          severity: 'info',
        },
        {
          entityType: 'capital_entries',
          entityId: entry.id,
          action: 'create',
          operationType: 'capital_entry_creation',
          description: `Created capital entry: ${entry.description}`,
          newValues: entry
        }
      );

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating capital entry:", error);
      res.status(500).json({ message: "Failed to create capital entry" });
    }
  }
);

// POST /api/capital/reverse-entry - Stage 1 Compliance: Immutable entries support reversal only
capitalRouter.post("/reverse-entry",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  requireApproval("capital_entry"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { originalEntryId, reason } = req.body;
      
      // Get original entry to reverse
      const originalEntry = await storage.getCapitalEntryById(originalEntryId);
      if (!originalEntry) {
        return res.status(404).json({ message: "Original entry not found" });
      }
      
      // Stage 1 Compliance: Check if entry has linked records
      const hasLinkedRecords = originalEntry.reference && originalEntry.reference.trim() !== '';
      if (!hasLinkedRecords) {
        return res.status(400).json({ 
          message: "Only entries with linked records can be reversed. Unlinked entries can be deleted normally." 
        });
      }
      
      // Get central exchange rate
      const centralExchangeRate = await configurationService.getCentralExchangeRate();
      
      // Generate reversal document number
      const reversalNumber = await configurationService.generateEntityNumber('capital_entry', {
        prefix: 'REV',
        suffix: new Date().getFullYear().toString().slice(-2)
      });
      
      // Create reversal entry
      const reversalEntry = await storage.createCapitalEntry({
        type: 'Reverse',
        entryId: reversalNumber,
        amount: originalEntry.amount,
        description: `REVERSAL: ${originalEntry.description} | Reason: ${reason}`,
        reference: originalEntry.reference,
        exchangeRate: centralExchangeRate.toString(),
        createdBy: req.user.id
      });
      
      // Create audit log
      await auditService.logOperation(
        {
          userId: req.user.id,
          userName: req.user.email || 'Capital Management',
          source: 'capital_management',
          severity: 'warning',
        },
        {
          entityType: 'capital_entries',
          entityId: reversalEntry.id,
          action: 'create',
          operationType: 'capital_entry_reversal',
          description: `Created reversal entry for ${originalEntryId}: ${reason}`,
          newValues: {
            originalEntryId,
            reversalEntryId: reversalEntry.id,
            reason
          }
        }
      );
      
      res.status(201).json({ reversalEntry, originalEntry });
    } catch (error) {
      console.error("Error creating reversal entry:", error);
      res.status(500).json({ message: "Failed to create reversal entry" });
    }
  }
);

// POST /api/capital/opening-balance - Stage 1 Compliance: Opening Balance support
capitalRouter.post("/opening-balance",
  isAuthenticated,
  requireRole(["admin"]),
  requireApproval("capital_entry"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, date, description } = req.body;
      
      // Check if opening balance already exists
      const existingOpening = await storage.getCapitalEntriesByType('Opening');
      if (existingOpening.length > 0) {
        return res.status(400).json({ 
          message: "Opening balance already exists. Use reversal/reclass to modify." 
        });
      }
      
      // Get central exchange rate
      const centralExchangeRate = await configurationService.getCentralExchangeRate();
      
      // Generate opening balance document number
      const openingNumber = await configurationService.generateEntityNumber('capital_entry', {
        prefix: 'OPB',
        suffix: new Date().getFullYear().toString().slice(-2)
      });
      
      // Create opening balance entry
      const openingEntry = await storage.createCapitalEntry({
        type: 'Opening',
        entryId: openingNumber,
        amount: amount.toString(),
        date: new Date(date),
        description: description || 'Opening Balance',
        exchangeRate: centralExchangeRate.toString(),
        createdBy: req.user.id
      });
      
      // Create audit log
      await auditService.logOperation(
        {
          userId: req.user.id,
          userName: req.user.email || 'Capital Management',
          source: 'capital_management',
          severity: 'info',
        },
        {
          entityType: 'capital_entries',
          entityId: openingEntry.id,
          action: 'create',
          operationType: 'opening_balance_creation',
          description: `Created opening balance: $${amount}`,
          newValues: openingEntry
        }
      );
      
      res.status(201).json(openingEntry);
    } catch (error) {
      console.error("Error creating opening balance:", error);
      res.status(500).json({ message: "Failed to create opening balance" });
    }
  }
);

// POST /api/capital/multi-order-entry
capitalRouter.post("/multi-order-entry",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await capitalEnhancementService.createMultiOrderCapitalEntry(
        req.body,
        req.user.id
      );
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating multi-order capital entry:", error);
      res.status(500).json({ message: "Failed to create multi-order capital entry" });
    }
  }
);

// GET /api/capital/balance-alerts
capitalRouter.get("/balance-alerts",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const alerts = await capitalEnhancementService.getCapitalBalanceSummary();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching balance alerts:", error);
      res.status(500).json({ message: "Failed to fetch balance alerts" });
    }
  }
);