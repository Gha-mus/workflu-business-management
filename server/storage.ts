import {
  users,
  suppliers,
  orders,
  purchases,
  capitalEntries,
  warehouseStock,
  filterRecords,
  settings,
  aiInsightsCache,
  aiConversations,
  periods,
  periodClosingLogs,
  periodAdjustments,
  exportHistory,
  exportPreferences,
  exportJobs,
  workflowValidations,
  carriers,
  shipments,
  shipmentItems,
  shippingCosts,
  deliveryTracking,
  qualityStandards,
  warehouseBatches,
  qualityInspections,
  inventoryConsumption,
  processingOperations,
  stockTransfers,
  inventoryAdjustments,
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
  type AiInsightsCache,
  type InsertAiInsightsCache,
  type AiConversation,
  type InsertAiConversation,
  type Period,
  type InsertPeriod,
  type PeriodClosingLog,
  type InsertPeriodClosingLog,
  type PeriodAdjustment,
  type InsertPeriodAdjustment,
  type ExportHistory,
  type InsertExportHistory,
  type ExportPreferences,
  type InsertExportPreferences,
  type ExportJob,
  type InsertExportJob,
  type WorkflowValidation,
  type InsertWorkflowValidation,
  type Carrier,
  type InsertCarrier,
  type Shipment,
  type InsertShipment,
  type ShipmentItem,
  type InsertShipmentItem,
  type ShippingCost,
  type InsertShippingCost,
  type DeliveryTracking,
  type InsertDeliveryTracking,
  type QualityStandard,
  type InsertQualityStandard,
  type WarehouseBatch,
  type InsertWarehouseBatch,
  type QualityInspection,
  type InsertQualityInspection,
  type InventoryConsumption,
  type InsertInventoryConsumption,
  type ProcessingOperation,
  type InsertProcessingOperation,
  type StockTransfer,
  type InsertStockTransfer,
  type InventoryAdjustment,
  type InsertInventoryAdjustment,
  type ShipmentWithDetailsResponse,
  type ShippingAnalyticsResponse,
  type CreateShipmentFromStock,
  type AddShippingCost,
  type AddDeliveryTracking,
  type ShipmentFilter,
  type CarrierFilter,
  type FinancialSummaryResponse,
  type CashFlowResponse,
  type InventoryAnalyticsResponse,
  type SupplierPerformanceResponse,
  type TradingActivityResponse,
  type DateRangeFilter,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, sql, gte, lte, count, avg } from "drizzle-orm";
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
  
  // Reporting operations
  getFinancialSummary(filters?: DateRangeFilter): Promise<FinancialSummaryResponse>;
  getCashflowAnalysis(period: string): Promise<CashFlowResponse>;
  getInventoryAnalytics(): Promise<InventoryAnalyticsResponse>;
  getSupplierPerformance(): Promise<SupplierPerformanceResponse>;
  getTradingActivity(): Promise<TradingActivityResponse>;
  exportReportData(type: string, format: string): Promise<any>;
  
  // AI operations
  getAiInsightsCache(cacheKey: string): Promise<AiInsightsCache | undefined>;
  setAiInsightsCache(cache: InsertAiInsightsCache): Promise<AiInsightsCache>;
  deleteExpiredInsightsCache(): Promise<void>;
  getAiConversation(sessionId: string, userId: string): Promise<AiConversation | undefined>;
  createOrUpdateAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getRecentAiConversations(userId: string, limit: number): Promise<AiConversation[]>;
  
  // Workflow validation operations
  getWorkflowValidations(userId?: string, limit?: number): Promise<WorkflowValidation[]>;
  getLatestWorkflowValidation(userId?: string): Promise<WorkflowValidation | undefined>;
  createWorkflowValidation(validation: InsertWorkflowValidation): Promise<WorkflowValidation>;
  updateWorkflowValidationAsLatest(validationId: string): Promise<void>;
  
  // Period management operations
  getPeriods(): Promise<Period[]>;
  getPeriod(id: string): Promise<Period | undefined>;
  createPeriod(period: InsertPeriod): Promise<Period>;
  updatePeriod(id: string, period: Partial<InsertPeriod>): Promise<Period>;
  closePeriod(periodId: string, userId: string, adjustments?: InsertPeriodAdjustment[]): Promise<Period>;
  reopenPeriod(periodId: string, userId: string, reason: string): Promise<Period>;
  getPeriodClosingLogs(periodId: string): Promise<PeriodClosingLog[]>;
  createPeriodAdjustment(adjustment: InsertPeriodAdjustment): Promise<PeriodAdjustment>;
  getPeriodAdjustments(periodId: string): Promise<PeriodAdjustment[]>;
  approvePeriodAdjustment(adjustmentId: string, userId: string): Promise<PeriodAdjustment>;
  
  // Enhanced export operations
  createExportRequest(exportData: InsertExportHistory): Promise<ExportHistory>;
  getExportHistory(userId?: string, limit?: number): Promise<ExportHistory[]>;
  updateExportStatus(exportId: string, status: string, filePath?: string, fileSize?: number): Promise<ExportHistory>;
  getExportJob(id: string): Promise<ExportHistory | undefined>;
  deleteExpiredExports(): Promise<void>;
  incrementDownloadCount(exportId: string): Promise<void>;
  
  // Enhanced period operations with compliance
  closePeriodWithCompliance(periodId: string, userId: string, adjustments?: InsertPeriodAdjustment[], complianceData?: {
    complianceValidationId?: string | null;
    aiValidationStatus: 'passed' | 'skipped' | 'failed';
  }): Promise<Period>;
  reopenPeriodWithAudit(periodId: string, userId: string, reason: string): Promise<Period>;
  
  // Export preferences operations
  getUserExportPreferences(userId: string, reportType?: string): Promise<ExportPreferences[]>;
  setExportPreference(preference: InsertExportPreferences): Promise<ExportPreferences>;
  updateExportPreference(userId: string, reportType: string, updates: Partial<InsertExportPreferences>): Promise<ExportPreferences>;
  
  // Scheduled export operations
  getExportJobs(userId?: string): Promise<ExportJob[]>;
  createExportJob(job: InsertExportJob): Promise<ExportJob>;
  updateExportJob(id: string, updates: Partial<InsertExportJob>): Promise<ExportJob>;
  deleteExportJob(id: string): Promise<void>;
  
  // Enhanced export format operations
  exportToCSV(data: any[], filename: string): Promise<string>;
  exportToExcel(data: Record<string, any[]>, filename: string): Promise<string>;
  exportToPDF(data: any, reportType: string, filename: string): Promise<string>;
  compressFile(filePath: string): Promise<string>;
  sendEmailWithAttachment(recipients: string[], subject: string, body: string, attachmentPath: string): Promise<void>;

  // Shipping and Logistics operations
  
  // Carrier operations
  getCarriers(filter?: CarrierFilter): Promise<Carrier[]>;
  getCarrier(id: string): Promise<Carrier | undefined>;
  createCarrier(carrier: InsertCarrier): Promise<Carrier>;
  updateCarrier(id: string, carrier: Partial<InsertCarrier>): Promise<Carrier>;
  deleteCarrier(id: string): Promise<void>;
  updateCarrierRating(carrierId: string, rating: number): Promise<Carrier>;
  
  // Shipment operations
  getShipments(filter?: ShipmentFilter): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentWithDetails(id: string): Promise<ShipmentWithDetailsResponse | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  createShipmentFromWarehouseStock(shipmentData: CreateShipmentFromStock, userId: string): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment>;
  updateShipmentStatus(id: string, status: string, userId: string, actualDate?: Date): Promise<Shipment>;
  deleteShipment(id: string): Promise<void>;
  
  // Shipment item operations
  getShipmentItems(shipmentId: string): Promise<ShipmentItem[]>;
  createShipmentItem(item: InsertShipmentItem): Promise<ShipmentItem>;
  updateShipmentItem(id: string, item: Partial<InsertShipmentItem>): Promise<ShipmentItem>;
  deleteShipmentItem(id: string): Promise<void>;
  
  // Shipping cost operations
  getShippingCosts(shipmentId: string): Promise<ShippingCost[]>;
  getShippingCost(id: string): Promise<ShippingCost | undefined>;
  addShippingCost(costData: AddShippingCost, userId: string): Promise<ShippingCost>;
  updateShippingCost(id: string, cost: Partial<InsertShippingCost>): Promise<ShippingCost>;
  deleteShippingCost(id: string): Promise<void>;
  
  // Delivery tracking operations
  getDeliveryTracking(shipmentId: string): Promise<DeliveryTracking[]>;
  addDeliveryTracking(trackingData: AddDeliveryTracking, userId: string): Promise<DeliveryTracking>;
  updateDeliveryTracking(id: string, tracking: Partial<InsertDeliveryTracking>): Promise<DeliveryTracking>;
  markCustomerNotified(trackingId: string, userId: string): Promise<DeliveryTracking>;
  
  // Shipping analytics and reporting
  getShippingAnalytics(filters?: DateRangeFilter): Promise<ShippingAnalyticsResponse>;
  getCarrierPerformanceReport(): Promise<any>;
  getShippingCostAnalysis(filters?: DateRangeFilter): Promise<any>;
  getDeliveryTimeAnalysis(filters?: DateRangeFilter): Promise<any>;
  
  // Integration operations
  getAvailableWarehouseStockForShipping(): Promise<WarehouseStock[]>;
  reserveStockForShipment(stockId: string, quantity: number, shipmentId: string): Promise<WarehouseStock>;
  releaseReservedStock(stockId: string, quantity: number): Promise<WarehouseStock>;
  updateFinalWarehouseFromDelivery(shipmentId: string, userId: string): Promise<void>;

  // Advanced Warehouse Operations

  // Quality standards operations
  getQualityStandards(isActive?: boolean): Promise<QualityStandard[]>;
  getQualityStandard(id: string): Promise<QualityStandard | undefined>;
  createQualityStandard(standard: InsertQualityStandard): Promise<QualityStandard>;
  updateQualityStandard(id: string, standard: Partial<InsertQualityStandard>): Promise<QualityStandard>;
  deleteQualityStandard(id: string): Promise<void>;

  // Warehouse batches operations
  getWarehouseBatches(filter?: { supplierId?: string; qualityGrade?: string; isActive?: boolean }): Promise<WarehouseBatch[]>;
  getWarehouseBatch(id: string): Promise<WarehouseBatch | undefined>;
  createWarehouseBatch(batch: InsertWarehouseBatch): Promise<WarehouseBatch>;
  updateWarehouseBatch(id: string, batch: Partial<InsertWarehouseBatch>): Promise<WarehouseBatch>;
  splitWarehouseBatch(batchId: string, splitQuantity: string, userId: string): Promise<{ originalBatch: WarehouseBatch; newBatch: WarehouseBatch }>;
  mergeWarehouseBatches(batchIds: string[], userId: string): Promise<WarehouseBatch>;

  // Quality inspections operations
  getQualityInspections(filter?: { status?: string; inspectionType?: string; batchId?: string }): Promise<QualityInspection[]>;
  getQualityInspection(id: string): Promise<QualityInspection | undefined>;
  createQualityInspection(inspection: InsertQualityInspection): Promise<QualityInspection>;
  updateQualityInspection(id: string, inspection: Partial<InsertQualityInspection>): Promise<QualityInspection>;
  completeQualityInspection(id: string, results: {
    qualityGrade: string;
    overallScore?: string;
    testResults?: any;
    recommendations?: string;
    userId: string;
  }): Promise<QualityInspection>;
  approveQualityInspection(id: string, userId: string): Promise<QualityInspection>;
  rejectQualityInspection(id: string, rejectionReason: string, userId: string): Promise<QualityInspection>;

  // Inventory consumption operations
  getInventoryConsumption(filter?: { warehouseStockId?: string; consumptionType?: string; orderId?: string }): Promise<InventoryConsumption[]>;
  getInventoryConsumptionByBatch(batchId: string): Promise<InventoryConsumption[]>;
  createInventoryConsumption(consumption: InsertInventoryConsumption): Promise<InventoryConsumption>;
  consumeInventoryFIFO(warehouseStockId: string, quantity: string, consumptionType: string, userId: string, allocatedTo?: string): Promise<InventoryConsumption[]>;
  getStockAging(): Promise<Array<{ warehouseStockId: string; daysInStock: number; qtyKgClean: number; unitCostUsd: number }>>;
  getConsumptionAnalytics(dateRange?: DateRangeFilter): Promise<{
    totalConsumed: number;
    averageCostPerKg: number;
    consumptionByType: Array<{ type: string; quantity: number; cost: number }>;
    fifoCompliance: number;
  }>;

  // Processing operations
  getProcessingOperations(filter?: { status?: string; operationType?: string; batchId?: string }): Promise<ProcessingOperation[]>;
  getProcessingOperation(id: string): Promise<ProcessingOperation | undefined>;
  createProcessingOperation(operation: InsertProcessingOperation): Promise<ProcessingOperation>;
  updateProcessingOperation(id: string, operation: Partial<InsertProcessingOperation>): Promise<ProcessingOperation>;
  startProcessingOperation(id: string, userId: string): Promise<ProcessingOperation>;
  completeProcessingOperation(id: string, results: {
    outputQuantityKg: string;
    yieldPercentage: string;
    lossQuantityKg: string;
    qualityAfter?: string;
    userId: string;
  }): Promise<ProcessingOperation>;

  // Stock transfers operations
  getStockTransfers(filter?: { status?: string; transferType?: string }): Promise<StockTransfer[]>;
  getStockTransfer(id: string): Promise<StockTransfer | undefined>;
  createStockTransfer(transfer: InsertStockTransfer): Promise<StockTransfer>;
  executeStockTransfer(id: string, userId: string): Promise<StockTransfer>;
  approveStockTransfer(id: string, userId: string): Promise<StockTransfer>;
  cancelStockTransfer(id: string, reason: string, userId: string): Promise<StockTransfer>;

  // Inventory adjustments operations
  getInventoryAdjustments(filter?: { status?: string; adjustmentType?: string; warehouseStockId?: string }): Promise<InventoryAdjustment[]>;
  getInventoryAdjustment(id: string): Promise<InventoryAdjustment | undefined>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
  approveInventoryAdjustment(id: string, userId: string): Promise<InventoryAdjustment>;
  rejectInventoryAdjustment(id: string, reason: string, userId: string): Promise<InventoryAdjustment>;

  // Enhanced warehouse stock operations with quality and batch tracking
  assignQualityGradeToStock(stockId: string, qualityGrade: string, qualityScore?: string, userId?: string): Promise<WarehouseStock>;
  assignBatchToStock(stockId: string, batchId: string, userId?: string): Promise<WarehouseStock>;
  getStockWithQualityHistory(stockId: string): Promise<{
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    consumptions: InventoryConsumption[];
    transfers: StockTransfer[];
    adjustments: InventoryAdjustment[];
  }>;
  getWarehouseAnalyticsAdvanced(): Promise<{
    qualityBreakdown: Array<{ grade: string; totalKg: number; valueUsd: number; count: number }>;
    batchAnalysis: Array<{ batchId: string; batchNumber: string; totalKg: number; remainingKg: number; qualityGrade: string }>;
    consumptionTrends: Array<{ date: string; totalConsumed: number; averageCost: number }>;
    processingMetrics: Array<{ operationType: string; totalProcessed: number; averageYield: number; totalCost: number }>;
    fifoCompliance: number;
    stockAging: Array<{ ageRange: string; totalKg: number; valueUsd: number }>;
  }>;

  // Traceability operations
  traceStockOrigin(stockId: string): Promise<{
    purchase: Purchase;
    supplier: Supplier;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    processingHistory: ProcessingOperation[];
  }>;
  traceConsumptionChain(consumptionId: string): Promise<{
    consumption: InventoryConsumption;
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    purchaseOrigin: Purchase;
    supplier: Supplier;
  }>;
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

  // Reporting operations with USD normalization
  async getFinancialSummary(filters?: DateRangeFilter): Promise<FinancialSummaryResponse> {
    // Get current exchange rate
    const exchangeRate = await this.getExchangeRate();

    // Build date filter conditions
    const dateConditions = [];
    if (filters?.startDate) {
      dateConditions.push(gte(purchases.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      dateConditions.push(lte(purchases.date, new Date(filters.endDate)));
    }

    // Get capital entries summary
    const capitalResult = await db
      .select({
        capitalIn: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalIn' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
        capitalOut: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalOut' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
      })
      .from(capitalEntries)
      .where(dateConditions.length > 0 ? and(...dateConditions.map(cond => 
        // Map purchase date conditions to capital entry dates
        cond.toString().includes('date') ? 
          cond.toString().replace('purchases.date', 'capital_entries.date') 
          : cond
      )) : undefined);

    const capitalIn = new Decimal(capitalResult[0]?.capitalIn?.toString() || '0');
    const capitalOut = new Decimal(capitalResult[0]?.capitalOut?.toString() || '0');
    const currentBalance = capitalIn.sub(capitalOut);

    // Get purchase totals with USD normalization
    const purchaseQuery = db
      .select({
        totalPurchases: sum(purchases.total),
        totalPaid: sum(purchases.amountPaid),
        usdCount: count(sql`CASE WHEN ${purchases.currency} = 'USD' THEN 1 END`),
        usdAmount: sum(sql`CASE WHEN ${purchases.currency} = 'USD' THEN ${purchases.total} ELSE 0 END`),
        etbCount: count(sql`CASE WHEN ${purchases.currency} = 'ETB' THEN 1 END`),
        etbAmount: sum(sql`CASE WHEN ${purchases.currency} = 'ETB' THEN (${purchases.total} / ${purchases.exchangeRate}) ELSE 0 END`),
      })
      .from(purchases);

    if (dateConditions.length > 0) {
      purchaseQuery.where(and(...dateConditions));
    }

    const purchaseResult = await purchaseQuery;
    
    const totalPurchases = new Decimal(purchaseResult[0]?.totalPurchases?.toString() || '0');
    const totalPaid = new Decimal(purchaseResult[0]?.totalPaid?.toString() || '0');
    const totalOutstanding = totalPurchases.sub(totalPaid);

    // Calculate inventory value with USD normalization
    const inventoryResult = await db
      .select({
        totalValue: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean} > 0`);

    const totalInventoryValue = new Decimal(inventoryResult[0]?.totalValue?.toString() || '0');
    const netPosition = currentBalance.add(totalInventoryValue).sub(totalOutstanding);

    return {
      summary: {
        currentBalance: currentBalance.toNumber(),
        capitalIn: capitalIn.toNumber(),
        capitalOut: capitalOut.toNumber(),
        totalPurchases: totalPurchases.toNumber(),
        totalPaid: totalPaid.toNumber(),
        totalOutstanding: totalOutstanding.toNumber(),
        totalInventoryValue: totalInventoryValue.toNumber(),
        netPosition: netPosition.toNumber(),
      },
      currencyBreakdown: {
        usd: {
          amount: new Decimal(purchaseResult[0]?.usdAmount?.toString() || '0').toNumber(),
          count: Number(purchaseResult[0]?.usdCount || 0),
        },
        etb: {
          amount: new Decimal(purchaseResult[0]?.etbAmount?.toString() || '0').toNumber(),
          count: Number(purchaseResult[0]?.etbCount || 0),
        },
      },
      exchangeRate,
    };
  }

  async getCashflowAnalysis(period: string): Promise<CashFlowResponse> {
    // Determine date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'last-7-days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last-30-days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last-90-days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'last-year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get daily capital flows
    const capitalFlows = await db
      .select({
        date: sql<string>`DATE(${capitalEntries.date})`,
        capitalIn: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalIn' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
        capitalOut: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalOut' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
      })
      .from(capitalEntries)
      .where(and(
        gte(capitalEntries.date, startDate),
        lte(capitalEntries.date, endDate)
      ))
      .groupBy(sql`DATE(${capitalEntries.date})`)
      .orderBy(sql`DATE(${capitalEntries.date})`);

    // Get daily purchase payments
    const purchasePayments = await db
      .select({
        date: sql<string>`DATE(${purchases.date})`,
        payments: sum(purchases.amountPaid),
      })
      .from(purchases)
      .where(and(
        gte(purchases.date, startDate),
        lte(purchases.date, endDate),
        sql`${purchases.amountPaid} > 0`
      ))
      .groupBy(sql`DATE(${purchases.date})`)
      .orderBy(sql`DATE(${purchases.date})`);

    // Merge and calculate net flows
    const flowMap = new Map();
    
    capitalFlows.forEach(flow => {
      const capitalIn = new Decimal(flow.capitalIn?.toString() || '0');
      const capitalOut = new Decimal(flow.capitalOut?.toString() || '0');
      flowMap.set(flow.date, {
        date: flow.date,
        capitalIn: capitalIn.toNumber(),
        capitalOut: capitalOut.toNumber(),
        purchasePayments: 0,
        netFlow: capitalIn.sub(capitalOut).toNumber(),
      });
    });

    purchasePayments.forEach(payment => {
      const existing = flowMap.get(payment.date) || {
        date: payment.date,
        capitalIn: 0,
        capitalOut: 0,
        purchasePayments: 0,
        netFlow: 0,
      };
      const paymentAmount = new Decimal(payment.payments?.toString() || '0');
      existing.purchasePayments = paymentAmount.toNumber();
      existing.netFlow = existing.capitalIn - existing.capitalOut - existing.purchasePayments;
      flowMap.set(payment.date, existing);
    });

    const data = Array.from(flowMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary
    const summary = data.reduce(
      (acc, day) => ({
        totalIn: acc.totalIn + day.capitalIn,
        totalOut: acc.totalOut + day.capitalOut + day.purchasePayments,
        netFlow: acc.netFlow + day.netFlow,
      }),
      { totalIn: 0, totalOut: 0, netFlow: 0 }
    );

    return {
      period,
      data,
      summary,
    };
  }

  async getInventoryAnalytics(): Promise<InventoryAnalyticsResponse> {
    // Get warehouse summary with USD valuation
    const warehouseSummary = await db
      .select({
        warehouse: warehouseStock.warehouse,
        totalKg: sum(warehouseStock.qtyKgClean),
        valueUsd: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
        count: count(),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean} > 0`)
      .groupBy(warehouseStock.warehouse);

    const firstWarehouse = warehouseSummary.find(w => w.warehouse === 'FIRST') || { totalKg: '0', valueUsd: '0', count: 0 };
    const finalWarehouse = warehouseSummary.find(w => w.warehouse === 'FINAL') || { totalKg: '0', valueUsd: '0', count: 0 };

    // Get status breakdown
    const statusBreakdown = await db
      .select({
        status: warehouseStock.status,
        count: count(),
        totalKg: sum(warehouseStock.qtyKgClean),
        valueUsd: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean} > 0`)
      .groupBy(warehouseStock.status);

    // Get filter analysis
    const filterAnalysis = await db
      .select({
        totalFiltered: count(),
        avgYield: avg(filterRecords.filterYield),
        totalInput: sum(filterRecords.inputKg),
        totalOutput: sum(filterRecords.outputCleanKg),
      })
      .from(filterRecords);

    // Get top products by supplier
    const topProducts = await db
      .select({
        supplierId: warehouseStock.supplierId,
        supplierName: suppliers.name,
        totalKg: sum(warehouseStock.qtyKgClean),
        valueUsd: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
      })
      .from(warehouseStock)
      .innerJoin(suppliers, eq(warehouseStock.supplierId, suppliers.id))
      .where(sql`${warehouseStock.qtyKgClean} > 0`)
      .groupBy(warehouseStock.supplierId, suppliers.name)
      .orderBy(desc(sum(warehouseStock.qtyKgClean)))
      .limit(10);

    return {
      warehouseSummary: {
        first: {
          totalKg: new Decimal(firstWarehouse.totalKg?.toString() || '0').toNumber(),
          valueUsd: new Decimal(firstWarehouse.valueUsd?.toString() || '0').toNumber(),
          count: Number(firstWarehouse.count || 0),
        },
        final: {
          totalKg: new Decimal(finalWarehouse.totalKg?.toString() || '0').toNumber(),
          valueUsd: new Decimal(finalWarehouse.valueUsd?.toString() || '0').toNumber(),
          count: Number(finalWarehouse.count || 0),
        },
      },
      statusBreakdown: statusBreakdown.map(status => ({
        status: status.status,
        count: Number(status.count || 0),
        totalKg: new Decimal(status.totalKg?.toString() || '0').toNumber(),
        valueUsd: new Decimal(status.valueUsd?.toString() || '0').toNumber(),
      })),
      filterAnalysis: {
        totalFiltered: Number(filterAnalysis[0]?.totalFiltered || 0),
        averageYield: new Decimal(filterAnalysis[0]?.avgYield?.toString() || '0').toNumber(),
        totalInputKg: new Decimal(filterAnalysis[0]?.totalInput?.toString() || '0').toNumber(),
        totalOutputKg: new Decimal(filterAnalysis[0]?.totalOutput?.toString() || '0').toNumber(),
      },
      topProducts: topProducts.map(product => ({
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        totalKg: new Decimal(product.totalKg?.toString() || '0').toNumber(),
        valueUsd: new Decimal(product.valueUsd?.toString() || '0').toNumber(),
      })),
    };
  }

  async getSupplierPerformance(): Promise<SupplierPerformanceResponse> {
    // Get supplier metrics with USD normalization
    const supplierMetrics = await db
      .select({
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        totalPurchases: count(purchases.id),
        totalValue: sum(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.total}
            ELSE ${purchases.total} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        totalWeight: sum(purchases.weight),
        avgPrice: avg(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.pricePerKg}
            ELSE ${purchases.pricePerKg} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        orderCount: count(sql`DISTINCT ${purchases.orderId}`),
      })
      .from(suppliers)
      .leftJoin(purchases, eq(suppliers.id, purchases.supplierId))
      .where(eq(suppliers.isActive, true))
      .groupBy(suppliers.id, suppliers.name);

    // Calculate trends (simplified - comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentMetrics = await db
      .select({
        supplierId: purchases.supplierId,
        avgPrice: avg(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.pricePerKg}
            ELSE ${purchases.pricePerKg} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        totalWeight: sum(purchases.weight),
      })
      .from(purchases)
      .where(gte(purchases.date, thirtyDaysAgo))
      .groupBy(purchases.supplierId);

    const previousMetrics = await db
      .select({
        supplierId: purchases.supplierId,
        avgPrice: avg(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.pricePerKg}
            ELSE ${purchases.pricePerKg} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        totalWeight: sum(purchases.weight),
      })
      .from(purchases)
      .where(and(
        gte(purchases.date, sixtyDaysAgo),
        lte(purchases.date, thirtyDaysAgo)
      ))
      .groupBy(purchases.supplierId);

    // Build trends map
    const recentMap = new Map(recentMetrics.map(m => [m.supplierId, m]));
    const previousMap = new Map(previousMetrics.map(m => [m.supplierId, m]));

    const suppliers_ = supplierMetrics.map(supplier => {
      const recent = recentMap.get(supplier.supplierId);
      const previous = previousMap.get(supplier.supplierId);
      
      let priceChange = 0;
      let volumeChange = 0;

      if (recent && previous) {
        const recentPrice = new Decimal(recent.avgPrice?.toString() || '0');
        const previousPrice = new Decimal(previous.avgPrice?.toString() || '0');
        if (previousPrice.gt(0)) {
          priceChange = recentPrice.sub(previousPrice).div(previousPrice).mul(100).toNumber();
        }

        const recentVolume = new Decimal(recent.totalWeight?.toString() || '0');
        const previousVolume = new Decimal(previous.totalWeight?.toString() || '0');
        if (previousVolume.gt(0)) {
          volumeChange = recentVolume.sub(previousVolume).div(previousVolume).mul(100).toNumber();
        }
      }

      return {
        id: supplier.supplierId,
        name: supplier.supplierName,
        metrics: {
          totalPurchases: Number(supplier.totalPurchases || 0),
          totalValue: new Decimal(supplier.totalValue?.toString() || '0').toNumber(),
          totalWeight: new Decimal(supplier.totalWeight?.toString() || '0').toNumber(),
          averagePrice: new Decimal(supplier.avgPrice?.toString() || '0').toNumber(),
          averageQuality: undefined, // Could be calculated from warehouse data
          onTimeDelivery: 95, // Placeholder - would need delivery tracking
          orderCount: Number(supplier.orderCount || 0),
        },
        trends: {
          priceChange,
          volumeChange,
        },
      };
    });

    const activeSuppliers = suppliers_.filter(s => s.metrics.totalPurchases > 0);
    const topPerformer = activeSuppliers.reduce((best, current) => 
      current.metrics.totalValue > best.metrics.totalValue ? current : best,
      activeSuppliers[0]
    );

    return {
      suppliers: suppliers_,
      summary: {
        totalSuppliers: suppliers_.length,
        activeSuppliers: activeSuppliers.length,
        topPerformer: topPerformer?.name,
      },
    };
  }

  async getTradingActivity(): Promise<TradingActivityResponse> {
    // Get order fulfillment stats
    const orderStats = await db
      .select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .groupBy(orders.status);

    const stats = orderStats.reduce((acc, stat) => {
      const statusCount = Number(stat.count || 0);
      acc.total += statusCount;
      
      switch (stat.status) {
        case 'completed':
          acc.completed += statusCount;
          break;
        case 'cancelled':
          acc.cancelled += statusCount;
          break;
        default:
          acc.pending += statusCount;
      }
      
      return acc;
    }, { total: 0, completed: 0, pending: 0, cancelled: 0 });

    const fulfillmentRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    // Get volume analysis from purchases (as proxy for order volume)
    const volumeAnalysis = await db
      .select({
        totalVolume: sum(purchases.weight),
        avgOrderSize: avg(purchases.weight),
        maxOrderSize: sql<number>`MAX(${purchases.weight})`,
        orderCount: count(),
      })
      .from(purchases);

    // Get time analysis (simplified - based on creation to completion time)
    const completedOrders = await db
      .select({
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.status, 'completed'));

    let totalProcessingDays = 0;
    let processedOrdersCount = 0;

    completedOrders.forEach(order => {
      if (order.createdAt && order.updatedAt) {
        const days = (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        totalProcessingDays += days;
        processedOrdersCount++;
      }
    });

    const averageProcessingTime = processedOrdersCount > 0 ? totalProcessingDays / processedOrdersCount : 0;

    return {
      orderFulfillment: {
        stats,
        fulfillmentRate,
      },
      volumeAnalysis: {
        totalVolume: new Decimal(volumeAnalysis[0]?.totalVolume?.toString() || '0').toNumber(),
        averageOrderSize: new Decimal(volumeAnalysis[0]?.avgOrderSize?.toString() || '0').toNumber(),
        largestOrder: Number(volumeAnalysis[0]?.maxOrderSize || 0),
      },
      timeAnalysis: {
        averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
        totalProcessingDays: Math.round(totalProcessingDays),
      },
    };
  }

  async exportReportData(type: string, format: string): Promise<any> {
    // Implementation depends on the specific type requested
    switch (type) {
      case 'financial':
        const financialData = await this.getFinancialSummary();
        return format === 'csv' ? this.convertToCSV(financialData) : financialData;
      
      case 'inventory':
        const inventoryData = await this.getInventoryAnalytics();
        return format === 'csv' ? this.convertToCSV(inventoryData) : inventoryData;
        
      case 'suppliers':
        const supplierData = await this.getSupplierPerformance();
        return format === 'csv' ? this.convertToCSV(supplierData) : supplierData;
        
      case 'trading':
        const tradingData = await this.getTradingActivity();
        return format === 'csv' ? this.convertToCSV(tradingData) : tradingData;
        
      case 'all':
        const allData = {
          financial: await this.getFinancialSummary(),
          inventory: await this.getInventoryAnalytics(),
          suppliers: await this.getSupplierPerformance(),
          trading: await this.getTradingActivity(),
        };
        return format === 'csv' ? this.convertToCSV(allData) : allData;
        
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  // Helper method to convert data to CSV format
  private convertToCSV(data: any): string {
    // Simple CSV conversion - in a real implementation, you'd want more sophisticated formatting
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    } else if (typeof data === 'object') {
      // Convert object to key-value CSV
      return Object.entries(data)
        .map(([key, value]) => `"${key}","${JSON.stringify(value).replace(/"/g, '""')}"`)
        .join('\n');
    }
    
    return JSON.stringify(data);
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

  // AI operations
  async getAiInsightsCache(cacheKey: string): Promise<AiInsightsCache | undefined> {
    const [cache] = await db
      .select()
      .from(aiInsightsCache)
      .where(and(
        eq(aiInsightsCache.cacheKey, cacheKey),
        sql`${aiInsightsCache.expiresAt} > NOW()`
      ));
    return cache;
  }

  async setAiInsightsCache(cache: InsertAiInsightsCache): Promise<AiInsightsCache> {
    const [result] = await db
      .insert(aiInsightsCache)
      .values(cache)
      .onConflictDoUpdate({
        target: aiInsightsCache.cacheKey,
        set: {
          result: cache.result,
          metadata: cache.metadata,
          dataHash: cache.dataHash,
          expiresAt: cache.expiresAt,
        },
      })
      .returning();
    return result;
  }

  async deleteExpiredInsightsCache(): Promise<void> {
    await db
      .delete(aiInsightsCache)
      .where(sql`${aiInsightsCache.expiresAt} <= NOW()`);
  }

  async getAiConversation(sessionId: string, userId: string): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(and(
        eq(aiConversations.sessionId, sessionId),
        eq(aiConversations.userId, userId)
      ));
    return conversation;
  }

  async createOrUpdateAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [result] = await db
      .insert(aiConversations)
      .values(conversation)
      .onConflictDoUpdate({
        target: [aiConversations.sessionId, aiConversations.userId],
        set: {
          messages: conversation.messages,
          context: conversation.context,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getRecentAiConversations(userId: string, limit: number = 10): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt))
      .limit(limit);
  }

  // Workflow validation operations
  async getWorkflowValidations(userId?: string, limit: number = 10): Promise<WorkflowValidation[]> {
    const query = db
      .select()
      .from(workflowValidations)
      .orderBy(desc(workflowValidations.createdAt))
      .limit(limit);

    if (userId) {
      return await query.where(eq(workflowValidations.userId, userId));
    }
    return await query;
  }

  async getLatestWorkflowValidation(userId?: string): Promise<WorkflowValidation | undefined> {
    const query = db
      .select()
      .from(workflowValidations)
      .where(eq(workflowValidations.isLatest, true))
      .orderBy(desc(workflowValidations.createdAt))
      .limit(1);

    if (userId) {
      const [validation] = await query.where(eq(workflowValidations.userId, userId));
      return validation;
    }
    
    const [validation] = await query;
    return validation;
  }

  async createWorkflowValidation(validation: InsertWorkflowValidation): Promise<WorkflowValidation> {
    return await db.transaction(async (tx) => {
      // Mark all previous validations as not latest
      await tx
        .update(workflowValidations)
        .set({ isLatest: false })
        .where(eq(workflowValidations.userId, validation.userId));

      // Insert new validation with completedAt timestamp
      const [result] = await tx
        .insert(workflowValidations)
        .values({
          ...validation,
          isLatest: true,
          completedAt: new Date(),
        })
        .returning();

      return result;
    });
  }

  async updateWorkflowValidationAsLatest(validationId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get the validation to update
      const [validation] = await tx
        .select()
        .from(workflowValidations)
        .where(eq(workflowValidations.id, validationId));

      if (!validation) {
        throw new Error('Validation not found');
      }

      // Mark all previous validations for this user as not latest
      await tx
        .update(workflowValidations)
        .set({ isLatest: false })
        .where(eq(workflowValidations.userId, validation.userId));

      // Mark the specified validation as latest
      await tx
        .update(workflowValidations)
        .set({ isLatest: true })
        .where(eq(workflowValidations.id, validationId));
    });
  }

  // Period management operations
  async getPeriods(): Promise<Period[]> {
    return await db.select().from(periods).orderBy(desc(periods.createdAt));
  }

  async getPeriod(id: string): Promise<Period | undefined> {
    const [period] = await db.select().from(periods).where(eq(periods.id, id));
    return period;
  }

  async createPeriod(period: InsertPeriod): Promise<Period> {
    const [result] = await db.insert(periods).values(period).returning();
    return result;
  }

  async updatePeriod(id: string, period: Partial<InsertPeriod>): Promise<Period> {
    const [result] = await db
      .update(periods)
      .set({ ...period, updatedAt: new Date() })
      .where(eq(periods.id, id))
      .returning();
    return result;
  }

  async closePeriod(periodId: string, userId: string, adjustments?: InsertPeriodAdjustment[]): Promise<Period> {
    // Start transaction for period closing
    return await db.transaction(async (tx) => {
      // Create adjustments if provided
      if (adjustments && adjustments.length > 0) {
        for (const adjustment of adjustments) {
          await tx.insert(periodAdjustments).values({
            ...adjustment,
            periodId,
            createdBy: userId,
            approvedBy: userId,
            approvedAt: new Date()
          });
        }
      }

      // Create closing log entry
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'close',
        performedBy: userId,
        description: 'Period closed with final adjustments',
        metadata: { adjustmentCount: adjustments?.length || 0 }
      });

      // Update period status to closed
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'closed',
          closedBy: userId,
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async closePeriodWithCompliance(
    periodId: string, 
    userId: string, 
    adjustments?: InsertPeriodAdjustment[],
    complianceData?: {
      complianceValidationId?: string | null;
      aiValidationStatus: 'passed' | 'skipped' | 'failed';
    }
  ): Promise<Period> {
    // Start transaction for period closing with compliance
    return await db.transaction(async (tx) => {
      // Create adjustments if provided
      if (adjustments && adjustments.length > 0) {
        for (const adjustment of adjustments) {
          await tx.insert(periodAdjustments).values({
            ...adjustment,
            periodId,
            createdBy: userId,
            approvedBy: userId,
            approvedAt: new Date()
          });
        }
      }

      // Create comprehensive closing log entry with compliance data
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'close',
        performedBy: userId,
        description: 'Period closed with compliance validation and final adjustments',
        metadata: { 
          adjustmentCount: adjustments?.length || 0,
          complianceValidationId: complianceData?.complianceValidationId,
          aiValidationStatus: complianceData?.aiValidationStatus,
          closingTimestamp: new Date().toISOString(),
          complianceAttestation: complianceData?.aiValidationStatus === 'passed'
        }
      });

      // Update period status to closed
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'closed',
          closedBy: userId,
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async reopenPeriod(periodId: string, userId: string, reason: string): Promise<Period> {
    return await db.transaction(async (tx) => {
      // Create log entry for reopening
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'reopen',
        performedBy: userId,
        description: reason,
        metadata: { reason }
      });

      // Update period status to open
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'open',
          closedBy: null,
          closedAt: null,
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async reopenPeriodWithAudit(periodId: string, userId: string, reason: string): Promise<Period> {
    return await db.transaction(async (tx) => {
      // Get period details for audit
      const [period] = await tx.select().from(periods).where(eq(periods.id, periodId));
      
      if (!period) {
        throw new Error('Period not found');
      }

      // Create comprehensive audit log entry for reopening
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'reopen',
        performedBy: userId,
        description: `Period reopened: ${reason}`,
        metadata: { 
          reason,
          previousStatus: period.status,
          previousClosedBy: period.closedBy,
          previousClosedAt: period.closedAt?.toISOString(),
          reopenTimestamp: new Date().toISOString(),
          auditTrail: true
        }
      });

      // Update period status to open
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'open',
          closedBy: null,
          closedAt: null,
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async getPeriodClosingLogs(periodId: string): Promise<PeriodClosingLog[]> {
    return await db
      .select()
      .from(periodClosingLogs)
      .where(eq(periodClosingLogs.periodId, periodId))
      .orderBy(desc(periodClosingLogs.createdAt));
  }

  async createPeriodAdjustment(adjustment: InsertPeriodAdjustment): Promise<PeriodAdjustment> {
    const [result] = await db.insert(periodAdjustments).values(adjustment).returning();
    return result;
  }

  async getPeriodAdjustments(periodId: string): Promise<PeriodAdjustment[]> {
    return await db
      .select()
      .from(periodAdjustments)
      .where(eq(periodAdjustments.periodId, periodId))
      .orderBy(desc(periodAdjustments.createdAt));
  }

  async approvePeriodAdjustment(adjustmentId: string, userId: string): Promise<PeriodAdjustment> {
    const [result] = await db
      .update(periodAdjustments)
      .set({ 
        approvedBy: userId,
        approvedAt: new Date()
      })
      .where(eq(periodAdjustments.id, adjustmentId))
      .returning();
    return result;
  }

  // Enhanced export operations
  async createExportRequest(exportData: InsertExportHistory): Promise<ExportHistory> {
    const [result] = await db.insert(exportHistory).values(exportData).returning();
    return result;
  }

  async getExportHistory(userId?: string, limit: number = 50): Promise<ExportHistory[]> {
    let query = db.select().from(exportHistory);
    
    if (userId) {
      query = query.where(eq(exportHistory.userId, userId));
    }
    
    return await query.orderBy(desc(exportHistory.createdAt)).limit(limit);
  }

  async updateExportStatus(exportId: string, status: string, filePath?: string, fileSize?: number): Promise<ExportHistory> {
    const updateData: any = { status };
    
    if (filePath) updateData.filePath = filePath;
    if (fileSize) updateData.fileSize = fileSize;
    if (status === 'completed') updateData.completedAt = new Date();
    
    const [result] = await db
      .update(exportHistory)
      .set(updateData)
      .where(eq(exportHistory.id, exportId))
      .returning();
    return result;
  }

  async getExportJob(id: string): Promise<ExportHistory | undefined> {
    const [exportJob] = await db.select().from(exportHistory).where(eq(exportHistory.id, id));
    return exportJob;
  }

  async deleteExpiredExports(): Promise<void> {
    await db
      .delete(exportHistory)
      .where(and(
        sql`expires_at IS NOT NULL`,
        sql`expires_at < NOW()`
      ));
  }

  async incrementDownloadCount(exportId: string): Promise<void> {
    await db
      .update(exportHistory)
      .set({ downloadCount: sql`download_count + 1` })
      .where(eq(exportHistory.id, exportId));
  }

  // Export preferences operations
  async getUserExportPreferences(userId: string, reportType?: string): Promise<ExportPreferences[]> {
    let query = db.select().from(exportPreferences).where(eq(exportPreferences.userId, userId));
    
    if (reportType) {
      query = query.where(and(
        eq(exportPreferences.userId, userId),
        eq(exportPreferences.reportType, reportType)
      ));
    }
    
    return await query.orderBy(desc(exportPreferences.updatedAt));
  }

  async setExportPreference(preference: InsertExportPreferences): Promise<ExportPreferences> {
    const [result] = await db
      .insert(exportPreferences)
      .values(preference)
      .onConflictDoUpdate({
        target: [exportPreferences.userId, exportPreferences.reportType],
        set: {
          preferredFormat: preference.preferredFormat,
          defaultDateRange: preference.defaultDateRange,
          customFields: preference.customFields,
          emailDelivery: preference.emailDelivery,
          compression: preference.compression,
          updatedAt: new Date()
        }
      })
      .returning();
    return result;
  }

  async updateExportPreference(userId: string, reportType: string, updates: Partial<InsertExportPreferences>): Promise<ExportPreferences> {
    const [result] = await db
      .update(exportPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(exportPreferences.userId, userId),
        eq(exportPreferences.reportType, reportType)
      ))
      .returning();
    return result;
  }

  // Scheduled export operations
  async getExportJobs(userId?: string): Promise<ExportJob[]> {
    let query = db.select().from(exportJobs);
    
    if (userId) {
      query = query.where(eq(exportJobs.userId, userId));
    }
    
    return await query.orderBy(desc(exportJobs.createdAt));
  }

  async createExportJob(job: InsertExportJob): Promise<ExportJob> {
    const [result] = await db.insert(exportJobs).values(job).returning();
    return result;
  }

  async updateExportJob(id: string, updates: Partial<InsertExportJob>): Promise<ExportJob> {
    const [result] = await db
      .update(exportJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(exportJobs.id, id))
      .returning();
    return result;
  }

  async deleteExportJob(id: string): Promise<void> {
    await db.delete(exportJobs).where(eq(exportJobs.id, id));
  }

  // Enhanced export format operations
  async exportToCSV(data: any[], filename: string): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, filename);
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    return filePath;
  }

  async exportToExcel(data: Record<string, any[]>, filename: string): Promise<string> {
    const XLSX = await import('xlsx');
    const fs = await import('fs');
    const path = await import('path');

    const workbook = XLSX.utils.book_new();

    // Add each sheet to the workbook
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      if (sheetData && sheetData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, filename);
    XLSX.writeFile(workbook, filePath);
    
    return filePath;
  }

  async exportToPDF(data: any, reportType: string, filename: string): Promise<string> {
    const jsPDF = (await import('jspdf')).jsPDF;
    const fs = await import('fs');
    const path = await import('path');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`WorkFlu ${reportType.replace('_', ' ').toUpperCase()} Report`, 20, 30);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
    
    let yPosition = 60;
    
    if (Array.isArray(data)) {
      // Table format for array data
      const autoTable = (await import('jspdf-autotable')).default;
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => item[header] || ''));
        
        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [63, 123, 191] }
        });
      }
    } else {
      // Summary format for object data
      doc.setFontSize(10);
      Object.entries(data).forEach(([key, value]) => {
        doc.text(`${key}: ${JSON.stringify(value)}`, 20, yPosition);
        yPosition += 10;
      });
    }

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, filename);
    doc.save(filePath);
    
    return filePath;
  }

  async compressFile(filePath: string): Promise<string> {
    const archiver = await import('archiver');
    const fs = await import('fs');
    const path = await import('path');
    
    const compressedPath = filePath.replace(path.extname(filePath), '.zip');
    const output = fs.createWriteStream(compressedPath);
    const archive = archiver.default('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(compressedPath));
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.file(filePath, { name: path.basename(filePath) });
      archive.finalize();
    });
  }

  async sendEmailWithAttachment(recipients: string[], subject: string, body: string, attachmentPath: string): Promise<void> {
    const nodemailer = await import('nodemailer');
    
    // Configure transporter (you may need to configure this based on your email service)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'reports@workflu.com',
      to: recipients.join(', '),
      subject,
      text: body,
      attachments: [{
        path: attachmentPath
      }]
    };

    await transporter.sendMail(mailOptions);
  }

  // Shipping and Logistics implementations
  
  // Carrier operations
  async getCarriers(filter?: CarrierFilter): Promise<Carrier[]> {
    let query = db.select().from(carriers);
    
    if (filter?.isActive !== undefined) {
      query = query.where(eq(carriers.isActive, filter.isActive));
    }
    
    if (filter?.isPreferred !== undefined) {
      query = query.where(eq(carriers.isPreferred, filter.isPreferred));
    }
    
    if (filter?.serviceType) {
      query = query.where(sql`${carriers.serviceTypes} @> ${[filter.serviceType]}`);
    }
    
    return await query.orderBy(desc(carriers.isPreferred), desc(carriers.rating), carriers.name);
  }

  async getCarrier(id: string): Promise<Carrier | undefined> {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
    return carrier;
  }

  async createCarrier(carrier: InsertCarrier): Promise<Carrier> {
    const [result] = await db.insert(carriers).values(carrier).returning();
    return result;
  }

  async updateCarrier(id: string, carrier: Partial<InsertCarrier>): Promise<Carrier> {
    const [result] = await db
      .update(carriers)
      .set({ ...carrier, updatedAt: new Date() })
      .where(eq(carriers.id, id))
      .returning();
    return result;
  }

  async deleteCarrier(id: string): Promise<void> {
    await db.update(carriers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(carriers.id, id));
  }

  async updateCarrierRating(carrierId: string, rating: number): Promise<Carrier> {
    const [result] = await db
      .update(carriers)
      .set({ rating: rating.toString(), updatedAt: new Date() })
      .where(eq(carriers.id, carrierId))
      .returning();
    return result;
  }

  // Shipment operations
  async getShipments(filter?: ShipmentFilter): Promise<Shipment[]> {
    let query = db.select().from(shipments);
    const conditions = [];

    if (filter?.status) {
      conditions.push(eq(shipments.status, filter.status));
    }

    if (filter?.method) {
      conditions.push(eq(shipments.method, filter.method));
    }

    if (filter?.carrierId) {
      conditions.push(eq(shipments.carrierId, filter.carrierId));
    }

    if (filter?.orderId) {
      conditions.push(eq(shipments.orderId, filter.orderId));
    }

    if (filter?.startDate) {
      conditions.push(gte(shipments.createdAt, new Date(filter.startDate)));
    }

    if (filter?.endDate) {
      conditions.push(lte(shipments.createdAt, new Date(filter.endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(shipments.createdAt));
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment;
  }

  async getShipmentWithDetails(id: string): Promise<ShipmentWithDetailsResponse | undefined> {
    const shipment = await this.getShipment(id);
    if (!shipment) return undefined;

    const [carrier, items, costs, tracking] = await Promise.all([
      this.getCarrier(shipment.carrierId),
      this.getShipmentItemsWithStock(id),
      this.getShippingCosts(id),
      this.getDeliveryTracking(id)
    ]);

    return {
      ...shipment,
      carrier: carrier!,
      items,
      costs,
      tracking
    };
  }

  private async getShipmentItemsWithStock(shipmentId: string): Promise<(ShipmentItem & { warehouseStock: WarehouseStock })[]> {
    const result = await db
      .select({
        shipmentItem: shipmentItems,
        warehouseStock: warehouseStock,
      })
      .from(shipmentItems)
      .leftJoin(warehouseStock, eq(shipmentItems.warehouseStockId, warehouseStock.id))
      .where(eq(shipmentItems.shipmentId, shipmentId));

    return result.map(row => ({
      ...row.shipmentItem,
      warehouseStock: row.warehouseStock!
    }));
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const shipmentNumber = await this.generateNextShipmentNumber();
    
    const [result] = await db.insert(shipments).values({
      ...shipment,
      shipmentNumber,
    }).returning();
    return result;
  }

  async createShipmentFromWarehouseStock(shipmentData: CreateShipmentFromStock, userId: string): Promise<Shipment> {
    return await db.transaction(async (tx) => {
      // Generate shipment number
      const shipmentNumber = await this.generateNextShipmentNumberInTransaction(tx);
      
      // Calculate total weight
      const totalWeight = shipmentData.warehouseStockItems.reduce((sum, item) => 
        sum + parseFloat(item.quantity), 0
      );

      // Create the shipment
      const [shipment] = await tx.insert(shipments).values({
        shipmentNumber,
        orderId: shipmentData.orderId,
        carrierId: shipmentData.carrierId,
        method: shipmentData.method,
        status: 'pending',
        originAddress: shipmentData.originAddress,
        destinationAddress: shipmentData.destinationAddress,
        estimatedDepartureDate: shipmentData.estimatedDepartureDate ? new Date(shipmentData.estimatedDepartureDate) : undefined,
        estimatedArrivalDate: shipmentData.estimatedArrivalDate ? new Date(shipmentData.estimatedArrivalDate) : undefined,
        totalWeight: totalWeight.toString(),
        notes: shipmentData.notes,
        createdBy: userId,
      }).returning();

      // Create shipment items and reserve stock
      for (const item of shipmentData.warehouseStockItems) {
        await tx.insert(shipmentItems).values({
          shipmentId: shipment.id,
          warehouseStockId: item.warehouseStockId,
          quantity: item.quantity,
          packingDetails: item.packingDetails,
        });

        // Reserve the stock
        await this.reserveStockInTransaction(tx, item.warehouseStockId, parseFloat(item.quantity), shipment.id);
      }

      return shipment;
    });
  }

  private async generateNextShipmentNumber(): Promise<string> {
    const latestShipment = await db
      .select({ shipmentNumber: shipments.shipmentNumber })
      .from(shipments)
      .orderBy(sql`${shipments.shipmentNumber} DESC`)
      .limit(1);

    return this.calculateNextShipmentNumber(latestShipment[0]?.shipmentNumber);
  }

  private async generateNextShipmentNumberInTransaction(tx: any): Promise<string> {
    const lockId = 1234567891; // Different lock for shipments
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
    
    const latestShipment = await tx
      .select({ shipmentNumber: shipments.shipmentNumber })
      .from(shipments)
      .orderBy(sql`${shipments.shipmentNumber} DESC`)
      .limit(1)
      .for('update');

    return this.calculateNextShipmentNumber(latestShipment[0]?.shipmentNumber);
  }

  private calculateNextShipmentNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'SHP-000001';
    }

    const numberMatch = lastNumber.match(/SHP-(\d+)/);
    if (!numberMatch) {
      return 'SHP-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `SHP-${nextNumber.toString().padStart(6, '0')}`;
  }

  async updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment> {
    const [result] = await db
      .update(shipments)
      .set({ ...shipment, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return result;
  }

  async updateShipmentStatus(id: string, status: string, userId: string, actualDate?: Date): Promise<Shipment> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'in_transit' && actualDate) {
      updateData.actualDepartureDate = actualDate;
    }
    
    if (status === 'delivered' && actualDate) {
      updateData.actualArrivalDate = actualDate;
    }

    const [result] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();

    // If delivered, update final warehouse stock
    if (status === 'delivered') {
      await this.updateFinalWarehouseFromDelivery(id, userId);
    }

    return result;
  }

  async deleteShipment(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Release reserved stock first
      const items = await tx.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, id));
      
      for (const item of items) {
        await this.releaseReservedStockInTransaction(tx, item.warehouseStockId, parseFloat(item.quantity));
      }

      // Delete related records
      await tx.delete(deliveryTracking).where(eq(deliveryTracking.shipmentId, id));
      await tx.delete(shippingCosts).where(eq(shippingCosts.shipmentId, id));
      await tx.delete(shipmentItems).where(eq(shipmentItems.shipmentId, id));
      await tx.delete(shipments).where(eq(shipments.id, id));
    });
  }

  // Shipment item operations
  async getShipmentItems(shipmentId: string): Promise<ShipmentItem[]> {
    return await db.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, shipmentId));
  }

  async createShipmentItem(item: InsertShipmentItem): Promise<ShipmentItem> {
    const [result] = await db.insert(shipmentItems).values(item).returning();
    return result;
  }

  async updateShipmentItem(id: string, item: Partial<InsertShipmentItem>): Promise<ShipmentItem> {
    const [result] = await db
      .update(shipmentItems)
      .set(item)
      .where(eq(shipmentItems.id, id))
      .returning();
    return result;
  }

  async deleteShipmentItem(id: string): Promise<void> {
    await db.delete(shipmentItems).where(eq(shipmentItems.id, id));
  }

  // Shipping cost operations
  async getShippingCosts(shipmentId: string): Promise<ShippingCost[]> {
    return await db.select().from(shippingCosts).where(eq(shippingCosts.shipmentId, shipmentId));
  }

  async getShippingCost(id: string): Promise<ShippingCost | undefined> {
    const [cost] = await db.select().from(shippingCosts).where(eq(shippingCosts.id, id));
    return cost;
  }

  async addShippingCost(costData: AddShippingCost, userId: string): Promise<ShippingCost> {
    const amount = new Decimal(costData.amount);
    let amountUsd = amount;
    
    // Convert to USD if needed
    if (costData.currency === 'ETB' && costData.exchangeRate) {
      amountUsd = amount.div(new Decimal(costData.exchangeRate));
    }

    const remaining = costData.amountPaid ? 
      amount.sub(new Decimal(costData.amountPaid)).toString() : 
      amount.toString();

    const [result] = await db.insert(shippingCosts).values({
      shipmentId: costData.shipmentId,
      costType: costData.costType,
      amount: costData.amount,
      currency: costData.currency,
      exchangeRate: costData.exchangeRate,
      amountUsd: amountUsd.toFixed(2),
      description: costData.description,
      paymentMethod: costData.paymentMethod,
      amountPaid: costData.amountPaid || '0',
      remaining,
      fundingSource: costData.fundingSource,
      createdBy: userId,
    }).returning();

    // If paid from capital, create capital entry
    if (costData.fundingSource === 'capital' && costData.amountPaid && parseFloat(costData.amountPaid) > 0) {
      await this.createCapitalEntryWithConcurrencyProtection({
        entryId: `SHP-${result.id}`,
        amount: amountUsd.toFixed(2),
        type: 'CapitalOut',
        reference: result.shipmentId,
        description: `Shipping cost - ${costData.costType} ${costData.currency === 'ETB' ? `(${costData.amountPaid} ETB @ ${costData.exchangeRate})` : ''}`,
        paymentCurrency: costData.currency,
        exchangeRate: costData.exchangeRate,
        createdBy: userId,
      });
    }

    return result;
  }

  async updateShippingCost(id: string, cost: Partial<InsertShippingCost>): Promise<ShippingCost> {
    const [result] = await db
      .update(shippingCosts)
      .set(cost)
      .where(eq(shippingCosts.id, id))
      .returning();
    return result;
  }

  async deleteShippingCost(id: string): Promise<void> {
    await db.delete(shippingCosts).where(eq(shippingCosts.id, id));
  }

  // Delivery tracking operations
  async getDeliveryTracking(shipmentId: string): Promise<DeliveryTracking[]> {
    return await db.select().from(deliveryTracking)
      .where(eq(deliveryTracking.shipmentId, shipmentId))
      .orderBy(desc(deliveryTracking.timestamp));
  }

  async addDeliveryTracking(trackingData: AddDeliveryTracking, userId: string): Promise<DeliveryTracking> {
    const [result] = await db.insert(deliveryTracking).values({
      shipmentId: trackingData.shipmentId,
      status: trackingData.status,
      location: trackingData.location,
      description: trackingData.description,
      isCustomerNotified: trackingData.isCustomerNotified,
      proofOfDelivery: trackingData.proofOfDelivery,
      exceptionDetails: trackingData.exceptionDetails,
      createdBy: userId,
    }).returning();

    return result;
  }

  async updateDeliveryTracking(id: string, tracking: Partial<InsertDeliveryTracking>): Promise<DeliveryTracking> {
    const [result] = await db
      .update(deliveryTracking)
      .set(tracking)
      .where(eq(deliveryTracking.id, id))
      .returning();
    return result;
  }

  async markCustomerNotified(trackingId: string, userId: string): Promise<DeliveryTracking> {
    const [result] = await db
      .update(deliveryTracking)
      .set({ isCustomerNotified: true })
      .where(eq(deliveryTracking.id, trackingId))
      .returning();
    return result;
  }

  // Shipping analytics and reporting
  async getShippingAnalytics(filters?: DateRangeFilter): Promise<ShippingAnalyticsResponse> {
    let dateConditions = [];
    
    if (filters?.startDate) {
      dateConditions.push(gte(shipments.createdAt, new Date(filters.startDate)));
    }
    
    if (filters?.endDate) {
      dateConditions.push(lte(shipments.createdAt, new Date(filters.endDate)));
    }

    const whereClause = dateConditions.length > 0 ? and(...dateConditions) : undefined;

    // Summary stats
    const summaryResult = await db
      .select({
        totalShipments: count(),
        inTransit: sum(sql`CASE WHEN ${shipments.status} = 'in_transit' THEN 1 ELSE 0 END`),
        delivered: sum(sql`CASE WHEN ${shipments.status} = 'delivered' THEN 1 ELSE 0 END`),
      })
      .from(shipments)
      .where(whereClause);

    // Cost summary
    const costResult = await db
      .select({
        totalCostUsd: sum(shippingCosts.amountUsd),
        totalWeight: sum(shipments.totalWeight),
      })
      .from(shipments)
      .leftJoin(shippingCosts, eq(shipments.id, shippingCosts.shipmentId))
      .where(whereClause);

    const summary = summaryResult[0];
    const costs = costResult[0];
    const totalCostUsd = parseFloat(costs?.totalCostUsd || '0');
    const totalWeight = parseFloat(costs?.totalWeight || '0');

    // Carrier performance
    const carrierPerformance = await this.getCarrierPerformanceData(whereClause);
    
    // Cost breakdown
    const costBreakdown = await this.getShippingCostBreakdown(whereClause);
    
    // Delivery time analysis
    const deliveryTimeAnalysis = await this.getDeliveryTimeAnalysis(whereClause);

    return {
      summary: {
        totalShipments: Number(summary.totalShipments || 0),
        inTransit: Number(summary.inTransit || 0),
        delivered: Number(summary.delivered || 0),
        totalCostUsd,
        averageCostPerKg: totalWeight > 0 ? totalCostUsd / totalWeight : 0,
      },
      carrierPerformance,
      costBreakdown,
      deliveryTimeAnalysis,
    };
  }

  private async getCarrierPerformanceData(whereClause: any): Promise<any[]> {
    const result = await db
      .select({
        carrierId: carriers.id,
        carrierName: carriers.name,
        totalShipments: count(shipments.id),
        onTimeDeliveries: sum(sql`CASE WHEN ${shipments.actualArrivalDate} <= ${shipments.estimatedArrivalDate} THEN 1 ELSE 0 END`),
        averageCostPerKg: avg(sql`${shippingCosts.amountUsd} / ${shipments.totalWeight}`),
        rating: carriers.rating,
      })
      .from(carriers)
      .leftJoin(shipments, eq(carriers.id, shipments.carrierId))
      .leftJoin(shippingCosts, eq(shipments.id, shippingCosts.shipmentId))
      .where(whereClause)
      .groupBy(carriers.id, carriers.name, carriers.rating);

    return result.map(row => ({
      carrierId: row.carrierId,
      carrierName: row.carrierName,
      totalShipments: Number(row.totalShipments || 0),
      onTimeDeliveryRate: row.totalShipments ? (Number(row.onTimeDeliveries || 0) / Number(row.totalShipments)) * 100 : 0,
      averageCostPerKg: Number(row.averageCostPerKg || 0),
      rating: Number(row.rating || 0),
    }));
  }

  private async getShippingCostBreakdown(whereClause: any): Promise<any[]> {
    const result = await db
      .select({
        costType: shippingCosts.costType,
        totalUsd: sum(shippingCosts.amountUsd),
      })
      .from(shippingCosts)
      .leftJoin(shipments, eq(shippingCosts.shipmentId, shipments.id))
      .where(whereClause)
      .groupBy(shippingCosts.costType);

    const totalCost = result.reduce((sum, row) => sum + parseFloat(row.totalUsd || '0'), 0);

    return result.map(row => ({
      costType: row.costType,
      totalUsd: parseFloat(row.totalUsd || '0'),
      percentage: totalCost > 0 ? (parseFloat(row.totalUsd || '0') / totalCost) * 100 : 0,
    }));
  }

  private async getDeliveryTimeAnalysis(whereClause: any): Promise<any> {
    const result = await db
      .select({
        method: shipments.method,
        averageDays: avg(sql`EXTRACT(epoch FROM (${shipments.actualArrivalDate} - ${shipments.actualDepartureDate})) / 86400`),
      })
      .from(shipments)
      .where(and(whereClause, sql`${shipments.actualArrivalDate} IS NOT NULL AND ${shipments.actualDepartureDate} IS NOT NULL`))
      .groupBy(shipments.method);

    const overallAverage = result.reduce((sum, row) => sum + Number(row.averageDays || 0), 0) / result.length || 0;

    return {
      averageDeliveryDays: overallAverage,
      byMethod: result.map(row => ({
        method: row.method,
        averageDays: Number(row.averageDays || 0),
      })),
    };
  }

  async getCarrierPerformanceReport(): Promise<any> {
    return await this.getCarrierPerformanceData(undefined);
  }

  async getShippingCostAnalysis(filters?: DateRangeFilter): Promise<any> {
    let whereClause = undefined;
    if (filters?.startDate || filters?.endDate) {
      const conditions = [];
      if (filters.startDate) conditions.push(gte(shipments.createdAt, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(shipments.createdAt, new Date(filters.endDate)));
      whereClause = and(...conditions);
    }
    
    return await this.getShippingCostBreakdown(whereClause);
  }

  async getDeliveryTimeAnalysis(filters?: DateRangeFilter): Promise<any> {
    let whereClause = undefined;
    if (filters?.startDate || filters?.endDate) {
      const conditions = [];
      if (filters.startDate) conditions.push(gte(shipments.createdAt, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(shipments.createdAt, new Date(filters.endDate)));
      whereClause = and(...conditions);
    }
    
    return await this.getDeliveryTimeAnalysis(whereClause);
  }

  // Integration operations
  async getAvailableWarehouseStockForShipping(): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock)
      .where(and(
        eq(warehouseStock.status, 'READY_TO_SHIP'),
        sql`${warehouseStock.qtyKgClean} > ${warehouseStock.qtyKgReserved}`
      ))
      .orderBy(desc(warehouseStock.createdAt));
  }

  async reserveStockForShipment(stockId: string, quantity: number, shipmentId: string): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      return await this.reserveStockInTransaction(tx, stockId, quantity, shipmentId);
    });
  }

  private async reserveStockInTransaction(tx: any, stockId: string, quantity: number, shipmentId: string): Promise<WarehouseStock> {
    const [stock] = await tx.select().from(warehouseStock).where(eq(warehouseStock.id, stockId)).for('update');
    
    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    const availableQuantity = parseFloat(stock.qtyKgClean) - parseFloat(stock.qtyKgReserved);
    if (availableQuantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${availableQuantity}kg, Requested: ${quantity}kg`);
    }

    const newReserved = parseFloat(stock.qtyKgReserved) + quantity;
    
    const [result] = await tx
      .update(warehouseStock)
      .set({ qtyKgReserved: newReserved.toString() })
      .where(eq(warehouseStock.id, stockId))
      .returning();

    return result;
  }

  async releaseReservedStock(stockId: string, quantity: number): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      return await this.releaseReservedStockInTransaction(tx, stockId, quantity);
    });
  }

  private async releaseReservedStockInTransaction(tx: any, stockId: string, quantity: number): Promise<WarehouseStock> {
    const [stock] = await tx.select().from(warehouseStock).where(eq(warehouseStock.id, stockId)).for('update');
    
    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    const newReserved = Math.max(0, parseFloat(stock.qtyKgReserved) - quantity);
    
    const [result] = await tx
      .update(warehouseStock)
      .set({ qtyKgReserved: newReserved.toString() })
      .where(eq(warehouseStock.id, stockId))
      .returning();

    return result;
  }

  async updateFinalWarehouseFromDelivery(shipmentId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get shipment items
      const items = await tx.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, shipmentId));
      
      for (const item of items) {
        const [stock] = await tx.select().from(warehouseStock).where(eq(warehouseStock.id, item.warehouseStockId));
        
        if (stock && stock.warehouse === 'FIRST') {
          // Create new stock entry in FINAL warehouse
          await tx.insert(warehouseStock).values({
            purchaseId: stock.purchaseId,
            orderId: stock.orderId,
            supplierId: stock.supplierId,
            warehouse: 'FINAL',
            status: 'READY_FOR_SALE',
            qtyKgTotal: item.quantity,
            qtyKgClean: item.quantity,
            qtyKgNonClean: '0',
            qtyKgReserved: '0',
            cartonsCount: stock.cartonsCount,
            unitCostCleanUsd: stock.unitCostCleanUsd,
          });

          // Update FIRST warehouse stock (reduce by shipped quantity)
          const newCleanQty = parseFloat(stock.qtyKgClean) - parseFloat(item.quantity);
          const newReservedQty = parseFloat(stock.qtyKgReserved) - parseFloat(item.quantity);
          
          await tx
            .update(warehouseStock)
            .set({ 
              qtyKgClean: Math.max(0, newCleanQty).toString(),
              qtyKgReserved: Math.max(0, newReservedQty).toString(),
            })
            .where(eq(warehouseStock.id, item.warehouseStockId));
        }
      }
    });
  }

  // Quality Standards operations
  async getQualityStandards(isActive?: boolean): Promise<QualityStandard[]> {
    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(qualityStandards.isActive, isActive));
    }
    
    return await db
      .select()
      .from(qualityStandards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityStandards.createdAt));
  }

  async getQualityStandard(id: string): Promise<QualityStandard | undefined> {
    const [result] = await db
      .select()
      .from(qualityStandards)
      .where(eq(qualityStandards.id, id));
    return result;
  }

  async createQualityStandard(standard: InsertQualityStandard): Promise<QualityStandard> {
    const [result] = await db
      .insert(qualityStandards)
      .values(standard)
      .returning();
    return result;
  }

  async updateQualityStandard(id: string, standard: Partial<InsertQualityStandard>): Promise<QualityStandard> {
    const [result] = await db
      .update(qualityStandards)
      .set({ ...standard, updatedAt: new Date() })
      .where(eq(qualityStandards.id, id))
      .returning();
    return result;
  }

  // Warehouse Batches operations
  async getWarehouseBatches(filter?: { supplierId?: string; qualityGrade?: string; isActive?: boolean }): Promise<WarehouseBatch[]> {
    const conditions = [];
    
    if (filter?.supplierId) {
      conditions.push(eq(warehouseBatches.supplierId, filter.supplierId));
    }
    if (filter?.qualityGrade) {
      conditions.push(eq(warehouseBatches.qualityGrade, filter.qualityGrade));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(warehouseBatches.isActive, filter.isActive));
    }
    
    return await db
      .select()
      .from(warehouseBatches)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(warehouseBatches.createdAt));
  }

  async getWarehouseBatch(id: string): Promise<WarehouseBatch | undefined> {
    const [result] = await db
      .select()
      .from(warehouseBatches)
      .where(eq(warehouseBatches.id, id));
    return result;
  }

  async createWarehouseBatch(batch: InsertWarehouseBatch): Promise<WarehouseBatch> {
    const [result] = await db
      .insert(warehouseBatches)
      .values(batch)
      .returning();
    return result;
  }

  async updateWarehouseBatch(id: string, batch: Partial<InsertWarehouseBatch>): Promise<WarehouseBatch> {
    const [result] = await db
      .update(warehouseBatches)
      .set({ ...batch, updatedAt: new Date() })
      .where(eq(warehouseBatches.id, id))
      .returning();
    return result;
  }

  async splitWarehouseBatch(batchId: string, splitQuantityKg: string, userId: string): Promise<{ originalBatch: WarehouseBatch; newBatch: WarehouseBatch }> {
    return await db.transaction(async (tx) => {
      const [originalBatch] = await tx
        .select()
        .from(warehouseBatches)
        .where(eq(warehouseBatches.id, batchId))
        .for('update');
      
      if (!originalBatch) {
        throw new Error('Batch not found');
      }

      const splitQuantity = parseFloat(splitQuantityKg);
      const originalQuantity = parseFloat(originalBatch.totalQuantityKg);

      if (splitQuantity >= originalQuantity) {
        throw new Error('Split quantity cannot be greater than or equal to original quantity');
      }

      // Update original batch
      const newOriginalQuantity = originalQuantity - splitQuantity;
      const [updatedOriginalBatch] = await tx
        .update(warehouseBatches)
        .set({ 
          totalQuantityKg: newOriginalQuantity.toString(),
          updatedAt: new Date() 
        })
        .where(eq(warehouseBatches.id, batchId))
        .returning();

      // Create new batch from split
      const [newBatch] = await tx
        .insert(warehouseBatches)
        .values({
          batchNumber: `${originalBatch.batchNumber}-SPLIT-${Date.now()}`,
          supplierId: originalBatch.supplierId,
          qualityGrade: originalBatch.qualityGrade,
          totalQuantityKg: splitQuantityKg,
          notes: `Split from batch ${originalBatch.batchNumber}`,
          createdById: userId,
        })
        .returning();

      return { originalBatch: updatedOriginalBatch, newBatch };
    });
  }

  async mergeWarehouseBatches(batchIds: string[], userId: string): Promise<WarehouseBatch> {
    return await db.transaction(async (tx) => {
      // Get all batches to merge (simplified - in production would use IN clause)
      const batches = [];
      for (const id of batchIds) {
        const [batch] = await tx
          .select()
          .from(warehouseBatches)
          .where(and(eq(warehouseBatches.id, id), eq(warehouseBatches.isActive, true)))
          .for('update');
        if (batch) batches.push(batch);
      }

      if (batches.length !== batchIds.length) {
        throw new Error('Some batches not found or inactive');
      }

      // Verify all batches have same supplier and quality grade
      const firstBatch = batches[0];
      const allSameSupplier = batches.every(b => b.supplierId === firstBatch.supplierId);
      const allSameGrade = batches.every(b => b.qualityGrade === firstBatch.qualityGrade);

      if (!allSameSupplier || !allSameGrade) {
        throw new Error('Cannot merge batches with different suppliers or quality grades');
      }

      // Calculate total quantity
      const totalQuantity = batches.reduce((sum, batch) => sum + parseFloat(batch.totalQuantityKg), 0);

      // Create merged batch
      const [mergedBatch] = await tx
        .insert(warehouseBatches)
        .values({
          batchNumber: `MERGED-${Date.now()}`,
          supplierId: firstBatch.supplierId,
          qualityGrade: firstBatch.qualityGrade,
          totalQuantityKg: totalQuantity.toString(),
          notes: `Merged from batches: ${batches.map(b => b.batchNumber).join(', ')}`,
          createdById: userId,
        })
        .returning();

      // Deactivate original batches
      for (const batchId of batchIds) {
        await tx
          .update(warehouseBatches)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(warehouseBatches.id, batchId));
      }

      return mergedBatch;
    });
  }

  // Quality Inspections operations
  async getQualityInspections(filter?: { status?: string; inspectionType?: string; batchId?: string }): Promise<QualityInspection[]> {
    const conditions = [];
    
    if (filter?.status) {
      conditions.push(eq(qualityInspections.status, filter.status));
    }
    if (filter?.inspectionType) {
      conditions.push(eq(qualityInspections.inspectionType, filter.inspectionType));
    }
    if (filter?.batchId) {
      conditions.push(eq(qualityInspections.batchId, filter.batchId));
    }
    
    return await db
      .select()
      .from(qualityInspections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityInspections.createdAt));
  }

  async getQualityInspection(id: string): Promise<QualityInspection | undefined> {
    const [result] = await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.id, id));
    return result;
  }

  async createQualityInspection(inspection: InsertQualityInspection): Promise<QualityInspection> {
    const [result] = await db
      .insert(qualityInspections)
      .values(inspection)
      .returning();
    return result;
  }

  async updateQualityInspection(id: string, inspection: Partial<InsertQualityInspection>): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({ ...inspection, updatedAt: new Date() })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async completeQualityInspection(id: string, results: {
    qualityGrade: string;
    overallScore?: string;
    testResults?: any;
    recommendations?: string;
    userId: string;
  }): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'completed',
        qualityGrade: results.qualityGrade,
        overallScore: results.overallScore,
        testResults: results.testResults,
        recommendations: results.recommendations,
        completedAt: new Date(),
        completedById: results.userId,
        updatedAt: new Date(),
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async approveQualityInspection(id: string, userId: string): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async rejectQualityInspection(id: string, rejectionReason: string, userId: string): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'rejected',
        rejectionReason,
        rejectedAt: new Date(),
        rejectedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  // Enhanced warehouse stock operations with quality and batch tracking
  async assignQualityGradeToStock(stockId: string, qualityGrade: string, qualityScore?: string, userId?: string): Promise<WarehouseStock> {
    const [result] = await db
      .update(warehouseStock)
      .set({
        qualityGrade,
        qualityScore,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stockId))
      .returning();
    
    if (!result) {
      throw new Error('Warehouse stock not found');
    }
    
    return result;
  }

  async assignBatchToStock(stockId: string, batchId: string, userId?: string): Promise<WarehouseStock> {
    // Verify batch exists
    const batch = await this.getWarehouseBatch(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    const [result] = await db
      .update(warehouseStock)
      .set({
        batchId,
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stockId))
      .returning();
    
    if (!result) {
      throw new Error('Warehouse stock not found');
    }
    
    return result;
  }

  async getStockWithQualityHistory(stockId: string): Promise<{
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    consumptions: InventoryConsumption[];
    transfers: StockTransfer[];
    adjustments: InventoryAdjustment[];
  }> {
    // Get the stock item
    const [stock] = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.id, stockId));

    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    // Get associated batch if exists
    let batch: WarehouseBatch | undefined;
    if (stock.batchId) {
      batch = await this.getWarehouseBatch(stock.batchId);
    }

    // Get quality inspections
    const inspections = await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.batchId, stock.batchId || ''))
      .orderBy(desc(qualityInspections.createdAt));

    // Get consumption records
    const consumptions = await db
      .select()
      .from(inventoryConsumption)
      .where(eq(inventoryConsumption.warehouseStockId, stockId))
      .orderBy(desc(inventoryConsumption.createdAt));

    // Get transfer records
    const transfers = await db
      .select()
      .from(stockTransfers)
      .where(eq(stockTransfers.warehouseStockId, stockId))
      .orderBy(desc(stockTransfers.createdAt));

    // Get adjustment records
    const adjustments = await db
      .select()
      .from(inventoryAdjustments)
      .where(eq(inventoryAdjustments.warehouseStockId, stockId))
      .orderBy(desc(inventoryAdjustments.createdAt));

    return {
      stock,
      batch,
      inspections,
      consumptions,
      transfers,
      adjustments,
    };
  }

  // Inventory consumption operations
  async getInventoryConsumption(filter?: { warehouseStockId?: string; consumptionType?: string; orderId?: string }): Promise<InventoryConsumption[]> {
    const conditions = [];
    
    if (filter?.warehouseStockId) {
      conditions.push(eq(inventoryConsumption.warehouseStockId, filter.warehouseStockId));
    }
    if (filter?.consumptionType) {
      conditions.push(eq(inventoryConsumption.consumptionType, filter.consumptionType));
    }
    if (filter?.orderId) {
      conditions.push(eq(inventoryConsumption.orderId, filter.orderId));
    }
    
    return await db
      .select()
      .from(inventoryConsumption)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryConsumption.createdAt));
  }

  async getInventoryConsumptionByBatch(batchId: string): Promise<InventoryConsumption[]> {
    // Get all stock items in this batch and their consumption
    const batchStock = await db
      .select({ id: warehouseStock.id })
      .from(warehouseStock)
      .where(eq(warehouseStock.batchId, batchId));

    if (batchStock.length === 0) {
      return [];
    }

    const stockIds = batchStock.map(s => s.id);
    const consumptions = [];
    
    // Get consumption for each stock item (simplified - production would use IN clause)
    for (const stockId of stockIds) {
      const stockConsumptions = await db
        .select()
        .from(inventoryConsumption)
        .where(eq(inventoryConsumption.warehouseStockId, stockId))
        .orderBy(desc(inventoryConsumption.createdAt));
      consumptions.push(...stockConsumptions);
    }
    
    return consumptions;
  }

  async createInventoryConsumption(consumption: InsertInventoryConsumption): Promise<InventoryConsumption> {
    const [result] = await db
      .insert(inventoryConsumption)
      .values(consumption)
      .returning();
    return result;
  }

  async consumeInventoryFIFO(warehouseStockId: string, quantity: string, consumptionType: string, userId: string, allocatedTo?: string): Promise<InventoryConsumption[]> {
    const consumeQty = parseFloat(quantity);
    
    return await db.transaction(async (tx) => {
      // Get the specific stock item with locking
      const [stock] = await tx
        .select()
        .from(warehouseStock)
        .where(eq(warehouseStock.id, warehouseStockId))
        .for('update');

      if (!stock) {
        throw new Error('Warehouse stock not found');
      }

      const availableQty = parseFloat(stock.qtyKgClean) - parseFloat(stock.qtyKgReserved);
      
      if (availableQty < consumeQty) {
        throw new Error(`Insufficient stock. Available: ${availableQty}kg, Requested: ${consumeQty}kg`);
      }

      // Update stock quantities (FIFO consumption updates)
      const newConsumed = parseFloat(stock.qtyKgConsumed || '0') + consumeQty;
      const newClean = parseFloat(stock.qtyKgClean) - consumeQty;
      
      // Update FIFO sequence if not set
      const fifoSequence = stock.fifoSequence || new Date(stock.createdAt || new Date()).getTime();

      await tx
        .update(warehouseStock)
        .set({
          qtyKgConsumed: newConsumed.toString(),
          qtyKgClean: newClean.toString(),
          fifoSequence: fifoSequence.toString(),
          updatedAt: new Date(),
        })
        .where(eq(warehouseStock.id, warehouseStockId));

      // Create consumption record
      const [consumptionRecord] = await tx
        .insert(inventoryConsumption)
        .values({
          warehouseStockId,
          orderId: allocatedTo,
          quantityKg: quantity,
          consumptionType,
          unitCostUsd: stock.unitCostCleanUsd || '0',
          totalCostUsd: (parseFloat(stock.unitCostCleanUsd || '0') * consumeQty).toString(),
          createdById: userId,
        })
        .returning();

      return [consumptionRecord];
    });
  }

  async getStockAging(): Promise<Array<{ warehouseStockId: string; daysInStock: number; qtyKgClean: number; unitCostUsd: number }>> {
    const result = await db
      .select({
        warehouseStockId: warehouseStock.id,
        daysInStock: sql<number>`EXTRACT(epoch FROM (NOW() - ${warehouseStock.createdAt})) / 86400`,
        qtyKgClean: warehouseStock.qtyKgClean,
        unitCostUsd: warehouseStock.unitCostCleanUsd,
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean}::numeric > 0`)
      .orderBy(sql`EXTRACT(epoch FROM (NOW() - ${warehouseStock.createdAt})) / 86400 DESC`);

    return result.map(row => ({
      warehouseStockId: row.warehouseStockId,
      daysInStock: Number(row.daysInStock || 0),
      qtyKgClean: parseFloat(row.qtyKgClean || '0'),
      unitCostUsd: parseFloat(row.unitCostUsd || '0'),
    }));
  }

  async getConsumptionAnalytics(dateRange?: DateRangeFilter): Promise<{
    totalConsumed: number;
    averageCostPerKg: number;
    consumptionByType: Array<{ type: string; quantity: number; cost: number }>;
    fifoCompliance: number;
  }> {
    let whereClause = undefined;
    if (dateRange?.startDate || dateRange?.endDate) {
      const conditions = [];
      if (dateRange.startDate) conditions.push(gte(inventoryConsumption.createdAt, new Date(dateRange.startDate)));
      if (dateRange.endDate) conditions.push(lte(inventoryConsumption.createdAt, new Date(dateRange.endDate)));
      whereClause = and(...conditions);
    }

    // Total consumption metrics
    const totals = await db
      .select({
        totalConsumed: sum(inventoryConsumption.quantityKg),
        totalCost: sum(inventoryConsumption.totalCostUsd),
      })
      .from(inventoryConsumption)
      .where(whereClause);

    // Consumption by type
    const byType = await db
      .select({
        type: inventoryConsumption.consumptionType,
        quantity: sum(inventoryConsumption.quantityKg),
        cost: sum(inventoryConsumption.totalCostUsd),
      })
      .from(inventoryConsumption)
      .where(whereClause)
      .groupBy(inventoryConsumption.consumptionType);

    const totalConsumed = parseFloat(totals[0]?.totalConsumed || '0');
    const totalCost = parseFloat(totals[0]?.totalCost || '0');
    const averageCostPerKg = totalConsumed > 0 ? totalCost / totalConsumed : 0;

    // FIFO compliance calculation (simplified)
    const fifoCompliance = 95; // Placeholder - would need complex logic to verify actual FIFO adherence

    return {
      totalConsumed,
      averageCostPerKg,
      consumptionByType: byType.map(row => ({
        type: row.type,
        quantity: parseFloat(row.quantity || '0'),
        cost: parseFloat(row.cost || '0'),
      })),
      fifoCompliance,
    };
  }

  // Processing operations
  async getProcessingOperations(filter?: { status?: string; operationType?: string; batchId?: string }): Promise<ProcessingOperation[]> {
    const conditions = [];
    
    if (filter?.status) {
      conditions.push(eq(processingOperations.status, filter.status));
    }
    if (filter?.operationType) {
      conditions.push(eq(processingOperations.operationType, filter.operationType));
    }
    if (filter?.batchId) {
      conditions.push(eq(processingOperations.batchId, filter.batchId));
    }
    
    return await db
      .select()
      .from(processingOperations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(processingOperations.createdAt));
  }

  async getProcessingOperation(id: string): Promise<ProcessingOperation | undefined> {
    const [result] = await db
      .select()
      .from(processingOperations)
      .where(eq(processingOperations.id, id));
    return result;
  }

  async createProcessingOperation(operation: InsertProcessingOperation): Promise<ProcessingOperation> {
    const [result] = await db
      .insert(processingOperations)
      .values(operation)
      .returning();
    return result;
  }

  async updateProcessingOperation(id: string, operation: Partial<InsertProcessingOperation>): Promise<ProcessingOperation> {
    const [result] = await db
      .update(processingOperations)
      .set({ ...operation, updatedAt: new Date() })
      .where(eq(processingOperations.id, id))
      .returning();
    return result;
  }

  // Stock transfers operations
  async getStockTransfers(filter?: { fromWarehouse?: string; toWarehouse?: string; status?: string }): Promise<StockTransfer[]> {
    const conditions = [];
    
    if (filter?.fromWarehouse) {
      conditions.push(eq(stockTransfers.fromWarehouse, filter.fromWarehouse));
    }
    if (filter?.toWarehouse) {
      conditions.push(eq(stockTransfers.toWarehouse, filter.toWarehouse));
    }
    if (filter?.status) {
      conditions.push(eq(stockTransfers.status, filter.status));
    }
    
    return await db
      .select()
      .from(stockTransfers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(stockTransfers.createdAt));
  }

  async createStockTransfer(transfer: InsertStockTransfer): Promise<StockTransfer> {
    const [result] = await db
      .insert(stockTransfers)
      .values(transfer)
      .returning();
    return result;
  }

  async updateStockTransfer(id: string, transfer: Partial<InsertStockTransfer>): Promise<StockTransfer> {
    const [result] = await db
      .update(stockTransfers)
      .set({ ...transfer, updatedAt: new Date() })
      .where(eq(stockTransfers.id, id))
      .returning();
    return result;
  }

  // Inventory adjustments operations
  async getInventoryAdjustments(filter?: { warehouseStockId?: string; status?: string }): Promise<InventoryAdjustment[]> {
    const conditions = [];
    
    if (filter?.warehouseStockId) {
      conditions.push(eq(inventoryAdjustments.warehouseStockId, filter.warehouseStockId));
    }
    if (filter?.status) {
      conditions.push(eq(inventoryAdjustments.status, filter.status));
    }
    
    return await db
      .select()
      .from(inventoryAdjustments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryAdjustments.createdAt));
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const [result] = await db
      .insert(inventoryAdjustments)
      .values(adjustment)
      .returning();
    return result;
  }

  async approveInventoryAdjustment(id: string, userId: string): Promise<InventoryAdjustment> {
    const [result] = await db
      .update(inventoryAdjustments)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(inventoryAdjustments.id, id))
      .returning();
    return result;
  }

  async rejectInventoryAdjustment(id: string, reason: string, userId: string): Promise<InventoryAdjustment> {
    const [result] = await db
      .update(inventoryAdjustments)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(inventoryAdjustments.id, id))
      .returning();
    return result;
  }

  // Traceability operations
  async traceStockOrigin(stockId: string): Promise<{
    purchase: Purchase;
    supplier: Supplier;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    processingHistory: ProcessingOperation[];
  }> {
    // Get the stock item
    const [stock] = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.id, stockId));

    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    // Get purchase origin
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, stock.purchaseId || ''));

    if (!purchase) {
      throw new Error('Purchase origin not found');
    }

    // Get supplier
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, purchase.supplierId));

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Get associated batch if exists
    let batch: WarehouseBatch | undefined;
    if (stock.batchId) {
      batch = await this.getWarehouseBatch(stock.batchId);
    }

    // Get quality inspections for this batch
    const inspections = batch ? await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.batchId, batch.id))
      .orderBy(desc(qualityInspections.createdAt)) : [];

    // Get processing history for this batch
    const processingHistory = batch ? await db
      .select()
      .from(processingOperations)
      .where(eq(processingOperations.batchId, batch.id))
      .orderBy(desc(processingOperations.createdAt)) : [];

    return {
      purchase,
      supplier,
      batch,
      inspections,
      processingHistory,
    };
  }

  async traceConsumptionChain(consumptionId: string): Promise<{
    consumption: InventoryConsumption;
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    purchaseOrigin: Purchase;
    supplier: Supplier;
  }> {
    // Get the consumption record
    const [consumption] = await db
      .select()
      .from(inventoryConsumption)
      .where(eq(inventoryConsumption.id, consumptionId));

    if (!consumption) {
      throw new Error('Consumption record not found');
    }

    // Get the stock item
    const [stock] = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.id, consumption.warehouseStockId));

    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    // Get purchase origin
    const [purchaseOrigin] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, stock.purchaseId || ''));

    if (!purchaseOrigin) {
      throw new Error('Purchase origin not found');
    }

    // Get supplier
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, purchaseOrigin.supplierId));

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Get associated batch if exists
    let batch: WarehouseBatch | undefined;
    if (stock.batchId) {
      batch = await this.getWarehouseBatch(stock.batchId);
    }

    return {
      consumption,
      stock,
      batch,
      purchaseOrigin,
      supplier,
    };
  }

  // Grade-based pricing integration
  async updateStockValueByQualityGrade(stockId: string, qualityGrade: string): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      // Get the stock item
      const [stock] = await tx
        .select()
        .from(warehouseStock)
        .where(eq(warehouseStock.id, stockId))
        .for('update');

      if (!stock) {
        throw new Error('Warehouse stock not found');
      }

      // Calculate price adjustment based on quality grade
      const basePrice = parseFloat(stock.unitCostCleanUsd || '0');
      let adjustedPrice = basePrice;

      // Quality grade pricing multipliers
      const gradeMultipliers: Record<string, number> = {
        'A': 1.2,   // Premium grade +20%
        'B': 1.0,   // Standard grade (base price)
        'C': 0.8,   // Lower grade -20%
        'D': 0.6,   // Poor grade -40%
        'F': 0.4,   // Reject grade -60%
      };

      const multiplier = gradeMultipliers[qualityGrade] || 1.0;
      adjustedPrice = basePrice * multiplier;

      // Update the stock with new pricing
      const [result] = await tx
        .update(warehouseStock)
        .set({
          unitCostCleanUsd: adjustedPrice.toFixed(2),
          qualityGrade,
          gradedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(warehouseStock.id, stockId))
        .returning();

      return result;
    });
  }

  async recalculateInventoryValuesByGrade(): Promise<{
    updated: number;
    totalValueBefore: number;
    totalValueAfter: number;
    gradeBreakdown: Array<{ grade: string; count: number; totalValue: number }>;
  }> {
    return await db.transaction(async (tx) => {
      // Get all stock with quality grades
      const stockWithGrades = await tx
        .select()
        .from(warehouseStock)
        .where(and(
          sql`${warehouseStock.qualityGrade} IS NOT NULL`,
          sql`${warehouseStock.qtyKgClean}::numeric > 0`
        ))
        .for('update');

      let totalValueBefore = 0;
      let totalValueAfter = 0;
      let updated = 0;
      const gradeBreakdown = new Map<string, { count: number; totalValue: number }>();

      const gradeMultipliers: Record<string, number> = {
        'A': 1.2, 'B': 1.0, 'C': 0.8, 'D': 0.6, 'F': 0.4,
      };

      for (const stock of stockWithGrades) {
        const basePrice = parseFloat(stock.unitCostCleanUsd || '0');
        const quantity = parseFloat(stock.qtyKgClean || '0');
        const currentValue = basePrice * quantity;
        
        totalValueBefore += currentValue;

        const multiplier = gradeMultipliers[stock.qualityGrade || 'B'] || 1.0;
        const adjustedPrice = basePrice * multiplier;
        const newValue = adjustedPrice * quantity;
        
        totalValueAfter += newValue;

        // Update if price changed significantly (>1% difference)
        if (Math.abs(adjustedPrice - basePrice) > basePrice * 0.01) {
          await tx
            .update(warehouseStock)
            .set({
              unitCostCleanUsd: adjustedPrice.toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(warehouseStock.id, stock.id));
          updated++;
        }

        // Track grade breakdown
        const grade = stock.qualityGrade || 'B';
        const current = gradeBreakdown.get(grade) || { count: 0, totalValue: 0 };
        gradeBreakdown.set(grade, {
          count: current.count + 1,
          totalValue: current.totalValue + newValue,
        });
      }

      return {
        updated,
        totalValueBefore,
        totalValueAfter,
        gradeBreakdown: Array.from(gradeBreakdown.entries()).map(([grade, data]) => ({
          grade,
          count: data.count,
          totalValue: data.totalValue,
        })),
      };
    });
  }

  async getGradePricingReport(): Promise<{
    averagePriceByGrade: Array<{ grade: string; averagePrice: number; totalKg: number; stockCount: number }>;
    priceDistribution: Array<{ priceRange: string; count: number; percentage: number }>;
    qualityPremiumAnalysis: {
      baselineGrade: string;
      premiums: Array<{ grade: string; premiumPercentage: number; priceUsd: number }>;
    };
  }> {
    // Average price by grade
    const gradeData = await db
      .select({
        grade: warehouseStock.qualityGrade,
        averagePrice: avg(warehouseStock.unitCostCleanUsd),
        totalKg: sum(warehouseStock.qtyKgClean),
        stockCount: count(),
      })
      .from(warehouseStock)
      .where(and(
        sql`${warehouseStock.qualityGrade} IS NOT NULL`,
        sql`${warehouseStock.qtyKgClean}::numeric > 0`
      ))
      .groupBy(warehouseStock.qualityGrade);

    // Price distribution analysis
    const priceDistribution = await db
      .select({
        priceRange: sql<string>`
          CASE 
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 5 THEN '$0-5'
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 10 THEN '$5-10'
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 15 THEN '$10-15'
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 20 THEN '$15-20'
            ELSE '$20+'
          END
        `,
        count: count(),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.unitCostCleanUsd} IS NOT NULL`)
      .groupBy(sql`
        CASE 
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 5 THEN '$0-5'
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 10 THEN '$5-10'
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 15 THEN '$10-15'
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 20 THEN '$15-20'
          ELSE '$20+'
        END
      `);

    const totalCount = priceDistribution.reduce((sum, item) => sum + Number(item.count || 0), 0);

    // Quality premium analysis (using Grade B as baseline)
    const averagePriceByGrade = gradeData.map(row => ({
      grade: row.grade || 'B',
      averagePrice: parseFloat(row.averagePrice?.toString() || '0'),
      totalKg: parseFloat(row.totalKg?.toString() || '0'),
      stockCount: Number(row.stockCount || 0),
    }));

    const baselinePrice = averagePriceByGrade.find(g => g.grade === 'B')?.averagePrice || 0;
    const premiums = averagePriceByGrade.map(grade => ({
      grade: grade.grade,
      premiumPercentage: baselinePrice > 0 ? ((grade.averagePrice - baselinePrice) / baselinePrice) * 100 : 0,
      priceUsd: grade.averagePrice,
    }));

    return {
      averagePriceByGrade,
      priceDistribution: priceDistribution.map(row => ({
        priceRange: row.priceRange,
        count: Number(row.count || 0),
        percentage: totalCount > 0 ? (Number(row.count || 0) / totalCount) * 100 : 0,
      })),
      qualityPremiumAnalysis: {
        baselineGrade: 'B',
        premiums,
      },
    };
  }
}

export const storage = new DatabaseStorage();
