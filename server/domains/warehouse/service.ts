import { WarehouseRepository, FilterRecordRepository, WarehouseBatchRepository } from "./repository";
import { BaseService } from "../../shared/base/BaseService";
import type { 
  WarehouseStock, 
  InsertWarehouseStock,
  FilterRecord,
  InsertFilterRecord,
  WarehouseBatch,
  InsertWarehouseBatch
} from "@shared/schema";
import type { AuditContext } from "../../auditService";
import { insertWarehouseStockSchema, insertFilterRecordSchema, insertWarehouseBatchSchema } from "@shared/schema";

export interface ApprovalGuardContext {
  userId: string;
  userRole: string;
  operationType: string;
  operationData: any;
  businessContext: string;
  skipValidation?: boolean;
}

export class WarehouseService extends BaseService<WarehouseStock, InsertWarehouseStock> {
  protected repository = new WarehouseRepository();
  protected createSchema = insertWarehouseStockSchema;
  protected updateSchema = insertWarehouseStockSchema.partial();

  private filterRepository = new FilterRecordRepository();
  private batchRepository = new WarehouseBatchRepository();

  async getWarehouseStock(): Promise<WarehouseStock[]> {
    return await this.repository.findAll();
  }

  async getWarehouseStockByStatus(status: string): Promise<WarehouseStock[]> {
    return await this.repository.findByStatus(status);
  }

  async getWarehouseStockByWarehouse(warehouse: string): Promise<WarehouseStock[]> {
    return await this.repository.findByWarehouse(warehouse);
  }

  async getWarehouseStockById(id: string): Promise<WarehouseStock | undefined> {
    return await this.repository.findById(id);
  }

  async createWarehouseStock(
    stock: InsertWarehouseStock,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<WarehouseStock> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validateWarehouseStock(stock);

    return await this.repository.create(stock, auditContext);
  }

  async updateWarehouseStock(
    id: string,
    stock: Partial<InsertWarehouseStock>,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<WarehouseStock> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    return await this.repository.update(id, stock, auditContext);
  }

  async updateWarehouseStockStatus(
    id: string,
    status: string,
    userId: string,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<WarehouseStock> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate status
    await this.validateStockStatus(status);

    return await this.repository.updateStatus(id, status, auditContext);
  }

  async executeFilterOperation(
    purchaseId: string,
    outputCleanKg: string,
    outputNonCleanKg: string,
    userId: string,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<{ filterRecord: FilterRecord; updatedStock: WarehouseStock[] }> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate filter operation data
    await this.validateFilterOperation(outputCleanKg, outputNonCleanKg);

    return await this.filterRepository.executeFilterOperation(
      purchaseId,
      outputCleanKg,
      outputNonCleanKg,
      userId,
      auditContext
    );
  }

  async moveStockToFinalWarehouse(
    stockId: string,
    userId: string,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<WarehouseStock> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate that stock exists and is in correct state
    const existingStock = await this.repository.findById(stockId);
    if (!existingStock) {
      throw new Error(`Warehouse stock with id ${stockId} not found`);
    }

    if (existingStock.warehouse === 'final') {
      throw new Error('Stock is already in final warehouse');
    }

    return await this.repository.moveToFinalWarehouse(stockId, auditContext);
  }

  async getFilterRecords(): Promise<FilterRecord[]> {
    return await this.filterRepository.findAll();
  }

  async createFilterRecord(record: InsertFilterRecord): Promise<FilterRecord> {
    return await this.filterRepository.create(record);
  }

  // Warehouse batch operations
  async getWarehouseBatches(): Promise<WarehouseBatch[]> {
    return await this.batchRepository.findAll();
  }

  async getWarehouseBatchesByWarehouse(warehouse: string): Promise<WarehouseBatch[]> {
    return await this.batchRepository.findByWarehouse(warehouse);
  }

  async createWarehouseBatch(batch: InsertWarehouseBatch, auditContext?: AuditContext): Promise<WarehouseBatch> {
    return await this.batchRepository.create(batch, auditContext);
  }

  private async validateWarehouseStock(stock: InsertWarehouseStock): Promise<void> {
    // Validate quantities are positive
    if (stock.cleanKg && parseFloat(stock.cleanKg) < 0) {
      throw new Error('Clean kg must be non-negative');
    }

    if (stock.nonCleanKg && parseFloat(stock.nonCleanKg) < 0) {
      throw new Error('Non-clean kg must be non-negative');
    }

    // Validate warehouse location
    const validWarehouses = ['intake', 'processing', 'final', 'storage'];
    if (stock.warehouse && !validWarehouses.includes(stock.warehouse)) {
      throw new Error(`Invalid warehouse location: ${stock.warehouse}`);
    }

    // Validate status
    if (stock.status) {
      await this.validateStockStatus(stock.status);
    }
  }

  private async validateStockStatus(status: string): Promise<void> {
    const validStatuses = ['pending', 'in_process', 'filtered', 'ready_for_sale', 'sold', 'on_hold'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid stock status: ${status}`);
    }
  }

  private async validateFilterOperation(outputCleanKg: string, outputNonCleanKg: string): Promise<void> {
    const cleanKg = parseFloat(outputCleanKg);
    const nonCleanKg = parseFloat(outputNonCleanKg);

    if (isNaN(cleanKg) || cleanKg < 0) {
      throw new Error('Output clean kg must be a non-negative number');
    }

    if (isNaN(nonCleanKg) || nonCleanKg < 0) {
      throw new Error('Output non-clean kg must be a non-negative number');
    }

    if (cleanKg === 0 && nonCleanKg === 0) {
      throw new Error('Filter operation must produce some output');
    }
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
  protected async validateCreate(data: InsertWarehouseStock): Promise<void> {
    await this.validateWarehouseStock(data);
  }

  protected async afterCreate(entity: WarehouseStock, auditContext?: AuditContext): Promise<void> {
    // Log business event
    console.log(`Warehouse stock created: ${entity.id} - ${entity.warehouse}`);
    
    // Additional side effects can be added here (notifications, etc.)
  }
}