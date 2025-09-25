import { db } from "../../core/db";
import { auditService } from "../../auditService";
import type { AuditContext } from "../../auditService";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

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
  protected abstract table: PgTable;
  protected abstract auditHooks?: AuditHooks<TEntity>;

  async findById(id: string): Promise<TEntity | undefined> {
    const results = await db
      .select()
      .from(this.table)
      .where(and(
        eq(this.table.id, id),
        isNull(this.table.deletedAt)
      ))
      .limit(1);
    
    return results[0] as TEntity | undefined;
  }

  async findAll(): Promise<TEntity[]> {
    const results = await db
      .select()
      .from(this.table)
      .where(isNull(this.table.deletedAt));
    
    return results as TEntity[];
  }

  async create(data: TInsert, auditContext?: AuditContext): Promise<TEntity> {
    await this.auditHooks?.beforeCreate?.(data as TEntity, auditContext);

    const [created] = await db
      .insert(this.table)
      .values(data)
      .returning();

    const entity = created as TEntity;

    if (auditContext) {
      await auditService.logActivity({
        userId: auditContext.userId,
        action: 'create',
        resource: this.table._.name,
        resourceId: entity.id,
        details: { created: data },
        userRole: auditContext.userRole,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });
    }

    await this.auditHooks?.afterCreate?.(entity, auditContext);

    return entity;
  }

  async update(id: string, updates: Partial<TInsert>, auditContext?: AuditContext): Promise<TEntity> {
    await this.auditHooks?.beforeUpdate?.(id, updates as Partial<TEntity>, auditContext);

    const [updated] = await db
      .update(this.table)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(this.table.id, id),
        isNull(this.table.deletedAt)
      ))
      .returning();

    if (!updated) {
      throw new Error(`${this.table._.name} with id ${id} not found`);
    }

    const entity = updated as TEntity;

    if (auditContext) {
      await auditService.logActivity({
        userId: auditContext.userId,
        action: 'update',
        resource: this.table._.name,
        resourceId: id,
        details: { updates },
        userRole: auditContext.userRole,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });
    }

    await this.auditHooks?.afterUpdate?.(entity, auditContext);

    return entity;
  }

  async delete(id: string, auditContext?: AuditContext): Promise<TEntity> {
    await this.auditHooks?.beforeDelete?.(id, auditContext);

    const [deleted] = await db
      .delete(this.table)
      .where(and(
        eq(this.table.id, id),
        isNull(this.table.deletedAt)
      ))
      .returning();

    if (!deleted) {
      throw new Error(`${this.table._.name} with id ${id} not found`);
    }

    const entity = deleted as TEntity;

    if (auditContext) {
      await auditService.logActivity({
        userId: auditContext.userId,
        action: 'delete',
        resource: this.table._.name,
        resourceId: id,
        details: { deleted: entity },
        userRole: auditContext.userRole,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });
    }

    await this.auditHooks?.afterDelete?.(entity, auditContext);

    return entity;
  }

  async softDelete(id: string, auditContext?: AuditContext): Promise<TEntity> {
    await this.auditHooks?.beforeDelete?.(id, auditContext);

    const [deleted] = await db
      .update(this.table)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(this.table.id, id),
        isNull(this.table.deletedAt)
      ))
      .returning();

    if (!deleted) {
      throw new Error(`${this.table._.name} with id ${id} not found`);
    }

    const entity = deleted as TEntity;

    if (auditContext) {
      await auditService.logActivity({
        userId: auditContext.userId,
        action: 'soft_delete',
        resource: this.table._.name,
        resourceId: id,
        details: { soft_deleted: entity },
        userRole: auditContext.userRole,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });
    }

    await this.auditHooks?.afterDelete?.(entity, auditContext);

    return entity;
  }

  async count(): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(this.table)
      .where(isNull(this.table.deletedAt));
    
    return Number(result.count);
  }

  protected async runInTransaction<T>(
    callback: (tx: typeof db) => Promise<T>
  ): Promise<T> {
    return await db.transaction(callback);
  }
}