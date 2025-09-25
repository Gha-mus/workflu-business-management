import { db } from "../../core/db";
import { 
  purchases,
  purchasePayments,
  orders,
  suppliers,
  type Purchase, 
  type InsertPurchase,
  type PurchasePayment,
  type InsertPurchasePayment,
  type Order,
  type InsertOrder,
  type Supplier,
  type InsertSupplier
} from "@shared/schema";
import { BaseRepository } from "../../shared/base/BaseRepository";
import type { AuditContext } from "../../auditService";
import { eq, sql, and, desc } from "drizzle-orm";

export class PurchaseRepository extends BaseRepository<Purchase, InsertPurchase> {
  protected table = purchases;
  protected tableName = 'purchases';

  async findBySupplier(supplierId: string): Promise<Purchase[]> {
    const results = await db
      .select()
      .from(purchases)
      .where(eq(purchases.supplierId, supplierId))
      .orderBy(desc(purchases.createdAt));
    
    return results;
  }

  async findByStatus(status: string): Promise<Purchase[]> {
    const results = await db
      .select()
      .from(purchases)
      .where(eq(purchases.status, status))
      .orderBy(desc(purchases.createdAt));
    
    return results;
  }

  // REMOVED: Cross-domain orchestration moved to PurchaseService
  // This repository now focuses only on purchase-related operations

  // REMOVED: Cross-domain validation moved to PurchaseService
  // Use the standard delete method from BaseRepository

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
      description: `${action} purchase`,
      businessContext: `Purchase management - ${action} purchase`
    });
  }
}

export class PurchasePaymentRepository extends BaseRepository<PurchasePayment, InsertPurchasePayment> {
  protected table = purchasePayments;
  protected tableName = 'purchasePayments';

  async findByPurchaseId(purchaseId: string): Promise<PurchasePayment[]> {
    const results = await db
      .select()
      .from(purchasePayments)
      .where(eq(purchasePayments.purchaseId, purchaseId))
      .orderBy(desc(purchasePayments.createdAt));
    
    return results;
  }

  async getTotalPayments(purchaseId: string): Promise<number> {
    const result = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(amount), 0)` 
      })
      .from(purchasePayments)
      .where(eq(purchasePayments.purchaseId, purchaseId));
    
    return Number(result[0]?.total || 0);
  }
}

export class OrderRepository extends BaseRepository<Order, InsertOrder> {
  protected table = orders;
  protected tableName = 'orders';

  async findBySupplier(supplierId: string): Promise<Order[]> {
    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.supplierId, supplierId))
      .orderBy(desc(orders.createdAt));
    
    return results;
  }

  async findByStatus(status: string): Promise<Order[]> {
    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
    
    return results;
  }
}

export class SupplierRepository extends BaseRepository<Supplier, InsertSupplier> {
  protected table = suppliers;
  protected tableName = 'suppliers';

  async findByName(name: string): Promise<Supplier[]> {
    const results = await db
      .select()
      .from(suppliers)
      .where(sql`${suppliers.name} ILIKE ${`%${name}%`}`)
      .orderBy(suppliers.name);
    
    return results;
  }

  async findByLocation(location: string): Promise<Supplier[]> {
    const results = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.location, location))
      .orderBy(suppliers.name);
    
    return results;
  }
}