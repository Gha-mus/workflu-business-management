import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { notificationService } from "../notificationService";

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const { status, priority, limit, offset } = req.query;
    
    // Map frontend 'unread' status to backend 'pending' status
    let mappedStatus = status as string;
    if (status === 'unread') {
      mappedStatus = 'pending';
    }
    
    const filter = {
      ...(mappedStatus && mappedStatus !== 'all' && { status: mappedStatus }),
      ...(priority && { priority: priority as string }),
      ...(limit && { limit: parseInt(limit as string) }),
      ...(offset && { offset: parseInt(offset as string) }),
    };
    
    console.log(`🔍 GET /api/notifications for userId: ${userId}, filter:`, filter);
    const result = await storage.getUserNotifications(userId, filter);
    console.log(`📊 Returned ${result.notifications.length} notifications for user ${userId}`);
    res.json(result.notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/:id/read - Mark individual notification as read
notificationsRouter.put("/:id/read", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.markNotificationAsRead(id, (req.user as any)?.claims?.sub);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// PUT /api/notifications/:id/dismiss - Dismiss individual notification
notificationsRouter.put("/:id/dismiss", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.dismissNotification(id, (req.user as any)?.claims?.sub);
    res.json({ success: true });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    res.status(500).json({ message: "Failed to dismiss notification" });
  }
});

// POST /api/notifications/bulk-read - Mark multiple notifications as read
notificationsRouter.post("/bulk-read", isAuthenticated, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "notificationIds must be an array" });
    }
    const result = await storage.bulkMarkNotificationsAsRead(notificationIds, (req.user as any)?.claims?.sub);
    res.json({ success: true, updated: result.updated });
  } catch (error) {
    console.error("Error bulk marking notifications as read:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

// GET /api/notifications/settings
notificationsRouter.get("/settings", isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.getNotificationSettings((req.user as any)?.claims?.sub);
    res.json(settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ message: "Failed to fetch notification settings" });
  }
});

// POST /api/notifications/settings
notificationsRouter.post("/settings", isAuthenticated, async (req, res) => {
  try {
    const settings = await storage.updateNotificationSettings((req.user as any)?.claims?.sub, req.body);
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
      await notificationService.sendTestEmail((req.user as any).email, req.body.message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  }
);