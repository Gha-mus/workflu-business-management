import { db } from "../../core/db";
import { 
  customers,
  salesOrders,
  salesOrderItems,
  customerCommunications,
  revenueTransactions,
  salesPerformanceMetrics,
  customerCreditLimits,
  pricingRules,
  revenueLedger,
  withdrawalRecords,
  reinvestments,
  revenueBalanceSummary,
  type Customer,
  type InsertCustomer,
  type SalesOrder,
  type InsertSalesOrder,
  type SalesOrderItem,
  type InsertSalesOrderItem,
  type CustomerCommunication,
  type InsertCustomerCommunication,
  type RevenueTransaction,
  type InsertRevenueTransaction,
  type SalesPerformanceMetric,
  type InsertSalesPerformanceMetric,
  type CustomerCreditLimit,
  type InsertCustomerCreditLimit,
  type PricingRule,
  type InsertPricingRule
} from "@shared/schema";
import { BaseRepository } from "../../shared/base/BaseRepository";
import type { AuditContext } from "../../auditService";
import { eq, sql, and, desc, gte, lte } from "drizzle-orm";

export class CustomerRepository extends BaseRepository<Customer, InsertCustomer> {
  protected table = customers;
  protected tableName = 'customers';

  async findByEmail(email: string): Promise<Customer | undefined> {
    const [result] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);
    
    return result;
  }

  async findByName(name: string): Promise<Customer[]> {
    const results = await db
      .select()
      .from(customers)
      .where(sql`${customers.name} ILIKE ${`%${name}%`}`)
      .orderBy(customers.name);
    
    return results;
  }

  async findActiveCustomers(): Promise<Customer[]> {
    const results = await db
      .select()
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(customers.name);
    
    return results;
  }
}

export class SalesOrderRepository extends BaseRepository<SalesOrder, InsertSalesOrder> {
  protected table = salesOrders;
  protected tableName = 'salesOrders';

  async findByCustomer(customerId: string): Promise<SalesOrder[]> {
    const results = await db
      .select()
      .from(salesOrders)
      .where(eq(salesOrders.customerId, customerId))
      .orderBy(desc(salesOrders.createdAt));
    
    return results;
  }

  async findByStatus(status: string): Promise<SalesOrder[]> {
    const results = await db
      .select()
      .from(salesOrders)
      .where(eq(salesOrders.status, status))
      .orderBy(desc(salesOrders.createdAt));
    
    return results;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<SalesOrder[]> {
    const results = await db
      .select()
      .from(salesOrders)
      .where(and(
        gte(salesOrders.orderDate, startDate),
        lte(salesOrders.orderDate, endDate)
      ))
      .orderBy(desc(salesOrders.orderDate));
    
    return results;
  }

  async getTotalSales(customerId?: string): Promise<number> {
    let query = db
      .select({ 
        total: sql<number>`COALESCE(SUM(total_amount), 0)` 
      })
      .from(salesOrders);

    if (customerId) {
      query = query.where(eq(salesOrders.customerId, customerId));
    }
    
    const result = await query;
    return Number(result[0]?.total || 0);
  }
}

export class SalesOrderItemRepository extends BaseRepository<SalesOrderItem, InsertSalesOrderItem> {
  protected table = salesOrderItems;
  protected tableName = 'salesOrderItems';

  async findByOrderId(orderId: string): Promise<SalesOrderItem[]> {
    const results = await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.orderId, orderId))
      .orderBy(salesOrderItems.createdAt);
    
    return results;
  }

  async getOrderTotal(orderId: string): Promise<number> {
    const result = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(quantity * unit_price), 0)` 
      })
      .from(salesOrderItems)
      .where(eq(salesOrderItems.orderId, orderId));
    
    return Number(result[0]?.total || 0);
  }
}

export class RevenueTransactionRepository extends BaseRepository<RevenueTransaction, InsertRevenueTransaction> {
  protected table = revenueTransactions;
  protected tableName = 'revenueTransactions';

  async findByType(type: string): Promise<RevenueTransaction[]> {
    const results = await db
      .select()
      .from(revenueTransactions)
      .where(eq(revenueTransactions.type, type))
      .orderBy(desc(revenueTransactions.createdAt));
    
    return results;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<RevenueTransaction[]> {
    const results = await db
      .select()
      .from(revenueTransactions)
      .where(and(
        gte(revenueTransactions.transactionDate, startDate),
        lte(revenueTransactions.transactionDate, endDate)
      ))
      .orderBy(desc(revenueTransactions.transactionDate));
    
    return results;
  }

  async getRevenueTotal(type?: string): Promise<number> {
    let query = db
      .select({ 
        total: sql<number>`COALESCE(SUM(amount), 0)` 
      })
      .from(revenueTransactions);

    if (type) {
      query = query.where(eq(revenueTransactions.type, type));
    }
    
    const result = await query;
    return Number(result[0]?.total || 0);
  }

  async createRevenueFromSale(
    saleData: {
      orderId: string;
      customerId: string;
      amount: number;
      currency: string;
      description: string;
    },
    auditContext?: AuditContext
  ): Promise<RevenueTransaction> {
    return await this.runInTransaction(async (tx) => {
      // Create revenue transaction
      const [transaction] = await tx
        .insert(revenueTransactions)
        .values({
          type: 'sale',
          amount: saleData.amount,
          currency: saleData.currency,
          description: saleData.description,
          reference: saleData.orderId,
          customerId: saleData.customerId,
          transactionDate: new Date()
        })
        .returning();

      // Update revenue ledger
      await tx
        .insert(revenueLedger)
        .values({
          type: 'credit',
          amount: saleData.amount,
          currency: saleData.currency,
          description: `Sale revenue: ${saleData.orderId}`,
          reference: saleData.orderId,
          transactionId: transaction.id
        });

      if (auditContext) {
        await this.logAuditOperation('create', transaction.id, saleData, null, auditContext);
      }

      return transaction;
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
      description: `${action} revenue transaction`,
      businessContext: `Revenue management - ${action} transaction`
    });
  }
}

export class CustomerCommunicationRepository extends BaseRepository<CustomerCommunication, InsertCustomerCommunication> {
  protected table = customerCommunications;
  protected tableName = 'customerCommunications';

  async findByCustomer(customerId: string): Promise<CustomerCommunication[]> {
    const results = await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.customerId, customerId))
      .orderBy(desc(customerCommunications.createdAt));
    
    return results;
  }

  async findByType(type: string): Promise<CustomerCommunication[]> {
    const results = await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.type, type))
      .orderBy(desc(customerCommunications.createdAt));
    
    return results;
  }
}

export class SalesPerformanceMetricRepository extends BaseRepository<SalesPerformanceMetric, InsertSalesPerformanceMetric> {
  protected table = salesPerformanceMetrics;
  protected tableName = 'salesPerformanceMetrics';

  async findByPeriod(period: string): Promise<SalesPerformanceMetric[]> {
    const results = await db
      .select()
      .from(salesPerformanceMetrics)
      .where(eq(salesPerformanceMetrics.period, period))
      .orderBy(desc(salesPerformanceMetrics.createdAt));
    
    return results;
  }

  async getLatestMetrics(): Promise<SalesPerformanceMetric[]> {
    const results = await db
      .select()
      .from(salesPerformanceMetrics)
      .orderBy(desc(salesPerformanceMetrics.createdAt))
      .limit(10);
    
    return results;
  }
}