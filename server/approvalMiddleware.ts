import type { Request, Response, NextFunction } from "express";
import { approvalWorkflowService } from "./approvalWorkflowService";
import { auditService } from "./auditService";
import { storage } from "./storage";
import { z } from "zod";
import { MoneyUtils, Money } from "@shared/money";
import { ApprovalError, BusinessRuleError, ValidationError, ErrorHelpers } from "@shared/errors";

// Operation context for approval validation
interface OperationContext {
  operationType: string;
  operationData: any;
  amount?: number;
  currency?: string;
  businessContext?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  skipApproval?: boolean; // For operations that should bypass approval
}

// Approval requirement result
interface ApprovalRequirement {
  required: boolean;
  reason?: string;
  threshold?: number;
  approvalChainId?: string;
}

/**
 * Extract operation context from request based on operation type
 */
function extractOperationContext(req: any, operationType: string): OperationContext {
  const body = req.body;
  let amount: number | undefined;
  let currency = 'USD';
  let businessContext: string | undefined;
  let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

  switch (operationType) {
    case 'capital_entry':
      try {
        const amountMoney = MoneyUtils.parseMoneyInput(body.amount || '0', body.paymentCurrency || 'USD');
        amount = amountMoney.toNumber();
      } catch {
        amount = 0;
      }
      currency = body.paymentCurrency || 'USD';
      businessContext = `Capital ${body.type}: ${body.description}`;
      priority = body.type === 'CapitalOut' && amount > 10000 ? 'high' : 'normal';
      break;

    case 'purchase':
      try {
        const amountMoney = MoneyUtils.parseMoneyInput(body.total || '0', body.currency || 'USD');
        amount = amountMoney.toNumber();
      } catch {
        amount = 0;
      }
      currency = body.currency || 'USD';
      businessContext = `Purchase: ${body.weight}kg at ${body.pricePerKg} per kg`;
      priority = amount > 50000 ? 'high' : amount > 20000 ? 'normal' : 'low';
      break;

    case 'sale_order':
      try {
        const amountMoney = MoneyUtils.parseMoneyInput(body.totalAmount || '0', body.currency || 'USD');
        amount = amountMoney.toNumber();
      } catch {
        amount = 0;
      }
      currency = body.currency || 'USD';
      businessContext = `Sales Order: ${body.currency} ${body.totalAmount}`;
      priority = amount > 100000 ? 'urgent' : amount > 50000 ? 'high' : 'normal';
      break;

    case 'user_role_change':
      businessContext = `User role change: ${body.role}`;
      priority = body.role === 'admin' ? 'urgent' : 'high';
      break;

    case 'system_setting_change':
      businessContext = `System setting: ${body.key} = ${body.value}`;
      priority = ['PREVENT_NEGATIVE_BALANCE', 'USD_ETB_RATE'].includes(body.key) ? 'high' : 'normal';
      break;

    case 'warehouse_operation':
      businessContext = `Warehouse operation: ${body.status || 'status change'}`;
      priority = 'normal';
      break;

    case 'shipping_operation':
      try {
        const amountMoney = MoneyUtils.parseMoneyInput(body.totalAmount || body.amountPaid || '0', body.currency || 'USD');
        amount = amountMoney.toNumber();
      } catch {
        amount = 0;
      }
      currency = body.currency || 'USD';
      businessContext = `Shipping operation: ${body.shipmentNumber || 'new shipment'}`;
      priority = 'normal';
      break;
  }

  return {
    operationType,
    operationData: body,
    amount,
    currency,
    businessContext,
    priority,
    skipApproval: false // SECURITY: Client cannot control approval bypass
  };
}

/**
 * Create approval middleware for specific operation types
 */
export function requireApproval(operationType: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // Extract audit context from request
      const auditContext = auditService.extractRequestContext(req);
      
      // Extract operation context
      const operationContext = extractOperationContext(req, operationType);
      
      // SECURITY: Approval bypass removed - all operations must go through proper approval workflow
      // If internal operations need bypass, they should use the storage layer's secure internal token mechanism

      // Check if approval is required for this operation
      const requiresApproval = await approvalWorkflowService.requiresApproval(
        operationType,
        operationContext.amount,
        operationContext.currency,
        auditContext.userId
      );

      if (!requiresApproval) {
        // Log that approval was not required
        await auditService.logOperation(auditContext, {
          entityType: 'approval_check',
          action: 'view',
          description: `Approval not required for ${operationType}`,
          businessContext: operationContext.businessContext,
          operationType: operationType,
          financialImpact: operationContext.amount,
          currency: operationContext.currency
        });
        
        return next();
      }

      // SECURITY: Check if there's an existing approved request for this operation
      const existingApprovalId = req.body._approvalRequestId;
      if (existingApprovalId) {
        // Use the new secure validation that enforces operation scoping and single-use consumption
        const validationResult = await approvalWorkflowService.validateApprovalRequest(
          existingApprovalId, 
          {
            operationType,
            operationData: operationContext.operationData,
            amount: operationContext.amount,
            currency: operationContext.currency,
            entityId: extractEntityId(operationContext.operationData, operationType),
            requestedBy: auditContext.userId || 'unknown',
            operationId: req.body.id || `temp_${Date.now()}` // Use operation ID if available
          }
        );

        if (validationResult.isValid) {
          // SECURITY: Consume the approval atomically to prevent reuse
          const consumptionResult = await approvalWorkflowService.consumeApprovalRequest(
            existingApprovalId,
            {
              operationType,
              operationData: operationContext.operationData,
              amount: operationContext.amount,
              currency: operationContext.currency,
              entityId: extractEntityId(operationContext.operationData, operationType),
              requestedBy: auditContext.userId || 'unknown',
              operationId: req.body.id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          );

          if (consumptionResult.success) {
            // Log the approved operation execution with consumption details
            await auditService.logOperation(auditContext, {
              entityType: 'approved_operation',
              action: 'create',
              description: `Executing pre-approved ${operationType} with consumed approval`,
              businessContext: operationContext.businessContext,
              operationType: operationType,
              approvalRequestId: existingApprovalId,
              approvalStatus: 'consumed',
              financialImpact: operationContext.amount,
              currency: operationContext.currency
            });
            
            return next();
          } else {
            return res.status(403).json({
              message: "Approval consumption failed",
              approvalRequired: true,
              error: consumptionResult.reason,
              securityViolation: true
            });
          }
        } else {
          // SECURITY VIOLATION: Log failed approval validation attempts
          await auditService.logOperation({
            ...auditContext,
            severity: 'critical'
          }, {
            entityType: 'security_violation',
            action: 'view',
            description: `SECURITY VIOLATION: Invalid approval validation for ${operationType}`,
            businessContext: `Attempted approval misuse: ${validationResult.reason}`,
            operationType: operationType,
            approvalRequestId: existingApprovalId,
            approvalStatus: 'validation_failed'
          });

          return res.status(403).json({
            message: "Invalid approval",
            approvalRequired: true,
            error: validationResult.reason,
            securityViolation: true
          });
        }
      }

      // Create approval request since operation requires approval
      const approvalRequest = await approvalWorkflowService.createApprovalRequest({
        operationType,
        amount: operationContext.amount,
        currency: operationContext.currency,
        requestedBy: auditContext.userId || 'unknown',
        operationData: operationContext.operationData,
        businessContext: operationContext.businessContext,
        priority: operationContext.priority
      }, auditContext);

      // Return approval required response
      return res.status(202).json({
        message: "Operation requires approval",
        approvalRequired: true,
        approvalRequestId: approvalRequest.id,
        approvalRequestNumber: approvalRequest.requestNumber,
        operationType,
        amount: operationContext.amount,
        currency: operationContext.currency,
        businessContext: operationContext.businessContext,
        priority: operationContext.priority,
        currentApprover: approvalRequest.currentApprover,
        totalSteps: approvalRequest.totalSteps,
        status: approvalRequest.status,
        submittedAt: approvalRequest.submittedAt,
        estimatedApprovalTime: calculateEstimatedApprovalTime(approvalRequest),
        nextSteps: [
          "Your request has been submitted for approval",
          `Current approver: ${approvalRequest.currentApprover ? 'Assigned' : 'To be assigned'}`,
          "You will be notified when a decision is made",
          "You can track the status in the Approvals dashboard"
        ]
      });

    } catch (error) {
      console.error(`Approval middleware error for ${operationType}:`, error);
      
      // Log the error for audit purposes
      try {
        const auditContext = auditService.extractRequestContext(req);
        await auditService.logOperation({
          ...auditContext,
          severity: 'error'
        }, {
          entityType: 'approval_error',
          action: 'create',
          description: `Approval middleware error for ${operationType}`,
          businessContext: `Error in approval process: ${error instanceof Error ? error.message : 'Unknown error'}`,
          operationType: operationType
        });
      } catch (auditError) {
        console.error("Failed to log approval middleware error:", auditError);
      }

      // Fail securely - require approval on error
      return res.status(500).json({
        message: "Error processing approval requirement",
        error: error instanceof Error ? error.message : "Unknown error",
        approvalRequired: true, // Fail secure
        recommendation: "Please contact system administrator or try again later"
      });
    }
  };
}

/**
 * SECURITY: Extract entity ID from operation data for validation binding
 * This ensures approvals are bound to specific entities (customers, suppliers, etc.)
 */
function extractEntityId(operationData: any, operationType: string): string | undefined {
  switch (operationType) {
    case 'capital_entry':
      return operationData.reference; // Reference to order/purchase ID
      
    case 'purchase':
      return operationData.supplierId;
      
    case 'sale_order':
      return operationData.customerId;
      
    case 'user_role_change':
      return operationData.userId || operationData.id;
      
    case 'system_setting_change':
      return operationData.key; // Setting key as entity identifier
      
    case 'warehouse_operation':
      return operationData.id; // Warehouse stock ID
      
    case 'shipping_operation':
      return operationData.customerId || operationData.shipmentId;
      
    default:
      return operationData.id || operationData.entityId;
  }
}

/**
 * Calculate estimated approval time based on historical data
 */
function calculateEstimatedApprovalTime(approvalRequest: any): string {
  const totalSteps = approvalRequest.totalSteps || 1;
  const priority = approvalRequest.priority || 'normal';
  
  // Base estimates in hours per step
  const baseTimePerStep = {
    'urgent': 2,   // 2 hours per step
    'high': 6,     // 6 hours per step  
    'normal': 24,  // 24 hours per step
    'low': 48      // 48 hours per step
  };
  
  const hoursPerStep = baseTimePerStep[priority as keyof typeof baseTimePerStep] || 24;
  const totalHours = totalSteps * hoursPerStep;
  
  if (totalHours < 24) {
    return `${totalHours} hours`;
  } else if (totalHours < 168) { // Less than a week
    const days = Math.ceil(totalHours / 24);
    return `${days} business day${days > 1 ? 's' : ''}`;
  } else {
    const weeks = Math.ceil(totalHours / 168);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
}

/**
 * Middleware for operations that always require approval regardless of amount
 */
export function requireAlwaysApproval(operationType: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    // Force approval requirement by setting a high amount threshold
    req.body._forceApproval = true;
    return requireApproval(operationType)(req, res, next);
  };
}

/**
 * Middleware for sensitive operations that require admin approval
 */
export function requireAdminApproval(operationType: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const auditContext = auditService.extractRequestContext(req);
      const user = await storage.getUser(auditContext.userId || '');
      
      // Allow admin users to proceed without approval
      if (user?.role === 'admin') {
        await auditService.logOperation(auditContext, {
          entityType: 'admin_operation',
          action: 'create', 
          description: `Admin executed ${operationType} without approval`,
          businessContext: `Admin privilege: ${operationType}`,
          operationType: operationType,
          newValues: { adminBypass: true }
        });
        
        return next();
      }
      
      // For non-admin users, require approval
      return requireAlwaysApproval(operationType)(req, res, next);
      
    } catch (error) {
      console.error(`Admin approval middleware error for ${operationType}:`, error);
      return res.status(500).json({
        message: "Error validating admin privileges",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}

/**
 * Express middleware to inject approval context into request
 */
export function injectApprovalContext() {
  return (req: any, res: Response, next: NextFunction) => {
    // Add approval utilities to request object
    req.approvalUtils = {
      bypassApproval: () => {
        req.body._skipApproval = true;
      },
      setApprovalId: (approvalId: string) => {
        req.body._approvalRequestId = approvalId;
      },
      requiresApproval: async (operationType: string, amount?: number, currency?: string) => {
        const auditContext = auditService.extractRequestContext(req);
        return await approvalWorkflowService.requiresApproval(
          operationType, 
          amount, 
          currency, 
          auditContext.userId
        );
      }
    };
    
    next();
  };
}

/**
 * Validation middleware to ensure approved operations have valid approval IDs
 */
export function validateApprovalExecution() {
  return async (req: any, res: Response, next: NextFunction) => {
    const approvalId = req.body._approvalRequestId;
    
    if (!approvalId) {
      return next(); // No approval ID provided, let other middleware handle it
    }
    
    try {
      const auditContext = auditService.extractRequestContext(req);
      
      // CRITICAL SECURITY: Proper approval validation with user ownership and workflow guards
      const approval = await approvalWorkflowService.getApprovalById(approvalId);
      
      // Security validation: Check existence, status, and user ownership
      if (!approval) {
        return res.status(403).json({
          message: "Invalid approval request",
          approvalRequestId: approvalId,
          error: "The provided approval request does not exist"
        });
      }
      
      if (approval.status !== 'approved') {
        return res.status(403).json({
          message: "Approval not in approved status",
          approvalRequestId: approvalId,
          currentStatus: approval.status,
          error: "Only approved requests can be executed"
        });
      }
      
      // CRITICAL SECURITY: User ownership validation - only requester or current approver can execute
      const hasPermission = (approval.requestedBy === auditContext.userId || 
                           approval.currentApprover === auditContext.userId);
      
      if (!hasPermission) {
        return res.status(403).json({
          message: "Insufficient permissions",
          approvalRequestId: approvalId,
          error: "You lack permission to execute this approval - only the requester or current approver can execute approved requests"
        });
      }
      
      // CRITICAL SECURITY: Operation binding validation - ensure approval matches current operation
      const currentOperation = extractOperationContext(req, approval.operationType);
      
      // Validate operation type matches
      if (approval.operationType !== currentOperation.operationType) {
        return res.status(403).json({
          message: "Operation type mismatch",
          approvalRequestId: approvalId,
          approvedType: approval.operationType,
          requestedType: currentOperation.operationType,
          error: "This approval is for a different operation type"
        });
      }
      
      // CRITICAL SECURITY: Amount validation for financial operations
      if (currentOperation.amount && approval.amount) {
        const approvedAmount = parseFloat(approval.amount.toString());
        const requestedAmount = currentOperation.amount;
        
        // Allow small tolerance for rounding (0.01)
        if (Math.abs(approvedAmount - requestedAmount) > 0.01) {
          return res.status(403).json({
            message: "Amount mismatch",
            approvalRequestId: approvalId,
            approvedAmount: approvedAmount,
            requestedAmount: requestedAmount,
            error: "This approval is for a different amount"
          });
        }
      }
      
      next();
    } catch (error) {
      console.error("Error validating approval execution:", error);
      return res.status(500).json({
        message: "Error validating approval",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}

// Predefined approval middleware for common operations
export const approvalMiddleware = {
  // Financial operations
  capitalEntry: requireApproval('capital_entry'),
  purchase: requireApproval('purchase'), 
  saleOrder: requireApproval('sale_order'),
  
  // System administration
  userRoleChange: requireAdminApproval('user_role_change'),
  systemSettingChange: requireAdminApproval('system_setting_change'),
  
  // Warehouse and shipping
  warehouseOperation: requireApproval('warehouse_operation'),
  shippingOperation: requireApproval('shipping_operation'),
  
  // Financial adjustments
  financialAdjustment: requireAlwaysApproval('financial_adjustment'),
  
  // Stage 5 Operating Expenses
  operatingExpense: requireApproval('operating_expense'),
  supplyPurchase: requireApproval('supply_purchase'),
  
  // Utility middleware
  injectContext: injectApprovalContext,
  validateExecution: validateApprovalExecution
};

export default approvalMiddleware;