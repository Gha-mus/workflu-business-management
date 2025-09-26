import { UserRepository, UserWarehouseScopeRepository } from "./repository";
import { BaseService } from "../../shared/base/BaseService";
import type { 
  User, 
  UpsertUser,
  UserWarehouseScope,
  InsertUserWarehouseScope
} from "@shared/schema";
import type { AuditContext } from "../../auditService";
import { upsertUserSchema, insertUserWarehouseScopeSchema } from "@shared/schema";

export interface ApprovalGuardContext {
  userId: string;
  userRole: string;
  operationType: string;
  operationData: any;
  businessContext: string;
  skipValidation?: boolean;
}

export class UserService extends BaseService<User, UpsertUser> {
  protected repository = new UserRepository();
  protected createSchema = upsertUserSchema;
  protected updateSchema = upsertUserSchema.partial();

  private warehouseScopeRepository = new UserWarehouseScopeRepository();

  async getUser(id: string): Promise<User | undefined> {
    return await this.repository.findById(id);
  }

  async upsertUser(user: UpsertUser, auditContext?: AuditContext): Promise<User> {
    // Validate business rules
    await this.validateUser(user);

    return await this.repository.upsertUser(user, auditContext);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.repository.findAll();
  }

  async countAdminUsers(): Promise<number> {
    return await this.repository.countAdminUsers();
  }

  async updateUserRole(
    id: string, 
    role: User['role'], 
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<User> {
    // Apply approval guard for role changes
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate role
    await this.validateUserRole(role);

    return await this.repository.updateUserRole(id, role, auditContext);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    return await this.repository.updateUserStatus(id, isActive);
  }

  async updateSuperAdminStatus(id: string, isSuperAdmin: boolean): Promise<User> {
    // Only allow super admin status changes with strict validation
    await this.validateSuperAdminChange(id, isSuperAdmin);

    return await this.repository.updateSuperAdminStatus(id, isSuperAdmin);
  }

  async updateDisplayName(id: string, firstName: string, lastName: string): Promise<User> {
    // Validate names
    await this.validateUserNames(firstName, lastName);

    return await this.repository.updateDisplayName(id, firstName, lastName);
  }

  async deleteUser(id: string, auditContext?: AuditContext): Promise<User> {
    // Check for business records before deletion
    const businessRecords = await this.repository.checkUserBusinessRecords(id);
    
    if (businessRecords.hasPurchases || businessRecords.hasOrders || 
        businessRecords.hasCapitalEntries || businessRecords.hasWarehouseStock) {
      throw new Error('Cannot delete user with active business records. Use anonymization instead.');
    }

    return await this.repository.deleteUser(id, auditContext);
  }

  async anonymizeUserData(id: string, auditContext?: AuditContext): Promise<User> {
    return await this.repository.anonymizeUserData(id, auditContext);
  }

  async checkUserBusinessRecords(userId: string): Promise<{
    hasPurchases: boolean;
    hasOrders: boolean;
    hasCapitalEntries: boolean;
    hasWarehouseStock: boolean;
  }> {
    return await this.repository.checkUserBusinessRecords(userId);
  }

  async bulkCleanupUsers(userIds: string[], auditContext?: AuditContext): Promise<{
    processed: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    return await this.repository.bulkCleanupUsers(userIds, auditContext);
  }

  // Warehouse scope operations
  async getUserWarehouseScopes(userId: string): Promise<UserWarehouseScope[]> {
    return await this.warehouseScopeRepository.findByUserId(userId);
  }

  async createUserWarehouseScope(
    scope: InsertUserWarehouseScope, 
    auditContext?: AuditContext
  ): Promise<UserWarehouseScope> {
    return await this.warehouseScopeRepository.createUserWarehouseScope(scope, auditContext);
  }

  async deleteUserWarehouseScope(
    id: string, 
    auditContext?: AuditContext
  ): Promise<UserWarehouseScope> {
    return await this.warehouseScopeRepository.deleteUserWarehouseScope(id, auditContext);
  }

  private async validateUser(user: UpsertUser): Promise<void> {
    // Validate email format
    if (user.email && !this.isValidEmail(user.email)) {
      throw new Error('Invalid email format');
    }

    // Validate names
    if (user.firstName && user.lastName) {
      await this.validateUserNames(user.firstName, user.lastName);
    }

    // Validate role
    if (user.role) {
      await this.validateUserRole(user.role);
    }
  }

  private async validateUserRole(role: User['role']): Promise<void> {
    const validRoles = ['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid user role: ${role}`);
    }
  }

  private async validateUserNames(firstName: string, lastName: string): Promise<void> {
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!lastName || lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (firstName.length > 50) {
      throw new Error('First name must be 50 characters or less');
    }

    if (lastName.length > 50) {
      throw new Error('Last name must be 50 characters or less');
    }
  }

  private async validateSuperAdminChange(id: string, isSuperAdmin: boolean): Promise<void> {
    if (isSuperAdmin) {
      // Additional validation for granting super admin privileges
      const user = await this.repository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.role !== 'admin') {
        throw new Error('Only admin users can be granted super admin privileges');
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async enforceApprovalRequirement(approvalContext: ApprovalGuardContext): Promise<void> {
    const { StorageApprovalGuard } = await import("../../storage");
    
    await StorageApprovalGuard.enforceApprovalRequirement({
      userId: approvalContext.userId,
      userRole: approvalContext.userRole,
      operationType: approvalContext.operationType,
      operationData: approvalContext.operationData,
      businessContext: approvalContext.businessContext,
      skipValidation: approvalContext.skipValidation
    });
  }

  // Business logic hooks
  protected async validateCreate(data: UpsertUser): Promise<void> {
    await this.validateUser(data);
  }

  protected async afterCreate(entity: User, auditContext?: AuditContext): Promise<void> {
    // Log business event
    console.log(`User created: ${entity.email} - ${entity.role}`);
    
    // Additional side effects can be added here (welcome email, etc.)
  }
}