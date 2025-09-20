import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { auditService } from "../auditService";
import { configurationService } from "../configurationService";
import { insertSettingSchema } from "@shared/schema";
import { requireApproval } from "../approvalMiddleware";

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.getSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// POST /api/settings
settingsRouter.post("/",
  isAuthenticated,
  requireRole(["admin"]),
  requireApproval("system_setting_change"),
  async (req, res) => {
    try {
      const validatedData = insertSettingSchema.parse(req.body);
      const setting = await storage.updateSetting(validatedData);

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "setting",
        entityId: setting.key,
        description: `Updated setting: ${setting.key} = ${setting.value}`,
        previousState: null,
        newState: setting
      });

      // Clear configuration cache for this setting
      await configurationService.clearCache(setting.key);

      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  }
);

// GET /api/settings/:key
settingsRouter.get("/:key", isAuthenticated, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await storage.getSetting(key);
    res.json(setting);
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({ message: "Failed to fetch setting" });
  }
});

// GET /api/settings/exchange-rates/current
settingsRouter.get("/exchange-rates/current", isAuthenticated, async (req, res) => {
  try {
    const rate = await configurationService.getCentralExchangeRate();
    res.json(rate);
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    res.status(500).json({ message: "Failed to fetch exchange rate" });
  }
});

// POST /api/settings/exchange-rates/update
settingsRouter.post("/exchange-rates/update",
  isAuthenticated,
  requireRole(["admin", "finance"]),
  requireApproval("system_setting_change"),
  async (req, res) => {
    try {
      const { rate } = req.body;
      await storage.updateSetting({
        key: "USD_ETB_RATE",
        category: "financial",
        value: rate.toString(),
        description: "USD to ETB exchange rate"
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "UPDATE",
        entityType: "setting",
        entityId: "USD_ETB_RATE",
        description: `Updated USD/ETB exchange rate to ${rate}`,
        previousState: null,
        newState: { rate }
      });

      // Clear configuration cache
      await configurationService.clearCache("USD_ETB_RATE");

      res.json({ success: true, rate });
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      res.status(500).json({ message: "Failed to update exchange rate" });
    }
  }
);