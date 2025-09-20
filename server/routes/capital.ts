import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
import { capitalEnhancementService } from "../modules/capital/service";
import { insertCapitalEntrySchema } from "@shared/schema";
import { capitalEntryPeriodGuard } from "../periodGuard";
import { requireApproval } from "../approvalMiddleware";

export const capitalRouter = Router();

// GET /api/capital/entries
capitalRouter.get("/entries", isAuthenticated, async (req, res) => {
  try {
    const entries = await storage.getCapitalEntries();
    res.json(entries);
  } catch (error) {
    console.error("Error fetching capital entries:", error);
    res.status(500).json({ message: "Failed to fetch capital entries" });
  }
});

// POST /api/capital/entries
capitalRouter.post("/entries", 
  isAuthenticated,
  requireRole(["admin", "finance"]),
  capitalEntryPeriodGuard,
  requireApproval("capital_entry"),
  async (req, res) => {
    try {
      const validatedData = insertCapitalEntrySchema.parse(req.body);
      const entry = await storage.createCapitalEntry({
        ...validatedData,
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "capital_entry",
        entityId: entry.id,
        description: `Created capital entry: ${entry.description}`,
        previousState: null,
        newState: entry
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating capital entry:", error);
      res.status(500).json({ message: "Failed to create capital entry" });
    }
  }
);

// POST /api/capital/multi-order-entry
capitalRouter.post("/multi-order-entry",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  async (req, res) => {
    try {
      const result = await capitalEnhancementService.createMultiOrderCapitalEntry(
        req.body,
        req.user!.id
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
    try {
      const alerts = await capitalEnhancementService.getCapitalBalanceAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching balance alerts:", error);
      res.status(500).json({ message: "Failed to fetch balance alerts" });
    }
  }
);