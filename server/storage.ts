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
  createCapitalEntryWithConcurrencyProtection(entry: InsertCapitalEntry): Promise<CapitalEntry>;
  createPurchaseWithSideEffectsRetryable(purchaseData: InsertPurchase, userId: string): Promise<Purchase>;
  updatePurchase(id: string, purchase: Partial<InsertPurchase>): Promise<Purchase>;
  
  // Warehouse operations
  getWarehouseStock(): Promise<WarehouseStock[]>;
  getWarehouseStockByStatus(status: string): Promise<WarehouseStock[]>;
  getWarehouseStockByWarehouse(warehouse: string): Promise<WarehouseStock[]>;
  createWarehouseStock(stock: InsertWarehouseStock): Promise<WarehouseStock>;
  updateWarehouseStock(id: string, stock: Partial<InsertWarehouseStock>): Promise<WarehouseStock>;
  updateWarehouseStockStatus(id: string, status: string, userId: string): Promise<WarehouseStock>;
  executeFilterOperation(purchaseId: string, outputCleanKg: string, outputNonCleanKg: string, userId: string): Promise<{ filterRecord: FilterRecord; updatedStock: WarehouseStock[] }>;
  moveStockToFinalWarehouse(stockId: string, userId: string): Promise<WarehouseStock>;
  
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

  async createCapitalEntryWithConcurrencyProtection(entry: InsertCapitalEntry): Promise<CapitalEntry> {
    // Use database transaction with locking for capital entries
    return await db.transaction(async (tx) => {
      return await this.createCapitalEntryInTransaction(tx, entry);
    });
  }

  private async createCapitalEntryInTransaction(tx: any, entry: InsertCapitalEntry): Promise<CapitalEntry> {
    // Use advisory lock to serialize capital balance operations (prevent race conditions)
    // Lock ID: hash of "capital_balance_operations" string = 9876543210  
    const capitalLockId = 9876543210;
    
    // Acquire advisory transaction lock for capital operations
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${capitalLockId})`);
    
    // For CapitalOut entries, check balance atomically within the lock
    if (entry.type === 'CapitalOut') {
      const currentBalance = await this.getCapitalBalanceInTransaction(tx);
      const withdrawalAmount = new Decimal(entry.amount);
      const newBalance = new Decimal(currentBalance).sub(withdrawalAmount);
      
      // Check if negative balance prevention is enabled
      const [preventNegativeSetting] = await tx.select().from(settings).where(eq(settings.key, 'PREVENT_NEGATIVE_BALANCE'));
      const preventNegative = preventNegativeSetting?.value === 'true';
      
      if (preventNegative && newBalance.lt(0)) {
        throw new Error(`Cannot create capital withdrawal. Would result in negative balance: ${newBalance.toFixed(2)} USD`);
      }
    }
    
    // Create the capital entry
    const [result] = await tx.insert(capitalEntries).values(entry).returning();
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
        
        // Create capital entry with atomic balance checking
        await this.createCapitalEntryInTransaction(tx, {
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

  async createPurchaseWithSideEffectsRetryable(purchaseData: InsertPurchase, userId: string): Promise<Purchase> {
    const maxRetries = 5;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.createPurchaseWithSideEffects(purchaseData, userId);
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable (serialization failure, unique violation, deadlock)
        const isRetryableError = error instanceof Error && (
          error.message.includes('serialization_failure') ||
          error.message.includes('unique_violation') ||
          error.message.includes('deadlock_detected') ||
          error.message.includes('could not serialize') ||
          error.message.includes('duplicate key') ||
          // Advisory lock conflicts
          error.message.includes('advisory') ||
          // Purchase number conflicts
          error.message.includes('purchase_number')
        );
        
        if (!isRetryableError || attempt === maxRetries - 1) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms, 800ms, 1600ms
        const jitter = Math.random() * 100; // 0-100ms random jitter
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        
        console.log(`Purchase creation attempt ${attempt + 1} failed with retryable error, retrying...`, error.message);
      }
    }
    
    throw lastError || new Error('Purchase creation failed after all retries');
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
    // Use advisory lock to serialize purchase number generation
    // Lock ID: hash of "purchase_number_generation" string = 1234567890
    const lockId = 1234567890;
    
    // Acquire advisory transaction lock (automatically released at transaction end)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
    
    // Now we have exclusive access to purchase number generation
    // Get the highest existing purchase number in transaction with SELECT FOR UPDATE
    const latestPurchase = await tx
      .select({ purchaseNumber: purchases.purchaseNumber })
      .from(purchases)
      .orderBy(sql`${purchases.purchaseNumber} DESC`)
      .limit(1)
      .for('update');

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

  async getWarehouseStockByWarehouse(warehouse: string): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock).where(eq(warehouseStock.warehouse, warehouse));
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

  async updateWarehouseStockStatus(id: string, status: string, userId: string): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      const [result] = await tx
        .update(warehouseStock)
        .set({ 
          status, 
          statusChangedAt: new Date()
        })
        .where(eq(warehouseStock.id, id))
        .returning();
      return result;
    });
  }

  async executeFilterOperation(purchaseId: string, outputCleanKg: string, outputNonCleanKg: string, userId: string): Promise<{ filterRecord: FilterRecord; updatedStock: WarehouseStock[] }> {
    return await db.transaction(async (tx) => {
      // Use advisory lock to serialize filter operations and prevent concurrent stock modifications
      // Lock ID: hash of "filter_operation_" + purchaseId for per-purchase filtering protection
      const lockId = this.hashString(`filter_operation_${purchaseId}`);
      
      // Acquire advisory transaction lock (automatically released at transaction end)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Get the stock entry for this purchase
      const [stockEntry] = await tx
        .select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.purchaseId, purchaseId),
          eq(warehouseStock.warehouse, 'FIRST'),
          eq(warehouseStock.status, 'AWAITING_FILTER')
        ));

      if (!stockEntry) {
        throw new Error('Stock entry not found or not in AWAITING_FILTER status');
      }

      const inputKg = stockEntry.qtyKgTotal;
      const cleanKg = new Decimal(outputCleanKg);
      const nonCleanKg = new Decimal(outputNonCleanKg);
      const totalOutput = cleanKg.add(nonCleanKg);
      
      // Validate filter outputs don't exceed input
      if (totalOutput.gt(new Decimal(inputKg))) {
        throw new Error('Filter output cannot exceed input weight');
      }

      // Calculate filter yield
      const filterYield = cleanKg.div(new Decimal(inputKg)).mul(100);

      // Create filter record
      const [filterRecord] = await tx.insert(filterRecords).values({
        purchaseId,
        inputKg,
        outputCleanKg,
        outputNonCleanKg,
        filterYield: filterYield.toFixed(2),
        createdBy: userId,
      }).returning();

      // Cost redistribution: all cost goes to clean only (per business rules)
      const originalUnitCost = new Decimal(stockEntry.unitCostCleanUsd || '0');
      const newCleanUnitCost = cleanKg.gt(0) 
        ? originalUnitCost.mul(new Decimal(inputKg)).div(cleanKg)
        : new Decimal('0');

      // Update original stock entry with clean portion
      const [cleanStock] = await tx
        .update(warehouseStock)
        .set({
          status: 'READY_TO_SHIP',
          qtyKgClean: outputCleanKg,
          qtyKgNonClean: '0',
          unitCostCleanUsd: newCleanUnitCost.toFixed(4),
          filteredAt: new Date(),
          statusChangedAt: new Date()
        })
        .where(eq(warehouseStock.id, stockEntry.id))
        .returning();

      let nonCleanStock: WarehouseStock | null = null;
      
      // Create separate non-clean stock entry if there's non-clean output
      if (nonCleanKg.gt(0)) {
        const [newNonCleanStock] = await tx.insert(warehouseStock).values({
          purchaseId,
          orderId: stockEntry.orderId,
          supplierId: stockEntry.supplierId,
          warehouse: 'FIRST',
          status: 'NON_CLEAN',
          qtyKgTotal: outputNonCleanKg,
          qtyKgClean: '0',
          qtyKgNonClean: outputNonCleanKg,
          unitCostCleanUsd: '0.0000', // Non-clean has zero cost per business rules
          filteredAt: new Date(),
        }).returning();
        nonCleanStock = newNonCleanStock;
      }

      const updatedStock = nonCleanStock ? [cleanStock, nonCleanStock] : [cleanStock];
      return { filterRecord, updatedStock };
    });
  }

  async moveStockToFinalWarehouse(stockId: string, userId: string): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      // Get the stock entry
      const [stockEntry] = await tx
        .select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.id, stockId),
          eq(warehouseStock.warehouse, 'FIRST'),
          eq(warehouseStock.status, 'READY_TO_SHIP')
        ));

      if (!stockEntry) {
        throw new Error('Stock entry not found or not ready for final warehouse');
      }

      // Create new entry in final warehouse
      const [finalStock] = await tx.insert(warehouseStock).values({
        purchaseId: stockEntry.purchaseId,
        orderId: stockEntry.orderId,
        supplierId: stockEntry.supplierId,
        warehouse: 'FINAL',
        status: 'READY_FOR_SALE',
        qtyKgTotal: stockEntry.qtyKgClean,
        qtyKgClean: stockEntry.qtyKgClean,
        qtyKgNonClean: '0',
        unitCostCleanUsd: stockEntry.unitCostCleanUsd,
        cartonsCount: stockEntry.cartonsCount,
      }).returning();

      // Remove from first warehouse (or mark as shipped)
      await tx
        .delete(warehouseStock)
        .where(eq(warehouseStock.id, stockId));

      return finalStock;
    });
  }

  // Filter operations
  async getFilterRecords(): Promise<FilterRecord[]> {
    return await db.select().from(filterRecords).orderBy(desc(filterRecords.createdAt));
  }

  async createFilterRecord(record: InsertFilterRecord): Promise<FilterRecord> {
    const [result] = await db.insert(filterRecords).values(record).returning();
    return result;
  }

  // Utility method to create consistent hash for advisory locks
  private hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive number for PostgreSQL advisory locks
    return Math.abs(hash);
  }
}

export const storage = new DatabaseStorage();
