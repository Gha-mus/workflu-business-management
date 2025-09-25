/**
 * Stage 8: User Management Enhancement Service
 * 
 * Implements missing Stage 8 requirements:
 * - Deny overrides rule (no role changes, deletions, or sensitive operations)
 * - Sensitive change policies (manager approval required)
 * - Optional visibility controls for sensitive data
 */

import { db } from "./db";
import { 
  users,
  auditLog
} from "@shared/schema";
import { eq, and, not } from "drizzle-orm";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";

export interface SensitiveChangeRequest {
  userId: string;
  changeType: 'role_change' | 'delete_user' | 'permissions_modify' | 'salary_view';
  requestedChanges: any;
  justification: string;
  requestedBy: string;
}

export interface AccessControl {
  userId: string;
  sensitiveDataAccess: {
    financialData: boolean;
    supplierCosts: boolean;
    employeeInfo: boolean;
    auditLogs: boolean;
  };
  operationalLimits: {
    maxTransactionAmount: number;
    approvalRequired: boolean;
    territoryRestrictions: string[];
  };
}

class UserManagementEnhancementService {
  private static instance: UserManagementEnhancementService;

  private constructor() {
    console.log("UserManagementEnhancementService initialized for Stage 8 enhancements");
  }

  public static getInstance(): UserManagementEnhancementService {
    if (!UserManagementEnhancementService.instance) {
      UserManagementEnhancementService.instance = new UserManagementEnhancementService();
    }
    return UserManagementEnhancementService.instance;
  }

  /**
   * Validate and process sensitive change requests
   */
  async processSensitiveChangeRequest(
    request: SensitiveChangeRequest,
    approvingUserId: string
  ): Promise<boolean> {
    try {
      // Get approving user details
      const [approvingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, approvingUserId));

      if (!approvingUser || approvingUser.role !== 'admin') {
        throw new Error("Only admin users can approve sensitive changes");
      }

      // Apply deny overrides rule
      if (this.isDeniedOperation(request.changeType, request.requestedChanges)) {
        await auditService.logOperation(
          {
            userId: request.requestedBy,
            userName: 'User Management Enhancement Service',
            source: 'user_management',
            severity: 'warning',
          },
          {
            entityType: 'users',
            entityId: request.userId,
            action: 'blocked',
            operationType: 'sensitive_change',
            description: `Sensitive change blocked: ${request.changeType}`,
            newValues: {
              changeType: request.changeType,
              requestedChanges: request.requestedChanges,
              blockReason: 'Deny overrides rule',
              justification: request.justification,
            },
            businessContext: `Blocked sensitive operation per deny overrides policy`,
          }
        );

        await notificationService.createBusinessAlert({
          userId: request.requestedBy,
          alertType: 'security_alert',
          alertCategory: 'access_denied',
          priority: 'high',
          title: 'Sensitive Change Blocked',
          message: `Request to ${request.changeType} was blocked by security policy`,
          entityType: 'users',
          entityId: request.userId,
          actionUrl: `/admin/users`,
          templateData: {
            changeType: request.changeType,
            blockReason: 'Deny overrides rule',
            actionUrl: `/admin/users`,
          },
        });

        return false;
      }

      // Log approved sensitive change
      await auditService.logOperation(
        {
          userId: approvingUserId,
          userName: 'User Management Enhancement Service',
          source: 'user_management',
          severity: 'info',
        },
        {
          entityType: 'users',
          entityId: request.userId,
          action: 'approve',
          operationType: 'sensitive_change',
          description: `Sensitive change approved: ${request.changeType}`,
          newValues: {
            changeType: request.changeType,
            requestedChanges: request.requestedChanges,
            approvedBy: approvingUserId,
            justification: request.justification,
          },
          businessContext: `Approved sensitive operation with manager override`,
        }
      );

      return true;
    } catch (error) {
      console.error("Error processing sensitive change request:", error);
      return false;
    }
  }

  /**
   * Apply optional visibility controls
   */
  async applyVisibilityControls(
    viewingUserId: string,
    targetData: any,
    dataType: string
  ): Promise<any> {
    try {
      const [viewingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, viewingUserId));

      if (!viewingUser) {
        throw new Error("Viewing user not found");
      }

      // Get access controls for user
      const accessControls = await this.getUserAccessControls(viewingUserId);

      // Apply visibility filters based on data type and access controls
      const filteredData = { ...targetData };

      switch (dataType) {
        case 'financial_data':
          if (!accessControls.sensitiveDataAccess.financialData && viewingUser.role !== 'admin') {
            delete filteredData.cost;
            delete filteredData.profit;
            delete filteredData.margin;
            filteredData._filtered = 'Financial data hidden per access controls';
          }
          break;

        case 'supplier_costs':
          if (!accessControls.sensitiveDataAccess.supplierCosts && viewingUser.role !== 'admin') {
            delete filteredData.pricePerKg;
            delete filteredData.total;
            delete filteredData.unitCost;
            filteredData._filtered = 'Supplier cost data hidden per access controls';
          }
          break;

        case 'audit_logs':
          if (!accessControls.sensitiveDataAccess.auditLogs && viewingUser.role !== 'admin') {
            filteredData.details = '[REDACTED]';
            filteredData._filtered = 'Audit details hidden per access controls';
          }
          break;

        case 'employee_info':
          if (!accessControls.sensitiveDataAccess.employeeInfo && viewingUser.role !== 'admin') {
            delete filteredData.salary;
            delete filteredData.personalInfo;
            filteredData._filtered = 'Employee info hidden per access controls';
          }
          break;
      }

      return filteredData;
    } catch (error) {
      console.error("Error applying visibility controls:", error);
      return targetData; // Return original data if error
    }
  }

  /**
   * Check if operation is denied by overrides rule
   */
  private isDeniedOperation(changeType: string, requestedChanges: any): boolean {
    const deniedOperations = [
      'delete_user', // No user deletions allowed
      'role_change', // No role changes without extreme justification
    ];

    // Basic deny list
    if (deniedOperations.includes(changeType)) {
      return true;
    }

    // Additional deny rules based on content
    if (changeType === 'permissions_modify' && requestedChanges.grantAdminAccess) {
      return true; // No admin access grants
    }

    return false;
  }

  /**
   * Get user access controls
   */
  private async getUserAccessControls(userId: string): Promise<AccessControl> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new Error("User not found");
      }

      // Define access controls based on user role
      const accessControls: AccessControl = {
        userId,
        sensitiveDataAccess: {
          financialData: ['admin', 'finance'].includes(user.role),
          supplierCosts: ['admin', 'finance', 'purchasing'].includes(user.role),
          employeeInfo: ['admin'].includes(user.role),
          auditLogs: ['admin'].includes(user.role),
        },
        operationalLimits: {
          maxTransactionAmount: this.getMaxTransactionAmount(user.role),
          approvalRequired: !['admin'].includes(user.role),
          territoryRestrictions: this.getTerritoryRestrictions(user.role),
        },
      };

      return accessControls;
    } catch (error) {
      console.error("Error getting user access controls:", error);
      // Return restrictive defaults
      return {
        userId,
        sensitiveDataAccess: {
          financialData: false,
          supplierCosts: false,
          employeeInfo: false,
          auditLogs: false,
        },
        operationalLimits: {
          maxTransactionAmount: 1000,
          approvalRequired: true,
          territoryRestrictions: [],
        },
      };
    }
  }

  private getMaxTransactionAmount(role: string): number {
    const limits = {
      admin: 1000000,
      finance: 100000,
      purchasing: 50000,
      sales: 25000,
      warehouse: 5000,
      worker: 1000,
    };
    return limits[role as keyof typeof limits] || 1000;
  }

  private getTerritoryRestrictions(role: string): string[] {
    // Define territory restrictions if needed
    return [];
  }
}

export const userManagementEnhancementService = UserManagementEnhancementService.getInstance();