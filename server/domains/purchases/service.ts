import { 
  PurchaseRepository, 
  PurchasePaymentRepository, 
  OrderRepository, 
  SupplierRepository 
} from "./repository";
import { BaseService } from "../../shared/base/BaseService";
import type { 
  Purchase, 
  InsertPurchase,
  PurchasePayment,
  InsertPurchasePayment,
  Order,
  InsertOrder,
  Supplier,
  InsertSupplier
} from "@shared/schema";
import type { AuditContext } from "../../auditService";
import { 
  insertPurchaseSchema, 
  insertPurchasePaymentSchema,
  insertOrderSchema,
  insertSupplierSchema 
} from "@shared/schema";

export interface ApprovalGuardContext {
  userId: string;
  userRole: string;
  operationType: string;
  operationData: any;
  businessContext: string;
  skipValidation?: boolean;
}

export class PurchaseService extends BaseService<Purchase, InsertPurchase> {
  protected repository = new PurchaseRepository();
  protected createSchema = insertPurchaseSchema;
  protected updateSchema = insertPurchaseSchema.partial();

  private paymentRepository = new PurchasePaymentRepository();

  async getPurchases(): Promise<Purchase[]> {
    return await this.repository.findAll();
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    return await this.repository.findById(id);
  }

  async getPurchasesBySupplier(supplierId: string): Promise<Purchase[]> {
    return await this.repository.findBySupplier(supplierId);
  }

  async createPurchase(
    purchase: InsertPurchase,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Purchase> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validatePurchase(purchase);

    return await this.repository.create(purchase, auditContext);
  }

  async createPurchaseWithSideEffects(
    purchaseData: InsertPurchase,
    userId: string,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Purchase> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validatePurchase(purchaseData);

    // PROPER TRANSACTIONAL COORDINATOR: Single transaction with repository helpers
    return await this.repository.runInTransaction(async (tx) => {
      // 1. Create the purchase using transaction
      const [purchase] = await tx
        .insert((await import("@shared/schema")).purchases)
        .values(purchaseData)
        .returning();

      // 2. Create warehouse stock using transaction-aware repository helper
      const warehouseRepository = new (await import("../warehouse/repository")).WarehouseRepository();
      await warehouseRepository.createWarehouseStockWithTransaction(tx, {
        purchaseId: purchase.id,
        warehouse: 'intake',
        status: 'pending',
        cleanKg: (purchaseData as any).cleanKg || '0',
        nonCleanKg: (purchaseData as any).nonCleanKg || '0',
        totalKg: (purchaseData as any).totalKg || purchaseData.weight || '0',
        userId
      });

      // 3. Create capital entry using transaction-aware repository helper
      const capitalRepository = new (await import("../capital/repository")).CapitalRepository();
      await capitalRepository.createCapitalEntryWithTransaction(tx, {
        type: 'debit',
        amount: (purchaseData as any).totalCost || purchaseData.total,
        currency: (purchaseData as any).currency || 'USD',
        description: `Purchase: ${purchase.id}`,
        reference: purchase.id,
        createdBy: userId
      });

      // 4. Log audit operation within transaction
      if (auditContext) {
        const { auditService } = await import("../../auditService");
        await auditService.logOperation(auditContext, {
          entityType: 'purchases',
          entityId: purchase.id,
          action: 'create' as const,
          newValues: purchaseData,
          description: 'Created purchase with side effects',
          businessContext: 'Purchase creation with warehouse stock and capital entry'
        });
      }

      return purchase;
    });
  }

  async updatePurchase(
    id: string,
    purchase: Partial<InsertPurchase>,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Purchase> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    return await this.repository.update(id, purchase, auditContext);
  }

  async deletePurchase(
    id: string,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<void> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // PROPER CROSS-DOMAIN VALIDATION - moved from repository to service layer
    // Check if purchase can be deleted (no related warehouse stock)
    try {
      const warehouseService = new (await import("../warehouse/service")).WarehouseService();
      const relatedStock = await warehouseService.getWarehouseStockByPurchase(id);
      
      if (relatedStock && relatedStock.length > 0) {
        throw new Error('Cannot delete purchase with existing warehouse stock');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot delete purchase')) {
        throw error;
      }
      // If warehouse service is not available, continue with deletion
      console.warn('Could not check warehouse stock for purchase deletion:', error);
    }

    // Use the standard delete method from BaseRepository
    await this.repository.delete(id, auditContext);
  }

  // Purchase payment operations
  async getPurchasePayments(purchaseId: string): Promise<PurchasePayment[]> {
    return await this.paymentRepository.findByPurchaseId(purchaseId);
  }

  async createPurchasePayment(
    payment: InsertPurchasePayment,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<PurchasePayment> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate payment
    await this.validatePurchasePayment(payment);

    return await this.paymentRepository.create(payment, auditContext);
  }

  async getTotalPayments(purchaseId: string): Promise<number> {
    return await this.paymentRepository.getTotalPayments(purchaseId);
  }

  private async validatePurchase(purchase: InsertPurchase): Promise<void> {
    // Validate amounts are positive
    if (parseFloat(purchase.totalCost || '0') <= 0) {
      throw new Error('Purchase total cost must be positive');
    }

    // Validate quantities
    if (purchase.totalKg && parseFloat(purchase.totalKg) <= 0) {
      throw new Error('Purchase weight must be positive');
    }

    // Validate currency
    const validCurrencies = ['USD', 'ETB'];
    if (!validCurrencies.includes(purchase.currency || 'USD')) {
      throw new Error(`Invalid currency: ${purchase.currency}`);
    }

    // Validate supplier exists
    if (purchase.supplierId) {
      const supplierRepository = new SupplierRepository();
      const supplier = await supplierRepository.findById(purchase.supplierId);
      if (!supplier) {
        throw new Error(`Supplier with id ${purchase.supplierId} not found`);
      }
    }

    // Validate status
    if (purchase.status) {
      await this.validatePurchaseStatus(purchase.status);
    }
  }

  private async validatePurchaseStatus(status: string): Promise<void> {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'received', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid purchase status: ${status}`);
    }
  }

  private async validatePurchasePayment(payment: InsertPurchasePayment): Promise<void> {
    // Validate amount is positive
    if (parseFloat(payment.amount || '0') <= 0) {
      throw new Error('Payment amount must be positive');
    }

    // Validate currency
    const validCurrencies = ['USD', 'ETB'];
    if (!validCurrencies.includes(payment.currency)) {
      throw new Error(`Invalid currency: ${payment.currency}`);
    }

    // Validate purchase exists
    const purchase = await this.repository.findById(payment.purchaseId);
    if (!purchase) {
      throw new Error(`Purchase with id ${payment.purchaseId} not found`);
    }

    // Validate payment doesn't exceed purchase total
    const totalPayments = await this.paymentRepository.getTotalPayments(payment.purchaseId);
    if (totalPayments + payment.amount > purchase.totalCost) {
      throw new Error('Payment amount exceeds remaining purchase balance');
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
  protected async validateCreate(data: InsertPurchase): Promise<void> {
    await this.validatePurchase(data);
  }

  protected async afterCreate(entity: Purchase, auditContext?: AuditContext): Promise<void> {
    // Log business event
    console.log(`Purchase created: ${entity.id} - ${entity.currency} ${entity.totalCost}`);
    
    // Additional side effects can be added here (notifications, inventory updates, etc.)
  }
}

export class OrderService extends BaseService<Order, InsertOrder> {
  protected repository = new OrderRepository();
  protected createSchema = insertOrderSchema;
  protected updateSchema = insertOrderSchema.partial();

  async getOrders(): Promise<Order[]> {
    return await this.repository.findAll();
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return await this.repository.findById(id);
  }

  async getOrdersBySupplier(supplierId: string): Promise<Order[]> {
    return await this.repository.findBySupplier(supplierId);
  }

  async createOrder(
    order: InsertOrder,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Order> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validateOrder(order);

    return await this.repository.create(order, auditContext);
  }

  async updateOrder(
    id: string,
    order: Partial<InsertOrder>,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Order> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    return await this.repository.update(id, order, auditContext);
  }

  private async validateOrder(order: InsertOrder): Promise<void> {
    // Validate supplier exists
    if (order.supplierId) {
      const supplierRepository = new SupplierRepository();
      const supplier = await supplierRepository.findById(order.supplierId);
      if (!supplier) {
        throw new Error(`Supplier with id ${order.supplierId} not found`);
      }
    }

    // Validate quantities and amounts if provided
    if (order.quantity && order.quantity <= 0) {
      throw new Error('Order quantity must be positive');
    }

    if (order.unitPrice && order.unitPrice <= 0) {
      throw new Error('Order unit price must be positive');
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
}

export class SupplierService extends BaseService<Supplier, InsertSupplier> {
  protected repository = new SupplierRepository();
  protected createSchema = insertSupplierSchema;
  protected updateSchema = insertSupplierSchema.partial();

  async getSuppliers(): Promise<Supplier[]> {
    return await this.repository.findAll();
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return await this.repository.findById(id);
  }

  async getSuppliersByName(name: string): Promise<Supplier[]> {
    return await this.repository.findByName(name);
  }

  async getSuppliersByLocation(location: string): Promise<Supplier[]> {
    return await this.repository.findByLocation(location);
  }

  async createSupplier(
    supplier: InsertSupplier,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Supplier> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validateSupplier(supplier);

    return await this.repository.create(supplier, auditContext);
  }

  async updateSupplier(
    id: string,
    supplier: Partial<InsertSupplier>,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Supplier> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    return await this.repository.update(id, supplier, auditContext);
  }

  private async validateSupplier(supplier: InsertSupplier): Promise<void> {
    // Validate required fields
    if (!supplier.name || supplier.name.trim().length === 0) {
      throw new Error('Supplier name is required');
    }

    if (!supplier.location || supplier.location.trim().length === 0) {
      throw new Error('Supplier location is required');
    }

    // Validate contact information if provided
    if (supplier.email && !this.isValidEmail(supplier.email)) {
      throw new Error('Invalid email format');
    }

    if (supplier.phone && !this.isValidPhone(supplier.phone)) {
      throw new Error('Invalid phone format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 7;
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
}