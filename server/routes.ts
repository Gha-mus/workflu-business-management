import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { aiService } from "./aiService";
import { exportService } from "./exportService";
import { approvalWorkflowService } from "./approvalWorkflowService";
import { approvalStartupValidator } from "./approvalStartupValidator";
import { auditService } from "./auditService";
import { approvalMiddleware, requireApproval } from "./approvalMiddleware";
import { 
  purchasePeriodGuard, 
  capitalEntryPeriodGuard, 
  warehousePeriodGuard, 
  genericPeriodGuard,
  strictPeriodGuard 
} from "./periodGuard";
import { DocumentService, upload } from "./documentService";
import { z } from "zod";
import Decimal from "decimal.js";
import crypto from "crypto";
import { 
  insertSupplierSchema,
  insertOrderSchema,
  insertPurchaseSchema,
  insertCapitalEntrySchema,
  insertWarehouseStockSchema,
  insertFilterRecordSchema,
  insertSettingSchema,
  warehouseStatusUpdateSchema,
  warehouseFilterOperationSchema,
  warehouseMoveToFinalSchema,
  warehouseStockFilterSchema,
  dateRangeFilterSchema,
  periodFilterSchema,
  exportTypeSchema,
  aiPurchaseRecommendationRequestSchema,
  aiSupplierRecommendationRequestSchema,
  aiCapitalOptimizationRequestSchema,
  aiChatRequestSchema,
  aiContextualHelpRequestSchema,
  insertCarrierSchema,
  insertShipmentSchema,
  insertShipmentItemSchema,
  insertShippingCostSchema,
  insertDeliveryTrackingSchema,
  createShipmentFromStockSchema,
  addShippingCostSchema,
  addDeliveryTrackingSchema,
  shipmentStatusUpdateSchema,
  carrierFilterSchema,
  shipmentFilterSchema,
  insertQualityStandardSchema,
  insertWarehouseBatchSchema,
  insertQualityInspectionSchema,
  insertInventoryConsumptionSchema,
  insertProcessingOperationSchema,
  insertStockTransferSchema,
  insertInventoryAdjustmentSchema,
  insertCustomerSchema,
  updateCustomerSchema,
  insertSalesOrderSchema,
  updateSalesOrderSchema,
  insertSalesOrderItemSchema,
  updateSalesOrderItemSchema,
  insertCustomerCommunicationSchema,
  insertRevenueTransactionSchema,
  insertCustomerCreditLimitSchema,
  insertPricingRuleSchema,
  // Financial reporting schemas
  financialPeriodFilterSchema,
  financialAnalysisRequestSchema,
  marginAnalysisRequestSchema,
  cashFlowAnalysisRequestSchema,
  budgetTrackingRequestSchema,
  insertFinancialPeriodSchema,
  // Document management schemas
  documentUploadSchema,
  documentSearchSchema,
  documentUpdateSchema,
  documentVersionCreateSchema,
  documentComplianceUpdateSchema,
  complianceFilterSchema,
  insertDocumentSchema,
  insertFinancialMetricSchema,
  insertProfitLossStatementSchema,
  insertCashFlowAnalysisSchema,
  insertMarginAnalysisSchema,
  insertBudgetTrackingSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', requireRole(['admin']), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', requireRole(['admin']), approvalMiddleware.userRoleChange, async (req, res) => {
    try {
      const { id } = req.params;
      const roleUpdateSchema = z.object({
        role: z.enum(['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker']),
      });
      
      const { role } = roleUpdateSchema.parse(req.body);
      const updatedUser = await storage.updateUserRole(id, role);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // ===============================================
  // APPROVAL WORKFLOW API ENDPOINTS
  // ===============================================

  // Get approval statistics for dashboard
  app.get('/api/approvals/statistics', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get pending approvals for user
      const pendingApprovals = await approvalWorkflowService.getPendingApprovals(userId);
      
      // Get recent approval activity
      const recentApprovals = await approvalWorkflowService.getApprovalsByStatus('approved', {
        userId,
        limit: 10
      });
      
      const rejectedApprovals = await approvalWorkflowService.getApprovalsByStatus('rejected', {
        userId,
        limit: 5
      });

      res.json({
        pending: pendingApprovals.length,
        recentApprovals: recentApprovals.length,
        recentRejections: rejectedApprovals.length,
        totalActive: pendingApprovals.length,
        pendingApprovals: pendingApprovals.slice(0, 5), // First 5 for preview
        recentActivity: [...recentApprovals.slice(0, 5), ...rejectedApprovals.slice(0, 3)]
      });
    } catch (error) {
      console.error("Error fetching approval statistics:", error);
      res.status(500).json({ message: "Failed to fetch approval statistics" });
    }
  });

  // Get pending approval requests for current user (as approver)
  app.get('/api/approvals/pending', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { operationType, priority, limit = '50', offset = '0' } = req.query;
      
      const pendingApprovals = await approvalWorkflowService.getPendingApprovals(userId, {
        operationType: operationType as string,
        priority: priority as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json(pendingApprovals);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Get approval requests submitted by current user
  app.get('/api/approvals/my-requests', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, operationType, limit = '50', offset = '0' } = req.query;
      
      let approvals = [];
      
      if (status && status !== 'all') {
        approvals = await approvalWorkflowService.getApprovalsByStatus(status as string, {
          userId,
          operationType: operationType as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        });
      } else {
        // Get all statuses
        const [pending, approved, rejected, escalated] = await Promise.all([
          approvalWorkflowService.getApprovalsByStatus('pending', { userId, operationType: operationType as string }),
          approvalWorkflowService.getApprovalsByStatus('approved', { userId, operationType: operationType as string }),
          approvalWorkflowService.getApprovalsByStatus('rejected', { userId, operationType: operationType as string }),
          approvalWorkflowService.getApprovalsByStatus('escalated', { userId, operationType: operationType as string })
        ]);
        
        approvals = [...pending, ...approved, ...rejected, ...escalated]
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));
      }

      res.json(approvals);
    } catch (error) {
      console.error("Error fetching user's approval requests:", error);
      res.status(500).json({ message: "Failed to fetch approval requests" });
    }
  });

  // Get approval history/all approvals (admin/manager view)
  app.get('/api/approvals/history', requireRole(['admin', 'finance', 'purchasing']), async (req, res) => {
    try {
      const { status = 'all', operationType, userId, limit = '100', offset = '0' } = req.query;
      
      let approvals = [];
      
      if (status !== 'all') {
        approvals = await approvalWorkflowService.getApprovalsByStatus(status as string, {
          userId: userId as string,
          operationType: operationType as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        });
      } else {
        // Get all approvals across all statuses
        const [pending, approved, rejected, escalated, cancelled] = await Promise.all([
          approvalWorkflowService.getApprovalsByStatus('pending', { operationType: operationType as string }),
          approvalWorkflowService.getApprovalsByStatus('approved', { operationType: operationType as string }),
          approvalWorkflowService.getApprovalsByStatus('rejected', { operationType: operationType as string }),
          approvalWorkflowService.getApprovalsByStatus('escalated', { operationType: operationType as string }),
          approvalWorkflowService.getApprovalsByStatus('cancelled', { operationType: operationType as string })
        ]);
        
        approvals = [...pending, ...approved, ...rejected, ...escalated, ...cancelled]
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));
      }

      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approval history:", error);
      res.status(500).json({ message: "Failed to fetch approval history" });
    }
  });

  // Process approval decision (approve, reject, escalate, delegate)
  app.post('/api/approvals/:id/decision', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const decisionSchema = z.object({
        decision: z.enum(['approve', 'reject', 'escalate', 'delegate']),
        comments: z.string().optional(),
        delegateTo: z.string().optional(),
        escalateTo: z.string().optional()
      });
      
      const decision = decisionSchema.parse(req.body);
      
      // Validate delegation/escalation targets
      if (decision.decision === 'delegate' && !decision.delegateTo) {
        return res.status(400).json({ message: "Delegation target is required" });
      }
      
      if (decision.decision === 'escalate' && !decision.escalateTo) {
        return res.status(400).json({ message: "Escalation target is required" });
      }
      
      const auditContext = auditService.extractRequestContext(req);
      const updatedRequest = await approvalWorkflowService.processApprovalDecision(
        id,
        decision,
        userId,
        auditContext
      );
      
      res.json({
        success: true,
        approval: updatedRequest,
        message: `Approval request ${decision.decision}d successfully`
      });
    } catch (error) {
      console.error("Error processing approval decision:", error);
      res.status(500).json({ 
        message: "Failed to process approval decision",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create approval request manually (for exceptional cases)
  app.post('/api/approvals/requests', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const requestSchema = z.object({
        operationType: z.string(),
        operationData: z.any(),
        amount: z.number().optional(),
        currency: z.string().default('USD'),
        businessContext: z.string().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        justification: z.string().optional()
      });
      
      const requestData = requestSchema.parse(req.body);
      const auditContext = auditService.extractRequestContext(req);
      
      const approvalRequest = await approvalWorkflowService.createApprovalRequest({
        ...requestData,
        requestedBy: userId
      }, auditContext);
      
      res.status(201).json({
        success: true,
        approval: approvalRequest,
        message: "Approval request created successfully"
      });
    } catch (error) {
      console.error("Error creating approval request:", error);
      res.status(500).json({ 
        message: "Failed to create approval request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get specific approval request details
  app.get('/api/approvals/requests/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // For now, get from the approval history - in a real implementation,
      // we'd have a dedicated endpoint in the workflow service
      const [approval] = await approvalWorkflowService.getApprovalsByStatus('pending', { limit: 1000 });
      const [approvedApproval] = await approvalWorkflowService.getApprovalsByStatus('approved', { limit: 1000 });
      const [rejectedApproval] = await approvalWorkflowService.getApprovalsByStatus('rejected', { limit: 1000 });
      const [escalatedApproval] = await approvalWorkflowService.getApprovalsByStatus('escalated', { limit: 1000 });
      
      const allApprovals = [
        ...(approval || []),
        ...(approvedApproval || []),
        ...(rejectedApproval || []),
        ...(escalatedApproval || [])
      ];
      
      const foundApproval = allApprovals.find(a => a.id === id);
      
      if (!foundApproval) {
        return res.status(404).json({ message: "Approval request not found" });
      }
      
      res.json(foundApproval);
    } catch (error) {
      console.error("Error fetching approval request:", error);
      res.status(500).json({ message: "Failed to fetch approval request" });
    }
  });

  // Check if operation requires approval
  app.post('/api/approvals/check-requirement', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const checkSchema = z.object({
        operationType: z.string(),
        amount: z.number().optional(),
        currency: z.string().default('USD')
      });
      
      const { operationType, amount, currency } = checkSchema.parse(req.body);
      
      const requiresApproval = await approvalWorkflowService.requiresApproval(
        operationType,
        amount,
        currency,
        userId
      );
      
      let approvalChain = null;
      if (requiresApproval) {
        approvalChain = await approvalWorkflowService.findApprovalChain(
          operationType,
          amount,
          currency
        );
      }
      
      res.json({
        requiresApproval,
        operationType,
        amount,
        currency,
        approvalChain: approvalChain ? {
          id: approvalChain.id,
          name: approvalChain.name,
          requiredRoles: approvalChain.requiredRoles,
          estimatedTime: approvalChain.estimatedTimeHours ? `${approvalChain.estimatedTimeHours} hours` : 'Variable'
        } : null
      });
    } catch (error) {
      console.error("Error checking approval requirement:", error);
      res.status(500).json({ message: "Failed to check approval requirement" });
    }
  });

  // Get approval chains configuration (admin only)
  app.get('/api/approvals/chains', requireRole(['admin']), async (req, res) => {
    try {
      const chains = await storage.getApprovalChains();
      res.json(chains);
    } catch (error) {
      console.error("Error fetching approval chains:", error);
      res.status(500).json({ message: "Failed to fetch approval chains" });
    }
  });

  // CRITICAL SECURITY ENDPOINT: Get approval chain coverage diagnostics (admin only)
  app.get('/api/approvals/diagnostics', requireRole(['admin']), async (req, res) => {
    try {
      console.log("🔍 Admin requested approval chain diagnostics");

      // Get current approval chain coverage status
      const coverage = await approvalStartupValidator.getApprovalChainCoverage();
      
      // Get additional security metrics
      const securityMetrics = {
        failClosedBehavior: true, // Now implemented
        storageGuardHardened: true, // Now implemented
        startupValidationActive: true, // Now implemented
        criticalOperationsProtected: true, // Now implemented
        skipApprovalControlsActive: true // Now implemented
      };

      // Generate comprehensive diagnostics report
      const diagnosticsReport = {
        ...coverage,
        securityMetrics,
        status: coverage.criticalMissing.length === 0 ? 'secure' : 'critical_gaps',
        recommendation: coverage.criticalMissing.length === 0 
          ? 'All critical approval chains are properly configured' 
          : `URGENT: ${coverage.criticalMissing.length} critical approval chains are missing`,
        nextActions: coverage.criticalMissing.length > 0 
          ? coverage.criticalMissing.map(op => `Create approval chain for: ${op}`) 
          : coverage.warnings.length > 0 
            ? ['Review and address approval chain warnings'] 
            : ['Approval system is fully secure'],
        securityFeatures: {
          failClosedOnMissingChains: 'ACTIVE - Operations require approval when chains missing',
          criticalOperationProtection: 'ACTIVE - Critical operations cannot skip approval',
          internalTokenValidation: 'ACTIVE - skipApproval requires valid internal token',
          startupValidation: 'ACTIVE - System validates chains at startup',
          comprehensiveAuditing: 'ACTIVE - All approval actions logged',
          singleUseApprovals: 'ACTIVE - Approvals consumed atomically'
        }
      };

      res.json(diagnosticsReport);

      // Log admin access for audit trail
      await auditService.logOperation({
        userId: (req as any).user?.claims?.sub || 'unknown-admin',
        userName: (req as any).user?.claims?.name || 'Unknown Admin',
        userRole: 'admin',
        source: 'approval_diagnostics_endpoint',
        severity: 'info'
      }, {
        entityType: 'approval_diagnostics',
        entityId: `diagnostics_${Date.now()}`,
        action: 'view',
        description: 'Admin accessed approval chain diagnostics',
        businessContext: 'Approval system security monitoring',
        operationType: 'system_diagnostics',
        newValues: {
          requestedDiagnostics: true,
          coverageStatus: coverage.status,
          criticalMissing: coverage.criticalMissing.length,
          totalOperations: coverage.totalOperations,
          configuredChains: coverage.configuredChains
        }
      });

    } catch (error) {
      console.error("Error generating approval diagnostics:", error);
      res.status(500).json({ 
        message: "Failed to generate approval diagnostics",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create approval chain (admin only)
  app.post('/api/approvals/chains', requireRole(['admin']), async (req, res) => {
    try {
      const chainSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        operationType: z.enum(['capital_entry', 'purchase', 'sale_order', 'user_role_change', 'system_setting_change', 'warehouse_operation', 'shipping_operation', 'financial_adjustment']),
        requiredRoles: z.array(z.string()),
        minAmount: z.string().optional(),
        maxAmount: z.string().optional(),
        currency: z.string().default('USD'),
        priority: z.number().default(1),
        estimatedTimeHours: z.number().optional(),
        autoApproveBelow: z.string().optional(),
        autoApproveSameUser: z.boolean().default(false),
        isActive: z.boolean().default(true)
      });
      
      const chainData = chainSchema.parse(req.body);
      const auditContext = auditService.extractRequestContext(req);
      
      const createdChain = await storage.createApprovalChain(chainData, auditContext);
      
      res.status(201).json({
        success: true,
        chain: createdChain,
        message: "Approval chain created successfully"
      });
    } catch (error) {
      console.error("Error creating approval chain:", error);
      res.status(500).json({ 
        message: "Failed to create approval chain",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update approval chain (admin only)
  app.patch('/api/approvals/chains/:id', requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const auditContext = auditService.extractRequestContext(req);
      
      const updatedChain = await storage.updateApprovalChain(id, updateData, auditContext);
      
      res.json({
        success: true,
        chain: updatedChain,
        message: "Approval chain updated successfully"
      });
    } catch (error) {
      console.error("Error updating approval chain:", error);
      res.status(500).json({ 
        message: "Failed to update approval chain",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ===============================================
  // ADDITIONAL APPROVAL API ENDPOINTS - DIRECT ACTIONS
  // ===============================================

  // Direct approve endpoint
  app.post('/api/approvals/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { comments } = req.body;
      
      const auditContext = auditService.extractRequestContext(req);
      const updatedRequest = await approvalWorkflowService.processApprovalDecision(
        id,
        { decision: 'approve', comments },
        userId,
        auditContext
      );
      
      res.json({
        success: true,
        approval: updatedRequest,
        message: "Approval request approved successfully"
      });
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ 
        message: "Failed to approve request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Direct reject endpoint
  app.post('/api/approvals/:id/reject', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { comments } = req.body;
      
      const auditContext = auditService.extractRequestContext(req);
      const updatedRequest = await approvalWorkflowService.processApprovalDecision(
        id,
        { decision: 'reject', comments },
        userId,
        auditContext
      );
      
      res.json({
        success: true,
        approval: updatedRequest,
        message: "Approval request rejected successfully"
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ 
        message: "Failed to reject request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Direct escalate endpoint  
  app.post('/api/approvals/:id/escalate', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { escalateTo, comments } = req.body;
      
      if (!escalateTo) {
        return res.status(400).json({ message: "Escalation target is required" });
      }
      
      const auditContext = auditService.extractRequestContext(req);
      const updatedRequest = await approvalWorkflowService.processApprovalDecision(
        id,
        { decision: 'escalate', escalateTo, comments },
        userId,
        auditContext
      );
      
      res.json({
        success: true,
        approval: updatedRequest,
        message: "Approval request escalated successfully"
      });
    } catch (error) {
      console.error("Error escalating request:", error);
      res.status(500).json({ 
        message: "Failed to escalate request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Direct delegate endpoint
  app.post('/api/approvals/:id/delegate', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { delegateTo, comments } = req.body;
      
      if (!delegateTo) {
        return res.status(400).json({ message: "Delegation target is required" });
      }
      
      const auditContext = auditService.extractRequestContext(req);
      const updatedRequest = await approvalWorkflowService.processApprovalDecision(
        id,
        { decision: 'delegate', delegateTo, comments },
        userId,
        auditContext
      );
      
      res.json({
        success: true,
        approval: updatedRequest,
        message: "Approval request delegated successfully"
      });
    } catch (error) {
      console.error("Error delegating request:", error);
      res.status(500).json({ 
        message: "Failed to delegate request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Cancel approval request endpoint
  app.post('/api/approvals/:id/cancel', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { comments } = req.body;
      
      // Get the approval request to validate ownership
      const approvals = await approvalWorkflowService.getApprovalsByStatus('pending', { limit: 1000 });
      const approval = approvals.find(a => a.id === id);
      
      if (!approval) {
        return res.status(404).json({ message: "Approval request not found" });
      }
      
      if (approval.requestedBy !== userId) {
        // Allow admins to cancel any request
        const user = await storage.getUser(userId);
        if (user?.role !== 'admin') {
          return res.status(403).json({ message: "Only the requester or admin can cancel approval requests" });
        }
      }
      
      const auditContext = auditService.extractRequestContext(req);
      
      // Update the approval request to cancelled status
      const updateData = {
        status: 'cancelled' as any,
        rejectionReason: comments || 'Cancelled by requester',
        completedAt: new Date(),
        updatedAt: new Date()
      };

      const updatedRequest = await storage.updateApprovalRequest(id, updateData, auditContext);
      
      res.json({
        success: true,
        approval: updatedRequest,
        message: "Approval request cancelled successfully"
      });
    } catch (error) {
      console.error("Error cancelling request:", error);
      res.status(500).json({ 
        message: "Failed to cancel request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bulk approval actions endpoint
  app.post('/api/approvals/bulk-actions', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { approvalIds, action, comments, targetUserId } = req.body;
      const userId = req.user.claims.sub;
      
      if (!approvalIds || !Array.isArray(approvalIds) || approvalIds.length === 0) {
        return res.status(400).json({ message: "Approval IDs array is required" });
      }
      
      if (!['approve', 'reject', 'escalate', 'delegate'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      const results = [];
      const auditContext = auditService.extractRequestContext(req);
      
      for (const approvalId of approvalIds) {
        try {
          const decision: any = { decision: action, comments };
          if (action === 'escalate') decision.escalateTo = targetUserId;
          if (action === 'delegate') decision.delegateTo = targetUserId;
          
          const updatedRequest = await approvalWorkflowService.processApprovalDecision(
            approvalId,
            decision,
            userId,
            auditContext
          );
          
          results.push({
            approvalId,
            success: true,
            approval: updatedRequest
          });
        } catch (error) {
          results.push({
            approvalId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      res.json({
        success: true,
        message: `Bulk action completed: ${successCount} succeeded, ${failureCount} failed`,
        results,
        summary: {
          total: approvalIds.length,
          succeeded: successCount,
          failed: failureCount
        }
      });
    } catch (error) {
      console.error("Error processing bulk approval actions:", error);
      res.status(500).json({ 
        message: "Failed to process bulk approval actions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Add comments to approval request
  app.post('/api/approvals/:id/comments', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { comment } = req.body;
      
      if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: "Comment is required" });
      }
      
      const auditContext = auditService.extractRequestContext(req);
      
      // Log comment as audit entry
      await auditService.logOperation(auditContext, {
        entityType: 'approval_requests',
        entityId: id,
        action: 'update',
        description: `Added comment to approval request`,
        businessContext: `Approval workflow: Comment added by ${auditContext.userName}`,
        operationType: 'approval_comment',
        newValues: { comment, commentedBy: userId, commentedAt: new Date().toISOString() }
      });
      
      res.json({
        success: true,
        message: "Comment added successfully"
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ 
        message: "Failed to add comment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ===============================================
  // AUDIT LOGGING API ENDPOINTS
  // ===============================================

  // Get audit logs with advanced filtering and search
  app.get('/api/audit/logs', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const {
        entityType,
        entityId, 
        action,
        userId,
        operationType,
        dateFrom,
        dateTo,
        severity,
        searchTerm,
        limit = '100',
        offset = '0',
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      const auditLogs = await auditService.getAuditLogs({
        entityType: entityType as string,
        entityId: entityId as string,
        action: action as string,
        userId: userId as string,
        operationType: operationType as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        severity: severity as string,
        searchTerm: searchTerm as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get audit statistics for dashboard
  app.get('/api/audit/statistics', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { days = '30' } = req.query;
      const daysParsed = parseInt(days as string);

      const stats = await auditService.getAuditStatistics({
        days: daysParsed
      });

      res.json(stats);
    } catch (error) {
      console.error("Error fetching audit statistics:", error);
      res.status(500).json({ message: "Failed to fetch audit statistics" });
    }
  });

  // Get audit activity timeline
  app.get('/api/audit/timeline', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { 
        entityType, 
        entityId, 
        userId,
        hours = '24',
        groupBy = 'hour'
      } = req.query;

      const timeline = await auditService.getAuditTimeline({
        entityType: entityType as string,
        entityId: entityId as string,
        userId: userId as string,
        hours: parseInt(hours as string),
        groupBy: groupBy as 'hour' | 'day' | 'week'
      });

      res.json(timeline);
    } catch (error) {
      console.error("Error fetching audit timeline:", error);
      res.status(500).json({ message: "Failed to fetch audit timeline" });
    }
  });

  // Get audit logs for specific entity
  app.get('/api/audit/entity/:type/:id', isAuthenticated, async (req, res) => {
    try {
      const { type, id } = req.params;
      const { limit = '50', offset = '0' } = req.query;

      const entityLogs = await auditService.getEntityAuditTrail(
        type,
        id,
        {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );

      res.json(entityLogs);
    } catch (error) {
      console.error("Error fetching entity audit trail:", error);
      res.status(500).json({ message: "Failed to fetch entity audit trail" });
    }
  });

  // Get user activity audit logs
  app.get('/api/audit/users/:userId/activity', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { userId } = req.params;
      const { 
        dateFrom, 
        dateTo, 
        operationType,
        limit = '100', 
        offset = '0' 
      } = req.query;

      const userActivity = await auditService.getUserActivity(userId, {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        operationType: operationType as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json(userActivity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // Search audit logs with advanced text search
  app.post('/api/audit/search', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const searchSchema = z.object({
        query: z.string(),
        filters: z.object({
          entityTypes: z.array(z.string()).optional(),
          actions: z.array(z.string()).optional(),
          userIds: z.array(z.string()).optional(),
          operationTypes: z.array(z.string()).optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          severity: z.array(z.string()).optional()
        }).optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
        includeMetadata: z.boolean().default(true),
        highlightMatches: z.boolean().default(true)
      });

      const searchParams = searchSchema.parse(req.body);
      
      const searchResults = await auditService.searchAuditLogs(
        searchParams.query,
        {
          ...searchParams.filters,
          dateFrom: searchParams.filters?.dateFrom ? new Date(searchParams.filters.dateFrom) : undefined,
          dateTo: searchParams.filters?.dateTo ? new Date(searchParams.filters.dateTo) : undefined,
        },
        {
          limit: searchParams.limit,
          offset: searchParams.offset,
          includeMetadata: searchParams.includeMetadata,
          highlightMatches: searchParams.highlightMatches
        }
      );

      res.json(searchResults);
    } catch (error) {
      console.error("Error searching audit logs:", error);
      res.status(500).json({ 
        message: "Failed to search audit logs",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Export audit logs
  app.post('/api/audit/export', requireRole(['admin']), async (req, res) => {
    try {
      const exportSchema = z.object({
        format: z.enum(['csv', 'json', 'xlsx']),
        filters: z.object({
          entityType: z.string().optional(),
          entityId: z.string().optional(),
          action: z.string().optional(),
          userId: z.string().optional(),
          operationType: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          severity: z.string().optional()
        }).optional(),
        includeMetadata: z.boolean().default(false),
        maxRecords: z.number().default(10000)
      });

      const exportParams = exportSchema.parse(req.body);
      const auditContext = auditService.extractRequestContext(req);

      // Log the export operation for audit purposes
      await auditService.logOperation(auditContext, {
        entityType: 'audit_export',
        action: 'create',
        description: `Audit log export requested - format: ${exportParams.format}`,
        businessContext: `Data export: ${exportParams.maxRecords} max records`,
        operationType: 'data_export',
        exportParams: exportParams.filters
      });

      const exportData = await auditService.exportAuditLogs(
        {
          ...exportParams.filters,
          dateFrom: exportParams.filters?.dateFrom ? new Date(exportParams.filters.dateFrom) : undefined,
          dateTo: exportParams.filters?.dateTo ? new Date(exportParams.filters.dateTo) : undefined,
        },
        {
          format: exportParams.format,
          includeMetadata: exportParams.includeMetadata,
          maxRecords: exportParams.maxRecords
        }
      );

      // Set appropriate headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit_logs_${timestamp}.${exportParams.format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      if (exportParams.format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.json(exportData);
      } else if (exportParams.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.send(exportData);
      } else if (exportParams.format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(exportData);
      }
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      res.status(500).json({ 
        message: "Failed to export audit logs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get audit integrity verification report
  app.get('/api/audit/integrity/verify', requireRole(['admin']), async (req, res) => {
    try {
      const { 
        startDate,
        endDate,
        sampleSize = '100',
        fullVerification = 'false'
      } = req.query;

      const auditContext = auditService.extractRequestContext(req);
      
      // Log the integrity verification request
      await auditService.logOperation(auditContext, {
        entityType: 'audit_integrity',
        action: 'view',
        description: 'Audit integrity verification requested',
        businessContext: `Verification: ${fullVerification === 'true' ? 'Full' : 'Sample'} - ${sampleSize} records`,
        operationType: 'audit_verification'
      });

      const verificationReport = await auditService.verifyAuditIntegrity({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sampleSize: parseInt(sampleSize as string),
        fullVerification: fullVerification === 'true'
      });

      res.json(verificationReport);
    } catch (error) {
      console.error("Error verifying audit integrity:", error);
      res.status(500).json({ message: "Failed to verify audit integrity" });
    }
  });

  // Get operational audit insights (analytics)
  app.get('/api/audit/insights', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { 
        timeframe = '30',
        operationType,
        includeAnomalies = 'true',
        includePatterns = 'true'
      } = req.query;

      const insights = await auditService.getOperationalInsights({
        timeframeDays: parseInt(timeframe as string),
        operationType: operationType as string,
        includeAnomalies: includeAnomalies === 'true',
        includePatterns: includePatterns === 'true'
      });

      res.json(insights);
    } catch (error) {
      console.error("Error fetching audit insights:", error);
      res.status(500).json({ message: "Failed to fetch audit insights" });
    }
  });

  // Get approval-related audit logs
  app.get('/api/audit/approvals/:approvalId', isAuthenticated, async (req, res) => {
    try {
      const { approvalId } = req.params;

      const approvalAuditLogs = await auditService.getApprovalAuditTrail(approvalId);

      res.json(approvalAuditLogs);
    } catch (error) {
      console.error("Error fetching approval audit trail:", error);
      res.status(500).json({ message: "Failed to fetch approval audit trail" });
    }
  });

  // Real-time audit monitoring endpoint (for system monitoring)
  app.get('/api/audit/monitoring/health', requireRole(['admin']), async (req, res) => {
    try {
      const healthStatus = await auditService.getSystemHealthStatus();
      res.json(healthStatus);
    } catch (error) {
      console.error("Error fetching audit system health:", error);
      res.status(500).json({ message: "Failed to fetch audit system health" });
    }
  });

  // Settings routes
  app.get('/api/settings', requireRole(['admin', 'finance', 'purchasing', 'sales', 'warehouse']), async (req, res) => {
    try {
      const exchangeRate = await storage.getExchangeRate();
      const preventNegativeSetting = await storage.getSetting('PREVENT_NEGATIVE_BALANCE');
      const preventNegativeBalance = preventNegativeSetting?.value === 'true';
      
      res.json({ 
        exchangeRate,
        preventNegativeBalance 
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/settings', requireRole(['admin']), async (req, res) => {
    try {
      const setting = insertSettingSchema.parse(req.body);
      const result = await storage.setSetting(setting);
      res.json(result);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Capital routes
  app.get('/api/capital/entries', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const entries = await storage.getCapitalEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching capital entries:", error);
      res.status(500).json({ message: "Failed to fetch capital entries" });
    }
  });

  app.get('/api/capital/balance', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const balance = await storage.getCapitalBalance();
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching capital balance:", error);
      res.status(500).json({ message: "Failed to fetch capital balance" });
    }
  });

  app.post('/api/capital/entries', requireRole(['admin', 'finance']), approvalMiddleware.capitalEntry, capitalEntryPeriodGuard, async (req: any, res) => {
    try {
      const entryData = insertCapitalEntrySchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });
      
      // Require exchangeRate for non-USD entries
      if (entryData.paymentCurrency !== 'USD' && (!entryData.exchangeRate || entryData.exchangeRate === '0')) {
        return res.status(400).json({ 
          message: "Exchange rate is required for non-USD currencies",
          field: "exchangeRate"
        });
      }
      
      // Convert amount to USD for capital tracking normalization
      const entryAmount = new Decimal(entryData.amount);
      let amountInUsd = entryAmount;
      if (entryData.paymentCurrency === 'ETB' && entryData.exchangeRate) {
        amountInUsd = entryAmount.div(new Decimal(entryData.exchangeRate));
      }
      
      // Store USD amount with original paymentCurrency and exchangeRate as metadata
      // Use concurrency protection to prevent race conditions  
      const entry = await storage.createCapitalEntryWithConcurrencyProtection({
        ...entryData,
        amount: amountInUsd.toFixed(2), // Store normalized USD amount for accurate balance calculation
      });
      res.json(entry);
    } catch (error) {
      console.error("Error creating capital entry:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to create capital entry" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', requireRole(['admin', 'purchasing', 'warehouse']), async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', requireRole(['admin', 'purchasing']), approvalMiddleware.warehouseOperation, genericPeriodGuard, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.get('/api/suppliers/:id', requireRole(['admin', 'purchasing']), async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Order routes
  app.get('/api/orders', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', requireRole(['admin', 'sales']), approvalMiddleware.saleOrder, genericPeriodGuard, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Purchase routes
  app.get('/api/purchases', requireRole(['admin', 'purchasing']), async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post('/api/purchases', requireRole(['admin', 'purchasing']), approvalMiddleware.purchase, purchasePeriodGuard, async (req: any, res) => {
    try {
      const purchaseData = insertPurchaseSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      // Additional validation: ensure exchange rate is provided for non-USD currencies
      if (purchaseData.currency !== 'USD' && (!purchaseData.exchangeRate || purchaseData.exchangeRate === '0')) {
        return res.status(400).json({ 
          message: "Exchange rate is required for non-USD currencies",
          field: "exchangeRate"
        });
      }

      // Calculate total and remaining using decimal-safe math
      const weight = new Decimal(purchaseData.weight);
      const pricePerKg = new Decimal(purchaseData.pricePerKg);
      const amountPaid = new Decimal(purchaseData.amountPaid || '0');
      
      const total = weight.mul(pricePerKg);
      const remaining = total.sub(amountPaid);

      // Use atomic transaction with retry logic to create purchase with all side effects
      const purchase = await storage.createPurchaseWithSideEffectsRetryable({
        ...purchaseData,
        total: total.toFixed(2),
        remaining: remaining.toFixed(2),
      }, req.user.claims.sub);

      res.json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }

      // Handle specific business logic errors from the transaction
      if (error instanceof Error && error.message.includes('Would result in negative balance')) {
        return res.status(400).json({
          message: error.message,
          field: "fundingSource",
          suggestion: "Use external funding or add more capital"
        });
      }
      
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Warehouse routes
  app.get('/api/warehouse/stock', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      let stock;
      
      // Support query filtering
      const queryParams = req.query;
      if (Object.keys(queryParams).length > 0) {
        const filterParams = warehouseStockFilterSchema.parse(queryParams);
        
        if (filterParams.status && filterParams.warehouse) {
          // This combination would need a new storage method, for now get by status
          stock = await storage.getWarehouseStockByStatus(filterParams.status);
        } else if (filterParams.status) {
          stock = await storage.getWarehouseStockByStatus(filterParams.status);
        } else if (filterParams.warehouse) {
          stock = await storage.getWarehouseStockByWarehouse(filterParams.warehouse);
        } else {
          stock = await storage.getWarehouseStock();
        }
      } else {
        stock = await storage.getWarehouseStock();
      }
      
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to fetch warehouse stock" });
    }
  });

  app.get('/api/warehouse/stock/status/:status', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stock = await storage.getWarehouseStockByStatus(req.params.status);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock by status:", error);
      res.status(500).json({ message: "Failed to fetch warehouse stock" });
    }
  });

  app.get('/api/warehouse/stock/warehouse/:warehouse', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stock = await storage.getWarehouseStockByWarehouse(req.params.warehouse);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching warehouse stock by warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse stock" });
    }
  });

  app.patch('/api/warehouse/stock/:id', requireRole(['admin', 'warehouse']), approvalMiddleware.warehouseOperation, warehousePeriodGuard, async (req, res) => {
    try {
      const stockData = req.body;
      const stock = await storage.updateWarehouseStock(req.params.id, stockData);
      res.json(stock);
    } catch (error) {
      console.error("Error updating warehouse stock:", error);
      res.status(500).json({ message: "Failed to update warehouse stock" });
    }
  });

  app.patch('/api/warehouse/stock/:id/status', requireRole(['admin', 'warehouse']), approvalMiddleware.warehouseOperation, warehousePeriodGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Stock ID is required" });
      }

      const statusData = warehouseStatusUpdateSchema.parse(req.body);
      const stock = await storage.updateWarehouseStockStatus(id, statusData.status, req.user.claims.sub);
      
      res.json(stock);
    } catch (error) {
      console.error("Error updating warehouse stock status:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid status data",
          errors: error.errors
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update warehouse stock status" });
    }
  });

  app.post('/api/warehouse/filter', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const filterData = warehouseFilterOperationSchema.parse(req.body);
      
      const result = await storage.executeFilterOperation(
        filterData.purchaseId, 
        filterData.outputCleanKg, 
        filterData.outputNonCleanKg, 
        req.user.claims.sub
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error executing filter operation:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid filter operation data",
          errors: error.errors
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to execute filter operation" });
    }
  });

  app.post('/api/warehouse/move-to-final', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const moveData = warehouseMoveToFinalSchema.parse(req.body);
      
      const finalStock = await storage.moveStockToFinalWarehouse(moveData.stockId, req.user.claims.sub);
      res.json(finalStock);
    } catch (error) {
      console.error("Error moving stock to final warehouse:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid move operation data",
          errors: error.errors
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to move stock to final warehouse" });
    }
  });

  // Filter routes
  app.get('/api/filters', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filters = await storage.getFilterRecords();
      res.json(filters);
    } catch (error) {
      console.error("Error fetching filter records:", error);
      res.status(500).json({ message: "Failed to fetch filter records" });
    }
  });

  app.post('/api/filters', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const filterData = insertFilterRecordSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      // Calculate filter yield
      const filterYield = (parseFloat(filterData.outputCleanKg) / parseFloat(filterData.inputKg)) * 100;

      const filter = await storage.createFilterRecord({
        ...filterData,
        filterYield: filterYield.toString(),
      });

      res.json(filter);
    } catch (error) {
      console.error("Error creating filter record:", error);
      res.status(500).json({ message: "Failed to create filter record" });
    }
  });


  // REPORTING ENDPOINTS - All with proper RBAC and USD normalization

  // Financial Summary Endpoint
  app.get('/api/reports/financial/summary', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const filters = dateRangeFilterSchema.parse(req.query);
      const summary = await storage.getFinancialSummary(filters);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  // Cash Flow Analysis Endpoint
  app.get('/api/reports/financial/cashflow', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { period } = periodFilterSchema.parse(req.query);
      const cashFlow = await storage.getCashflowAnalysis(period);
      res.json(cashFlow);
    } catch (error) {
      console.error("Error fetching cash flow analysis:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to fetch cash flow analysis" });
    }
  });

  // Inventory Analytics Endpoint
  app.get('/api/reports/inventory/analytics', requireRole(['admin', 'finance', 'warehouse']), async (req, res) => {
    try {
      const analytics = await storage.getInventoryAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching inventory analytics:", error);
      res.status(500).json({ message: "Failed to fetch inventory analytics" });
    }
  });

  // Supplier Performance Endpoint
  app.get('/api/reports/suppliers/performance', requireRole(['admin', 'finance', 'purchasing']), async (req, res) => {
    try {
      const performance = await storage.getSupplierPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching supplier performance:", error);
      res.status(500).json({ message: "Failed to fetch supplier performance" });
    }
  });

  // Trading Activity Endpoint
  app.get('/api/reports/trading/activity', requireRole(['admin', 'finance', 'sales']), async (req, res) => {
    try {
      const activity = await storage.getTradingActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching trading activity:", error);
      res.status(500).json({ message: "Failed to fetch trading activity" });
    }
  });

  // ===== COMPREHENSIVE FINANCIAL REPORTING ENDPOINTS =====

  // Financial Periods Management
  app.get('/api/financial/periods', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const filters = financialPeriodFilterSchema.parse(req.query);
      const periods = await storage.getFinancialPeriods(filters.status);
      res.json(periods);
    } catch (error) {
      console.error("Error fetching financial periods:", error);
      res.status(500).json({ message: "Failed to fetch financial periods" });
    }
  });

  app.get('/api/financial/periods/current', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const currentPeriod = await storage.getCurrentFinancialPeriod();
      res.json(currentPeriod);
    } catch (error) {
      console.error("Error fetching current financial period:", error);
      res.status(500).json({ message: "Failed to fetch current financial period" });
    }
  });

  app.post('/api/financial/periods', requireRole(['admin']), async (req: any, res) => {
    try {
      const periodData = insertFinancialPeriodSchema.parse(req.body);
      const period = await storage.createFinancialPeriod(periodData);
      res.json(period);
    } catch (error) {
      console.error("Error creating financial period:", error);
      res.status(500).json({ message: "Failed to create financial period" });
    }
  });

  app.post('/api/financial/periods/:id/close', requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { exchangeRates } = req.body;
      const closedPeriod = await storage.closeFinancialPeriod(id, userId, exchangeRates);
      res.json(closedPeriod);
    } catch (error) {
      console.error("Error closing financial period:", error);
      res.status(500).json({ message: "Failed to close financial period" });
    }
  });

  // Advanced Financial Metrics & KPIs
  app.get('/api/financial/kpis', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const kpiData = await storage.getKpiDashboardData(periodId as string);
      res.json(kpiData);
    } catch (error) {
      console.error("Error fetching KPI dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch KPI dashboard data" });
    }
  });

  app.get('/api/financial/metrics', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const filters = dateRangeFilterSchema.parse(req.query);
      const metrics = await storage.getFinancialMetrics(periodId as string, filters);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching financial metrics:", error);
      res.status(500).json({ message: "Failed to fetch financial metrics" });
    }
  });

  app.post('/api/financial/metrics/calculate', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { periodId } = req.body;
      const userId = req.user.claims.sub;
      const metrics = await storage.calculateAndStoreFinancialMetrics(periodId, userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating financial metrics:", error);
      res.status(500).json({ message: "Failed to calculate financial metrics" });
    }
  });

  // Comprehensive Profit & Loss Analysis
  app.get('/api/financial/profit-loss', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId, statementType } = req.query;
      const statements = await storage.getProfitLossStatements(periodId as string, statementType as string);
      res.json(statements);
    } catch (error) {
      console.error("Error fetching P&L statements:", error);
      res.status(500).json({ message: "Failed to fetch P&L statements" });
    }
  });

  app.post('/api/financial/profit-loss/generate', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { periodId, statementType } = req.body;
      const userId = req.user.claims.sub;
      const statement = await storage.generateProfitLossStatement(periodId, statementType, userId);
      res.json(statement);
    } catch (error) {
      console.error("Error generating P&L statement:", error);
      res.status(500).json({ message: "Failed to generate P&L statement" });
    }
  });

  app.get('/api/financial/profit-loss/analysis', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId, comparisonPeriodId } = req.query;
      const analysis = await storage.getDetailedPLAnalysis(periodId as string, comparisonPeriodId as string);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching detailed P&L analysis:", error);
      res.status(500).json({ message: "Failed to fetch detailed P&L analysis" });
    }
  });

  // Advanced Cash Flow Analysis
  app.get('/api/financial/cashflow/advanced', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const request = cashFlowAnalysisRequestSchema.parse(req.query);
      const analyses = await storage.getCashFlowAnalyses(request.periodId, request.analysisType);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching advanced cash flow analyses:", error);
      res.status(500).json({ message: "Failed to fetch advanced cash flow analyses" });
    }
  });

  app.post('/api/financial/cashflow/generate', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { periodId, analysisType, forecastDays } = req.body;
      const userId = req.user.claims.sub;
      const analysis = await storage.generateCashFlowAnalysis(periodId, analysisType, userId, forecastDays);
      res.json(analysis);
    } catch (error) {
      console.error("Error generating cash flow analysis:", error);
      res.status(500).json({ message: "Failed to generate cash flow analysis" });
    }
  });

  app.get('/api/financial/cashflow/forecast', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const forecast = await storage.getCashFlowForecast(Number(days));
      res.json(forecast);
    } catch (error) {
      console.error("Error fetching cash flow forecast:", error);
      res.status(500).json({ message: "Failed to fetch cash flow forecast" });
    }
  });

  app.get('/api/financial/working-capital', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const analysis = await storage.getWorkingCapitalAnalysis();
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching working capital analysis:", error);
      res.status(500).json({ message: "Failed to fetch working capital analysis" });
    }
  });

  // Comprehensive Margin Analysis
  app.get('/api/financial/margins', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const request = marginAnalysisRequestSchema.parse(req.query);
      const analyses = await storage.getMarginAnalyses(request.periodId, request.analysisType, request.filters);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching margin analyses:", error);
      res.status(500).json({ message: "Failed to fetch margin analyses" });
    }
  });

  app.post('/api/financial/margins/generate', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { periodId, analysisType, filters } = req.body;
      const userId = req.user.claims.sub;
      const analyses = await storage.generateMarginAnalysis(periodId, analysisType, filters, userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error generating margin analysis:", error);
      res.status(500).json({ message: "Failed to generate margin analysis" });
    }
  });

  app.get('/api/financial/margins/customers', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const analysis = await storage.getCustomerProfitabilityAnalysis(periodId as string);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching customer profitability analysis:", error);
      res.status(500).json({ message: "Failed to fetch customer profitability analysis" });
    }
  });

  app.get('/api/financial/margins/products', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const analysis = await storage.getProductMarginAnalysis(periodId as string);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching product margin analysis:", error);
      res.status(500).json({ message: "Failed to fetch product margin analysis" });
    }
  });

  app.get('/api/financial/margins/transactions', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId, minMargin } = req.query;
      const analysis = await storage.getTransactionMarginAnalysis(
        periodId as string, 
        minMargin ? Number(minMargin) : undefined
      );
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching transaction margin analysis:", error);
      res.status(500).json({ message: "Failed to fetch transaction margin analysis" });
    }
  });

  // Budget Tracking & Variance Analysis
  app.get('/api/financial/budget', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const request = budgetTrackingRequestSchema.parse(req.query);
      const budgets = await storage.getBudgetTrackings(request.periodId, request.category);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budget tracking:", error);
      res.status(500).json({ message: "Failed to fetch budget tracking" });
    }
  });

  app.post('/api/financial/budget', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const budgetData = insertBudgetTrackingSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub
      });
      const budget = await storage.createBudgetTracking(budgetData);
      res.json(budget);
    } catch (error) {
      console.error("Error creating budget tracking:", error);
      res.status(500).json({ message: "Failed to create budget tracking" });
    }
  });

  app.get('/api/financial/budget/variance', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const analysis = await storage.getBudgetVsActualAnalysis(periodId as string);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching budget variance analysis:", error);
      res.status(500).json({ message: "Failed to fetch budget variance analysis" });
    }
  });

  // Advanced Financial Calculations
  app.get('/api/financial/breakeven', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const analysis = await storage.calculateBreakEvenAnalysis(periodId as string);
      res.json(analysis);
    } catch (error) {
      console.error("Error calculating break-even analysis:", error);
      res.status(500).json({ message: "Failed to calculate break-even analysis" });
    }
  });

  app.get('/api/financial/roi', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const analysis = await storage.calculateROIAnalysis(periodId as string);
      res.json(analysis);
    } catch (error) {
      console.error("Error calculating ROI analysis:", error);
      res.status(500).json({ message: "Failed to calculate ROI analysis" });
    }
  });

  app.get('/api/financial/ratios', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const ratios = await storage.calculateFinancialRatios(periodId as string);
      res.json(ratios);
    } catch (error) {
      console.error("Error calculating financial ratios:", error);
      res.status(500).json({ message: "Failed to calculate financial ratios" });
    }
  });

  // Financial Forecasting & Predictive Analytics
  app.get('/api/financial/forecast', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId, forecastPeriods = 4 } = req.query;
      const forecast = await storage.generateFinancialForecast(periodId as string, Number(forecastPeriods));
      res.json(forecast);
    } catch (error) {
      console.error("Error generating financial forecast:", error);
      res.status(500).json({ message: "Failed to generate financial forecast" });
    }
  });

  // Currency Analysis
  app.get('/api/financial/currency-exposure', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const analysis = await storage.getCurrencyExposureAnalysis(periodId as string);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching currency exposure analysis:", error);
      res.status(500).json({ message: "Failed to fetch currency exposure analysis" });
    }
  });

  // Financial Data Validation
  app.post('/api/financial/validate', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.body;
      const validation = await storage.validateFinancialData(periodId);
      res.json(validation);
    } catch (error) {
      console.error("Error validating financial data:", error);
      res.status(500).json({ message: "Failed to validate financial data" });
    }
  });

  // Executive Financial Summary
  app.get('/api/financial/executive-summary', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { periodId } = req.query;
      const summary = await storage.generateExecutiveFinancialSummary(periodId as string);
      res.json(summary);
    } catch (error) {
      console.error("Error generating executive financial summary:", error);
      res.status(500).json({ message: "Failed to generate executive financial summary" });
    }
  });

  // Enhanced Export Endpoint with proper USD normalization
  app.get('/api/reports/export/:type', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { type } = req.params;
      const { format = 'json' } = exportTypeSchema.parse({ type, format: req.query.format });
      
      const data = await storage.exportReportData(type, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
        res.send(data);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.json`);
        res.json(data);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      if (error instanceof Error && error.message.includes('Unsupported report type')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  // AI Routes - Business Process Automation
  app.post('/api/ai/purchase-recommendations', requireRole(['admin', 'purchasing']), async (req: any, res) => {
    try {
      const requestData = aiPurchaseRecommendationRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      // Create cache key
      const cacheKey = `purchase_recommendations_${crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex')}`;
      
      // Check cache first
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      // Fetch business data
      const purchases = await storage.getPurchases();
      const capitalBalance = await storage.getCapitalBalance();
      
      // Generate AI recommendations
      const result = await aiService.getPurchaseRecommendations(
        purchases,
        requestData.marketConditions || {},
        capitalBalance
      );
      
      // Cache result for 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'purchase_recommendations',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ purchases, capitalBalance })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating purchase recommendations:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate purchase recommendations" 
      });
    }
  });

  app.post('/api/ai/supplier-recommendations', requireRole(['admin', 'purchasing']), async (req: any, res) => {
    try {
      const requestData = aiSupplierRecommendationRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const cacheKey = `supplier_recommendations_${crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex')}`;
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const suppliers = await storage.getSuppliers();
      const supplierPerformance = await storage.getSupplierPerformance();
      
      const result = await aiService.getSupplierRecommendations(
        suppliers,
        supplierPerformance,
        requestData
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'supplier_recommendations',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ suppliers, supplierPerformance })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating supplier recommendations:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate supplier recommendations" 
      });
    }
  });

  app.post('/api/ai/capital-optimization', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const requestData = aiCapitalOptimizationRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const cacheKey = `capital_optimization_${crypto.createHash('md5').update(JSON.stringify(requestData)).digest('hex')}`;
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const capitalEntries = await storage.getCapitalEntries();
      const financialSummary = await storage.getFinancialSummary();
      const purchases = await storage.getPurchases();
      
      // Get upcoming payments (outstanding balances)
      const upcomingPayments = purchases
        .filter(p => parseFloat(p.remaining) > 0)
        .map(p => ({
          id: p.id,
          amount: parseFloat(p.remaining),
          supplier: p.supplierId,
          dueDate: p.date
        }));
      
      const result = await aiService.getCapitalOptimizationSuggestions(
        capitalEntries,
        financialSummary,
        upcomingPayments
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'capital_optimization',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ capitalEntries, financialSummary })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating capital optimization:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate capital optimization suggestions" 
      });
    }
  });

  app.get('/api/ai/inventory-recommendations', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'inventory_recommendations_current';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const warehouseStock = await storage.getWarehouseStock();
      const filterRecords = await storage.getFilterRecords();
      const inventoryAnalytics = await storage.getInventoryAnalytics();
      
      const result = await aiService.getInventoryRecommendations(
        warehouseStock,
        filterRecords,
        inventoryAnalytics
      );
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes cache
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'inventory_recommendations',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ warehouseStock, inventoryAnalytics })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating inventory recommendations:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate inventory recommendations" 
      });
    }
  });

  // AI Routes - Financial Insights
  app.get('/api/ai/financial-trends', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'financial_trends_analysis';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const financialSummary = await storage.getFinancialSummary();
      const cashFlow = await storage.getCashflowAnalysis('last-90-days');
      const purchases = await storage.getPurchases();
      
      // Prepare historical data
      const historicalData = {
        cashFlow,
        purchases: purchases.slice(-20), // Last 20 purchases
        capitalEntries: await storage.getCapitalEntries()
      };
      
      const result = await aiService.getFinancialTrendAnalysis(
        financialSummary,
        [historicalData]
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 6);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'financial_trends',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ financialSummary, historicalData })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating financial trend analysis:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate financial trend analysis" 
      });
    }
  });

  // AI Routes - Trading Decision Support
  app.get('/api/ai/market-timing', requireRole(['admin', 'purchasing', 'sales']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'market_timing_analysis';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const purchases = await storage.getPurchases();
      const warehouseStock = await storage.getWarehouseStock();
      
      // Calculate current inventory level
      const currentInventory = warehouseStock.reduce((total, stock) => {
        return total + parseFloat(stock.qtyKgTotal);
      }, 0);
      
      // Prepare market data from historical purchases
      const marketData = {
        averagePrice: purchases.reduce((sum, p) => sum + parseFloat(p.pricePerKg), 0) / purchases.length,
        recentTrend: purchases.slice(-10).map(p => ({
          date: p.date,
          price: parseFloat(p.pricePerKg),
          volume: parseFloat(p.weight)
        }))
      };
      
      const historicalPrices = purchases.map(p => ({
        date: p.date,
        pricePerKg: parseFloat(p.pricePerKg),
        currency: p.currency
      }));
      
      const result = await aiService.getMarketTimingAnalysis(
        marketData,
        historicalPrices,
        currentInventory
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'market_timing',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ marketData, historicalPrices })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating market timing analysis:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate market timing analysis" 
      });
    }
  });

  // AI Routes - Intelligent Reporting
  app.get('/api/ai/executive-summary', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'executive_summary_current';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      const [financialSummary, tradingActivity, inventoryAnalytics, supplierPerformance] = await Promise.all([
        storage.getFinancialSummary(),
        storage.getTradingActivity(),
        storage.getInventoryAnalytics(),
        storage.getSupplierPerformance()
      ]);
      
      const result = await aiService.generateExecutiveSummary(
        financialSummary,
        tradingActivity,
        inventoryAnalytics,
        supplierPerformance
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 12);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'executive_summary',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({
          financialSummary, tradingActivity, inventoryAnalytics, supplierPerformance
        })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating executive summary:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to generate executive summary" 
      });
    }
  });

  app.get('/api/ai/anomaly-detection', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const cacheKey = 'anomaly_detection_current';
      const cachedResult = await storage.getAiInsightsCache(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult.result);
      }
      
      // Get recent data (last 30 days) vs historical baseline (last 6 months)
      const allPurchases = await storage.getPurchases();
      const allCapitalEntries = await storage.getCapitalEntries();
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentData = {
        purchases: allPurchases.filter(p => new Date(p.date) >= thirtyDaysAgo),
        capitalEntries: allCapitalEntries.filter(c => new Date(c.date) >= thirtyDaysAgo)
      };
      
      const historicalBaseline = {
        purchases: allPurchases.filter(p => new Date(p.date) >= sixMonthsAgo && new Date(p.date) < thirtyDaysAgo),
        capitalEntries: allCapitalEntries.filter(c => new Date(c.date) >= sixMonthsAgo && new Date(c.date) < thirtyDaysAgo)
      };
      
      const result = await aiService.detectAnomalies(
        [recentData],
        [historicalBaseline]
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4);
      
      await storage.setAiInsightsCache({
        cacheKey,
        insightType: 'anomaly_detection',
        userId,
        dataHash: crypto.createHash('md5').update(JSON.stringify({ recentData, historicalBaseline })).digest('hex'),
        result,
        expiresAt,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to detect anomalies" 
      });
    }
  });

  // AI Chat Assistant
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const requestData = aiChatRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Generate session ID if not provided
      const sessionId = requestData.conversationId || `session_${userId}_${Date.now()}`;
      
      // Get conversation history
      let conversation = await storage.getAiConversation(sessionId, userId);
      const conversationHistory = conversation?.messages as Array<{ role: 'user' | 'assistant'; content: string }> || [];
      
      // Prepare business context
      const businessContext = {
        userRole: user?.role,
        recentActivity: {
          purchases: (await storage.getPurchases()).slice(-5),
          capitalBalance: await storage.getCapitalBalance(),
          warehouseStock: (await storage.getWarehouseStock()).slice(0, 10)
        },
        ...requestData.context
      };
      
      // Get AI response
      const result = await aiService.chatAssistant(
        requestData.message,
        conversationHistory,
        businessContext
      );
      
      // Update conversation history
      const updatedMessages = [
        ...conversationHistory,
        { role: 'user' as const, content: requestData.message },
        { role: 'assistant' as const, content: result.response }
      ];
      
      // Save conversation (keep last 20 messages)
      await storage.createOrUpdateAiConversation({
        sessionId,
        userId,
        messages: updatedMessages.slice(-20),
        context: businessContext
      });
      
      res.json({
        ...result,
        conversationId: sessionId
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to process chat request" 
      });
    }
  });

  // Contextual Help
  app.post('/api/ai/contextual-help', isAuthenticated, async (req: any, res) => {
    try {
      const requestData = aiContextualHelpRequestSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const result = await aiService.getContextualHelp(
        requestData.currentPage,
        user?.role || 'worker',
        requestData.currentData || {}
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error getting contextual help:", error);
      res.status(500).json({ 
        message: error.message.includes('OpenAI API key') 
          ? "AI service not configured. Please set OPENAI_API_KEY environment variable."
          : "Failed to get contextual help" 
      });
    }
  });

  // AI conversation history
  app.get('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const conversations = await storage.getRecentAiConversations(userId, limit);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching AI conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Clean up expired AI cache (can be called periodically)
  app.post('/api/ai/cleanup-cache', requireRole(['admin']), async (req, res) => {
    try {
      await storage.deleteExpiredInsightsCache();
      res.json({ message: "Cache cleanup completed" });
    } catch (error) {
      console.error("Error cleaning up AI cache:", error);
      res.status(500).json({ message: "Failed to cleanup cache" });
    }
  });

  // ======================================
  // WORKFLOW VALIDATION ENDPOINTS
  // ======================================

  // Initiate workflow validation against business document
  app.post('/api/ai/validate-workflow', requireRole(['admin']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Basic rate limiting: check if validation was run recently
      const recentValidation = await storage.getLatestWorkflowValidation(userId);
      if (recentValidation) {
        const timeSinceLastValidation = new Date().getTime() - new Date(recentValidation.createdAt).getTime();
        const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
        
        if (timeSinceLastValidation < cooldownPeriod) {
          return res.status(429).json({
            message: 'Validation was run recently. Please wait before running again.',
            nextAllowedTime: new Date(new Date(recentValidation.createdAt).getTime() + cooldownPeriod).toISOString()
          });
        }
      }

      console.log(`Starting workflow validation for user ${userId}`);
      
      // Generate hashes for caching
      const documentPath = 'attached_assets/workflu_1758260129381.docx';
      const documentHash = crypto.createHash('md5').update(documentPath + Date.now()).digest('hex');
      const systemSpecHash = crypto.createHash('md5').update(JSON.stringify({
        timestamp: Date.now(),
        version: '1.0'
      })).digest('hex');

      // Run the complete validation pipeline
      const gapReport = await aiService.validateWorkflowAgainstDocument();

      // Store validation results
      const validationResult = await storage.createWorkflowValidation({
        userId,
        documentPath,
        documentHash,
        systemSpecHash,
        overallStatus: gapReport.overallStatus,
        gapReport: gapReport,
        stageResults: gapReport.stages,
        summary: gapReport.summary,
        validationMetadata: {
          aiModel: 'gpt-5',
          processingTime: Date.now(),
          version: '1.0'
        }
      });

      // Also create export history entry for compliance tracking
      await storage.createExportRequest({
        userId,
        exportType: 'compliance_report',
        format: 'json',
        fileName: `workflow_validation_${Date.now()}.json`,
        parameters: {
          validationId: validationResult.id,
          documentPath,
          overallStatus: gapReport.overallStatus
        }
      });

      console.log(`Workflow validation completed for user ${userId}. Status: ${gapReport.overallStatus}`);
      
      res.json({
        validationId: validationResult.id,
        overallStatus: gapReport.overallStatus,
        summary: gapReport.summary,
        completedAt: validationResult.completedAt,
        stages: Object.keys(gapReport.stages),
        message: 'Workflow validation completed successfully'
      });
    } catch (error) {
      console.error("Error validating workflow:", error);
      
      if (error.message.includes('OpenAI API key')) {
        return res.status(500).json({
          message: "AI service not configured. Please set OPENAI_API_KEY environment variable."
        });
      }
      
      if (error.message.includes('Document appears to be empty')) {
        return res.status(400).json({
          message: "Business document is invalid or corrupted. Please check the document file."
        });
      }
      
      res.status(500).json({
        message: "Failed to validate workflow",
        error: error.message
      });
    }
  });

  // Get latest workflow validation results
  app.get('/api/ai/validation/latest', requireRole(['admin', 'finance', 'warehouse']), async (req: any, res) => {
    try {
      const userId = req.query.global === 'true' ? undefined : req.user.claims.sub;
      const validation = await storage.getLatestWorkflowValidation(userId);
      
      if (!validation) {
        return res.status(404).json({
          message: 'No validation results found. Please run a validation first.'
        });
      }

      res.json({
        validationId: validation.id,
        overallStatus: validation.overallStatus,
        gapReport: validation.gapReport,
        summary: validation.summary,
        createdAt: validation.createdAt,
        completedAt: validation.completedAt,
        documentPath: validation.documentPath,
        isLatest: validation.isLatest
      });
    } catch (error) {
      console.error("Error fetching latest validation:", error);
      res.status(500).json({ message: "Failed to fetch validation results" });
    }
  });

  // Get validation history
  app.get('/api/ai/validation/history', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const userId = req.query.userId as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const validations = await storage.getWorkflowValidations(userId, limit);
      
      res.json(validations.map(validation => ({
        validationId: validation.id,
        overallStatus: validation.overallStatus,
        summary: validation.summary,
        createdAt: validation.createdAt,
        completedAt: validation.completedAt,
        isLatest: validation.isLatest
      })));
    } catch (error) {
      console.error("Error fetching validation history:", error);
      res.status(500).json({ message: "Failed to fetch validation history" });
    }
  });

  // Export validation results
  app.post('/api/ai/validation/:id/export', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.body;
      const userId = req.user.claims.sub;
      
      const validations = await storage.getWorkflowValidations(undefined, 100);
      const validation = validations.find(v => v.id === id);
      
      if (!validation) {
        return res.status(404).json({ message: 'Validation not found' });
      }

      // Create export request
      const exportRequest = await storage.createExportRequest({
        userId,
        exportType: 'compliance_report',
        format,
        fileName: `validation_report_${id}.${format}`,
        parameters: {
          validationId: id,
          format,
          includeDetails: true
        }
      });

      // For immediate download, return the validation data
      if (format === 'json') {
        res.json({
          exportId: exportRequest.id,
          validationReport: {
            validationId: validation.id,
            overallStatus: validation.overallStatus,
            gapReport: validation.gapReport,
            summary: validation.summary,
            createdAt: validation.createdAt,
            completedAt: validation.completedAt,
            documentPath: validation.documentPath
          }
        });
      } else {
        res.json({
          exportId: exportRequest.id,
          message: `Export in ${format} format has been queued`,
          downloadUrl: `/api/exports/${exportRequest.id}/download`
        });
      }
    } catch (error) {
      console.error("Error exporting validation results:", error);
      res.status(500).json({ message: "Failed to export validation results" });
    }
  });

  // Initialize scheduler service
  const { schedulerService } = await import('./schedulerService');
  await schedulerService.initialize();

  // Export job management routes
  app.get('/api/export-jobs', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getExportJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching export jobs:", error);
      res.status(500).json({ message: "Failed to fetch export jobs" });
    }
  });

  app.post('/api/export-jobs', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobData = {
        ...req.body,
        userId
      };
      
      const validation = exportService.validateExportParams(jobData);
      if (!validation.valid) {
        return res.status(400).json({
          message: "Invalid export job parameters",
          errors: validation.errors
        });
      }

      const job = await schedulerService.createScheduledJob(jobData);
      res.json(job);
    } catch (error) {
      console.error("Error creating export job:", error);
      res.status(500).json({ message: "Failed to create export job" });
    }
  });

  app.patch('/api/export-jobs/:id', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertExportJobSchema.partial().parse(req.body);
      
      const job = await schedulerService.updateScheduledJob(id, updates);
      res.json(job);
    } catch (error) {
      console.error("Error updating export job:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to update export job" });
    }
  });

  app.delete('/api/export-jobs/:id', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      await schedulerService.deleteScheduledJob(id);
      res.json({ message: "Export job deleted successfully" });
    } catch (error) {
      console.error("Error deleting export job:", error);
      res.status(500).json({ message: "Failed to delete export job" });
    }
  });

  // Enhanced export routes with real file generation
  app.post('/api/exports', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exportParams = {
        ...req.body,
        userId
      };

      const validation = exportService.validateExportParams(exportParams);
      if (!validation.valid) {
        return res.status(400).json({
          message: "Invalid export parameters",
          errors: validation.errors
        });
      }

      const exportRecord = await exportService.createExport(exportParams);
      res.json(exportRecord);
    } catch (error) {
      console.error("Error creating export:", error);
      res.status(500).json({ message: "Failed to create export" });
    }
  });

  app.get('/api/exports/history', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const history = await storage.getExportHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching export history:", error);
      res.status(500).json({ message: "Failed to fetch export history" });
    }
  });

  app.get('/api/exports/download/:id', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const exportRecord = await storage.getExportJob(id);
      
      if (!exportRecord || !exportRecord.filePath) {
        return res.status(404).json({ message: "Export file not found" });
      }

      if (exportRecord.status !== 'completed') {
        return res.status(400).json({ 
          message: "Export is not ready for download",
          status: exportRecord.status
        });
      }

      // Increment download count
      await storage.incrementDownloadCount(id);

      // Set appropriate headers and send file
      res.download(exportRecord.filePath, exportRecord.fileName);
    } catch (error) {
      console.error("Error downloading export:", error);
      res.status(500).json({ message: "Failed to download export" });
    }
  });

  // Enhanced period management routes with compliance integration
  app.get('/api/periods', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const periods = await storage.getPeriods();
      res.json(periods);
    } catch (error) {
      console.error("Error fetching periods:", error);
      res.status(500).json({ message: "Failed to fetch periods" });
    }
  });

  app.post('/api/periods', requireRole(['admin']), async (req, res) => {
    try {
      const periodData = req.body;
      const period = await storage.createPeriod(periodData);
      res.json(period);
    } catch (error) {
      console.error("Error creating period:", error);
      res.status(500).json({ message: "Failed to create period" });
    }
  });

  app.post('/api/periods/:id/close', requireRole(['admin']), strictPeriodGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { adjustments, requireCompliance = true } = req.body;

      // Compliance validation - require successful AI validation before closing
      if (requireCompliance) {
        const latestValidation = await storage.getLatestWorkflowValidation(userId);
        
        if (!latestValidation) {
          return res.status(400).json({
            message: "Period closing requires compliance validation. Please run workflow validation first.",
            error: "COMPLIANCE_VALIDATION_REQUIRED"
          });
        }

        const validationAge = Date.now() - new Date(latestValidation.createdAt).getTime();
        const maxValidationAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (validationAge > maxValidationAge) {
          return res.status(400).json({
            message: "Compliance validation is outdated. Please run a fresh validation before closing the period.",
            error: "COMPLIANCE_VALIDATION_EXPIRED"
          });
        }

        if (latestValidation.overallStatus !== 'matched') {
          return res.status(400).json({
            message: `Period closing blocked due to compliance issues. Validation status: ${latestValidation.overallStatus}`,
            error: "COMPLIANCE_VALIDATION_FAILED",
            validationDetails: latestValidation.summary
          });
        }
      }

      // Close the period with enhanced audit logging
      const closedPeriod = await storage.closePeriodWithCompliance(id, userId, adjustments, {
        complianceValidationId: requireCompliance ? (await storage.getLatestWorkflowValidation(userId))?.id : null,
        aiValidationStatus: requireCompliance ? 'passed' : 'skipped'
      });

      res.json(closedPeriod);
    } catch (error) {
      console.error("Error closing period:", error);
      res.status(500).json({ message: "Failed to close period" });
    }
  });

  app.post('/api/periods/:id/reopen', requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Reason is required for reopening a period" });
      }

      const reopenedPeriod = await storage.reopenPeriodWithAudit(id, userId, reason);
      res.json(reopenedPeriod);
    } catch (error) {
      console.error("Error reopening period:", error);
      res.status(500).json({ message: "Failed to reopen period" });
    }
  });

  app.get('/api/periods/:id/logs', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const logs = await storage.getPeriodClosingLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching period logs:", error);
      res.status(500).json({ message: "Failed to fetch period logs" });
    }
  });

  app.get('/api/periods/:id/adjustments', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const adjustments = await storage.getPeriodAdjustments(id);
      res.json(adjustments);
    } catch (error) {
      console.error("Error fetching period adjustments:", error);
      res.status(500).json({ message: "Failed to fetch period adjustments" });
    }
  });

  app.post('/api/periods/:id/adjustments/:adjustmentId/approve', requireRole(['admin']), async (req: any, res) => {
    try {
      const { adjustmentId } = req.params;
      const userId = req.user.claims.sub;
      
      const approvedAdjustment = await storage.approvePeriodAdjustment(adjustmentId, userId);
      res.json(approvedAdjustment);
    } catch (error) {
      console.error("Error approving period adjustment:", error);
      res.status(500).json({ message: "Failed to approve period adjustment" });
    }
  });

  // Scheduler status route
  app.get('/api/scheduler/status', requireRole(['admin']), async (req, res) => {
    try {
      const status = schedulerService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching scheduler status:", error);
      res.status(500).json({ message: "Failed to fetch scheduler status" });
    }
  });

  // Shipping and Logistics Routes
  
  // Carrier management routes
  app.get('/api/carriers', requireRole(['admin', 'warehouse', 'sales']), async (req, res) => {
    try {
      const filter = carrierFilterSchema.parse(req.query);
      const carriers = await storage.getCarriers(filter);
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ message: "Failed to fetch carriers" });
    }
  });

  app.get('/api/carriers/:id', requireRole(['admin', 'warehouse', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      const carrier = await storage.getCarrier(id);
      if (!carrier) {
        return res.status(404).json({ message: "Carrier not found" });
      }
      res.json(carrier);
    } catch (error) {
      console.error("Error fetching carrier:", error);
      res.status(500).json({ message: "Failed to fetch carrier" });
    }
  });

  app.post('/api/carriers', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const carrierData = insertCarrierSchema.parse(req.body);
      const carrier = await storage.createCarrier(carrierData);
      res.status(201).json(carrier);
    } catch (error) {
      console.error("Error creating carrier:", error);
      res.status(500).json({ message: "Failed to create carrier" });
    }
  });

  app.patch('/api/carriers/:id', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertCarrierSchema.partial().parse(req.body);
      const carrier = await storage.updateCarrier(id, updates);
      res.json(carrier);
    } catch (error) {
      console.error("Error updating carrier:", error);
      res.status(500).json({ message: "Failed to update carrier" });
    }
  });

  app.delete('/api/carriers/:id', requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCarrier(id);
      res.json({ message: "Carrier deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating carrier:", error);
      res.status(500).json({ message: "Failed to deactivate carrier" });
    }
  });

  app.patch('/api/carriers/:id/rating', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = z.object({ rating: z.number().min(0).max(5) }).parse(req.body);
      const carrier = await storage.updateCarrierRating(id, rating);
      res.json(carrier);
    } catch (error) {
      console.error("Error updating carrier rating:", error);
      res.status(500).json({ message: "Failed to update carrier rating" });
    }
  });

  // Shipment management routes
  app.get('/api/shipments', requireRole(['admin', 'warehouse', 'sales']), async (req, res) => {
    try {
      const filter = shipmentFilterSchema.parse(req.query);
      const shipments = await storage.getShipments(filter);
      res.json(shipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ message: "Failed to fetch shipments" });
    }
  });

  app.get('/api/shipments/:id', requireRole(['admin', 'warehouse', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      const shipment = await storage.getShipmentWithDetails(id);
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Error fetching shipment:", error);
      res.status(500).json({ message: "Failed to fetch shipment" });
    }
  });

  app.post('/api/shipments', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const shipmentData = insertShipmentSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const shipment = await storage.createShipment({ ...shipmentData, createdBy: userId });
      res.status(201).json(shipment);
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ message: "Failed to create shipment" });
    }
  });

  app.post('/api/shipments/from-stock', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const shipmentData = createShipmentFromStockSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const shipment = await storage.createShipmentFromWarehouseStock(shipmentData, userId);
      res.status(201).json(shipment);
    } catch (error) {
      console.error("Error creating shipment from stock:", error);
      res.status(500).json({ message: "Failed to create shipment from stock" });
    }
  });

  app.patch('/api/shipments/:id', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertShipmentSchema.partial().parse(req.body);
      const shipment = await storage.updateShipment(id, updates);
      res.json(shipment);
    } catch (error) {
      console.error("Error updating shipment:", error);
      res.status(500).json({ message: "Failed to update shipment" });
    }
  });

  app.patch('/api/shipments/:id/status', requireRole(['admin', 'warehouse']), genericPeriodGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, actualDepartureDate, actualArrivalDate } = shipmentStatusUpdateSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      let actualDate: Date | undefined;
      if (status === 'in_transit' && actualDepartureDate) {
        actualDate = new Date(actualDepartureDate);
      } else if (status === 'delivered' && actualArrivalDate) {
        actualDate = new Date(actualArrivalDate);
      }
      
      const shipment = await storage.updateShipmentStatus(id, status, userId, actualDate);
      res.json(shipment);
    } catch (error) {
      console.error("Error updating shipment status:", error);
      res.status(500).json({ message: "Failed to update shipment status" });
    }
  });

  app.delete('/api/shipments/:id', requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShipment(id);
      res.json({ message: "Shipment deleted successfully" });
    } catch (error) {
      console.error("Error deleting shipment:", error);
      res.status(500).json({ message: "Failed to delete shipment" });
    }
  });

  // Shipment item routes
  app.get('/api/shipments/:id/items', requireRole(['admin', 'warehouse', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getShipmentItems(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching shipment items:", error);
      res.status(500).json({ message: "Failed to fetch shipment items" });
    }
  });

  app.post('/api/shipments/:id/items', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const itemData = insertShipmentItemSchema.parse({ ...req.body, shipmentId: id });
      const item = await storage.createShipmentItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating shipment item:", error);
      res.status(500).json({ message: "Failed to create shipment item" });
    }
  });

  app.patch('/api/shipment-items/:id', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertShipmentItemSchema.partial().parse(req.body);
      const item = await storage.updateShipmentItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating shipment item:", error);
      res.status(500).json({ message: "Failed to update shipment item" });
    }
  });

  app.delete('/api/shipment-items/:id', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShipmentItem(id);
      res.json({ message: "Shipment item deleted successfully" });
    } catch (error) {
      console.error("Error deleting shipment item:", error);
      res.status(500).json({ message: "Failed to delete shipment item" });
    }
  });

  // Shipping cost routes
  app.get('/api/shipments/:id/costs', requireRole(['admin', 'warehouse', 'finance', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      const costs = await storage.getShippingCosts(id);
      res.json(costs);
    } catch (error) {
      console.error("Error fetching shipping costs:", error);
      res.status(500).json({ message: "Failed to fetch shipping costs" });
    }
  });

  app.post('/api/shipping-costs', requireRole(['admin', 'finance']), approvalMiddleware.shippingOperation, genericPeriodGuard, async (req: any, res) => {
    try {
      const costData = addShippingCostSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      // Require exchangeRate for non-USD shipping costs (same as capital entries)
      if (costData.currency !== 'USD' && (!costData.exchangeRate || costData.exchangeRate === '0')) {
        return res.status(400).json({ 
          message: "Exchange rate is required for non-USD currencies",
          field: "exchangeRate"
        });
      }
      
      const cost = await storage.addShippingCost(costData, userId);
      res.status(201).json(cost);
    } catch (error) {
      console.error("Error adding shipping cost:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to add shipping cost" });
    }
  });

  app.patch('/api/shipping-costs/:id', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertShippingCostSchema.partial().parse(req.body);
      const cost = await storage.updateShippingCost(id, updates);
      res.json(cost);
    } catch (error) {
      console.error("Error updating shipping cost:", error);
      res.status(500).json({ message: "Failed to update shipping cost" });
    }
  });

  app.delete('/api/shipping-costs/:id', requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShippingCost(id);
      res.json({ message: "Shipping cost deleted successfully" });
    } catch (error) {
      console.error("Error deleting shipping cost:", error);
      res.status(500).json({ message: "Failed to delete shipping cost" });
    }
  });

  // Delivery tracking routes
  app.get('/api/shipments/:id/tracking', requireRole(['admin', 'warehouse', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      const tracking = await storage.getDeliveryTracking(id);
      res.json(tracking);
    } catch (error) {
      console.error("Error fetching delivery tracking:", error);
      res.status(500).json({ message: "Failed to fetch delivery tracking" });
    }
  });

  app.post('/api/delivery-tracking', requireRole(['admin', 'warehouse']), approvalMiddleware.shippingOperation, async (req: any, res) => {
    try {
      const trackingData = addDeliveryTrackingSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const tracking = await storage.addDeliveryTracking(trackingData, userId);
      res.status(201).json(tracking);
    } catch (error) {
      console.error("Error adding delivery tracking:", error);
      res.status(500).json({ message: "Failed to add delivery tracking" });
    }
  });

  app.patch('/api/delivery-tracking/:id', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertDeliveryTrackingSchema.partial().parse(req.body);
      const tracking = await storage.updateDeliveryTracking(id, updates);
      res.json(tracking);
    } catch (error) {
      console.error("Error updating delivery tracking:", error);
      res.status(500).json({ message: "Failed to update delivery tracking" });
    }
  });

  app.patch('/api/delivery-tracking/:id/notify', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const tracking = await storage.markCustomerNotified(id, userId);
      res.json(tracking);
    } catch (error) {
      console.error("Error marking customer notified:", error);
      res.status(500).json({ message: "Failed to mark customer notified" });
    }
  });

  // Shipping analytics and reporting routes
  app.get('/api/shipping/analytics', requireRole(['admin', 'warehouse', 'finance', 'sales']), async (req, res) => {
    try {
      const filters = dateRangeFilterSchema.parse(req.query);
      const analytics = await storage.getShippingAnalytics(filters);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching shipping analytics:", error);
      res.status(500).json({ message: "Failed to fetch shipping analytics" });
    }
  });

  app.get('/api/shipping/carrier-performance', requireRole(['admin', 'warehouse', 'finance']), async (req, res) => {
    try {
      const report = await storage.getCarrierPerformanceReport();
      res.json(report);
    } catch (error) {
      console.error("Error fetching carrier performance report:", error);
      res.status(500).json({ message: "Failed to fetch carrier performance report" });
    }
  });

  app.get('/api/shipping/cost-analysis', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const filters = dateRangeFilterSchema.parse(req.query);
      const analysis = await storage.getShippingCostAnalysis(filters);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching shipping cost analysis:", error);
      res.status(500).json({ message: "Failed to fetch shipping cost analysis" });
    }
  });

  app.get('/api/shipping/delivery-time-analysis', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filters = dateRangeFilterSchema.parse(req.query);
      const analysis = await storage.getDeliveryTimeAnalysis(filters);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching delivery time analysis:", error);
      res.status(500).json({ message: "Failed to fetch delivery time analysis" });
    }
  });

  // Integration routes
  app.get('/api/warehouse/stock/available-for-shipping', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const stock = await storage.getAvailableWarehouseStockForShipping();
      res.json(stock);
    } catch (error) {
      console.error("Error fetching available stock for shipping:", error);
      res.status(500).json({ message: "Failed to fetch available stock for shipping" });
    }
  });

  app.post('/api/warehouse/stock/:id/reserve', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, shipmentId } = z.object({
        quantity: z.number().positive(),
        shipmentId: z.string().min(1)
      }).parse(req.body);
      
      const stock = await storage.reserveStockForShipment(id, quantity, shipmentId);
      res.json(stock);
    } catch (error) {
      console.error("Error reserving stock for shipment:", error);
      res.status(500).json({ message: "Failed to reserve stock for shipment" });
    }
  });

  app.post('/api/warehouse/stock/:id/release', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = z.object({
        quantity: z.number().positive()
      }).parse(req.body);
      
      const stock = await storage.releaseReservedStock(id, quantity);
      res.json(stock);
    } catch (error) {
      console.error("Error releasing reserved stock:", error);
      res.status(500).json({ message: "Failed to release reserved stock" });
    }
  });

  // Shipping workflow validation endpoint
  app.post('/api/shipping/validate-workflow', requireRole(['admin']), async (req, res) => {
    try {
      const validation = await aiService.validateShippingWorkflow();
      res.json(validation);
    } catch (error) {
      console.error("Error validating shipping workflow:", error);
      res.status(500).json({ message: "Failed to validate shipping workflow" });
    }
  });

  // Advanced Warehouse Operations - Quality Standards
  app.get('/api/warehouse/quality-standards', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const isActive = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
      const standards = await storage.getQualityStandards(isActive);
      res.json(standards);
    } catch (error) {
      console.error("Error fetching quality standards:", error);
      res.status(500).json({ message: "Failed to fetch quality standards" });
    }
  });

  app.post('/api/warehouse/quality-standards', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const standard = insertQualityStandardSchema.parse(req.body);
      const result = await storage.createQualityStandard(standard);
      res.json(result);
    } catch (error) {
      console.error("Error creating quality standard:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quality standard" });
    }
  });

  app.patch('/api/warehouse/quality-standards/:id', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const standard = await storage.updateQualityStandard(id, req.body);
      res.json(standard);
    } catch (error) {
      console.error("Error updating quality standard:", error);
      res.status(500).json({ message: "Failed to update quality standard" });
    }
  });

  // Advanced Warehouse Operations - Warehouse Batches
  app.get('/api/warehouse/batches', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filter = {
        supplierId: req.query.supplierId as string,
        qualityGrade: req.query.qualityGrade as string,
        isActive: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined
      };
      const batches = await storage.getWarehouseBatches(filter);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching warehouse batches:", error);
      res.status(500).json({ message: "Failed to fetch warehouse batches" });
    }
  });

  app.post('/api/warehouse/batches', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const batchData = {
        ...insertWarehouseBatchSchema.parse(req.body),
        createdById: req.user.claims.sub
      };
      const batch = await storage.createWarehouseBatch(batchData);
      res.json(batch);
    } catch (error) {
      console.error("Error creating warehouse batch:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create warehouse batch" });
    }
  });

  app.post('/api/warehouse/batches/:id/split', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { splitQuantity } = z.object({
        splitQuantity: z.string()
      }).parse(req.body);
      const userId = req.user.claims.sub;
      
      const result = await storage.splitWarehouseBatch(id, splitQuantity, userId);
      res.json(result);
    } catch (error) {
      console.error("Error splitting warehouse batch:", error);
      res.status(500).json({ message: "Failed to split warehouse batch" });
    }
  });

  // Advanced Warehouse Operations - Quality Inspections
  app.get('/api/warehouse/quality-inspections', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filter = {
        status: req.query.status as string,
        inspectionType: req.query.inspectionType as string,
        batchId: req.query.batchId as string
      };
      const inspections = await storage.getQualityInspections(filter);
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching quality inspections:", error);
      res.status(500).json({ message: "Failed to fetch quality inspections" });
    }
  });

  app.post('/api/warehouse/quality-inspections', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const inspectionData = {
        ...insertQualityInspectionSchema.parse(req.body),
        inspectorId: req.user.claims.sub,
        createdById: req.user.claims.sub
      };
      const inspection = await storage.createQualityInspection(inspectionData);
      res.json(inspection);
    } catch (error) {
      console.error("Error creating quality inspection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quality inspection" });
    }
  });

  app.patch('/api/warehouse/quality-inspections/:id/complete', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const results = {
        ...req.body,
        userId: req.user.claims.sub
      };
      const inspection = await storage.completeQualityInspection(id, results);
      res.json(inspection);
    } catch (error) {
      console.error("Error completing quality inspection:", error);
      res.status(500).json({ message: "Failed to complete quality inspection" });
    }
  });

  app.patch('/api/warehouse/quality-inspections/:id/approve', requireRole(['admin', 'warehouse']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const inspection = await storage.approveQualityInspection(id, userId);
      res.json(inspection);
    } catch (error) {
      console.error("Error approving quality inspection:", error);
      res.status(500).json({ message: "Failed to approve quality inspection" });
    }
  });

  // Advanced Warehouse Operations - Inventory Consumption
  app.get('/api/warehouse/inventory-consumption', requireRole(['admin', 'warehouse', 'finance']), async (req, res) => {
    try {
      const filter = {
        warehouseStockId: req.query.stockId as string,
        consumptionType: req.query.type as string,
        orderId: req.query.orderId as string
      };
      const consumption = await storage.getInventoryConsumption(filter);
      res.json(consumption);
    } catch (error) {
      console.error("Error fetching inventory consumption:", error);
      res.status(500).json({ message: "Failed to fetch inventory consumption" });
    }
  });

  app.post('/api/warehouse/inventory-consumption/fifo', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const { warehouseStockId, quantity, consumptionType, allocatedTo } = z.object({
        warehouseStockId: z.string(),
        quantity: z.string(),
        consumptionType: z.string(),
        allocatedTo: z.string().optional()
      }).parse(req.body);
      const userId = req.user.claims.sub;
      
      const consumptions = await storage.consumeInventoryFIFO(warehouseStockId, quantity, consumptionType, userId, allocatedTo);
      res.json(consumptions);
    } catch (error) {
      console.error("Error consuming inventory FIFO:", error);
      res.status(500).json({ message: "Failed to consume inventory FIFO" });
    }
  });

  app.get('/api/warehouse/stock-aging', requireRole(['admin', 'warehouse', 'finance']), async (req, res) => {
    try {
      const aging = await storage.getStockAging();
      res.json(aging);
    } catch (error) {
      console.error("Error fetching stock aging:", error);
      res.status(500).json({ message: "Failed to fetch stock aging" });
    }
  });

  app.get('/api/warehouse/consumption-analytics', requireRole(['admin', 'warehouse', 'finance']), async (req, res) => {
    try {
      const dateRange = req.query.startDate && req.query.endDate ? {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      } : undefined;
      const analytics = await storage.getConsumptionAnalytics(dateRange);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching consumption analytics:", error);
      res.status(500).json({ message: "Failed to fetch consumption analytics" });
    }
  });

  // Advanced Warehouse Operations - Processing Operations
  app.get('/api/warehouse/processing-operations', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filter = {
        status: req.query.status as string,
        operationType: req.query.operationType as string,
        batchId: req.query.batchId as string
      };
      const operations = await storage.getProcessingOperations(filter);
      res.json(operations);
    } catch (error) {
      console.error("Error fetching processing operations:", error);
      res.status(500).json({ message: "Failed to fetch processing operations" });
    }
  });

  app.post('/api/warehouse/processing-operations', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const operationData = {
        ...insertProcessingOperationSchema.parse(req.body),
        createdById: req.user.claims.sub
      };
      const operation = await storage.createProcessingOperation(operationData);
      res.json(operation);
    } catch (error) {
      console.error("Error creating processing operation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create processing operation" });
    }
  });

  app.patch('/api/warehouse/processing-operations/:id/complete', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const results = {
        ...req.body,
        userId: req.user.claims.sub
      };
      const operation = await storage.completeProcessingOperation(id, results);
      res.json(operation);
    } catch (error) {
      console.error("Error completing processing operation:", error);
      res.status(500).json({ message: "Failed to complete processing operation" });
    }
  });

  // Advanced Warehouse Operations - Stock Transfers
  app.get('/api/warehouse/stock-transfers', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filter = {
        status: req.query.status as string,
        transferType: req.query.transferType as string
      };
      const transfers = await storage.getStockTransfers(filter);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching stock transfers:", error);
      res.status(500).json({ message: "Failed to fetch stock transfers" });
    }
  });

  app.post('/api/warehouse/stock-transfers', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const transferData = {
        ...insertStockTransferSchema.parse(req.body),
        createdById: req.user.claims.sub
      };
      const transfer = await storage.createStockTransfer(transferData);
      res.json(transfer);
    } catch (error) {
      console.error("Error creating stock transfer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create stock transfer" });
    }
  });

  app.patch('/api/warehouse/stock-transfers/:id/execute', requireRole(['admin', 'warehouse']), approvalMiddleware.warehouseOperation, warehousePeriodGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const transfer = await storage.executeStockTransfer(id, userId);
      res.json(transfer);
    } catch (error) {
      console.error("Error executing stock transfer:", error);
      res.status(500).json({ message: "Failed to execute stock transfer" });
    }
  });

  // Advanced Warehouse Operations - Inventory Adjustments
  app.get('/api/warehouse/inventory-adjustments', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const filter = {
        status: req.query.status as string,
        adjustmentType: req.query.adjustmentType as string,
        warehouseStockId: req.query.stockId as string
      };
      const adjustments = await storage.getInventoryAdjustments(filter);
      res.json(adjustments);
    } catch (error) {
      console.error("Error fetching inventory adjustments:", error);
      res.status(500).json({ message: "Failed to fetch inventory adjustments" });
    }
  });

  app.post('/api/warehouse/inventory-adjustments', requireRole(['admin', 'warehouse']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const adjustmentData = {
        ...insertInventoryAdjustmentSchema.parse(req.body),
        createdById: req.user.claims.sub
      };
      const adjustment = await storage.createInventoryAdjustment(adjustmentData);
      res.json(adjustment);
    } catch (error) {
      console.error("Error creating inventory adjustment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory adjustment" });
    }
  });

  app.patch('/api/warehouse/inventory-adjustments/:id/approve', requireRole(['admin']), warehousePeriodGuard, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const adjustment = await storage.approveInventoryAdjustment(id, userId);
      res.json(adjustment);
    } catch (error) {
      console.error("Error approving inventory adjustment:", error);
      res.status(500).json({ message: "Failed to approve inventory adjustment" });
    }
  });

  // Enhanced Warehouse Operations - Quality & Batch Management
  app.patch('/api/warehouse/stock/:id/assign-quality-grade', requireRole(['admin', 'warehouse']), approvalMiddleware.warehouseOperation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { qualityGrade, qualityScore } = req.body;
      const userId = req.user.claims.sub;
      const stock = await storage.assignQualityGradeToStock(id, qualityGrade, qualityScore, userId);
      res.json(stock);
    } catch (error) {
      console.error("Error assigning quality grade to stock:", error);
      res.status(500).json({ message: "Failed to assign quality grade to stock" });
    }
  });

  app.patch('/api/warehouse/stock/:id/assign-batch', requireRole(['admin', 'warehouse']), approvalMiddleware.warehouseOperation, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { batchId } = req.body;
      const userId = req.user.claims.sub;
      const stock = await storage.assignBatchToStock(id, batchId, userId);
      res.json(stock);
    } catch (error) {
      console.error("Error assigning batch to stock:", error);
      res.status(500).json({ message: "Failed to assign batch to stock" });
    }
  });

  app.get('/api/warehouse/stock/:id/quality-history', requireRole(['admin', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getStockWithQualityHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching stock quality history:", error);
      res.status(500).json({ message: "Failed to fetch stock quality history" });
    }
  });

  // Advanced Warehouse Analytics
  app.get('/api/warehouse/analytics/advanced', requireRole(['admin', 'warehouse', 'finance']), async (req, res) => {
    try {
      const analytics = await storage.getWarehouseAnalyticsAdvanced();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching advanced warehouse analytics:", error);
      res.status(500).json({ message: "Failed to fetch advanced warehouse analytics" });
    }
  });

  // Traceability Operations
  app.get('/api/warehouse/trace/stock/:id/origin', requireRole(['admin', 'warehouse', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const origin = await storage.traceStockOrigin(id);
      res.json(origin);
    } catch (error) {
      console.error("Error tracing stock origin:", error);
      res.status(500).json({ message: "Failed to trace stock origin" });
    }
  });

  app.get('/api/warehouse/trace/consumption/:id/chain', requireRole(['admin', 'warehouse', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const chain = await storage.traceConsumptionChain(id);
      res.json(chain);
    } catch (error) {
      console.error("Error tracing consumption chain:", error);
      res.status(500).json({ message: "Failed to trace consumption chain" });
    }
  });

  // Advanced Warehouse Workflow Validation
  app.post('/api/warehouse/validate-workflow', requireRole(['admin']), async (req, res) => {
    try {
      const validation = await aiService.validateWarehouseWorkflow();
      res.json(validation);
    } catch (error) {
      console.error("Error validating warehouse workflow:", error);
      res.status(500).json({ message: "Failed to validate warehouse workflow" });
    }
  });

  // Sales Pipeline APIs
  
  // Customer Management APIs
  app.get('/api/customers', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { category, isActive, salesRepId } = req.query;
      const filter: any = {};
      
      if (category) filter.category = category as string;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (salesRepId) filter.salesRepId = salesRepId as string;
      
      const customers = await storage.getCustomers(filter);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', requireRole(['admin', 'sales']), approvalMiddleware.saleOrder, genericPeriodGuard, async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.get('/api/customers/:id', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.patch('/api/customers/:id', requireRole(['admin', 'sales']), approvalMiddleware.saleOrder, genericPeriodGuard, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(id, updates);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', requireRole(['admin', 'sales']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const customer = await storage.deactivateCustomer(id, userId);
      res.json(customer);
    } catch (error) {
      console.error("Error deactivating customer:", error);
      res.status(500).json({ message: "Failed to deactivate customer" });
    }
  });

  app.get('/api/customers/:id/performance', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const performance = await storage.updateCustomerPerformanceMetrics(id);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching customer performance:", error);
      res.status(500).json({ message: "Failed to fetch customer performance" });
    }
  });

  app.post('/api/customers/:id/communications', requireRole(['admin', 'sales']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const communicationData = insertCustomerCommunicationSchema.parse({
        ...req.body,
        customerId: id,
        userId: req.user.claims.sub,
      });
      const communication = await storage.createCustomerCommunication(communicationData);
      res.json(communication);
    } catch (error) {
      console.error("Error creating customer communication:", error);
      res.status(500).json({ message: "Failed to create customer communication" });
    }
  });

  app.get('/api/customers/:id/communications', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const communications = await storage.getCustomerCommunications(id, limit);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching customer communications:", error);
      res.status(500).json({ message: "Failed to fetch customer communications" });
    }
  });

  // Sales Order Management APIs
  app.get('/api/sales-orders', requireRole(['admin', 'sales', 'finance', 'warehouse']), async (req, res) => {
    try {
      const { status, customerId, salesRepId, startDate, endDate } = req.query;
      const filter: any = {};
      
      if (status) filter.status = status as string;
      if (customerId) filter.customerId = customerId as string;
      if (salesRepId) filter.salesRepId = salesRepId as string;
      if (startDate && endDate) {
        filter.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }
      
      const orders = await storage.getSalesOrders(filter);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  app.post('/api/sales-orders', requireRole(['admin', 'sales']), approvalMiddleware.saleOrder, strictPeriodGuard, async (req: any, res) => {
    try {
      const orderData = insertSalesOrderSchema.parse({
        ...req.body,
        salesRepId: req.user.claims.sub,
        createdBy: req.user.claims.sub,
      });
      const order = await storage.createSalesOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating sales order:", error);
      res.status(500).json({ message: "Failed to create sales order" });
    }
  });

  app.get('/api/sales-orders/:id', requireRole(['admin', 'sales', 'finance', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getSalesOrderWithDetails(id);
      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching sales order:", error);
      res.status(500).json({ message: "Failed to fetch sales order" });
    }
  });

  app.patch('/api/sales-orders/:id', requireRole(['admin', 'sales']), approvalMiddleware.saleOrder, strictPeriodGuard, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateSalesOrderSchema.parse(req.body);
      const order = await storage.updateSalesOrder(id, updates);
      res.json(order);
    } catch (error) {
      console.error("Error updating sales order:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to update sales order" });
    }
  });

  app.patch('/api/sales-orders/:id/status', requireRole(['admin', 'sales', 'warehouse']), approvalMiddleware.saleOrder, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
      let order;
      switch (status) {
        case 'confirmed':
          order = await storage.confirmSalesOrder(id, userId);
          break;
        case 'fulfilled':
          order = await storage.fulfillSalesOrder(id, userId);
          break;
        case 'delivered':
          order = await storage.deliverSalesOrder(id, userId);
          break;
        case 'cancelled':
          const { reason } = req.body;
          order = await storage.cancelSalesOrder(id, reason || 'No reason provided', userId);
          break;
        default:
          return res.status(400).json({ message: "Invalid status" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating sales order status:", error);
      res.status(500).json({ message: "Failed to update sales order status" });
    }
  });

  app.delete('/api/sales-orders/:id', requireRole(['admin', 'sales']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const order = await storage.cancelSalesOrder(id, 'Order deleted', userId);
      res.json(order);
    } catch (error) {
      console.error("Error cancelling sales order:", error);
      res.status(500).json({ message: "Failed to cancel sales order" });
    }
  });

  app.post('/api/sales-orders/:id/fulfill', requireRole(['admin', 'sales', 'warehouse']), approvalMiddleware.saleOrder, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const order = await storage.fulfillSalesOrder(id, userId);
      res.json(order);
    } catch (error) {
      console.error("Error fulfilling sales order:", error);
      res.status(500).json({ message: "Failed to fulfill sales order" });
    }
  });

  app.get('/api/sales-orders/:id/items', requireRole(['admin', 'sales', 'finance', 'warehouse']), async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getSalesOrderItems(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching sales order items:", error);
      res.status(500).json({ message: "Failed to fetch sales order items" });
    }
  });

  // Pricing & Revenue APIs
  app.post('/api/pricing/calculate', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const { itemId, customerId, qualityGrade } = req.body;
      const pricing = await storage.calculateItemPricing(itemId, customerId, qualityGrade);
      res.json(pricing);
    } catch (error) {
      console.error("Error calculating pricing:", error);
      res.status(500).json({ message: "Failed to calculate pricing" });
    }
  });

  app.get('/api/revenue/transactions', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { status, customerId, salesOrderId, startDate, endDate } = req.query;
      const filter: any = {};
      
      if (status) filter.status = status as string;
      if (customerId) filter.customerId = customerId as string;
      if (salesOrderId) filter.salesOrderId = salesOrderId as string;
      if (startDate && endDate) {
        filter.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }
      
      const transactions = await storage.getRevenueTransactions(filter);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching revenue transactions:", error);
      res.status(500).json({ message: "Failed to fetch revenue transactions" });
    }
  });

  app.post('/api/revenue/transactions', requireRole(['admin', 'sales', 'finance']), approvalMiddleware.saleOrder, strictPeriodGuard, async (req: any, res) => {
    try {
      const transactionData = insertRevenueTransactionSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      const transaction = await storage.createRevenueTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating revenue transaction:", error);
      res.status(500).json({ message: "Failed to create revenue transaction" });
    }
  });

  app.get('/api/revenue/analytics', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const analytics = await storage.getSalesPerformanceAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  // Sales Analytics APIs
  app.get('/api/sales/analytics', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const analytics = await storage.getSalesPerformanceAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({ message: "Failed to fetch sales analytics" });
    }
  });

  app.get('/api/sales/performance', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { salesRepId, periodType } = req.query;
      const performance = salesRepId 
        ? await storage.getSalesRepPerformance(salesRepId as string, periodType as string || 'monthly')
        : await storage.getSalesPerformanceMetrics();
      res.json(performance);
    } catch (error) {
      console.error("Error fetching sales performance:", error);
      res.status(500).json({ message: "Failed to fetch sales performance" });
    }
  });

  app.get('/api/customers/analytics', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { customerId } = req.query;
      const analytics = customerId 
        ? await storage.getCustomerProfitabilityAnalysis(customerId as string)
        : await storage.getCustomerProfitabilityAnalysis();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching customer analytics:", error);
      res.status(500).json({ message: "Failed to fetch customer analytics" });
    }
  });

  // Sales order item management
  app.post('/api/sales-orders/:orderId/items', requireRole(['admin', 'sales']), async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const itemData = insertSalesOrderItemSchema.parse({
        ...req.body,
        salesOrderId: orderId,
      });
      const item = await storage.createSalesOrderItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating sales order item:", error);
      res.status(500).json({ message: "Failed to create sales order item" });
    }
  });

  app.patch('/api/sales-order-items/:id', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateSalesOrderItemSchema.parse(req.body);
      const item = await storage.updateSalesOrderItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating sales order item:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: "Failed to update sales order item" });
    }
  });

  app.delete('/api/sales-order-items/:id', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSalesOrderItem(id);
      res.json({ message: "Sales order item deleted successfully" });
    } catch (error) {
      console.error("Error deleting sales order item:", error);
      res.status(500).json({ message: "Failed to delete sales order item" });
    }
  });

  // Additional customer endpoints
  app.get('/api/customers/search', requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const { query, limit } = req.query;
      const customers = await storage.searchCustomers(
        query as string, 
        limit ? parseInt(limit as string) : 50
      );
      res.json(customers);
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({ message: "Failed to search customers" });
    }
  });

  app.get('/api/customers/:id/account-balance', requireRole(['admin', 'sales', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const balance = await storage.getCustomerAccountBalance(id);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching customer account balance:", error);
      res.status(500).json({ message: "Failed to fetch customer account balance" });
    }
  });

  // ===============================================
  // DOCUMENT MANAGEMENT API ENDPOINTS
  // ===============================================

  // Document upload
  app.post('/api/documents/upload', requireRole(['admin', 'finance', 'purchasing', 'warehouse', 'sales']), 
    upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = documentUploadSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const result = await DocumentService.processFileUpload(req.file, documentData, userId);
      
      res.json({
        message: "Document uploaded successfully",
        document: result.document,
        validation: result.validation
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      }
      
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload document" });
    }
  });

  // Document search and listing
  app.get('/api/documents', requireRole(['admin', 'finance', 'purchasing', 'warehouse', 'sales']), async (req: any, res) => {
    try {
      const searchRequest = documentSearchSchema.parse(req.query);
      const userId = req.user.claims.sub;
      
      const result = await DocumentService.searchDocuments(searchRequest, userId);
      res.json(result);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: "Failed to search documents" });
    }
  });

  // Get single document
  app.get('/api/documents/:id', requireRole(['admin', 'finance', 'purchasing', 'warehouse', 'sales']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const document = await storage.getDocumentWithMetadata(id, userId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Update document
  app.patch('/api/documents/:id', requireRole(['admin', 'finance', 'purchasing']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = documentUpdateSchema.parse({ ...req.body, id });
      const userId = req.user.claims.sub;
      
      const document = await storage.updateDocument(id, updateData, {
        userId,
        userName: 'Document Update',
        source: 'document_management'
      });
      
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', requireRole(['admin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      await DocumentService.deleteDocument(id, userId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Download document
  app.get('/api/documents/:id/download', requireRole(['admin', 'finance', 'purchasing', 'warehouse', 'sales']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const fileInfo = await DocumentService.downloadDocument(id, userId);
      
      res.download(fileInfo.filePath, fileInfo.fileName, {
        headers: {
          'Content-Type': fileInfo.contentType
        }
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Document version control
  app.get('/api/documents/:id/versions', requireRole(['admin', 'finance', 'purchasing', 'warehouse', 'sales']), async (req, res) => {
    try {
      const { id } = req.params;
      const versions = await storage.getDocumentVersionHistory(id);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching document versions:", error);
      res.status(500).json({ message: "Failed to fetch document versions" });
    }
  });

  // Create new document version
  app.post('/api/documents/:id/versions', requireRole(['admin', 'finance', 'purchasing']), 
    upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { id } = req.params;
      const versionData = documentVersionCreateSchema.parse({ ...req.body, documentId: id });
      const userId = req.user.claims.sub;
      
      const result = await DocumentService.createDocumentVersion(id, req.file, versionData, userId);
      
      res.json({
        message: "Document version created successfully",
        document: result.document,
        version: result.version
      });
    } catch (error) {
      console.error("Error creating document version:", error);
      res.status(500).json({ message: "Failed to create document version" });
    }
  });

  // Document compliance management
  app.get('/api/documents/:id/compliance', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { id } = req.params;
      const compliance = await storage.getDocumentCompliance(id);
      res.json(compliance);
    } catch (error) {
      console.error("Error fetching document compliance:", error);
      res.status(500).json({ message: "Failed to fetch document compliance" });
    }
  });

  app.post('/api/documents/:id/compliance', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { id } = req.params;
      const complianceData = documentComplianceUpdateSchema.parse({ ...req.body, documentId: id });
      const userId = req.user.claims.sub;
      
      const compliance = await storage.addDocumentCompliance(complianceData, {
        userId,
        userName: 'Compliance Update',
        source: 'compliance_management'
      });
      
      res.json(compliance);
    } catch (error) {
      console.error("Error adding document compliance:", error);
      res.status(500).json({ message: "Failed to add document compliance" });
    }
  });

  // Compliance dashboard
  app.get('/api/compliance/dashboard', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dashboard = await DocumentService.getComplianceDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching compliance dashboard:", error);
      res.status(500).json({ message: "Failed to fetch compliance dashboard" });
    }
  });

  // Compliance alerts and monitoring
  app.get('/api/compliance/alerts', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { priority, limit } = req.query;
      const alerts = await storage.getComplianceAlerts(
        priority as any, 
        limit ? parseInt(limit as string) : 20
      );
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching compliance alerts:", error);
      res.status(500).json({ message: "Failed to fetch compliance alerts" });
    }
  });

  app.get('/api/compliance/expiring', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { days } = req.query;
      const expiringItems = await storage.getExpiringCompliance(
        days ? parseInt(days as string) : 30
      );
      res.json(expiringItems);
    } catch (error) {
      console.error("Error fetching expiring compliance items:", error);
      res.status(500).json({ message: "Failed to fetch expiring compliance items" });
    }
  });

  // Document analytics
  app.get('/api/documents/analytics', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const analytics = await DocumentService.getDocumentAnalytics(
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching document analytics:", error);
      res.status(500).json({ message: "Failed to fetch document analytics" });
    }
  });

  // Document statistics
  app.get('/api/documents/statistics', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const statistics = await storage.getDocumentStatistics();
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching document statistics:", error);
      res.status(500).json({ message: "Failed to fetch document statistics" });
    }
  });

  // Document activity feed
  app.get('/api/documents/activity', requireRole(['admin', 'finance']), async (req, res) => {
    try {
      const { limit } = req.query;
      const activity = await storage.getRecentDocumentActivity(
        limit ? parseInt(limit as string) : 50
      );
      res.json(activity);
    } catch (error) {
      console.error("Error fetching document activity:", error);
      res.status(500).json({ message: "Failed to fetch document activity" });
    }
  });

  // Document access logs
  app.get('/api/documents/:id/access-logs', requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const logs = await storage.getDocumentAccessLogs(
        id,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching document access logs:", error);
      res.status(500).json({ message: "Failed to fetch document access logs" });
    }
  });

  // Bulk operations
  app.patch('/api/documents/bulk/status', requireRole(['admin', 'finance']), async (req: any, res) => {
    try {
      const { documentIds, status } = req.body;
      const userId = req.user.claims.sub;
      
      if (!Array.isArray(documentIds) || !status) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      const result = await storage.bulkUpdateDocumentStatus(documentIds, status, userId);
      res.json(result);
    } catch (error) {
      console.error("Error bulk updating document status:", error);
      res.status(500).json({ message: "Failed to bulk update document status" });
    }
  });

  app.delete('/api/documents/bulk', requireRole(['admin']), async (req: any, res) => {
    try {
      const { documentIds } = req.body;
      const userId = req.user.claims.sub;
      
      if (!Array.isArray(documentIds)) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      const result = await storage.bulkDeleteDocuments(documentIds, userId);
      res.json(result);
    } catch (error) {
      console.error("Error bulk deleting documents:", error);
      res.status(500).json({ message: "Failed to bulk delete documents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
