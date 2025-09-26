import { db } from "../../core/db";
import { capitalEntries, type CapitalEntry, type InsertCapitalEntry } from "@shared/schema";
import { BaseRepository, type BaseEntity } from "../../shared/base/BaseRepository";
import type { AuditContext } from "../../auditService";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export class CapitalRepository extends BaseRepository<CapitalEntry, InsertCapitalEntry> {
  protected table = capitalEntries;
  protected tableName = 'capitalEntries';

  async findByType(type: string): Promise<CapitalEntry[]> {
    const results = await db
      .select()
      .from(capitalEntries)
      .where(eq(capitalEntries.type, type))
      .orderBy(capitalEntries.createdAt);
    
    return results;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<CapitalEntry[]> {
    const results = await db
      .select()
      .from(capitalEntries)
      .where(and(
        gte(capitalEntries.createdAt, startDate),
        lte(capitalEntries.createdAt, endDate)
      ))
      .orderBy(capitalEntries.createdAt);
    
    return results;
  }

  async getBalance(): Promise<number> {
    const result = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0)` 
      })
      .from(capitalEntries);
    
    return Number(result[0]?.total || 0);
  }

  async getBalanceByType(type: string): Promise<number> {
    const result = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(amount), 0)` 
      })
      .from(capitalEntries)
      .where(eq(capitalEntries.type, type));
    
    return Number(result[0]?.total || 0);
  }

  async getBalanceByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const result = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0)` 
      })
      .from(capitalEntries)
      .where(and(
        gte(capitalEntries.createdAt, startDate),
        lte(capitalEntries.createdAt, endDate)
      ));
    
    return Number(result[0]?.total || 0);
  }

  // Transaction-aware method for cross-domain operations
  async createCapitalEntryWithTransaction(tx: any, entryData: any): Promise<void> {
    await tx
      .insert(capitalEntries)
      .values(entryData);
  }

  async generateNextEntryNumber(): Promise<string> {
    const result = await db
      .select({ 
        maxNumber: sql<number>`COALESCE(MAX(CAST(SUBSTRING(number FROM '[0-9]+') AS INTEGER)), 0)` 
      })
      .from(capitalEntries)
      .where(sql`number ~ '^CE[0-9]+$'`);
    
    const nextNumber = (result[0]?.maxNumber || 0) + 1;
    return `CE${String(nextNumber).padStart(6, '0')}`;
  }

  async createWithConcurrencyProtection(
    entry: InsertCapitalEntry, 
    auditContext?: AuditContext
  ): Promise<CapitalEntry> {
    return await this.runInTransaction(async (tx) => {
      // Check if entry number already exists
      if (entry.number) {
        const existing = await tx
          .select()
          .from(capitalEntries)
          .where(eq(capitalEntries.number, entry.number))
          .limit(1);
        
        if (existing.length > 0) {
          throw new Error(`Capital entry number ${entry.number} already exists`);
        }
      }

      // Create the entry
      const [created] = await tx
        .insert(capitalEntries)
        .values(entry)
        .returning();

      if (auditContext) {
        await this.logAuditOperation('create', created.id, entry, null, auditContext);
      }

      return created;
    });
  }

  private async logAuditOperation(
    action: 'create' | 'update' | 'delete',
    entityId: string,
    newValues: any,
    oldValues: any,
    auditContext: AuditContext
  ): Promise<void> {
    const { auditService } = await import("../../auditService");
    
    await auditService.logOperation(auditContext, {
      entityType: this.tableName,
      entityId,
      action,
      newValues,
      oldValues,
      description: `${action} capital entry`,
      businessContext: `Capital management - ${action} entry`
    });
  }
}