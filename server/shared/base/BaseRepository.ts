import { db } from "../../core/db";
import { auditService } from "../../auditService";
import type { AuditContext, ChangeRecord } from "../../auditService";
import { eq, and, isNull, sql } from "drizzle-orm";

export interface BaseEntity {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AuditHooks<TEntity> {
  beforeCreate?(entity: TEntity, context?: AuditContext): Promise<void>;
  afterCreate?(entity: TEntity, context?: AuditContext): Promise<void>;
  beforeUpdate?(id: string, updates: Partial<TEntity>, context?: AuditContext): Promise<void>;
  afterUpdate?(entity: TEntity, context?: AuditContext): Promise<void>;
  beforeDelete?(id: string, context?: AuditContext): Promise<void>;
  afterDelete?(entity: TEntity, context?: AuditContext): Promise<void>;
}

export abstract class BaseRepository<TEntity extends BaseEntity, TInsert> {
  protected abstract table: any; // Use any to avoid complex PgTable typing issues
  protected abstract tableName: string; // Explicit table name for audit logging
  protected abstract auditHooks?: AuditHooks<TEntity>;

  async findById(id: string): Promise<TEntity | undefined> {
    const results = await db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return results[0] as TEntity | undefined;
  }

  async findAll(): Promise<TEntity[]> {
    const results = await db
      .select()
      .from(this.table);
    
    return results as TEntity[];
  }

  async create(data: TInsert, auditContext?: AuditContext): Promise<TEntity> {
    await this.auditHooks?.beforeCreate?.(data as unknown as TEntity, auditContext);

    const [created] = await db
      .insert(this.table)
      .values(data as any)
      .returning();

    const entity = created as TEntity;

    if (auditContext) {
      await auditService.logOperation(auditContext, {
        entityType: this.tableName,
        entityId: entity.id,
        action: 'create',
        newValues: data as any,
        description: `Created ${this.tableName}`,
        businessContext: `${this.tableName} creation`
      });
    }

    await this.auditHooks?.afterCreate?.(entity, auditContext);

    return entity;
  }

  async update(id: string, updates: Partial<TInsert>, auditContext?: AuditContext): Promise<TEntity> {
    await this.auditHooks?.beforeUpdate?.(id, updates as Partial<TEntity>, auditContext);

    // Get old values for audit
    const [oldEntity] = await db.select().from(this.table).where(eq(this.table.id, id));

    const [updated] = await db
      .update(this.table)
      .set({
        ...updates,
        updatedAt: new Date()
      } as any)
      .where(eq(this.table.id, id))
      .returning();

    if (!updated) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }

    const entity = updated as TEntity;

    if (auditContext) {
      await auditService.logOperation(auditContext, {
        entityType: this.tableName,
        entityId: id,
        action: 'update',
        oldValues: oldEntity,
        newValues: updates as any,
        description: `Updated ${this.tableName}`,
        businessContext: `${this.tableName} update`
      });
    }

    await this.auditHooks?.afterUpdate?.(entity, auditContext);

    return entity;
  }

  async delete(id: string, auditContext?: AuditContext): Promise<TEntity> {
    await this.auditHooks?.beforeDelete?.(id, auditContext);

    // Get entity for audit before deletion
    const [entityToDelete] = await db.select().from(this.table).where(eq(this.table.id, id));

    const [deleted] = await db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();

    if (!deleted) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }

    const entity = deleted as TEntity;

    if (auditContext) {
      await auditService.logOperation(auditContext, {
        entityType: this.tableName,
        entityId: id,
        action: 'delete',
        oldValues: entityToDelete,
        description: `Deleted ${this.tableName}`,
        businessContext: `${this.tableName} deletion`
      });
    }

    await this.auditHooks?.afterDelete?.(entity, auditContext);

    return entity;
  }

  async count(): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(this.table);
    
    return Number(result.count);
  }

  protected async runInTransaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    return await db.transaction(callback);
  }
}