import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import type { AuthenticatedRequest } from "../core/auth/types";
import { auditService } from "../auditService";
import { approvalWorkflowService } from "../approvalWorkflowService";
import { insertApprovalRequestSchema } from "@shared/schema";

export const approvalsRouter = Router();

// GET /api/approvals/requests
approvalsRouter.get("/requests", isAuthenticated, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const requests = await storage.getApprovalRequests();
    res.json(requests);
  } catch (error) {
    console.error("Error fetching approval requests:", error);
    res.status(500).json({ message: "Failed to fetch approval requests" });
  }
});

// POST /api/approvals/requests
approvalsRouter.post("/requests",
  isAuthenticated,
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const validatedData = insertApprovalRequestSchema.parse(req.body);
      const request = await approvalWorkflowService.createApprovalRequest({
        ...validatedData,
        requestedBy: authReq.user.id
      });

      // Create audit log
      await auditService.logAction({
        userId: authReq.user.id,
        action: "CREATE",
        entityType: "approval_request",
        entityId: request.id,
        description: `Created approval request: ${request.operationType}`,
        previousState: null,
        newState: request
      });

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating approval request:", error);
      res.status(500).json({ message: "Failed to create approval request" });
    }
  }
);

// POST /api/approvals/requests/:id/decision
approvalsRouter.post("/requests/:id/decision",
  isAuthenticated,
  requireRole(["admin", "finance", "manager"]),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      const { decision, comments } = req.body;

      const result = await approvalWorkflowService.processApprovalDecision(
        id,
        authReq.user.id,
        { decision, comments }
      );

      // Create audit log
      await auditService.logAction({
        userId: authReq.user.id,
        action: "UPDATE",
        entityType: "approval_request",
        entityId: id,
        description: `${decision} approval request: ${comments || 'No comments'}`,
        previousState: null,
        newState: result
      });

      res.json(result);
    } catch (error) {
      console.error("Error processing approval decision:", error);
      res.status(500).json({ message: "Failed to process approval decision" });
    }
  }
);

// GET /api/approvals/chains
approvalsRouter.get("/chains",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const chains = await storage.getApprovalChains();
      res.json(chains);
    } catch (error) {
      console.error("Error fetching approval chains:", error);
      res.status(500).json({ message: "Failed to fetch approval chains" });
    }
  }
);

// GET /api/approvals/pending
approvalsRouter.get("/pending",
  isAuthenticated,
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const pending = await approvalWorkflowService.getPendingApprovalsForUser(authReq.user.id);
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  }
);