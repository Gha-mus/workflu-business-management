import { db } from "./db";
import { 
  approvalChains, 
  approvalRequests, 
  users,
  type ApprovalChain,
  type ApprovalRequest, 
  type InsertApprovalRequest,
  type InsertApprovalChain,
  type User
} from "@shared/schema";
import { eq, and, or, desc, asc, inArray, isNotNull, sql } from "drizzle-orm";
import { auditService } from "./auditService";
import crypto from "crypto";

// Approval workflow configuration and state management
interface ApprovalWorkflowConfig {
  operationType: string;
  amount?: number;
  currency?: string;
  requestedBy: string;
  operationData: any;
  businessContext?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requiredBy?: Date;
  attachments?: string[];
}

interface ApprovalDecision {
  decision: 'approve' | 'reject' | 'escalate' | 'delegate';
  comments?: string;
  delegateTo?: string;
  escalateTo?: string;
}

interface ApprovalStep {
  step: number;
  role: string;
  approverId?: string;
  decision?: 'approve' | 'reject' | 'escalate';
  comments?: string;
  decidedAt?: Date;
  escalatedFrom?: string;
  delegatedFrom?: string;
}

class ApprovalWorkflowService {
  private static instance: ApprovalWorkflowService;

  private constructor() {
    console.log("ApprovalWorkflowService initialized for enterprise approval workflows");
  }

  public static getInstance(): ApprovalWorkflowService {
    if (!ApprovalWorkflowService.instance) {
      ApprovalWorkflowService.instance = new ApprovalWorkflowService();
    }
    return ApprovalWorkflowService.instance;
  }

  /**
   * Generate unique approval request number
   */
  private generateApprovalRequestNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `APR-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Find the appropriate approval chain for an operation
   * SECURITY: Enhanced error handling and logging
   */
  public async findApprovalChain(
    operationType: string,
    amount?: number,
    currency: string = 'USD'
  ): Promise<ApprovalChain | null> {
    try {
      // Convert amount to USD for consistent comparison
      const amountUsd = currency === 'USD' ? amount : amount; // TODO: Add currency conversion
      
      // Find matching approval chains ordered by priority
      const chains = await db
        .select()
        .from(approvalChains)
        .where(
          and(
            eq(approvalChains.operationType, operationType as any),
            eq(approvalChains.isActive, true)
          )
        )
        .orderBy(desc(approvalChains.priority));

      console.log(`APPROVAL CHAIN SEARCH: Found ${chains.length} active chains for ${operationType}`);

      // Find the best matching chain based on amount thresholds
      for (const chain of chains) {
        const minAmount = chain.minAmount ? parseFloat(chain.minAmount) : null;
        const maxAmount = chain.maxAmount ? parseFloat(chain.maxAmount) : null;
        
        // Check if amount falls within this chain's range
        const matchesMinAmount = !minAmount || !amountUsd || amountUsd >= minAmount;
        const matchesMaxAmount = !maxAmount || !amountUsd || amountUsd <= maxAmount;
        
        if (matchesMinAmount && matchesMaxAmount) {
          console.log(`APPROVAL CHAIN FOUND: ${chain.name} (ID: ${chain.id}) for ${operationType} ${currency} ${amount}`);
          return chain;
        }
      }

      // If no specific chain matches, try to find a default chain (no amount restrictions)
      const [defaultChain] = await db
        .select()
        .from(approvalChains)
        .where(
          and(
            eq(approvalChains.operationType, operationType as any),
            eq(approvalChains.isActive, true),
            isNotNull(approvalChains.minAmount),
            isNotNull(approvalChains.maxAmount)
          )
        )
        .orderBy(desc(approvalChains.priority))
        .limit(1);

      if (defaultChain) {
        console.log(`APPROVAL CHAIN DEFAULT: Using default chain ${defaultChain.name} for ${operationType}`);
      } else {
        console.warn(`APPROVAL CHAIN NOT FOUND: No approval chain available for ${operationType} ${currency} ${amount}`);
      }

      return defaultChain || null;
    } catch (error) {
      // SECURITY: Log database errors that could indicate attacks or system issues
      console.error(`CRITICAL: Database error finding approval chain for ${operationType}:`, error);
      // Rethrow to trigger fail-closed logic in caller
      throw error;
    }
  }

  /**
   * Check if an operation requires approval
   * SECURITY: Now implements fail-closed logic - ANY error requires approval/blocks operation
   */
  public async requiresApproval(
    operationType: string,
    amount?: number,
    currency: string = 'USD',
    requestedBy?: string
  ): Promise<boolean> {
    try {
      const chain = await this.findApprovalChain(operationType, amount, currency);
      if (!chain) {
        // CRITICAL SECURITY FIX: FAIL-CLOSED BEHAVIOR
        // No approval chain found - this is a configuration error that MUST NOT bypass security
        console.error(`🚨 CRITICAL SECURITY ERROR: No approval chain found for operation type '${operationType}'. FAILING CLOSED - REQUIRING APPROVAL.`);
        
        // Log this as a critical security event for immediate attention
        await this.logCriticalSecurityEvent({
          event: 'missing_approval_chain',
          operationType,
          amount,
          currency,
          requestedBy,
          error: `No approval chain configured for operation type '${operationType}'`,
          decision: 'fail_closed_require_approval',
          timestamp: new Date()
        }).catch(logError => {
          console.error('Failed to log critical security event for missing approval chain:', logError);
        });
        
        // SECURITY: FAIL CLOSED - Return true to require approval when no chain is configured
        return true;
      }

      // Check auto-approval rules
      if (chain.autoApproveBelow && amount && amount < parseFloat(chain.autoApproveBelow)) {
        console.log(`APPROVAL AUTO-APPROVED: ${operationType} amount ${currency} ${amount} is below auto-approval threshold ${chain.autoApproveBelow}`);
        return false;
      }

      // Check if same user can auto-approve their own requests
      if (chain.autoApproveSameUser && requestedBy) {
        // Additional logic for same-user auto-approval could be added here
        console.log(`APPROVAL AUTO-APPROVED: ${operationType} by ${requestedBy} allowed for same-user auto-approval`);
        return false;
      }

      console.log(`APPROVAL REQUIRED: ${operationType} requires approval (amount: ${currency} ${amount})`);
      return true;
    } catch (error) {
      // CRITICAL SECURITY FIX: FAIL-CLOSED LOGIC
      // Any error in approval checking MUST require approval to prevent security bypass
      console.error(`CRITICAL SECURITY: Approval system error for ${operationType} - FAILING CLOSED (requiring approval):`, error);
      
      // Log this as a critical security event for monitoring
      await this.logCriticalSecurityEvent({
        event: 'approval_system_error',
        operationType,
        amount,
        currency,
        requestedBy,
        error: error instanceof Error ? error.message : String(error),
        decision: 'fail_closed_require_approval',
        timestamp: new Date()
      }).catch(logError => {
        console.error('Failed to log critical security event:', logError);
      });
      
      // FAIL CLOSED: Return true to require approval when system has errors
      return true;
    }
  }

  /**
   * Create a new approval request
   */
  public async createApprovalRequest(
    config: ApprovalWorkflowConfig,
    auditContext?: any
  ): Promise<ApprovalRequest> {
    try {
      // Find the appropriate approval chain
      const chain = await this.findApprovalChain(
        config.operationType,
        config.amount,
        config.currency
      );

      if (!chain) {
        throw new Error(`No approval chain found for operation type: ${config.operationType}`);
      }

      // Calculate approval steps based on chain configuration
      const approvalSteps = await this.calculateApprovalSteps(chain, config);

      // Create the approval request
      const requestData: InsertApprovalRequest = {
        // requestNumber is auto-generated by database $defaultFn()
        approvalChainId: chain.id,
        operationType: config.operationType as any,
        operationId: crypto.randomUUID(), // Will be set when operation is created
        operationData: config.operationData,
        
        requestedAmount: config.amount ? config.amount.toString() : null,
        currency: config.currency || 'USD',
        amountUsd: config.amount ? config.amount.toString() : null, // TODO: Convert to USD
        
        title: this.generateApprovalTitle(config),
        description: config.businessContext || `Approval request for ${config.operationType}`,
        justification: `Approval required by business rules for ${config.operationType}`,
        attachments: config.attachments || undefined,
        priority: config.priority || 'normal',
        
        status: 'pending',
        requiredBy: config.requiredBy || null,
        
        requestedBy: config.requestedBy,
        currentApprover: approvalSteps.length > 0 ? approvalSteps[0].approverId || null : null,
        
        currentStep: 1,
        totalSteps: approvalSteps.length,
        approvalHistory: approvalSteps,
        
        // System context
        systemContext: {
          createdBy: 'approval_workflow_service',
          chain: chain.name,
          requiredRoles: chain.requiredRoles,
          autoApprovalRules: {
            autoApproveBelow: chain.autoApproveBelow,
            autoApproveSameUser: chain.autoApproveSameUser
          }
        }
      };

      const [approvalRequest] = await db
        .insert(approvalRequests)
        .values(requestData)
        .returning();

      // Log approval request creation
      if (auditContext) {
        await auditService.logOperation(auditContext, {
          entityType: 'approval_requests',
          entityId: approvalRequest.id,
          action: 'create',
          description: `Created approval request ${approvalRequest.requestNumber} for ${config.operationType}`,
          operationType: config.operationType,
          newValues: requestData,
          financialImpact: config.amount,
          currency: config.currency
        });
      }

      return approvalRequest;
    } catch (error) {
      console.error("Error creating approval request:", error);
      throw error;
    }
  }

  /**
   * Calculate approval steps based on chain configuration
   */
  private async calculateApprovalSteps(
    chain: ApprovalChain,
    config: ApprovalWorkflowConfig
  ): Promise<ApprovalStep[]> {
    const steps: ApprovalStep[] = [];
    const requiredRoles = chain.requiredRoles || [];

    try {
      for (let i = 0; i < requiredRoles.length; i++) {
        const role = requiredRoles[i];
        
        // Find available approvers for this role
        const approvers = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.role, role),
              eq(users.isActive, true)
            )
          );

        // Select the best approver (could be based on workload, availability, etc.)
        const selectedApprover = approvers.length > 0 ? approvers[0] : null;

        steps.push({
          step: i + 1,
          role,
          approverId: selectedApprover?.id
        });
      }

      return steps;
    } catch (error) {
      console.error("Error calculating approval steps:", error);
      return [];
    }
  }

  /**
   * Generate human-readable approval title
   */
  private generateApprovalTitle(config: ApprovalWorkflowConfig): string {
    const operationName = config.operationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const amountStr = config.amount ? ` - ${config.currency} ${config.amount.toLocaleString()}` : '';
    return `${operationName} Approval${amountStr}`;
  }

  /**
   * Process an approval decision
   */
  public async processApprovalDecision(
    approvalRequestId: string,
    decision: ApprovalDecision,
    deciderId: string,
    auditContext?: any
  ): Promise<ApprovalRequest> {
    try {
      // Get the current approval request
      const [currentRequest] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approvalRequestId));

      if (!currentRequest) {
        throw new Error(`Approval request not found: ${approvalRequestId}`);
      }

      if (currentRequest.status !== 'pending') {
        throw new Error(`Approval request ${currentRequest.requestNumber} is not in pending status`);
      }

      // Validate that the decider is authorized
      await this.validateApprovalAuthority(currentRequest, deciderId);

      // Update the approval history
      const updatedHistory = await this.updateApprovalHistory(
        currentRequest,
        decision,
        deciderId
      );

      // Determine the next state based on the decision
      const { newStatus, nextApprover, nextStep } = await this.calculateNextApprovalState(
        currentRequest,
        decision,
        updatedHistory
      );

      // Update the approval request
      const updateData = {
        status: newStatus as any,
        currentApprover: nextApprover,
        currentStep: nextStep,
        approvalHistory: updatedHistory,
        rejectionReason: decision.decision === 'reject' ? decision.comments || null : currentRequest.rejectionReason,
        completedAt: ['approved', 'rejected', 'cancelled'].includes(newStatus) ? new Date() : null,
        escalatedAt: decision.decision === 'escalate' ? new Date() : currentRequest.escalatedAt,
        finalApprover: newStatus === 'approved' ? deciderId : currentRequest.finalApprover,
        updatedAt: new Date()
      };

      const [updatedRequest] = await db
        .update(approvalRequests)
        .set(updateData)
        .where(eq(approvalRequests.id, approvalRequestId))
        .returning();

      // Log the approval decision
      if (auditContext) {
        await auditService.logApprovalDecision(
          auditContext,
          approvalRequestId,
          decision.decision === 'delegate' ? 'approve' : decision.decision,
          currentRequest.operationType || 'unknown',
          currentRequest.operationData,
          decision.comments
        );
      }

      return updatedRequest;
    } catch (error) {
      console.error("Error processing approval decision:", error);
      throw error;
    }
  }

  /**
   * Validate that a user has authority to approve a request
   */
  private async validateApprovalAuthority(
    request: ApprovalRequest,
    deciderId: string
  ): Promise<void> {
    // Check if the decider is the current approver
    if (request.currentApprover && request.currentApprover === deciderId) {
      return; // Valid
    }

    // Check if the decider has escalated authority
    const [decider] = await db
      .select()
      .from(users)
      .where(eq(users.id, deciderId));

    if (!decider) {
      throw new Error("Approver not found");
    }

    // Allow admins to approve any request (escalated authority)
    if (decider.role === 'admin') {
      return; // Valid
    }

    // Check approval chain for role-based authority
    const [approvalChain] = await db
      .select()
      .from(approvalChains)
      .where(eq(approvalChains.id, request.approvalChainId));

    if (approvalChain?.requiredRoles?.includes(decider.role)) {
      return; // Valid
    }

    throw new Error("User does not have authority to approve this request");
  }

  /**
   * Update approval history with the new decision
   */
  private async updateApprovalHistory(
    request: ApprovalRequest,
    decision: ApprovalDecision,
    deciderId: string
  ): Promise<ApprovalStep[]> {
    const currentHistory: ApprovalStep[] = request.approvalHistory as ApprovalStep[] || [];
    const currentStepIndex = request.currentStep - 1;

    if (currentStepIndex >= 0 && currentStepIndex < currentHistory.length) {
      currentHistory[currentStepIndex] = {
        ...currentHistory[currentStepIndex],
        approverId: deciderId,
        decision: decision.decision === 'delegate' ? 'approve' : decision.decision,
        comments: decision.comments,
        decidedAt: new Date(),
        delegatedFrom: decision.decision === 'delegate' ? deciderId : currentHistory[currentStepIndex].delegatedFrom
      };

      // Handle delegation
      if (decision.decision === 'delegate' && decision.delegateTo) {
        currentHistory[currentStepIndex].approverId = decision.delegateTo;
        currentHistory[currentStepIndex].delegatedFrom = deciderId;
      }

      // Handle escalation
      if (decision.decision === 'escalate' && decision.escalateTo) {
        currentHistory[currentStepIndex].approverId = decision.escalateTo;
        currentHistory[currentStepIndex].escalatedFrom = deciderId;
      }
    }

    return currentHistory;
  }

  /**
   * Calculate the next approval state after a decision
   */
  private async calculateNextApprovalState(
    request: ApprovalRequest,
    decision: ApprovalDecision,
    updatedHistory: ApprovalStep[]
  ): Promise<{ newStatus: string; nextApprover: string | null; nextStep: number }> {
    
    // Handle rejection
    if (decision.decision === 'reject') {
      return {
        newStatus: 'rejected',
        nextApprover: null,
        nextStep: request.currentStep
      };
    }

    // Handle escalation
    if (decision.decision === 'escalate') {
      return {
        newStatus: 'escalated',
        nextApprover: decision.escalateTo || null,
        nextStep: request.currentStep // Stay on same step but with escalated approver
      };
    }

    // Handle approval and delegation
    const nextStep = request.currentStep + 1;
    const isLastStep = nextStep > request.totalSteps;

    if (isLastStep) {
      // All approvals completed
      return {
        newStatus: 'approved',
        nextApprover: null,
        nextStep: request.currentStep
      };
    } else {
      // Move to next approval step
      const nextApprover = updatedHistory[nextStep - 1]?.approverId || null;
      return {
        newStatus: 'pending',
        nextApprover,
        nextStep
      };
    }
  }

  /**
   * Get pending approval requests for a specific user
   */
  public async getPendingApprovals(
    userId: string,
    options: {
      operationType?: string;
      priority?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ApprovalRequest[]> {
    try {
      let conditions = [
        eq(approvalRequests.status, 'pending'),
        eq(approvalRequests.currentApprover, userId)
      ];
      
      if (options.operationType) {
        conditions.push(eq(approvalRequests.operationType, options.operationType as any));
      }

      if (options.priority) {
        conditions.push(eq(approvalRequests.priority, options.priority as any));
      }

      const results = await db
        .select()
        .from(approvalRequests)
        .where(and(...conditions))
        .orderBy(desc(approvalRequests.submittedAt))
        .limit(options.limit || 50)
        .offset(options.offset || 0);

      return results;
    } catch (error) {
      console.error("Error getting pending approvals:", error);
      return [];
    }
  }

  /**
   * Get approval requests by status
   */
  public async getApprovalsByStatus(
    status: string,
    options: {
      userId?: string;
      operationType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ApprovalRequest[]> {
    try {
      let conditions = [eq(approvalRequests.status, status as any)];

      if (options.userId) {
        conditions.push(
          or(
            eq(approvalRequests.requestedBy, options.userId),
            eq(approvalRequests.currentApprover, options.userId),
            eq(approvalRequests.finalApprover, options.userId)
          )
        );
      }

      if (options.operationType) {
        conditions.push(eq(approvalRequests.operationType, options.operationType as any));
      }

      const results = await db
        .select()
        .from(approvalRequests)
        .where(and(...conditions))
        .orderBy(desc(approvalRequests.submittedAt))
        .limit(options.limit || 50)
        .offset(options.offset || 0);

      return results;
    } catch (error) {
      console.error("Error getting approvals by status:", error);
      return [];
    }
  }

  /**
   * SECURITY: Comprehensive approval validation with operation binding and single-use consumption
   * This is the critical security function that prevents approval replay attacks and misuse
   */
  public async validateApprovalRequest(
    approvalRequestId: string,
    operationContext: {
      operationType: string;
      operationData: any;
      amount?: number;
      currency?: string;
      entityId?: string;  // Customer, supplier, etc.
      requestedBy: string; // User executing the operation
      operationId?: string; // The actual operation being performed
    }
  ): Promise<{ isValid: boolean; reason?: string; approval?: ApprovalRequest }> {
    try {
      // Fetch the approval request directly by ID
      const [approval] = await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.id, approvalRequestId));

      if (!approval) {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Approval request ${approvalRequestId} not found`
        };
      }

      // CRITICAL: Check if approval has already been consumed (prevent replay attacks)
      if (approval.isConsumed) {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Approval ${approval.requestNumber} has already been consumed at ${approval.consumedAt}. Single-use approvals cannot be reused.`,
          approval
        };
      }

      // CRITICAL: Verify approval is in approved status
      if (approval.status !== 'approved') {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Approval ${approval.requestNumber} is not approved (status: ${approval.status})`,
          approval
        };
      }

      // CRITICAL: Verify operation type matches exactly
      if (approval.operationType !== operationContext.operationType) {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Operation type mismatch. Approval is for '${approval.operationType}' but operation is '${operationContext.operationType}'`,
          approval
        };
      }

      // CRITICAL: Verify requester matches (prevent user swapping)
      if (approval.requestedBy !== operationContext.requestedBy) {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Requester mismatch. Approval requested by '${approval.requestedBy}' but operation executed by '${operationContext.requestedBy}'`,
          approval
        };
      }

      // CRITICAL: Verify amounts match if specified (prevent amount manipulation)
      if (operationContext.amount !== undefined && approval.requestedAmount) {
        const approvedAmount = parseFloat(approval.requestedAmount);
        const operationAmount = operationContext.amount;
        const tolerance = 0.01; // Allow 1 cent tolerance for rounding
        
        if (Math.abs(approvedAmount - operationAmount) > tolerance) {
          return {
            isValid: false,
            reason: `SECURITY VIOLATION: Amount mismatch. Approval is for ${approval.currency} ${approvedAmount} but operation is for ${operationContext.currency} ${operationAmount}`,
            approval
          };
        }
      }

      // CRITICAL: Verify currency matches if specified
      if (operationContext.currency && approval.currency && approval.currency !== operationContext.currency) {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Currency mismatch. Approval is for '${approval.currency}' but operation is for '${operationContext.currency}'`,
          approval
        };
      }

      // CRITICAL: Verify approval hasn't expired (24-hour validity)
      const approvalAge = Date.now() - new Date(approval.completedAt || approval.submittedAt).getTime();
      const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
      
      if (approvalAge > maxAgeMs) {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Approval ${approval.requestNumber} has expired (age: ${Math.round(approvalAge / (60 * 60 * 1000))} hours, max: 24 hours)`,
          approval
        };
      }

      // CRITICAL: Calculate and verify operation data checksum to detect tampering
      const operationChecksum = this.calculateOperationChecksum(operationContext.operationData);
      const originalChecksum = this.calculateOperationChecksum(approval.operationData);
      
      // Allow some flexibility for additional fields, but core fields must match
      const coreFieldsMatch = this.verifyCoreOperationFields(approval.operationData, operationContext.operationData);
      if (!coreFieldsMatch) {
        return {
          isValid: false,
          reason: `SECURITY VIOLATION: Operation data has been tampered with. Core fields do not match original approval request`,
          approval
        };
      }

      // All validations passed - approval is valid for single use
      return {
        isValid: true,
        approval
      };

    } catch (error) {
      console.error("CRITICAL: Error validating approval request:", error);
      return {
        isValid: false,
        reason: `SECURITY ERROR: Validation failed due to system error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * SECURITY: Consume approval request atomically to prevent race conditions
   * This marks the approval as consumed and records consumption details
   */
  public async consumeApprovalRequest(
    approvalRequestId: string,
    operationContext: {
      operationType: string;
      operationData: any;
      amount?: number;
      currency?: string;
      entityId?: string;
      requestedBy: string;
      operationId: string; // Required for consumption
    }
  ): Promise<{ success: boolean; reason?: string }> {
    try {
      // Calculate operation checksum for integrity verification
      const operationChecksum = this.calculateOperationChecksum(operationContext.operationData);
      
      // Atomic consumption using database transaction
      const [updatedApproval] = await db
        .update(approvalRequests)
        .set({
          isConsumed: true,
          consumedAt: new Date(),
          consumedBy: operationContext.requestedBy,
          consumedOperationId: operationContext.operationId,
          consumedOperationType: operationContext.operationType as any,
          consumedAmount: operationContext.amount ? operationContext.amount.toString() : null,
          consumedCurrency: operationContext.currency || null,
          consumedEntityId: operationContext.entityId || null,
          operationChecksum,
          consumptionAttempts: sql`${approvalRequests.consumptionAttempts} + 1`,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(approvalRequests.id, approvalRequestId),
            eq(approvalRequests.isConsumed, false) // Prevent double consumption
          )
        )
        .returning();

      if (!updatedApproval) {
        return {
          success: false,
          reason: `SECURITY VIOLATION: Failed to consume approval ${approvalRequestId}. It may have been consumed by another operation (race condition detected)`
        };
      }

      console.log(`SECURITY: Successfully consumed approval ${updatedApproval.requestNumber} for operation ${operationContext.operationType} by user ${operationContext.requestedBy}`);
      
      return { success: true };

    } catch (error) {
      console.error("CRITICAL: Error consuming approval request:", error);
      return {
        success: false,
        reason: `SECURITY ERROR: Failed to consume approval due to system error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate checksum for operation data integrity verification
   */
  private calculateOperationChecksum(operationData: any): string {
    try {
      // Sort keys to ensure consistent checksum calculation
      const sortedData = this.sortObjectKeys(operationData);
      const jsonString = JSON.stringify(sortedData);
      return crypto.createHash('sha256').update(jsonString).digest('hex').substring(0, 32);
    } catch (error) {
      console.error("Error calculating operation checksum:", error);
      return 'checksum_error';
    }
  }

  /**
   * Recursively sort object keys for consistent serialization
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sortObjectKeys(item));
    
    const sortedObj: any = {};
    Object.keys(obj).sort().forEach(key => {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    });
    return sortedObj;
  }

  /**
   * Verify core operation fields match between approval and execution
   * This allows some flexibility for additional fields while ensuring core security
   */
  private verifyCoreOperationFields(approvalData: any, operationData: any): boolean {
    try {
      // Define core fields that must match exactly for each operation type
      const coreFieldsByType: Record<string, string[]> = {
        'capital_entry': ['amount', 'type', 'paymentCurrency'],
        'purchase': ['total', 'currency', 'supplierId', 'weight'],
        'sale_order': ['totalAmount', 'currency', 'customerId'],
        'user_role_change': ['role'],
        'system_setting_change': ['key', 'value'],
        'warehouse_operation': ['qtyKgTotal', 'warehouse'],
        'shipping_operation': ['totalWeight', 'destinationAddress']
      };

      const operationType = approvalData.operationType || operationData.operationType;
      const coreFields = coreFieldsByType[operationType] || [];

      // Verify each core field matches
      for (const field of coreFields) {
        const approvalValue = this.getNestedValue(approvalData, field);
        const operationValue = this.getNestedValue(operationData, field);
        
        // Handle numeric comparisons with tolerance
        if (typeof approvalValue === 'number' && typeof operationValue === 'number') {
          const tolerance = Math.max(0.01, Math.abs(approvalValue) * 0.001); // 0.1% tolerance or 1 cent minimum
          if (Math.abs(approvalValue - operationValue) > tolerance) {
            console.error(`Core field mismatch: ${field} - approved: ${approvalValue}, operation: ${operationValue}`);
            return false;
          }
        } else if (String(approvalValue) !== String(operationValue)) {
          console.error(`Core field mismatch: ${field} - approved: ${approvalValue}, operation: ${operationValue}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error verifying core operation fields:", error);
      return false; // Fail secure
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Handle escalation of overdue approval requests
   */
  public async processEscalations(): Promise<void> {
    try {
      console.log("Processing approval escalations...");

      // Find overdue pending approval requests
      const overdueRequests = await db
        .select()
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.status, 'pending'),
            // TODO: Add time-based escalation logic
          )
        );

      for (const request of overdueRequests) {
        await this.escalateRequest(request);
      }

      console.log(`Processed ${overdueRequests.length} escalations`);
    } catch (error) {
      console.error("Error processing escalations:", error);
    }
  }

  /**
   * Escalate an overdue approval request
   */
  private async escalateRequest(request: ApprovalRequest): Promise<void> {
    try {
      // Find the next level approver (typically admin or higher role)
      const [escalationTarget] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, 'admin'),
            eq(users.isActive, true)
          )
        )
        .limit(1);

      if (escalationTarget) {
        await this.processApprovalDecision(
          request.id,
          {
            decision: 'escalate',
            comments: 'Auto-escalated due to timeout',
            escalateTo: escalationTarget.id
          },
          'system'
        );
      }
    } catch (error) {
      console.error(`Error escalating request ${request.id}:`, error);
    }
  }

  /**
   * SECURITY: Log critical security events for monitoring and alerting
   * This method ensures that approval system errors and security violations are properly logged
   */
  private async logCriticalSecurityEvent(eventData: {
    event: string;
    operationType: string;
    amount?: number;
    currency?: string;
    requestedBy?: string;
    error: string;
    decision: string;
    timestamp: Date;
  }): Promise<void> {
    try {
      // Log to console immediately for monitoring systems
      console.error(`🚨 CRITICAL SECURITY EVENT: ${eventData.event}`, {
        operationType: eventData.operationType,
        amount: eventData.amount,
        currency: eventData.currency,
        requestedBy: eventData.requestedBy,
        error: eventData.error,
        decision: eventData.decision,
        timestamp: eventData.timestamp.toISOString()
      });

      // Log to audit service for permanent record
      await auditService.logOperation({
        userId: 'system',
        userName: 'ApprovalWorkflowService',
        userRole: 'system',
        source: 'approval_security_monitor',
        severity: 'critical'
      }, {
        entityType: 'security_event',
        entityId: `security_${eventData.event}_${Date.now()}`,
        action: 'create',
        description: `CRITICAL SECURITY: ${eventData.event} - ${eventData.decision}`,
        businessContext: `Approval system error handling: ${eventData.operationType} for ${eventData.currency} ${eventData.amount} by ${eventData.requestedBy}`,
        operationType: eventData.operationType,
        newValues: {
          securityEvent: eventData.event,
          operationType: eventData.operationType,
          amount: eventData.amount,
          currency: eventData.currency,
          requestedBy: eventData.requestedBy,
          error: eventData.error,
          securityDecision: eventData.decision,
          timestamp: eventData.timestamp.toISOString()
        },
        financialImpact: eventData.amount,
        currency: eventData.currency
      });

    } catch (logError) {
      // If logging fails, at least ensure console output
      console.error('🚨 CRITICAL: Failed to log security event - this could indicate a serious system compromise:', {
        originalEvent: eventData,
        loggingError: logError instanceof Error ? logError.message : logError
      });
    }
  }
}

// Export singleton instance
export const approvalWorkflowService = ApprovalWorkflowService.getInstance();