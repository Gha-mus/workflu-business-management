/**
 * User Management & Audit Routes
 * Super-admin protected endpoints for comprehensive user cleanup and management
 */

import { Router } from 'express';
import { z } from 'zod';
import { sql, eq, and, count } from 'drizzle-orm';
import { storage } from '../core/storage';
import { db } from '../core/db';
import { supabaseAuthProvider } from '../core/auth/providers/supabaseProvider';
import { auditService } from '../auditService';
import { 
  User,
  users,
  capitalEntries,
  purchases,
  salesOrders,
  salesReturns,
  documents,
  auditLogs,
  approvalRequests,
  notificationQueue,
  inventoryConsumption,
  inventoryAdjustments,
  stockTransfers,
  warehouseBatches,
  qualityInspections,
  processingOperations,
  revenueLedger,
  withdrawalRecords
} from '@shared/schema';
import { supabaseAdmin } from '../core/auth/providers/supabaseProvider';

const router = Router();

// User audit response interface
interface UserAuditRecord {
  user: User;
  businessRecordCounts: {
    capitalEntries: number;
    purchases: number;
    salesOrders: number;
    salesReturns: number;
    documents: number;
    auditLogs: number;
    approvalRequests: number;
    notifications: number;
    inventoryOperations: number;
    warehouseOperations: number;
    financialTransactions: number;
    total: number;
  };
  canHardDelete: boolean; // Safe to permanently delete
  needsSoftDelete: boolean; // Has business records, needs anonymization
  lastActivity?: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// User cleanup request schema
const userCleanupSchema = z.object({
  userIds: z.array(z.string()).min(1).max(50), // Limit bulk operations
  action: z.enum(['hard_delete', 'soft_delete_anonymize', 'deactivate']),
  reason: z.string().min(10).max(500),
  preserveAuditLogs: z.boolean().default(true)
});

// Helper function to check business record dependencies
async function getUserBusinessRecordCounts(userId: string): Promise<UserAuditRecord['businessRecordCounts']> {
  try {
    const [
      capitalEntriesCount,
      purchasesCount,
      salesOrdersCount,
      salesReturnsCount,
      documentsCount,
      auditLogsCount,
      approvalRequestsCount,
      notificationsCount,
      inventoryConsumptionCount,
      inventoryAdjustmentsCount,
      stockTransfersCount,
      warehouseBatchesCount,
      qualityInspectionsCount,
      processingOperationsCount,
      revenueLedgerCount,
      withdrawalRecordsCount
    ] = await Promise.all([
      // Count capital entries created by user
      db.select({ count: count() }).from(capitalEntries).where(eq(capitalEntries.createdBy, userId)),
      
      // Count purchases created by user
      db.select({ count: count() }).from(purchases).where(eq(purchases.createdBy, userId)),
      
      // Count sales orders created by or assigned to user
      db.select({ count: count() }).from(salesOrders).where(
        sql`${salesOrders.createdBy} = ${userId} OR ${salesOrders.salesRepId} = ${userId}`
      ),
      
      // Count sales returns handled by user
      db.select({ count: count() }).from(salesReturns).where(
        sql`${salesReturns.returnedBy} = ${userId} OR ${salesReturns.approvedBy} = ${userId}`
      ),
      
      // Count documents created by user
      db.select({ count: count() }).from(documents).where(eq(documents.createdBy, userId)),
      
      // Count audit logs for user actions
      db.select({ count: count() }).from(auditLogs).where(eq(auditLogs.userId, userId)),
      
      // Count approval requests by user
      db.select({ count: count() }).from(approvalRequests).where(
        sql`${approvalRequests.requestedBy} = ${userId} OR ${approvalRequests.currentApprover} = ${userId} OR ${approvalRequests.finalApprover} = ${userId}`
      ),
      
      // Count notifications
      db.select({ count: count() }).from(notificationQueue).where(eq(notificationQueue.userId, userId)),
      
      // Count inventory consumption
      db.select({ count: count() }).from(inventoryConsumption).where(eq(inventoryConsumption.consumedBy, userId)),
      
      // Count inventory adjustments
      db.select({ count: count() }).from(inventoryAdjustments).where(
        sql`${inventoryAdjustments.createdBy} = ${userId} OR ${inventoryAdjustments.approvedBy} = ${userId}`
      ),
      
      // Count stock transfers
      db.select({ count: count() }).from(stockTransfers).where(
        sql`${stockTransfers.authorizedBy} = ${userId} OR ${stockTransfers.executedBy} = ${userId}`
      ),
      
      // Count warehouse batches
      db.select({ count: count() }).from(warehouseBatches).where(eq(warehouseBatches.createdBy, userId)),
      
      // Count quality inspections
      db.select({ count: count() }).from(qualityInspections).where(
        sql`${qualityInspections.inspectedBy} = ${userId} OR ${qualityInspections.approvedBy} = ${userId}`
      ),
      
      // Count processing operations
      db.select({ count: count() }).from(processingOperations).where(
        sql`${processingOperations.operatorId} = ${userId} OR ${processingOperations.supervisorId} = ${userId}`
      ),
      
      // Count revenue ledger entries
      db.select({ count: count() }).from(revenueLedger).where(eq(revenueLedger.createdBy, userId)),
      
      // Count withdrawal records
      db.select({ count: count() }).from(withdrawalRecords).where(
        sql`${withdrawalRecords.createdBy} = ${userId} OR ${withdrawalRecords.approvedBy} = ${userId}`
      )
    ]);

    // Properly aggregate inventory operations
    const inventoryOperations = (inventoryConsumptionCount[0]?.count || 0) + 
                               (inventoryAdjustmentsCount[0]?.count || 0) + 
                               (stockTransfersCount[0]?.count || 0);
    
    // Properly aggregate warehouse operations
    const warehouseOperations = (warehouseBatchesCount[0]?.count || 0) + 
                               (qualityInspectionsCount[0]?.count || 0) + 
                               (processingOperationsCount[0]?.count || 0);
    
    // Properly aggregate financial transactions
    const financialTransactions = (revenueLedgerCount[0]?.count || 0) + 
                                 (withdrawalRecordsCount[0]?.count || 0);
    
    const counts = {
      capitalEntries: capitalEntriesCount[0]?.count || 0,
      purchases: purchasesCount[0]?.count || 0,
      salesOrders: salesOrdersCount[0]?.count || 0,
      salesReturns: salesReturnsCount[0]?.count || 0,
      documents: documentsCount[0]?.count || 0,
      auditLogs: auditLogsCount[0]?.count || 0,
      approvalRequests: approvalRequestsCount[0]?.count || 0,
      notifications: notificationsCount[0]?.count || 0,
      inventoryOperations,
      warehouseOperations,
      financialTransactions,
      total: 0
    };

    counts.total = Object.values(counts).reduce((sum, count) => sum + count, 0) - counts.total; // Exclude the total itself

    return counts;
  } catch (error) {
    console.error('Error counting business records for user', userId, error);
    // Return safe defaults that will trigger soft-delete
    return {
      capitalEntries: 1,
      purchases: 1,
      salesOrders: 1,
      salesReturns: 1,
      documents: 1,
      auditLogs: 1,
      approvalRequests: 1,
      notifications: 1,
      inventoryOperations: 1,
      warehouseOperations: 1,
      financialTransactions: 1,
      total: 11
    };
  }
}

// Helper function to get user last activity
async function getUserLastActivity(userId: string): Promise<Date | undefined> {
  try {
    const result = await db.execute(sql`
      SELECT MAX(timestamp) as last_activity FROM (
        SELECT created_at as timestamp FROM audit_logs WHERE user_id = ${userId}
        UNION ALL
        SELECT created_at as timestamp FROM purchases WHERE created_by = ${userId}
        UNION ALL
        SELECT created_at as timestamp FROM sales_orders WHERE created_by = ${userId}
        UNION ALL
        SELECT created_at as timestamp FROM capital_entries WHERE created_by = ${userId}
      ) combined
    `);

    const lastActivity = result.rows[0]?.last_activity;
    return lastActivity ? new Date(String(lastActivity)) : undefined;
  } catch (error) {
    console.error('Error getting last activity for user', userId, error);
    return undefined;
  }
}

// Comprehensive user audit endpoint
router.get('/audit', 
  supabaseAuthProvider.isAuthenticated, 
  supabaseAuthProvider.requireRole(['admin']), 
  async (req, res) => {
    try {
      // Super-admin only access
      if (!req.user?.isSuperAdmin) {
        return res.status(403).json({ 
          message: 'Super-admin access required for user audit operations' 
        });
      }

      console.log('🔍 Starting comprehensive user audit...');

      // Get all users
      const allUsers = await storage.getAllUsers();
      
      const auditRecords: UserAuditRecord[] = [];

      // Process users in parallel batches for efficiency
      const batchSize = 10;
      for (let i = 0; i < allUsers.length; i += batchSize) {
        const batch = allUsers.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (user) => {
            const [businessRecordCounts, lastActivity] = await Promise.all([
              getUserBusinessRecordCounts(user.id),
              getUserLastActivity(user.id)
            ]);

            // Determine cleanup strategy
            const canHardDelete = businessRecordCounts.total === 0;
            const needsSoftDelete = businessRecordCounts.total > 0;

            // Assess risk level based on role and business record importance
            let riskLevel: UserAuditRecord['riskLevel'] = 'low';
            
            if (user.isSuperAdmin) {
              riskLevel = 'critical';
            } else if (user.role === 'admin' && user.isActive) {
              riskLevel = 'high';
            } else if (businessRecordCounts.total > 10 || businessRecordCounts.financialTransactions > 0) {
              riskLevel = 'high';
            } else if (businessRecordCounts.total > 5 || user.role === 'finance') {
              riskLevel = 'medium';
            }

            const auditRecord: UserAuditRecord = {
              user,
              businessRecordCounts,
              canHardDelete,
              needsSoftDelete,
              lastActivity,
              riskLevel
            };

            return auditRecord;
          })
        );

        auditRecords.push(...batchResults);
      }

      // Sort by risk level and business record count
      auditRecords.sort((a, b) => {
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return b.businessRecordCounts.total - a.businessRecordCounts.total;
      });

      // Generate summary statistics
      const summary = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.isActive).length,
        inactiveUsers: allUsers.filter(u => !u.isActive).length,
        superAdmins: allUsers.filter(u => u.isSuperAdmin).length,
        adminUsers: allUsers.filter(u => u.role === 'admin').length,
        canHardDelete: auditRecords.filter(r => r.canHardDelete).length,
        needsSoftDelete: auditRecords.filter(r => r.needsSoftDelete).length,
        riskBreakdown: {
          critical: auditRecords.filter(r => r.riskLevel === 'critical').length,
          high: auditRecords.filter(r => r.riskLevel === 'high').length,
          medium: auditRecords.filter(r => r.riskLevel === 'medium').length,
          low: auditRecords.filter(r => r.riskLevel === 'low').length
        },
        testAccountPatterns: {
          exampleEmails: auditRecords.filter(r => r.user.email?.includes('@example.com')).length,
          testPrefixes: auditRecords.filter(r => r.user.email?.startsWith('test')).length,
          demoAccounts: auditRecords.filter(r => r.user.email?.includes('demo')).length
        }
      };

      console.log('✅ User audit completed:', summary);

      res.json({
        success: true,
        summary,
        auditRecords,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error during user audit:', error);
      res.status(500).json({ 
        message: 'User audit failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Bulk user cleanup endpoint
router.post('/cleanup', 
  supabaseAuthProvider.isAuthenticated, 
  supabaseAuthProvider.requireRole(['admin']), 
  async (req, res) => {
    try {
      // Super-admin only access
      if (!req.user?.isSuperAdmin) {
        return res.status(403).json({ 
          message: 'Super-admin access required for user cleanup operations' 
        });
      }

      const parsed = userCleanupSchema.parse(req.body);
      const { userIds, action, reason, preserveAuditLogs } = parsed;

      console.log(`🧹 Starting bulk user cleanup: ${action} for ${userIds.length} users`);

      // Validation: Prevent self-deletion
      if (userIds.includes(req.user.id)) {
        return res.status(400).json({
          message: 'Cannot perform cleanup operations on your own account'
        });
      }

      // Get users to be cleaned up
      const usersToCleanup = await Promise.all(
        userIds.map(id => storage.getUser(id))
      );

      const validUsers = usersToCleanup.filter(user => user !== undefined) as User[];
      
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({
          message: 'Some user IDs were not found',
          found: validUsers.length,
          requested: userIds.length
        });
      }

      // Validate last-super-admin guard
      const superAdminsToDelete = validUsers.filter(u => u.isSuperAdmin);
      if (superAdminsToDelete.length > 0) {
        const totalSuperAdminsResult = await db.select({ count: count() }).from(users).where(
          and(eq(users.isSuperAdmin, true), eq(users.isActive, true))
        );
        const remainingSuperAdmins = (totalSuperAdminsResult[0]?.count || 0) - superAdminsToDelete.length;
        
        if (remainingSuperAdmins < 1) {
          return res.status(400).json({
            message: 'Cannot delete all super-admins. At least one must remain active.',
            currentSuperAdmins: totalSuperAdminsResult[0]?.count || 0,
            attemptingToDelete: superAdminsToDelete.length
          });
        }
      }

      // Validate last-admin guard for regular admins
      const adminsToDelete = validUsers.filter(u => u.role === 'admin' && u.isActive);
      if (adminsToDelete.length > 0 && action !== 'deactivate') {
        const totalAdminsResult = await db.select({ count: count() }).from(users).where(
          and(eq(users.role, 'admin'), eq(users.isActive, true))
        );
        const remainingAdmins = (totalAdminsResult[0]?.count || 0) - adminsToDelete.length;
        
        if (remainingAdmins < 1) {
          return res.status(400).json({
            message: 'Cannot delete all admin users. At least one must remain active.',
            currentAdmins: totalAdminsResult[0]?.count || 0,
            attemptingToDelete: adminsToDelete.length
          });
        }
      }

      const results: Array<{ userId: string, email: string, success: boolean, error?: string }> = [];

      // Process cleanup operations
      for (const user of validUsers) {
        try {
          switch (action) {
            case 'hard_delete':
              // Verify user has no business records
              const businessRecords = await getUserBusinessRecordCounts(user.id);
              if (businessRecords.total > 0) {
                results.push({
                  userId: user.id,
                  email: user.email || 'unknown',
                  success: false,
                  error: `User has ${businessRecords.total} business records. Use soft_delete_anonymize instead.`
                });
                continue;
              }
              
              // Execute hard delete in transaction with external auth cleanup
              await db.transaction(async (tx) => {
                // 1. Delete from local database first (cascades to user_warehouse_scopes)
                await tx.delete(users).where(eq(users.id, user.id));
                
                // 2. Delete from Supabase Auth if user exists there
                if (user.authProviderUserId && process.env.AUTH_PROVIDER === 'supabase') {
                  try {
                    const admin = supabaseAdmin();
                    await admin.auth.admin.deleteUser(user.authProviderUserId);
                    console.log(`Deleted Supabase user: ${user.authProviderUserId} for ${user.email}`);
                  } catch (supabaseError) {
                    console.error(`Failed to delete Supabase user ${user.authProviderUserId}:`, supabaseError);
                    // Log but don't fail the entire operation
                  }
                }
                
                // 3. Log the deletion (done after successful deletion to ensure consistency)
                await auditService.logOperation({
                  userId: req.user!.id,
                  userName: req.user!.email || 'Unknown',
                  userRole: req.user!.role,
                  source: 'user_management',
                  severity: 'warning',
                  businessContext: `Hard delete user: ${user.email} - ${reason}`
                }, {
                  entityType: 'user',
                  entityId: user.id,
                  action: 'delete',
                  description: `Hard deleted user: ${user.email} and external auth account`,
                  operationType: 'user_role_change',
                  oldValues: { 
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    authProviderUserId: user.authProviderUserId
                  },
                  newValues: undefined
                });
              });

              results.push({
                userId: user.id,
                email: user.email || 'unknown',
                success: true
              });
              break;

            case 'soft_delete_anonymize':
              // Execute soft delete with anonymization in transaction
              await db.transaction(async (tx) => {
                const anonymizedEmail = `deleted_user_${user.id.slice(0, 8)}@anonymized.local`;
                
                // 1. Update user record with anonymized data
                await tx.update(users)
                  .set({
                    isActive: false,
                    email: anonymizedEmail,
                    firstName: 'Deleted',
                    lastName: 'User',
                    profileImageUrl: null,
                    authProviderUserId: null,
                    updatedAt: new Date()
                  })
                  .where(eq(users.id, user.id));
                
                // 2. Audit logs are immutable - never update or delete them
                // They serve as a permanent historical record
                // Note: preserveAuditLogs flag is ignored as audit logs must always be preserved
                
                // 3. Deactivate Supabase user (but don't delete for soft-delete)
                if (user.authProviderUserId && process.env.AUTH_PROVIDER === 'supabase') {
                  try {
                    const admin = supabaseAdmin();
                    // Deactivate rather than delete for soft-delete
                    await admin.auth.admin.updateUserById(user.authProviderUserId, {
                      ban_duration: 'none',
                      email: anonymizedEmail
                    });
                    console.log(`Anonymized Supabase user: ${user.authProviderUserId} for ${user.email}`);
                  } catch (supabaseError) {
                    console.error(`Failed to anonymize Supabase user ${user.authProviderUserId}:`, supabaseError);
                    // Log but don't fail the entire operation
                  }
                }
                
                // 4. Log the soft deletion
                await auditService.logOperation({
                  userId: req.user!.id,
                  userName: req.user!.email || 'Unknown',
                  userRole: req.user!.role,
                  source: 'user_management',
                  severity: 'warning',
                  businessContext: `Soft delete with anonymization: ${user.email} - ${reason}`
                }, {
                  entityType: 'user',
                  entityId: user.id,
                  action: 'update',
                  description: `Soft deleted and anonymized user: ${user.email}`,
                  operationType: 'user_role_change',
                  oldValues: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isActive: user.isActive,
                    authProviderUserId: user.authProviderUserId
                  },
                  newValues: {
                    email: anonymizedEmail,
                    firstName: 'Deleted',
                    lastName: 'User',
                    isActive: false,
                    authProviderUserId: null
                  }
                });
              });

              results.push({
                userId: user.id,
                email: user.email || 'unknown',
                success: true
              });
              break;

            case 'deactivate':
              // Execute deactivation in transaction
              await db.transaction(async (tx) => {
                // 1. Deactivate user
                await tx.update(users)
                  .set({
                    isActive: false,
                    updatedAt: new Date()
                  })
                  .where(eq(users.id, user.id));

                // 2. Log the deactivation
                await auditService.logOperation({
                  userId: req.user!.id,
                  userName: req.user!.email || 'Unknown',
                  userRole: req.user!.role,
                  source: 'user_management',
                  severity: 'info',
                  businessContext: `Deactivated user: ${user.email} - ${reason}`
                }, {
                  entityType: 'user',
                  entityId: user.id,
                  action: 'update',
                  description: `Deactivated user: ${user.email}`,
                  operationType: 'user_role_change',
                  oldValues: { isActive: user.isActive },
                  newValues: { isActive: false }
                });
              });

              results.push({
                userId: user.id,
                email: user.email || 'unknown',
                success: true
              });
              break;
          }
        } catch (error) {
          console.error(`Error processing cleanup for user ${user.id}:`, error);
          results.push({
            userId: user.id,
            email: user.email || 'unknown',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`✅ Bulk user cleanup completed: ${successCount} success, ${failureCount} failures`);

      res.json({
        success: true,
        action,
        reason,
        processedCount: results.length,
        successCount,
        failureCount,
        results,
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error during bulk user cleanup:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid request data',
          errors: error.errors
        });
      }

      res.status(500).json({ 
        message: 'Bulk user cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;