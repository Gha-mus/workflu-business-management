import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { notificationService } from "../notificationService";

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const notifications = await storage.getNotifications(req.user!.id);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// POST /api/notifications/mark-read/:id
notificationsRouter.post("/mark-read/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.markNotificationAsRead(id, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// GET /api/notifications/settings
notificationsRouter.get("/settings", isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.getNotificationSettings(req.user!.id);
    res.json(settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ message: "Failed to fetch notification settings" });
  }
});

// POST /api/notifications/settings
notificationsRouter.post("/settings", isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.updateNotificationSettings(req.user!.id, req.body);
    res.json(settings);
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Failed to update notification settings" });
  }
});

// POST /api/notifications/test-email
notificationsRouter.post("/test-email",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      await notificationService.sendTestEmail(req.user!.email, req.body.message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  }
);