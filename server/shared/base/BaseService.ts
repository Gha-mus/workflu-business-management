import type { AuditContext } from "../../auditService";
import type { BaseRepository, BaseEntity } from "./BaseRepository";
import { z } from "zod";

export interface ValidationContext {
  isUpdate?: boolean;
  existingEntity?: BaseEntity;
  userId?: string;
}

export interface ServiceOptions {
  skipValidation?: boolean;
  skipAudit?: boolean;
  skipApproval?: boolean;
}

export abstract class BaseService<
  TEntity extends BaseEntity,
  TInsert,
  TUpdate = Partial<TInsert>
> {
  protected abstract repository: BaseRepository<TEntity, TInsert>;
  protected abstract createSchema?: z.ZodSchema<TInsert>;
  protected abstract updateSchema?: z.ZodSchema<TUpdate>;

  async findById(id: string): Promise<TEntity | undefined> {
    return await this.repository.findById(id);
  }

  async findAll(): Promise<TEntity[]> {
    return await this.repository.findAll();
  }

  async create(
    data: TInsert,
    auditContext?: AuditContext,
    options: ServiceOptions = {}
  ): Promise<TEntity> {
    // Validation
    if (!options.skipValidation && this.createSchema) {
      const validationResult = this.createSchema.safeParse(data);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error.message}`);
      }
    }

    // Custom business validation
    await this.validateCreate?.(data, { userId: auditContext?.userId });

    // Apply business logic transformations
    const processedData = await this.beforeCreate?.(data, auditContext) || data;

    // Create entity
    const entity = await this.repository.create(processedData, auditContext);

    // Post-creation side effects
    await this.afterCreate?.(entity, auditContext);

    return entity;
  }

  async update(
    id: string,
    updates: TUpdate,
    auditContext?: AuditContext,
    options: ServiceOptions = {}
  ): Promise<TEntity> {
    // Get existing entity
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    // Validation
    if (!options.skipValidation && this.updateSchema) {
      const validationResult = this.updateSchema.safeParse(updates);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error.message}`);
      }
    }

    // Custom business validation
    await this.validateUpdate?.(id, updates, {
      isUpdate: true,
      existingEntity: existing,
      userId: auditContext?.userId
    });

    // Apply business logic transformations
    const processedUpdates = await this.beforeUpdate?.(id, updates, existing, auditContext) || updates;

    // Update entity
    const entity = await this.repository.update(id, processedUpdates as Partial<TInsert>, auditContext);

    // Post-update side effects
    await this.afterUpdate?.(entity, existing, auditContext);

    return entity;
  }

  async delete(
    id: string,
    auditContext?: AuditContext,
    options: ServiceOptions = {}
  ): Promise<TEntity> {
    // Get existing entity
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    // Custom business validation
    await this.validateDelete?.(id, existing, auditContext);

    // Pre-deletion side effects
    await this.beforeDelete?.(id, existing, auditContext);

    // Delete entity
    const entity = await this.repository.delete(id, auditContext);

    // Post-deletion side effects
    await this.afterDelete?.(entity, auditContext);

    return entity;
  }

  async softDelete(
    id: string,
    auditContext?: AuditContext,
    options: ServiceOptions = {}
  ): Promise<TEntity> {
    // Get existing entity
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    // Custom business validation
    await this.validateDelete?.(id, existing, auditContext);

    // Pre-deletion side effects
    await this.beforeDelete?.(id, existing, auditContext);

    // Soft delete entity
    const entity = await this.repository.softDelete(id, auditContext);

    // Post-deletion side effects
    await this.afterDelete?.(entity, auditContext);

    return entity;
  }

  // Business logic hooks - override in subclasses
  protected async validateCreate?(data: TInsert, context: ValidationContext): Promise<void> {}
  protected async validateUpdate?(id: string, updates: TUpdate, context: ValidationContext): Promise<void> {}
  protected async validateDelete?(id: string, entity: TEntity, auditContext?: AuditContext): Promise<void> {}

  protected async beforeCreate?(data: TInsert, auditContext?: AuditContext): Promise<TInsert | void> {}
  protected async afterCreate?(entity: TEntity, auditContext?: AuditContext): Promise<void> {}

  protected async beforeUpdate?(id: string, updates: TUpdate, existing: TEntity, auditContext?: AuditContext): Promise<TUpdate | void> {}
  protected async afterUpdate?(entity: TEntity, previous: TEntity, auditContext?: AuditContext): Promise<void> {}

  protected async beforeDelete?(id: string, entity: TEntity, auditContext?: AuditContext): Promise<void> {}
  protected async afterDelete?(entity: TEntity, auditContext?: AuditContext): Promise<void> {}

  protected async runInTransaction<T>(
    callback: () => Promise<T>
  ): Promise<T> {
    return await this.repository['runInTransaction'](async () => {
      return await callback();
    });
  }
}