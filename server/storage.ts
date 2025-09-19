import {
  users,
  suppliers,
  orders,
  purchases,
  capitalEntries,
  warehouseStock,
  filterRecords,
  settings,
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type Order,
  type InsertOrder,
  type Purchase,
  type InsertPurchase,
  type CapitalEntry,
  type InsertCapitalEntry,
  type WarehouseStock,
  type InsertWarehouseStock,
  type FilterRecord,
  type InsertFilterRecord,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, sql } from "drizzle-orm";
import Decimal from "decimal.js";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  countAdminUsers(): Promise<number>;
  updateUserRole(id: string, role: User['role']): Promise<User>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  getExchangeRate(): Promise<number>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  
  // Capital operations
  getCapitalEntries(): Promise<CapitalEntry[]>;
  getCapitalBalance(): Promise<number>;
  createCapitalEntry(entry: InsertCapitalEntry): Promise<CapitalEntry>;
  
  // Purchase operations
  getPurchases(): Promise<Purchase[]>;
  getPurchase(id: string): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  createPurchaseWithSideEffects(purchaseData: InsertPurchase, userId: string): Promise<Purchase>;
  updatePurchase(id: string, purchase: Partial<InsertPurchase>): Promise<Purchase>;
  
  // Warehouse operations
  getWarehouseStock(): Promise<WarehouseStock[]>;
  getWarehouseStockByStatus(status: string): Promise<WarehouseStock[]>;
  createWarehouseStock(stock: InsertWarehouseStock): Promise<WarehouseStock>;
  updateWarehouseStock(id: string, stock: Partial<InsertWarehouseStock>): Promise<WarehouseStock>;
  
  // Filter operations
  getFilterRecords(): Promise<FilterRecord[]>;
  createFilterRecord(record: InsertFilterRecord): Promise<FilterRecord>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async countAdminUsers(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
    return Number(result[0]?.count || 0);
  }

  async updateUserRole(id: string, role: User['role']): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    const [result] = await db
      .insert(settings)
      .values(setting)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getExchangeRate(): Promise<number> {
    const setting = await this.getSetting('USD_ETB_RATE');
    return setting ? parseFloat(setting.value) : 57.25; // Default rate
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(supplier).returning();
    return result;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [result] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values(order).returning();
    return result;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order> {
    const [result] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result;
  }

  // Capital operations
  async getCapitalEntries(): Promise<CapitalEntry[]> {
    return await db.select().from(capitalEntries).orderBy(desc(capitalEntries.date));
  }

  async getCapitalBalance(): Promise<number> {
    const result = await db
      .select({
        capitalIn: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalIn' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
        capitalOut: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalOut' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
      })
      .from(capitalEntries);

    const capitalIn = parseFloat(result[0]?.capitalIn || '0');
    const capitalOut = parseFloat(result[0]?.capitalOut || '0');
    
    return capitalIn - capitalOut;
  }

  async createCapitalEntry(entry: InsertCapitalEntry): Promise<CapitalEntry> {
    const [result] = await db.insert(capitalEntries).values(entry).returning();
    return result;
  }

  // Purchase operations
  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.date));
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    // Generate next purchase number with retry logic to handle race conditions
    const purchaseNumber = await this.generateNextPurchaseNumber();
    
    const [result] = await db.insert(purchases).values({
      ...purchase,
      purchaseNumber,
    }).returning();
    return result;
  }

  async createPurchaseWithSideEffects(purchaseData: InsertPurchase, userId: string): Promise<Purchase> {
    // Use database transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Generate next purchase number with retry logic
      const purchaseNumber = await this.generateNextPurchaseNumberInTransaction(tx);
      
      // Create the purchase record
      const [purchase] = await tx.insert(purchases).values({
        ...purchaseData,
        purchaseNumber,
      }).returning();

      // If funded from capital and amount paid > 0, create capital entry
      if (purchaseData.fundingSource === 'capital' && parseFloat(purchaseData.amountPaid || '0') > 0) {
        const amountPaid = new Decimal(purchaseData.amountPaid || '0');
        
        // Convert amount to USD for capital tracking normalization
        let amountInUsd = amountPaid;
        if (purchaseData.currency === 'ETB' && purchaseData.exchangeRate) {
          amountInUsd = amountPaid.div(new Decimal(purchaseData.exchangeRate));
        }
        
        // Check for negative balance prevention in transaction
        const currentBalance = await this.getCapitalBalanceInTransaction(tx);
        const newBalance = new Decimal(currentBalance).sub(amountInUsd);
        
        // Check if negative balance prevention is enabled
        const [preventNegativeSetting] = await tx.select().from(settings).where(eq(settings.key, 'PREVENT_NEGATIVE_BALANCE'));
        const preventNegative = preventNegativeSetting?.value === 'true';
        
        if (preventNegative && newBalance.lt(0)) {
          throw new Error(`Cannot fund purchase from capital. Would result in negative balance: ${newBalance.toFixed(2)} USD`);
        }
        
        // Create capital entry
        await tx.insert(capitalEntries).values({
          entryId: `PUR-${purchase.id}`,
          amount: amountInUsd.toFixed(2),
          type: 'CapitalOut',
          reference: purchase.id,
          description: `Purchase payment - ${purchaseData.weight}kg ${purchaseData.currency === 'ETB' ? `(${purchaseData.amountPaid} ETB @ ${purchaseData.exchangeRate})` : ''}`,
          paymentCurrency: purchaseData.currency,
          exchangeRate: purchaseData.exchangeRate || undefined,
          createdBy: userId,
        });
      }

      // Create warehouse stock entry in FIRST warehouse
      const pricePerKg = new Decimal(purchaseData.pricePerKg);
      const unitCostCleanUsd = purchaseData.currency === 'USD' 
        ? purchaseData.pricePerKg 
        : pricePerKg.div(new Decimal(purchaseData.exchangeRate as string)).toFixed(4);

      await tx.insert(warehouseStock).values({
        purchaseId: purchase.id,
        orderId: purchase.orderId,
        supplierId: purchase.supplierId,
        warehouse: 'FIRST',
        status: 'AWAITING_DECISION',
        qtyKgTotal: purchaseData.weight,
        qtyKgClean: purchaseData.weight,
        qtyKgNonClean: '0',
        unitCostCleanUsd,
      });

      return purchase;
    });
  }

  private async generateNextPurchaseNumber(): Promise<string> {
    // Use retry logic to handle race conditions
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get the highest existing purchase number using lexicographic ordering
        const latestPurchase = await db
          .select({ purchaseNumber: purchases.purchaseNumber })
          .from(purchases)
          .orderBy(sql`${purchases.purchaseNumber} DESC`)
          .limit(1);

        const nextNumber = this.calculateNextPurchaseNumber(latestPurchase[0]?.purchaseNumber);
        return nextNumber;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
      }
    }
    return 'PUR-000001'; // Fallback
  }

  private async generateNextPurchaseNumberInTransaction(tx: any): Promise<string> {
    // Get the highest existing purchase number in transaction
    const latestPurchase = await tx
      .select({ purchaseNumber: purchases.purchaseNumber })
      .from(purchases)
      .orderBy(sql`${purchases.purchaseNumber} DESC`)
      .limit(1);

    return this.calculateNextPurchaseNumber(latestPurchase[0]?.purchaseNumber);
  }

  private calculateNextPurchaseNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'PUR-000001';
    }

    // Extract number from PUR-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastNumber.match(/PUR-(\d+)/);
    
    if (!numberMatch) {
      return 'PUR-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `PUR-${nextNumber.toString().padStart(6, '0')}`;
  }

  private async getCapitalBalanceInTransaction(tx: any): Promise<number> {
    const result = await tx
      .select({
        capitalIn: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalIn' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
        capitalOut: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalOut' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
      })
      .from(capitalEntries);

    const capitalIn = parseFloat(result[0]?.capitalIn || '0');
    const capitalOut = parseFloat(result[0]?.capitalOut || '0');
    
    return capitalIn - capitalOut;
  }

  async updatePurchase(id: string, purchase: Partial<InsertPurchase>): Promise<Purchase> {
    const [result] = await db
      .update(purchases)
      .set({ ...purchase, updatedAt: new Date() })
      .where(eq(purchases.id, id))
      .returning();
    return result;
  }

  // Warehouse operations
  async getWarehouseStock(): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock).orderBy(desc(warehouseStock.createdAt));
  }

  async getWarehouseStockByStatus(status: string): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock).where(eq(warehouseStock.status, status));
  }

  async createWarehouseStock(stock: InsertWarehouseStock): Promise<WarehouseStock> {
    const [result] = await db.insert(warehouseStock).values(stock).returning();
    return result;
  }

  async updateWarehouseStock(id: string, stock: Partial<InsertWarehouseStock>): Promise<WarehouseStock> {
    const [result] = await db
      .update(warehouseStock)
      .set(stock)
      .where(eq(warehouseStock.id, id))
      .returning();
    return result;
  }

  // Filter operations
  async getFilterRecords(): Promise<FilterRecord[]> {
    return await db.select().from(filterRecords).orderBy(desc(filterRecords.createdAt));
  }

  async createFilterRecord(record: InsertFilterRecord): Promise<FilterRecord> {
    const [result] = await db.insert(filterRecords).values(record).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
