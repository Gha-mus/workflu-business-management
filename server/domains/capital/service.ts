import { CapitalRepository } from "./repository";
import { BaseService } from "../../shared/base/BaseService";
import type { CapitalEntry, InsertCapitalEntry } from "@shared/schema";
import type { AuditContext } from "../../auditService";
import { insertCapitalEntrySchema } from "@shared/schema";

export interface ApprovalGuardContext {
  userId: string;
  userRole: string;
  operationType: string;
  operationData: any;
  businessContext: string;
  skipValidation?: boolean;
}

export class CapitalService extends BaseService<CapitalEntry, InsertCapitalEntry> {
  protected repository = new CapitalRepository();
  protected createSchema = insertCapitalEntrySchema;
  protected updateSchema = insertCapitalEntrySchema.partial();

  async getCapitalEntries(): Promise<CapitalEntry[]> {
    return await this.repository.findAll();
  }

  async getCapitalEntryById(id: string): Promise<CapitalEntry | undefined> {
    return await this.repository.findById(id);
  }

  async getCapitalEntriesByType(type: string): Promise<CapitalEntry[]> {
    return await this.repository.findByType(type);
  }

  async getCapitalBalance(): Promise<number> {
    return await this.repository.getBalance();
  }

  async createCapitalEntry(
    entry: InsertCapitalEntry, 
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<CapitalEntry> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Generate entry number if not provided
    if (!entry.number) {
      entry.number = await this.repository.generateNextEntryNumber();
    }

    // Validate business rules
    await this.validateCapitalEntry(entry);

    return await this.repository.create(entry, auditContext);
  }

  async createCapitalEntryWithConcurrencyProtection(
    entry: InsertCapitalEntry, 
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<CapitalEntry> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Generate entry number if not provided
    if (!entry.number) {
      entry.number = await this.repository.generateNextEntryNumber();
    }

    // Validate business rules
    await this.validateCapitalEntry(entry);

    return await this.repository.createWithConcurrencyProtection(entry, auditContext);
  }

  async getCapitalBalanceByType(type: string): Promise<number> {
    return await this.repository.getBalanceByType(type);
  }

  async getCapitalBalanceByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return await this.repository.getBalanceByDateRange(startDate, endDate);
  }

  private async validateCapitalEntry(entry: InsertCapitalEntry): Promise<void> {
    // Validate amount is positive
    if (entry.amount <= 0) {
      throw new Error('Capital entry amount must be positive');
    }

    // Validate type
    const validTypes = ['credit', 'debit', 'investment', 'withdrawal', 'adjustment'];
    if (!validTypes.includes(entry.type)) {
      throw new Error(`Invalid capital entry type: ${entry.type}`);
    }

    // Validate currency
    const validCurrencies = ['USD', 'ETB'];
    if (!validCurrencies.includes(entry.currency)) {
      throw new Error(`Invalid currency: ${entry.currency}`);
    }

    // Additional business-specific validations can be added here
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
  protected async validateCreate(data: InsertCapitalEntry): Promise<void> {
    await this.validateCapitalEntry(data);
  }

  protected async beforeCreate(data: InsertCapitalEntry, auditContext?: AuditContext): Promise<InsertCapitalEntry> {
    // Generate entry number if not provided
    if (!data.number) {
      data.number = await this.repository.generateNextEntryNumber();
    }

    return data;
  }

  protected async afterCreate(entity: CapitalEntry, auditContext?: AuditContext): Promise<void> {
    // Log business event
    console.log(`Capital entry created: ${entity.number} - ${entity.currency} ${entity.amount}`);
    
    // Additional side effects can be added here (notifications, etc.)
  }
}