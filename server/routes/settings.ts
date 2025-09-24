import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
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
      await auditService.logOperation(
        {
          userId: req.user!.id,
          userName: 'System',
          userRole: 'admin',
          source: 'settings_api',
          severity: 'info',
          businessContext: `Updated setting: ${setting.key}`
        },
        {
          entityType: 'settings',
          entityId: setting.key,
          action: 'update',
          operationType: 'system_setting_change',
          description: `Updated setting: ${setting.key} = ${setting.value}`,
          oldValues: undefined,
          newValues: setting
        }
      );

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

// POST /api/settings/exchange-rates/admin-update - Admin-only immediate update (no approval required)
settingsRouter.post("/exchange-rates/admin-update",
  isAuthenticated,
  requireRole(["admin"]),
  // NO requireApproval middleware - admin bypass for immediate updates
  async (req: any, res) => {
    try {
      const { rate, reason } = req.body;
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      
      // Validate exchange rate
      if (!rate || isNaN(parseFloat(rate)) || parseFloat(rate) <= 0) {
        return res.status(400).json({ 
          message: 'Invalid exchange rate. Must be a positive number.' 
        });
      }
      
      const exchangeRate = parseFloat(rate);
      
      // Direct update using configurationService with admin bypass
      const result = await configurationService.updateSystemSetting(
        'USD_ETB_RATE',
        exchangeRate.toString(),
        {
          userId,
          category: 'financial',
          description: 'USD to ETB exchange rate',
          requiresApproval: false, // Force bypass approval
          changeReason: reason || 'Admin direct update',
          isAdmin: true // Admin bypass flag
        }
      );
      
      // Create audit log for admin action (corrected method signature)
      await auditService.logOperation(
        {
          userId,
          userName: 'Admin',
          userRole: 'admin',
          source: 'admin_exchange_rate_update',
          severity: 'critical',
          businessContext: `Admin direct exchange rate update to ${exchangeRate} (bypassed approval)`
        },
        {
          entityType: 'settings',
          entityId: 'USD_ETB_RATE',
          action: 'update',
          operationType: 'system_setting_change',
          description: `Admin direct exchange rate update to ${exchangeRate}`,
          newValues: {
            value: exchangeRate.toString(),
            reason: reason || 'Admin direct update',
            adminBypass: true,
            approvalBypassed: true
          },
          businessContext: `Exchange rate updated from configurationService (admin bypass)`,
        }
      );
      
      console.log(`✅ Admin direct exchange rate update to ${exchangeRate} by ${userId} (bypassed approval)`);
      
      res.json({ 
        success: true,
        message: 'Exchange rate updated successfully',
        rate: exchangeRate,
        updatedBy: userId,
        timestamp: new Date(),
        adminBypass: true
      });
      
    } catch (error) {
      console.error("Error updating exchange rate (admin bypass):", error);
      res.status(500).json({ 
        message: "Failed to update exchange rate",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

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
      await auditService.logOperation(
        {
          userId: req.user!.id,
          userName: 'System',
          userRole: 'admin',
          source: 'settings_api',
          severity: 'info',
          businessContext: `Updated USD/ETB exchange rate to ${rate}`
        },
        {
          entityType: 'settings',
          entityId: 'USD_ETB_RATE',
          action: 'update',
          operationType: 'system_setting_change',
          description: `Updated USD/ETB exchange rate to ${rate}`,
          oldValues: undefined,
          newValues: { rate }
        }
      );

      // Clear configuration cache
      await configurationService.clearCache("USD_ETB_RATE");

      res.json({ success: true, rate });
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      res.status(500).json({ message: "Failed to update exchange rate" });
    }
  }
);