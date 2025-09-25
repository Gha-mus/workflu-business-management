import { 
  CustomerRepository,
  SalesOrderRepository,
  SalesOrderItemRepository,
  RevenueTransactionRepository,
  CustomerCommunicationRepository,
  SalesPerformanceMetricRepository
} from "./repository";
import { BaseService } from "../../shared/base/BaseService";
import type { 
  Customer,
  InsertCustomer,
  SalesOrder,
  InsertSalesOrder,
  SalesOrderItem,
  InsertSalesOrderItem,
  RevenueTransaction,
  InsertRevenueTransaction,
  CustomerCommunication,
  InsertCustomerCommunication,
  SalesPerformanceMetric,
  InsertSalesPerformanceMetric
} from "@shared/schema";
import type { AuditContext } from "../../auditService";
import { 
  insertCustomerSchema,
  insertSalesOrderSchema,
  insertSalesOrderItemSchema,
  insertRevenueTransactionSchema,
  insertCustomerCommunicationSchema,
  insertSalesPerformanceMetricSchema
} from "@shared/schema";

export interface ApprovalGuardContext {
  userId: string;
  userRole: string;
  operationType: string;
  operationData: any;
  businessContext: string;
  skipValidation?: boolean;
}

export class CustomerService extends BaseService<Customer, InsertCustomer> {
  protected repository = new CustomerRepository();
  protected createSchema = insertCustomerSchema;
  protected updateSchema = insertCustomerSchema.partial();

  async getCustomers(): Promise<Customer[]> {
    return await this.repository.findAll();
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return await this.repository.findById(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return await this.repository.findByEmail(email);
  }

  async getCustomersByName(name: string): Promise<Customer[]> {
    return await this.repository.findByName(name);
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return await this.repository.findActiveCustomers();
  }

  async createCustomer(
    customer: InsertCustomer,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Customer> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validateCustomer(customer);

    return await this.repository.create(customer, auditContext);
  }

  async updateCustomer(
    id: string,
    customer: Partial<InsertCustomer>,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<Customer> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    return await this.repository.update(id, customer, auditContext);
  }

  private async validateCustomer(customer: InsertCustomer): Promise<void> {
    // Validate required fields
    if (!customer.name || customer.name.trim().length === 0) {
      throw new Error('Customer name is required');
    }

    // Validate email format if provided
    if (customer.email && !this.isValidEmail(customer.email)) {
      throw new Error('Invalid email format');
    }

    // Check for duplicate email if provided
    if (customer.email) {
      const existingCustomer = await this.repository.findByEmail(customer.email);
      if (existingCustomer) {
        throw new Error(`Customer with email ${customer.email} already exists`);
      }
    }

    // Validate phone format if provided
    if (customer.phone && !this.isValidPhone(customer.phone)) {
      throw new Error('Invalid phone format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
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

export class SalesOrderService extends BaseService<SalesOrder, InsertSalesOrder> {
  protected repository = new SalesOrderRepository();
  protected createSchema = insertSalesOrderSchema;
  protected updateSchema = insertSalesOrderSchema.partial();

  private itemRepository = new SalesOrderItemRepository();
  private revenueRepository = new RevenueTransactionRepository();

  async getSalesOrders(): Promise<SalesOrder[]> {
    return await this.repository.findAll();
  }

  async getSalesOrder(id: string): Promise<SalesOrder | undefined> {
    return await this.repository.findById(id);
  }

  async getSalesOrdersByCustomer(customerId: string): Promise<SalesOrder[]> {
    return await this.repository.findByCustomer(customerId);
  }

  async getSalesOrdersByStatus(status: string): Promise<SalesOrder[]> {
    return await this.repository.findByStatus(status);
  }

  async createSalesOrder(
    order: InsertSalesOrder,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<SalesOrder> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validateSalesOrder(order);

    return await this.repository.create(order, auditContext);
  }

  async updateSalesOrder(
    id: string,
    order: Partial<InsertSalesOrder>,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<SalesOrder> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    return await this.repository.update(id, order, auditContext);
  }

  async completeSaleWithRevenue(
    orderId: string,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<{ order: SalesOrder; revenueTransaction: RevenueTransaction }> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new Error(`Sales order with id ${orderId} not found`);
    }

    if (order.status === 'completed') {
      throw new Error('Sales order is already completed');
    }

    // Update order status to completed
    const updatedOrder = await this.repository.update(
      orderId,
      { status: 'completed' },
      auditContext
    );

    // Create revenue transaction
    const revenueTransaction = await this.revenueRepository.createRevenueFromSale({
      orderId,
      customerId: order.customerId,
      amount: order.totalAmount,
      currency: order.currency,
      description: `Revenue from completed sale order ${orderId}`
    }, auditContext);

    return { order: updatedOrder, revenueTransaction };
  }

  // Sales order items
  async getSalesOrderItems(orderId: string): Promise<SalesOrderItem[]> {
    return await this.itemRepository.findByOrderId(orderId);
  }

  async createSalesOrderItem(
    item: InsertSalesOrderItem,
    auditContext?: AuditContext
  ): Promise<SalesOrderItem> {
    // Validate item
    await this.validateSalesOrderItem(item);

    return await this.itemRepository.create(item, auditContext);
  }

  async getOrderTotal(orderId: string): Promise<number> {
    return await this.itemRepository.getOrderTotal(orderId);
  }

  private async validateSalesOrder(order: InsertSalesOrder): Promise<void> {
    // Validate customer exists
    const customerRepository = new CustomerRepository();
    const customer = await customerRepository.findById(order.customerId);
    if (!customer) {
      throw new Error(`Customer with id ${order.customerId} not found`);
    }

    // Validate amounts are positive
    if (order.totalAmount <= 0) {
      throw new Error('Sales order total amount must be positive');
    }

    // Validate currency
    const validCurrencies = ['USD', 'ETB'];
    if (!validCurrencies.includes(order.currency)) {
      throw new Error(`Invalid currency: ${order.currency}`);
    }

    // Validate status
    if (order.status) {
      await this.validateOrderStatus(order.status);
    }
  }

  private async validateOrderStatus(status: string): Promise<void> {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }
  }

  private async validateSalesOrderItem(item: InsertSalesOrderItem): Promise<void> {
    // Validate quantities are positive
    if (item.quantity <= 0) {
      throw new Error('Order item quantity must be positive');
    }

    if (item.unitPrice <= 0) {
      throw new Error('Order item unit price must be positive');
    }

    // Validate order exists
    const order = await this.repository.findById(item.orderId);
    if (!order) {
      throw new Error(`Sales order with id ${item.orderId} not found`);
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

export class RevenueService extends BaseService<RevenueTransaction, InsertRevenueTransaction> {
  protected repository = new RevenueTransactionRepository();
  protected createSchema = insertRevenueTransactionSchema;
  protected updateSchema = insertRevenueTransactionSchema.partial();

  async getRevenueTransactions(): Promise<RevenueTransaction[]> {
    return await this.repository.findAll();
  }

  async getRevenueTransactionsByType(type: string): Promise<RevenueTransaction[]> {
    return await this.repository.findByType(type);
  }

  async getRevenueTransactionsByDateRange(startDate: Date, endDate: Date): Promise<RevenueTransaction[]> {
    return await this.repository.findByDateRange(startDate, endDate);
  }

  async getTotalRevenue(type?: string): Promise<number> {
    return await this.repository.getRevenueTotal(type);
  }

  async createRevenueTransaction(
    transaction: InsertRevenueTransaction,
    auditContext?: AuditContext,
    approvalContext?: ApprovalGuardContext
  ): Promise<RevenueTransaction> {
    // Apply approval guard if provided
    if (approvalContext) {
      await this.enforceApprovalRequirement(approvalContext);
    }

    // Validate business rules
    await this.validateRevenueTransaction(transaction);

    return await this.repository.create(transaction, auditContext);
  }

  private async validateRevenueTransaction(transaction: InsertRevenueTransaction): Promise<void> {
    // Validate amount is positive
    if (transaction.amount <= 0) {
      throw new Error('Revenue transaction amount must be positive');
    }

    // Validate currency
    const validCurrencies = ['USD', 'ETB'];
    if (!validCurrencies.includes(transaction.currency)) {
      throw new Error(`Invalid currency: ${transaction.currency}`);
    }

    // Validate type
    const validTypes = ['sale', 'refund', 'adjustment', 'interest', 'other'];
    if (!validTypes.includes(transaction.type)) {
      throw new Error(`Invalid transaction type: ${transaction.type}`);
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