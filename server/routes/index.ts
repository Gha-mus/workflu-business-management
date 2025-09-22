import { Express } from "express";
import { capitalRouter } from "./capital";
import { purchasesRouter } from "./purchases";
import { warehouseRouter } from "./warehouse";
import { shippingRouter } from "./shipping";
import { operatingExpensesRouter } from "./operating-expenses";
import { salesRouter } from "./sales";
import { revenuesRouter } from "./revenues";
import { approvalsRouter } from "./approvals";
import { notificationsRouter } from "./notifications";
import { documentsRouter } from "./documents";
import { exportRouter } from "./export";
import { aiRouter } from "./ai";
import { reportsRouter } from "./reports";
import { settingsRouter } from "./settings";
import { usersRouter } from "./users";
import { adminRouter } from "./admin";
import userManagementRouter from "./userManagement";
import { superAdminRouter } from "./superAdmin";
import translationRouter from "./translation";

export function setupModuleRoutes(app: Express): void {
  // Business stage modules
  app.use("/api/capital", capitalRouter);
  app.use("/api/purchases", purchasesRouter);
  app.use("/api/warehouse", warehouseRouter);
  app.use("/api/shipping", shippingRouter);
  app.use("/api/operating-expenses", operatingExpensesRouter);
  app.use("/api/sales", salesRouter);
  app.use("/api/revenue", revenuesRouter);
  
  // Cross-cutting modules
  app.use("/api/approvals", approvalsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/documents", documentsRouter);
  app.use("/api/export", exportRouter);
  
  // Global services
  app.use("/api/ai", aiRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/translation", translationRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/admin/users", userManagementRouter);
  app.use("/api/super-admin/users", superAdminRouter);
}