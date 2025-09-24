/**
 * User Warehouse Scopes Enhancement Service for Stage 8 - Warehouse-Level Permissions
 * 
 * Provides comprehensive warehouse-level access control including:
 * - Role-based warehouse access permissions (FIRST, FINAL, etc.)
 * - User scope management and validation
 * - Dynamic permission enforcement for warehouse operations
 * - Audit trail for permission changes
 * - Integration with existing authentication and role systems
 */

import { db } from "./db";
import { 
  userWarehouseScopes, users, warehouseStock, User
} from "../shared/schema";

// Define types directly from table
type InsertUserWarehouseScope = typeof userWarehouseScopes.$inferInsert;
type SelectUserWarehouseScope = typeof userWarehouseScopes.$inferSelect;
import { eq, and, inArray, sql } from "drizzle-orm";
import { auditService } from "./auditService";
import { notificationService } from "./notificationService";

// Request interfaces for warehouse scope management
export interface UserWarehouseScopeRequest {
  userId: string;
  warehouseCode: string; // FIRST, FINAL, etc.
  isActive?: boolean;
}

export interface BulkScopeAssignmentRequest {
  userIds: string[];
  warehouseCodes: string[];
  action: 'grant' | 'revoke';
}

export interface WarehouseAccessValidationRequest {
  userId: string;
  warehouseCode: string;
  operation: 'read' | 'write' | 'transfer' | 'admin';
}

export interface UserPermissionSummary {
  userId: string;
  userName: string;
  email: string;
  role: string;
  warehouseScopes: Array<{
    warehouseCode: string;
    isActive: boolean;
    grantedAt: Date;
    permissions: {
      canRead: boolean;
      canWrite: boolean;
      canTransfer: boolean;
      canAdmin: boolean;
    };
  }>;
  effectivePermissions: {
    totalWarehouses: number;
    activeScopes: number;
    restrictedAccess: boolean;
    lastAccessDate: Date | null;
  };
}

export interface WarehouseUserReport {
  warehouseCode: string;
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  userBreakdown: Array<{
    userId: string;
    userName: string;
    role: string;
    accessLevel: 'read' | 'write' | 'transfer' | 'admin';
    isActive: boolean;
    lastActivity: Date | null;
  }>;
}

export interface PermissionAuditEntry {
  timestamp: Date;
  action: 'grant' | 'revoke' | 'modify' | 'validate';
  userId: string;
  targetUserId?: string;
  warehouseCode: string;
  previousState?: any;
  newState?: any;
  reason?: string;
  result: 'success' | 'denied' | 'error';
}

/**
 * Singleton service class for warehouse-level permission management
 */
class UserWarehouseScopesService {
  private static instance: UserWarehouseScopesService;

  private constructor() {
    console.log("UserWarehouseScopesService initialized for Stage 8 warehouse-level permissions");
  }

  public static getInstance(): UserWarehouseScopesService {
    if (!UserWarehouseScopesService.instance) {
      UserWarehouseScopesService.instance = new UserWarehouseScopesService();
    }
    return UserWarehouseScopesService.instance;
  }

  /**
   * Grant warehouse access scope to a user
   */
  async grantWarehouseScope(
    request: UserWarehouseScopeRequest,
    grantedBy: string
  ): Promise<string> {
    try {
      // Check if scope already exists
      const existingScope = await db.select()
        .from(userWarehouseScopes)
        .where(and(
          eq(userWarehouseScopes.userId, request.userId),
          eq(userWarehouseScopes.warehouseCode, request.warehouseCode)
        ))
        .limit(1);

      let scopeId: string;

      if (existingScope.length > 0) {
        // Update existing scope
        const [updatedScope] = await db.update(userWarehouseScopes)
          .set({
            isActive: request.isActive !== undefined ? request.isActive : true,
            updatedAt: new Date()
          })
          .where(eq(userWarehouseScopes.id, existingScope[0].id))
          .returning();
        
        scopeId = updatedScope.id;
      } else {
        // Create new scope
        const [newScope] = await db.insert(userWarehouseScopes)
          .values({
            userId: request.userId,
            warehouseCode: request.warehouseCode,
            isActive: request.isActive !== undefined ? request.isActive : true
          })
          .returning();
        
        scopeId = newScope.id;
      }

      // Create audit log
      await auditService.logOperation(
        {
          userId: grantedBy,
          userName: 'Warehouse Administrator',
          source: 'warehouse_permissions',
          severity: 'info',
        },
        {
          entityType: 'user_warehouse_scopes',
          entityId: scopeId,
          action: existingScope.length > 0 ? 'update' : 'create',
          operationType: 'warehouse_scope_grant',
          description: `${existingScope.length > 0 ? 'Updated' : 'Granted'} warehouse scope ${request.warehouseCode} to user ${request.userId}`,
          newValues: {
            userId: request.userId,
            warehouseCode: request.warehouseCode,
            isActive: request.isActive !== undefined ? request.isActive : true,
            action: existingScope.length > 0 ? 'updated' : 'granted'
          }
        }
      );

      // Send notification to the user
      await notificationService.sendNotification({
        userId: request.userId,
        title: 'Warehouse Access Granted',
        message: `You have been granted access to warehouse ${request.warehouseCode}`,
        alertType: 'operational_alert',
        alertCategory: 'system_health',
        priority: 'medium',
        channels: ['in_app']
      });

      return scopeId;
    } catch (error) {
      console.error("Error granting warehouse scope:", error);
      throw error;
    }
  }

  /**
   * Revoke warehouse access scope from a user
   */
  async revokeWarehouseScope(
    userId: string,
    warehouseCode: string,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      // Update scope to inactive
      const [updatedScope] = await db.update(userWarehouseScopes)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(userWarehouseScopes.userId, userId),
          eq(userWarehouseScopes.warehouseCode, warehouseCode)
        ))
        .returning();

      if (!updatedScope) {
        throw new Error(`Warehouse scope ${warehouseCode} not found for user ${userId}`);
      }

      // Create audit log
      await auditService.logOperation(
        {
          userId: revokedBy,
          userName: 'Warehouse Administrator',
          source: 'warehouse_permissions',
          severity: 'warning',
        },
        {
          entityType: 'user_warehouse_scopes',
          entityId: updatedScope.id,
          action: 'update',
          operationType: 'warehouse_scope_revoke',
          description: `Revoked warehouse scope ${warehouseCode} from user ${userId}${reason ? `: ${reason}` : ''}`,
          newValues: {
            userId,
            warehouseCode,
            isActive: false,
            reason
          }
        }
      );

      // Send notification to the user
      await notificationService.sendNotification({
        userId: userId,
        title: 'Warehouse Access Revoked',
        message: `Your access to warehouse ${warehouseCode} has been revoked${reason ? `: ${reason}` : ''}`,
        alertType: 'operational_alert',
        alertCategory: 'system_health',
        priority: 'high',
        channels: ['in_app', 'email']
      });
    } catch (error) {
      console.error("Error revoking warehouse scope:", error);
      throw error;
    }
  }

  /**
   * Validate user access to specific warehouse and operation
   */
  async validateWarehouseAccess(
    request: WarehouseAccessValidationRequest
  ): Promise<boolean> {
    try {
      // Get user's warehouse scopes
      const userScopes = await db.select()
        .from(userWarehouseScopes)
        .where(and(
          eq(userWarehouseScopes.userId, request.userId),
          eq(userWarehouseScopes.warehouseCode, request.warehouseCode),
          eq(userWarehouseScopes.isActive, true)
        ));

      // Get user role for additional permission logic
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);

      if (!user) {
        return false;
      }

      // Admin users have access to all warehouses and operations
      if (user.role === 'admin') {
        return true;
      }

      // Check if user has specific warehouse scope
      if (userScopes.length === 0) {
        return false;
      }

      // Role-based operation permissions
      const hasScope = userScopes.length > 0;
      
      switch (request.operation) {
        case 'read':
          // All users with scope can read
          return hasScope;
          
        case 'write':
          // Workers, warehouse staff, and above can write
          return hasScope && ['worker', 'warehouse', 'sales', 'finance', 'admin'].includes(user.role);
          
        case 'transfer':
          // Warehouse staff and above can transfer
          return hasScope && ['warehouse', 'sales', 'finance', 'admin'].includes(user.role);
          
        case 'admin':
          // Only admin and warehouse managers can perform admin operations
          return hasScope && ['admin'].includes(user.role);
          
        default:
          return false;
      }
    } catch (error) {
      console.error("Error validating warehouse access:", error);
      return false;
    }
  }

  /**
   * Get comprehensive user permission summary
   */
  async getUserPermissionSummary(userId: string): Promise<UserPermissionSummary> {
    try {
      // Get user details
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get user's warehouse scopes
      const scopes = await db.select()
        .from(userWarehouseScopes)
        .where(eq(userWarehouseScopes.userId, userId));

      // Build warehouse scopes with permissions
      const warehouseScopes = scopes.map(scope => ({
        warehouseCode: scope.warehouseCode,
        isActive: scope.isActive,
        grantedAt: scope.createdAt || new Date(),
        permissions: {
          canRead: scope.isActive,
          canWrite: scope.isActive && ['worker', 'warehouse', 'sales', 'finance', 'admin'].includes(user.role),
          canTransfer: scope.isActive && ['warehouse', 'sales', 'finance', 'admin'].includes(user.role),
          canAdmin: scope.isActive && ['admin'].includes(user.role)
        }
      }));

      const activeScopes = scopes.filter(s => s.isActive).length;

      const summary: UserPermissionSummary = {
        userId: user.id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        email: user.email || 'No email',
        role: user.role,
        warehouseScopes,
        effectivePermissions: {
          totalWarehouses: scopes.length,
          activeScopes,
          restrictedAccess: user.role !== 'admin' && activeScopes < 2, // Consider restricted if not admin and less than 2 warehouses
          lastAccessDate: null // TODO: Track last access from activity logs
        }
      };

      return summary;
    } catch (error) {
      console.error("Error getting user permission summary:", error);
      throw error;
    }
  }

  /**
   * Get warehouse user access report
   */
  async getWarehouseUserReport(warehouseCode: string): Promise<WarehouseUserReport> {
    try {
      // Get all users with access to this warehouse
      const warehouseUsers = await db.select({
        userId: userWarehouseScopes.userId,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userRole: users.role,
        isActive: userWarehouseScopes.isActive,
        grantedAt: userWarehouseScopes.createdAt
      })
      .from(userWarehouseScopes)
      .innerJoin(users, eq(userWarehouseScopes.userId, users.id))
      .where(eq(userWarehouseScopes.warehouseCode, warehouseCode));

      const totalUsers = warehouseUsers.length;
      const activeUsers = warehouseUsers.filter(u => u.isActive).length;
      const adminUsers = warehouseUsers.filter(u => u.userRole === 'admin' && u.isActive).length;

      const userBreakdown = warehouseUsers.map(user => {
        let accessLevel: 'read' | 'write' | 'transfer' | 'admin' = 'read';
        
        if (user.userRole === 'admin') {
          accessLevel = 'admin';
        } else if (['warehouse', 'sales', 'finance'].includes(user.userRole)) {
          accessLevel = 'transfer';
        } else if (['worker', 'warehouse', 'sales', 'finance'].includes(user.userRole)) {
          accessLevel = 'write';
        }

        return {
          userId: user.userId,
          userName: `${user.userName || ''} ${user.userLastName || ''}`.trim() || 'Unknown User',
          role: user.userRole,
          accessLevel,
          isActive: user.isActive,
          lastActivity: null // TODO: Track from activity logs
        };
      });

      return {
        warehouseCode,
        totalUsers,
        activeUsers,
        adminUsers,
        userBreakdown
      };
    } catch (error) {
      console.error("Error generating warehouse user report:", error);
      throw error;
    }
  }

  /**
   * Bulk assign or revoke warehouse scopes
   */
  async bulkManageScopes(
    request: BulkScopeAssignmentRequest,
    managedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const userId of request.userIds) {
        for (const warehouseCode of request.warehouseCodes) {
          try {
            if (request.action === 'grant') {
              await this.grantWarehouseScope({
                userId,
                warehouseCode,
                isActive: true
              }, managedBy);
            } else {
              await this.revokeWarehouseScope(userId, warehouseCode, managedBy, 'Bulk management operation');
            }
            success++;
          } catch (error) {
            failed++;
            errors.push(`Failed to ${request.action} ${warehouseCode} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Create audit log for bulk operation
      await auditService.logOperation(
        {
          userId: managedBy,
          userName: 'Warehouse Administrator',
          source: 'warehouse_permissions',
          severity: 'info',
        },
        {
          entityType: 'user_warehouse_scopes',
          entityId: 'bulk_operation',
          action: request.action === 'grant' ? 'create' : 'update',
          operationType: 'bulk_scope_management',
          description: `Bulk ${request.action} operation: ${success} success, ${failed} failed`,
          newValues: {
            action: request.action,
            userCount: request.userIds.length,
            warehouseCount: request.warehouseCodes.length,
            successCount: success,
            failedCount: failed
          }
        }
      );

      return { success, failed, errors };
    } catch (error) {
      console.error("Error in bulk scope management:", error);
      throw error;
    }
  }

  /**
   * Get all warehouse codes available in the system
   */
  async getAvailableWarehouses(): Promise<string[]> {
    try {
      const warehouses = await db.select({
        warehouse: warehouseStock.warehouse
      })
      .from(warehouseStock)
      .groupBy(warehouseStock.warehouse);

      return warehouses.map(w => w.warehouse).filter(Boolean);
    } catch (error) {
      console.error("Error getting available warehouses:", error);
      return ['FIRST', 'FINAL']; // Default fallback
    }
  }

  /**
   * Middleware function for enforcing warehouse permissions
   */
  createWarehousePermissionMiddleware(operation: 'read' | 'write' | 'transfer' | 'admin') {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = (req.user as any)?.claims?.sub;
        const warehouseCode = req.params.warehouseCode || req.body.warehouseCode || req.query.warehouseCode;

        if (!userId) {
          return res.status(401).json({ message: 'Authentication required' });
        }

        if (!warehouseCode) {
          return res.status(400).json({ message: 'Warehouse code required' });
        }

        const hasAccess = await this.validateWarehouseAccess({
          userId,
          warehouseCode,
          operation
        });

        if (!hasAccess) {
          // Log access denial
          await auditService.logOperation(
            {
              userId,
              userName: 'System',
              source: 'warehouse_permissions',
              severity: 'warning',
            },
            {
              entityType: 'user_warehouse_scopes',
              entityId: 'access_denied',
              action: 'validate',
              operationType: 'permission_check',
              description: `Access denied: User ${userId} attempted ${operation} operation on warehouse ${warehouseCode}`,
              newValues: {
                userId,
                warehouseCode,
                operation,
                result: 'denied'
              }
            }
          );

          return res.status(403).json({ 
            message: `Insufficient permissions for ${operation} operation on warehouse ${warehouseCode}` 
          });
        }

        next();
      } catch (error) {
        console.error("Error in warehouse permission middleware:", error);
        res.status(500).json({ message: 'Permission validation error' });
      }
    };
  }
}

// Initialize and export singleton instance
export const userWarehouseScopesService = UserWarehouseScopesService.getInstance();
export default userWarehouseScopesService;