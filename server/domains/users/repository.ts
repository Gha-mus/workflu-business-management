import { db } from "../../core/db";
import { 
  users, 
  userWarehouseScopes,
  type User, 
  type UpsertUser,
  type UserWarehouseScope,
  type InsertUserWarehouseScope
} from "@shared/schema";
import { BaseRepository } from "../../shared/base/BaseRepository";
import type { AuditContext } from "../../auditService";
import { eq, sql, and } from "drizzle-orm";

export class UserRepository extends BaseRepository<User, UpsertUser> {
  protected table = users;
  protected tableName = 'users';

  async upsertUser(user: UpsertUser, auditContext?: AuditContext): Promise<User> {
    const [result] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (auditContext) {
      await this.logAuditOperation('upsert', result.id, user, null, auditContext);
    }

    return result;
  }

  async countAdminUsers(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
    
    return Number(result[0]?.count || 0);
  }

  async updateUserRole(
    id: string, 
    role: User['role'], 
    auditContext?: AuditContext
  ): Promise<User> {
    // Get old user data for audit trail
    const [oldUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!oldUser) {
      throw new Error(`User not found: ${id}`);
    }

    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (auditContext) {
      await this.logAuditOperation(
        'update',
        id,
        { role },
        { role: oldUser.role },
        auditContext
      );
    }
    
    return user;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async updateSuperAdminStatus(id: string, isSuperAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isSuperAdmin, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async updateDisplayName(id: string, firstName: string, lastName: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ firstName, lastName, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async deleteUser(id: string, auditContext?: AuditContext): Promise<User> {
    return await this.delete(id, auditContext);
  }

  async anonymizeUserData(id: string, auditContext?: AuditContext): Promise<User> {
    // Get user for audit
    const [oldUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!oldUser) {
      throw new Error(`User not found: ${id}`);
    }

    const anonymizedData = {
      email: `anonymized_${id}@deleted.local`,
      firstName: 'Deleted',
      lastName: 'User',
      isActive: false,
      updatedAt: new Date()
    };

    const [user] = await db
      .update(users)
      .set(anonymizedData)
      .where(eq(users.id, id))
      .returning();

    if (auditContext) {
      // Use 'update' as the closest standard audit action for anonymization
      await this.logAuditOperation(
        'update',
        id,
        anonymizedData,
        oldUser,
        auditContext
      );
    }

    return user;
  }

  async checkUserBusinessRecords(userId: string): Promise<{
    hasPurchases: boolean;
    hasOrders: boolean;
    hasCapitalEntries: boolean;
    hasWarehouseStock: boolean;
  }> {
    // This would check various business tables for user references
    // Implementation would depend on actual business logic requirements
    const [purchaseCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(db.select().from(users).where(eq(users.id, userId)).as('user_check'));

    return {
      hasPurchases: false, // Would implement actual checks
      hasOrders: false,
      hasCapitalEntries: false,
      hasWarehouseStock: false
    };
  }

  async bulkCleanupUsers(userIds: string[], auditContext?: AuditContext): Promise<{
    processed: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    const results = {
      processed: 0,
      errors: [] as Array<{ userId: string; error: string }>
    };

    for (const userId of userIds) {
      try {
        await this.anonymizeUserData(userId, auditContext);
        results.processed++;
      } catch (error) {
        results.errors.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async logAuditOperation(
    action: 'create' | 'update' | 'delete',
    entityId: string,
    newValues: any,
    oldValues: any,
    auditContext: AuditContext
  ): Promise<void> {
    const { auditService } = await import("../../auditService");
    
    // Map non-standard actions to standard audit actions
    const auditAction = action === 'delete' ? 'delete' as const : action === 'update' ? 'update' as const : 'create' as const;
    
    await auditService.logOperation(auditContext, {
      entityType: this.tableName,
      entityId,
      action: auditAction,
      newValues,
      oldValues,
      description: `${action} user`,
      businessContext: `User management - ${action} user`
    });
  }
}

export class UserWarehouseScopeRepository extends BaseRepository<UserWarehouseScope, InsertUserWarehouseScope> {
  protected table = userWarehouseScopes;
  protected tableName = 'userWarehouseScopes';

  async findByUserId(userId: string): Promise<UserWarehouseScope[]> {
    const results = await db
      .select()
      .from(userWarehouseScopes)
      .where(eq(userWarehouseScopes.userId, userId));
    
    return results;
  }

  async createUserWarehouseScope(scope: InsertUserWarehouseScope, auditContext?: AuditContext): Promise<UserWarehouseScope> {
    return await this.create(scope, auditContext);
  }

  async deleteUserWarehouseScope(id: string, auditContext?: AuditContext): Promise<UserWarehouseScope> {
    return await this.delete(id, auditContext);
  }
}