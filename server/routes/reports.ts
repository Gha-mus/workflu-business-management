import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";

export const reportsRouter = Router();

// GET /api/reports/financial/summary
reportsRouter.get("/financial/summary", isAuthenticated, async (req, res) => {
  try {
    const summary = await storage.getFinancialSummary();
    res.json(summary);
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({ message: "Failed to fetch financial summary" });
  }
});

// GET /api/reports/trading/activity
reportsRouter.get("/trading/activity", isAuthenticated, async (req, res) => {
  try {
    const activity = await storage.getTradingActivity();
    res.json(activity);
  } catch (error) {
    console.error("Error fetching trading activity:", error);
    res.status(500).json({ message: "Failed to fetch trading activity" });
  }
});

// GET /api/reports/inventory/status
reportsRouter.get("/inventory/status", isAuthenticated, async (req, res) => {
  try {
    const status = await storage.getInventoryStatus();
    res.json(status);
  } catch (error) {
    console.error("Error fetching inventory status:", error);
    res.status(500).json({ message: "Failed to fetch inventory status" });
  }
});

// GET /api/reports/orders/fulfillment
reportsRouter.get("/orders/fulfillment", isAuthenticated, async (req, res) => {
  try {
    const fulfillment = await storage.getOrderFulfillmentReport();
    res.json(fulfillment);
  } catch (error) {
    console.error("Error fetching order fulfillment report:", error);
    res.status(500).json({ message: "Failed to fetch order fulfillment report" });
  }
});

// GET /api/reports/suppliers/performance
reportsRouter.get("/suppliers/performance",
  isAuthenticated,
  requireRole(["admin", "purchasing"]),
  async (req, res) => {
    try {
      const performance = await storage.getSupplierPerformanceReport();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching supplier performance:", error);
      res.status(500).json({ message: "Failed to fetch supplier performance" });
    }
  }
);

// GET /api/reports/capital/utilization
reportsRouter.get("/capital/utilization",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  async (req, res) => {
    try {
      const utilization = await storage.getCapitalUtilizationReport();
      res.json(utilization);
    } catch (error) {
      console.error("Error fetching capital utilization:", error);
      res.status(500).json({ message: "Failed to fetch capital utilization" });
    }
  }
);