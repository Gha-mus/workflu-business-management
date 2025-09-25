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

  async createPurchaseWithSideEffects(
    purchaseData: InsertPurchase,
    userId: string,
    auditContext?: AuditContext
  ): Promise<Purchase> {
    return await this.runInTransaction(async (tx) => {
      // Create the purchase
      const [purchase] = await tx
        .insert(purchases)
        .values(purchaseData)
        .returning();

      // Create related warehouse stock entry
      const { warehouseStock } = await import("@shared/schema");
      await tx
        .insert(warehouseStock)
        .values({
          purchaseId: purchase.id,
          warehouse: 'intake',
          status: 'pending',
          cleanKg: purchaseData.cleanKg || '0',
          nonCleanKg: purchaseData.nonCleanKg || '0',
          totalKg: purchaseData.totalKg || '0',
          userId
        });

      // Create capital entry to track the expense
      const { capitalEntries } = await import("@shared/schema");
      await tx
        .insert(capitalEntries)
        .values({
          type: 'debit',
          amount: purchaseData.totalCost,
          currency: purchaseData.currency,
          description: `Purchase: ${purchase.id}`,
          reference: purchase.id,
          userId
        });

      if (auditContext) {
        await this.logAuditOperation('create', purchase.id, purchaseData, null, auditContext);
      }

      return purchase;
    });
  }

  async deletePurchase(id: string, auditContext?: AuditContext): Promise<void> {
    return await this.runInTransaction(async (tx) => {
      // Check if purchase can be deleted (no related records)
      const [purchase] = await tx.select().from(purchases).where(eq(purchases.id, id));
      
      if (!purchase) {
        throw new Error(`Purchase with id ${id} not found`);
      }

      // Check for related warehouse stock
      const { warehouseStock } = await import("@shared/schema");
      const relatedStock = await tx
        .select()
        .from(warehouseStock)
        .where(eq(warehouseStock.purchaseId, id));

      if (relatedStock.length > 0) {
        throw new Error('Cannot delete purchase with existing warehouse stock');
      }

      // Delete the purchase
      await tx.delete(purchases).where(eq(purchases.id, id));

      if (auditContext) {
        await this.logAuditOperation('delete', id, null, purchase, auditContext);
      }
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