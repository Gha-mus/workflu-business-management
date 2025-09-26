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

// NEW: Import domain service for capital operations
import { CapitalService } from "../domains/capital/service";
const capitalService = new CapitalService();

export const capitalRouter = Router();

// GET /api/capital/entries - MIGRATED to use CapitalService
capitalRouter.get("/entries", isAuthenticated, async (req, res, next) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const entries = await capitalService.getCapitalEntries();
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
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const validatedData = insertCapitalEntrySchema.parse(req.body);
      
      // Get central exchange rate from settings
      const centralExchangeRate = await configurationService.getCentralExchangeRate();
      
      // Stage 1 Compliance: Prevent Negative Balance check for CapitalOut transactions
      if (validatedData.type === 'CapitalOut') {
        const isNegativeAllowed = await configurationService.isNegativeBalanceAllowed();
        if (!isNegativeAllowed) {
          const currentBalance = await capitalService.getCapitalBalance();
          const outAmount = parseFloat(validatedData.amount);
          if (currentBalance < outAmount) {
            return res.status(400).json({
              message: `Transaction blocked: Insufficient balance. Current: $${currentBalance.toFixed(2)}, Requested: $${outAmount.toFixed(2)}. Negative balance prevention is enabled.`
            });
          }
        }
      }
      
      // MIGRATED: Use CapitalService instead of storage
      const auditContext = {
        userId: authReq.user.id,
        userName: authReq.user.email || 'Capital Management',
        source: 'capital_management',
        severity: 'info' as const,
      };

      const entry = await capitalService.createCapitalEntry({
        ...validatedData,
        createdBy: authReq.user.id
      }, auditContext);

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
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { originalEntryId, reason } = req.body;
      
      // Get original entry to reverse - MIGRATED to use CapitalService
      const originalEntry = await capitalService.getCapitalEntry(originalEntryId);
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
      
      // Create reversal entry - MIGRATED to use CapitalService
      const auditContext = {
        userId: authReq.user.id,
        userName: authReq.user.email || 'Capital Management',
        source: 'capital_management',
        severity: 'info' as const,
      };

      const reversalEntry = await capitalService.createCapitalEntry({
        type: 'Reverse', // Use valid CapitalEntryType
        amount: originalEntry.amount,
        description: `REVERSAL: ${originalEntry.description} | Reason: ${reason}`,
        reference: originalEntry.reference,
        createdBy: authReq.user.id
      }, auditContext); // MIGRATED: CapitalService handles audit logging
      
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
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { amount, date, description } = req.body;
      
      // Check if opening balance already exists - MIGRATED to use CapitalService
      const existingOpening = await capitalService.getCapitalEntriesByType('Opening'); // Use valid CapitalEntryType
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
      
      // Create opening balance entry - MIGRATED to use CapitalService
      const auditContext = {
        userId: authReq.user.id,
        userName: authReq.user.email || 'Capital Management',
        source: 'capital_management',
        severity: 'info' as const,
      };

      const openingEntry = await capitalService.createCapitalEntry({
        type: 'Opening', // Use valid CapitalEntryType
        amount: parseFloat(amount), // FIX: Use numeric amount instead of string
        date: new Date(date),
        description: description || 'Opening Balance',
        createdBy: authReq.user.id
      }, auditContext); // MIGRATED: CapitalService handles audit logging
      
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
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const result = await capitalEnhancementService.createMultiOrderCapitalEntry(
        req.body,
        authReq.user.id
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
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const alerts = await capitalEnhancementService.getCapitalBalanceSummary();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching balance alerts:", error);
      res.status(500).json({ message: "Failed to fetch balance alerts" });
    }
  }
);