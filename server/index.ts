import express, { type Request, Response, NextFunction } from "express";
// Temporarily disable legacy routes
// import { registerRoutes } from "./routes";
import { setupModuleRoutes } from "./routes/index"; 
import { setupAuth } from "./core/auth";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { databaseSecurityService } from "./databaseSecurityService";
import { approvalStartupValidator } from "./approvalStartupValidator";
import { notificationService } from "./notificationService";
import { alertMonitoringService } from "./alertMonitoringService";
import { notificationSchedulerService } from "./notificationSchedulerService";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // CRITICAL SECURITY: Initialize and verify database security constraints FIRST
    // This MUST succeed before any routes or operations are available
    log("🔒 Initializing database security constraints...");
    await databaseSecurityService.initializeSecurityConstraints();
    log("✅ Database security constraints verified successfully");

    // CRITICAL SECURITY: Validate approval chain configuration SECOND
    // This ensures all critical operations have proper approval chains before accepting requests
    log("🔒 Validating approval chain configuration...");
    await approvalStartupValidator.validateApprovalChainConfiguration();
    log("✅ Approval chain configuration validated successfully");

    // NOTIFICATION SYSTEM: Initialize comprehensive notification and alerting system
    log("📧 Initializing notification system...");
    await notificationService.initialize();
    log("✅ Notification service initialized successfully");
    
    log("🚨 Initializing alert monitoring service...");
    await alertMonitoringService.initialize();
    log("✅ Alert monitoring service initialized successfully");
    
    log("⏰ Initializing notification scheduler...");
    await notificationSchedulerService.initialize();
    log("✅ Notification scheduler initialized successfully");

    // Set up authentication first
    await setupAuth(app);
    
    // Set up new modular routes
    setupModuleRoutes(app);
    
    // Set up HTTP server
    const server = createServer(app);
    
    // Set up Vite in development, static serving in production
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error ${status}: ${message}`);
      if (!res.headersSent) res.status(status).json({ message });
      // do not throw - prevents process crashes
    });

    // Vite setup already handled above - removed duplicate

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🚀 Server started on port ${port} with security constraints verified`);
    });

  } catch (error) {
    console.error("🚨 CRITICAL STARTUP FAILURE:", error);
    console.error("🛑 Application startup failed due to security constraint verification failure");
    process.exit(1);
  }
})();
