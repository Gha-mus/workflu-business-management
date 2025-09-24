import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { exportService } from "../exportService";
import { auditService } from "../auditService";
import { exportTypeSchema } from "@shared/schema";

export const exportRouter = Router();

// GET /api/export/history
exportRouter.get("/history", isAuthenticated, async (req, res) => {
  try {
    const history = await storage.getExportHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching export history:", error);
    res.status(500).json({ message: "Failed to fetch export history" });
  }
});

// POST /api/export/create
exportRouter.post("/create", isAuthenticated, async (req, res) => {
  try {
    const validatedData = exportTypeSchema.parse(req.body);
    const exportRecord = await exportService.createExport({
      userId: req.user!.id,
      exportType: validatedData.type,
      format: validatedData.format,
      dateRange: (validatedData as any).dateRange,
      filters: (validatedData as any).filters,
      preferences: (validatedData as any).preferences
    });

    // Create audit log
    await auditService.logOperation(
      {
        userId: req.user!.id,
        userName: 'System',
        userRole: 'admin',
        source: 'export_api',
        severity: 'info',
        businessContext: `Created export request: ${exportRecord.exportType}`
      },
      {
        entityType: 'export_history',
        entityId: exportRecord.id,
        action: 'create',
        operationType: 'export_request_create',
        description: `Created export request: ${exportRecord.exportType}`,
        oldValues: undefined,
        newValues: exportRecord
      }
    );

    res.status(201).json(exportRecord);
  } catch (error) {
    console.error("Error creating export:", error);
    res.status(500).json({ message: "Failed to create export" });
  }
});

// GET /api/export/download/:id
exportRouter.get("/download/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = await exportService.getExportFile(id, req.user!.id);
    res.download(filePath);
  } catch (error) {
    console.error("Error downloading export:", error);
    res.status(500).json({ message: "Failed to download export" });
  }
});

// GET /api/export/status/:id
exportRouter.get("/status/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const exportJob = await storage.getExportJob(id);
    const status = { status: exportJob?.status || 'not_found', exportJob };
    res.json(status);
  } catch (error) {
    console.error("Error fetching export status:", error);
    res.status(500).json({ message: "Failed to fetch export status" });
  }
});

// POST /api/export/schedule
exportRouter.post("/schedule",
  isAuthenticated,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const job = await exportService.scheduleExport({
        ...req.body,
        userId: req.user!.id
      });

      // Create audit log
      await auditService.logOperation(
        {
          userId: req.user!.id,
          userName: 'System',
          userRole: 'admin',
          source: 'export_api',
          severity: 'info',
          businessContext: `Scheduled export: ${job.exportType}`
        },
        {
          entityType: 'export_jobs',
          entityId: job.id,
          action: 'create',
          operationType: 'export_schedule_create',
          description: `Scheduled export: ${job.exportType}`,
          oldValues: undefined,
          newValues: job
        }
      );

      res.status(201).json(job);
    } catch (error) {
      console.error("Error scheduling export:", error);
      res.status(500).json({ message: "Failed to schedule export" });
    }
  }
);