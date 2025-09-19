import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker']);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('worker'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  tradeName: varchar("trade_name"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  status: varchar("status").notNull().default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Capital entries table
export const capitalEntries = pgTable("capital_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").notNull().unique(),
  date: timestamp("date").notNull().defaultNow(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type").notNull(), // CapitalIn, CapitalOut, Reclass, Reverse
  reference: varchar("reference"), // order_id, purchase_id, etc.
  description: text("description"),
  paymentCurrency: varchar("payment_currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchases table
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseNumber: varchar("purchase_number").notNull().unique(),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  pricePerKg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // cash, advance, credit
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  country: varchar("country"),
  quality: varchar("quality"),
  fundingSource: varchar("funding_source").notNull(), // capital, external
  date: timestamp("date").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse stock table
export const warehouseStock = pgTable("warehouse_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  warehouse: varchar("warehouse").notNull(), // FIRST, FINAL
  status: varchar("status").notNull().default('AWAITING_DECISION'),
  qtyKgTotal: decimal("qty_kg_total", { precision: 10, scale: 2 }).notNull(),
  qtyKgClean: decimal("qty_kg_clean", { precision: 10, scale: 2 }).notNull(),
  qtyKgNonClean: decimal("qty_kg_non_clean", { precision: 10, scale: 2 }).notNull().default('0'),
  qtyKgReserved: decimal("qty_kg_reserved", { precision: 10, scale: 2 }).notNull().default('0'),
  cartonsCount: integer("cartons_count").default(0),
  unitCostCleanUsd: decimal("unit_cost_clean_usd", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  statusChangedAt: timestamp("status_changed_at"),
  filteredAt: timestamp("filtered_at"),
  packedAt: timestamp("packed_at"),
});

// Filter records table
export const filterRecords = pgTable("filter_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  inputKg: decimal("input_kg", { precision: 10, scale: 2 }).notNull(),
  outputCleanKg: decimal("output_clean_kg", { precision: 10, scale: 2 }).notNull(),
  outputNonCleanKg: decimal("output_non_clean_kg", { precision: 10, scale: 2 }).notNull(),
  filterYield: decimal("filter_yield", { precision: 5, scale: 2 }).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  capitalEntries: many(capitalEntries),
  purchases: many(purchases),
  filterRecords: many(filterRecords),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
  warehouseStock: many(warehouseStock),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  purchases: many(purchases),
  warehouseStock: many(warehouseStock),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  order: one(orders, {
    fields: [purchases.orderId],
    references: [orders.id],
  }),
  createdBy: one(users, {
    fields: [purchases.createdBy],
    references: [users.id],
  }),
  warehouseStock: many(warehouseStock),
  filterRecords: many(filterRecords),
}));

export const warehouseStockRelations = relations(warehouseStock, ({ one }) => ({
  purchase: one(purchases, {
    fields: [warehouseStock.purchaseId],
    references: [purchases.id],
  }),
  order: one(orders, {
    fields: [warehouseStock.orderId],
    references: [orders.id],
  }),
  supplier: one(suppliers, {
    fields: [warehouseStock.supplierId],
    references: [suppliers.id],
  }),
}));

export const filterRecordsRelations = relations(filterRecords, ({ one }) => ({
  purchase: one(purchases, {
    fields: [filterRecords.purchaseId],
    references: [purchases.id],
  }),
  createdBy: one(users, {
    fields: [filterRecords.createdBy],
    references: [users.id],
  }),
}));

export const capitalEntriesRelations = relations(capitalEntries, ({ one }) => ({
  createdBy: one(users, {
    fields: [capitalEntries.createdBy],
    references: [users.id],
  }),
}));

// Relations will be added after all table definitions to avoid initialization errors

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchaseNumber: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => {
  // Require exchangeRate for non-USD currencies
  if (data.currency !== 'USD' && (!data.exchangeRate || data.exchangeRate === '0')) {
    return false;
  }
  return true;
}, {
  message: "Exchange rate is required for non-USD currencies",
  path: ["exchangeRate"],
});

export const insertCapitalEntrySchema = createInsertSchema(capitalEntries).omit({
  id: true,
  createdAt: true,
});

export const insertWarehouseStockSchema = createInsertSchema(warehouseStock).omit({
  id: true,
  createdAt: true,
  statusChangedAt: true,
  filteredAt: true,
  packedAt: true,
});

export const insertFilterRecordSchema = createInsertSchema(filterRecords).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type CapitalEntry = typeof capitalEntries.$inferSelect;
export type InsertCapitalEntry = z.infer<typeof insertCapitalEntrySchema>;

export type WarehouseStock = typeof warehouseStock.$inferSelect;
export type InsertWarehouseStock = z.infer<typeof insertWarehouseStockSchema>;

export type FilterRecord = typeof filterRecords.$inferSelect;
export type InsertFilterRecord = z.infer<typeof insertFilterRecordSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// API Response Types
export interface AuthUserResponse {
  user: User | null;
}

export interface SettingsResponse {
  exchangeRate: number;
  preventNegativeBalance: boolean;
}

export interface CapitalBalanceResponse {
  balance: number;
}

export type CapitalEntriesResponse = CapitalEntry[];
export type SuppliersResponse = Supplier[];
export type OrdersResponse = Order[];
export type PurchasesResponse = Purchase[];
export type WarehouseStockResponse = WarehouseStock[];
export type FilterRecordsResponse = FilterRecord[];

// Additional Zod schemas for warehouse operations
export const warehouseStatusUpdateSchema = z.object({
  status: z.enum(['AWAITING_DECISION', 'READY_TO_SHIP', 'AWAITING_FILTER', 'NON_CLEAN', 'READY_FOR_SALE']),
});

export const warehouseFilterOperationSchema = z.object({
  purchaseId: z.string().min(1, "Purchase ID is required"),
  outputCleanKg: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Output clean weight must be a valid positive number"),
  outputNonCleanKg: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Output non-clean weight must be a valid positive number"),
}).refine((data) => {
  // Ensure at least one output is greater than 0
  const cleanKg = parseFloat(data.outputCleanKg);
  const nonCleanKg = parseFloat(data.outputNonCleanKg);
  return cleanKg > 0 || nonCleanKg > 0;
}, {
  message: "At least one output (clean or non-clean) must be greater than 0",
  path: ["outputCleanKg"],
});

export const warehouseMoveToFinalSchema = z.object({
  stockId: z.string().min(1, "Stock ID is required"),
});

export const warehouseStockFilterSchema = z.object({
  status: z.enum(['AWAITING_DECISION', 'READY_TO_SHIP', 'AWAITING_FILTER', 'NON_CLEAN', 'READY_FOR_SALE']).optional(),
  warehouse: z.enum(['FIRST', 'FINAL']).optional(),
  supplierId: z.string().optional(),
  orderId: z.string().optional(),
});

// Type exports for the new schemas
export type WarehouseStatusUpdate = z.infer<typeof warehouseStatusUpdateSchema>;
export type WarehouseFilterOperation = z.infer<typeof warehouseFilterOperationSchema>;
export type WarehouseMoveToFinal = z.infer<typeof warehouseMoveToFinalSchema>;
export type WarehouseStockFilter = z.infer<typeof warehouseStockFilterSchema>;

// Reporting Schemas and Types

// Financial Summary Schema
export const financialSummaryResponseSchema = z.object({
  summary: z.object({
    currentBalance: z.number(),
    capitalIn: z.number(),
    capitalOut: z.number(),
    totalPurchases: z.number(),
    totalPaid: z.number(),
    totalOutstanding: z.number(),
    totalInventoryValue: z.number(),
    netPosition: z.number(),
  }),
  currencyBreakdown: z.object({
    usd: z.object({
      amount: z.number(),
      count: z.number(),
    }),
    etb: z.object({
      amount: z.number(),
      count: z.number(),
    }),
  }),
  exchangeRate: z.number(),
});

// Cash Flow Schema
export const cashFlowResponseSchema = z.object({
  period: z.string(),
  data: z.array(z.object({
    date: z.string(),
    capitalIn: z.number(),
    capitalOut: z.number(),
    purchasePayments: z.number(),
    netFlow: z.number(),
  })),
  summary: z.object({
    totalIn: z.number(),
    totalOut: z.number(),
    netFlow: z.number(),
  }),
});

// Inventory Analytics Schema
export const inventoryAnalyticsResponseSchema = z.object({
  warehouseSummary: z.object({
    first: z.object({
      totalKg: z.number(),
      valueUsd: z.number(),
      count: z.number(),
    }),
    final: z.object({
      totalKg: z.number(),
      valueUsd: z.number(),
      count: z.number(),
    }),
  }),
  statusBreakdown: z.array(z.object({
    status: z.string(),
    count: z.number(),
    totalKg: z.number(),
    valueUsd: z.number(),
  })),
  filterAnalysis: z.object({
    totalFiltered: z.number(),
    averageYield: z.number(),
    totalInputKg: z.number(),
    totalOutputKg: z.number(),
  }),
  topProducts: z.array(z.object({
    supplierId: z.string(),
    supplierName: z.string(),
    totalKg: z.number(),
    valueUsd: z.number(),
  })),
});

// Supplier Performance Schema
export const supplierPerformanceResponseSchema = z.object({
  suppliers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    metrics: z.object({
      totalPurchases: z.number(),
      totalValue: z.number(),
      totalWeight: z.number(),
      averagePrice: z.number(),
      averageQuality: z.string().optional(),
      onTimeDelivery: z.number(),
      orderCount: z.number(),
    }),
    trends: z.object({
      priceChange: z.number(),
      volumeChange: z.number(),
    }),
  })),
  summary: z.object({
    totalSuppliers: z.number(),
    activeSuppliers: z.number(),
    topPerformer: z.string().optional(),
  }),
});

// Trading Activity Schema
export const tradingActivityResponseSchema = z.object({
  orderFulfillment: z.object({
    stats: z.object({
      total: z.number(),
      completed: z.number(),
      pending: z.number(),
      cancelled: z.number(),
    }),
    fulfillmentRate: z.number(),
  }),
  volumeAnalysis: z.object({
    totalVolume: z.number(),
    averageOrderSize: z.number(),
    largestOrder: z.number(),
  }),
  timeAnalysis: z.object({
    averageProcessingTime: z.number(),
    totalProcessingDays: z.number(),
  }),
});

// Date Range Filter Schema
export const dateRangeFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: "Start date must be before or equal to end date",
  path: ["startDate"],
});

// Period Filter Schema
export const periodFilterSchema = z.object({
  period: z.enum(['last-7-days', 'last-30-days', 'last-90-days', 'last-year']),
});

// Export Type Schema - Enhanced with more formats
export const exportTypeSchema = z.object({
  type: z.enum(['financial', 'inventory', 'suppliers', 'trading', 'all']),
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).optional().default('json'),
});

// Enhanced export request schema with advanced options
export const exportRequestSchema = z.object({
  type: z.enum(['financial', 'inventory', 'suppliers', 'trading', 'all']),
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
  dateRange: dateRangeFilterSchema.optional(),
  customFields: z.array(z.string()).optional(), // Selected fields for export
  compression: z.boolean().default(false),
  emailDelivery: z.boolean().default(false),
  emailRecipients: z.array(z.string().email()).optional(),
});

// Bulk export schema for multiple reports
export const bulkExportRequestSchema = z.object({
  reports: z.array(exportRequestSchema),
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
  compression: z.boolean().default(true), // Default to compressed for bulk exports
  emailDelivery: z.boolean().default(false),
  emailRecipients: z.array(z.string().email()).optional(),
});

// Period management schemas
export const periodRequestSchema = z.object({
  periodType: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  description: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: "Start date must be before end date",
  path: ["startDate"],
});

export const periodClosingRequestSchema = z.object({
  periodId: z.string().min(1),
  adjustments: z.array(z.object({
    adjustmentType: z.enum(['balance', 'inventory', 'reconciliation']),
    amount: z.string().refine((val) => !isNaN(parseFloat(val)), 'Invalid amount'),
    currency: z.string().default('USD'),
    description: z.string().min(1),
    reason: z.string().min(1),
  })).optional(),
  notes: z.string().optional(),
});

export const periodComparisonRequestSchema = z.object({
  periodIds: z.array(z.string()).min(2).max(4), // Compare 2-4 periods
  metrics: z.array(z.enum(['revenue', 'expenses', 'profit', 'inventory', 'capital'])).optional(),
});

// Response Types
export type FinancialSummaryResponse = z.infer<typeof financialSummaryResponseSchema>;
export type CashFlowResponse = z.infer<typeof cashFlowResponseSchema>;
export type InventoryAnalyticsResponse = z.infer<typeof inventoryAnalyticsResponseSchema>;
export type SupplierPerformanceResponse = z.infer<typeof supplierPerformanceResponseSchema>;
export type TradingActivityResponse = z.infer<typeof tradingActivityResponseSchema>;

// Filter Types
export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>;
export type PeriodFilter = z.infer<typeof periodFilterSchema>;
export type ExportType = z.infer<typeof exportTypeSchema>;

// AI-related tables and schemas

// AI Insights Cache table
export const aiInsightsCache = pgTable("ai_insights_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cacheKey: varchar("cache_key").notNull().unique(),
  insightType: varchar("insight_type").notNull(), // purchase_recommendations, supplier_analysis, etc.
  userId: varchar("user_id").references(() => users.id),
  dataHash: varchar("data_hash").notNull(), // Hash of input data for cache invalidation
  result: jsonb("result").notNull(),
  metadata: jsonb("metadata"), // Additional context like confidence scores, timestamps
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Conversations table
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").notNull(),
  messages: jsonb("messages").notNull(), // Array of conversation messages
  context: jsonb("context"), // Business context at conversation time
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Period Management Tables

// Period status enum
export const periodStatusEnum = pgEnum('period_status', ['open', 'pending_close', 'closed']);

// Periods table for financial period management
export const periods = pgTable("periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodNumber: varchar("period_number").notNull().unique(), // e.g., "2025-Q1", "2025-01"
  periodType: varchar("period_type").notNull(), // monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: periodStatusEnum("status").notNull().default('open'),
  closedBy: varchar("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Period closing logs table for audit trail
export const periodClosingLogs = pgTable("period_closing_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => periods.id),
  action: varchar("action").notNull(), // open, close, reopen, validate, adjust
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional context about the action
  createdAt: timestamp("created_at").defaultNow(),
});

// Period adjustments table for period-end corrections
export const periodAdjustments = pgTable("period_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => periods.id),
  adjustmentType: varchar("adjustment_type").notNull(), // balance, inventory, reconciliation
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  description: text("description").notNull(),
  reason: text("reason").notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// Export Management Tables

// Export status enum  
export const exportStatusEnum = pgEnum('export_status', ['queued', 'processing', 'completed', 'failed', 'cancelled']);

// Export history table for tracking all exports
export const exportHistory = pgTable("export_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  exportType: varchar("export_type").notNull(), // financial, inventory, suppliers, trading, all
  format: varchar("format").notNull(), // csv, xlsx, pdf, json
  status: exportStatusEnum("status").notNull().default('queued'),
  filePath: varchar("file_path"), // Path to the generated file
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"), // File size in bytes
  downloadCount: integer("download_count").notNull().default(0),
  parameters: jsonb("parameters"), // Export parameters (filters, date ranges, etc.)
  errorMessage: text("error_message"), // Error details if failed
  expiresAt: timestamp("expires_at"), // When the file expires
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Export preferences table for user export settings
export const exportPreferences = pgTable("export_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  reportType: varchar("report_type").notNull(), // financial, inventory, suppliers, trading
  preferredFormat: varchar("preferred_format").notNull().default('csv'),
  defaultDateRange: varchar("default_date_range").notNull().default('last-30-days'),
  customFields: jsonb("custom_fields"), // Array of selected fields for export
  emailDelivery: boolean("email_delivery").notNull().default(false),
  emailRecipients: text("email_recipients").array(), // Array of email addresses
  compression: boolean("compression").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export jobs table for scheduled exports
export const exportJobs = pgTable("export_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  jobName: varchar("job_name").notNull(),
  exportType: varchar("export_type").notNull(),
  format: varchar("format").notNull(),
  schedule: varchar("schedule").notNull(), // daily, weekly, monthly, cron expression
  parameters: jsonb("parameters"), // Export parameters
  emailRecipients: text("email_recipients").array(), // Array of email addresses
  isActive: boolean("is_active").notNull().default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow validation table for storing validation results
export const workflowValidations = pgTable("workflow_validations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentPath: varchar("document_path").notNull(), // Path to business document
  documentHash: varchar("document_hash").notNull(), // Hash of document for cache invalidation
  systemSpecHash: varchar("system_spec_hash").notNull(), // Hash of system state
  overallStatus: varchar("overall_status").notNull(), // matched, partial, missing
  gapReport: jsonb("gap_report").notNull(), // Complete gap analysis results
  stageResults: jsonb("stage_results").notNull(), // Detailed per-stage analysis
  summary: jsonb("summary").notNull(), // Summary metrics and recommendations
  validationMetadata: jsonb("validation_metadata"), // Processing metadata
  isLatest: boolean("is_latest").notNull().default(false), // Flag for latest validation
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// AI-related insert schemas
export const insertAiInsightsCacheSchema = createInsertSchema(aiInsightsCache).omit({
  id: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Period management insert schemas
export const insertPeriodSchema = createInsertSchema(periods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPeriodClosingLogSchema = createInsertSchema(periodClosingLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPeriodAdjustmentSchema = createInsertSchema(periodAdjustments).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

// Workflow validation insert schema
export const insertWorkflowValidationSchema = createInsertSchema(workflowValidations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Export management insert schemas
export const insertExportHistorySchema = createInsertSchema(exportHistory).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertExportPreferencesSchema = createInsertSchema(exportPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertExportJobSchema = createInsertSchema(exportJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  nextRun: true,
});

// AI-related types
export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;
export type InsertAiInsightsCache = z.infer<typeof insertAiInsightsCacheSchema>;

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;

// Period management types
export type Period = typeof periods.$inferSelect;
export type InsertPeriod = z.infer<typeof insertPeriodSchema>;

export type PeriodClosingLog = typeof periodClosingLogs.$inferSelect;
export type InsertPeriodClosingLog = z.infer<typeof insertPeriodClosingLogSchema>;

export type PeriodAdjustment = typeof periodAdjustments.$inferSelect;
export type InsertPeriodAdjustment = z.infer<typeof insertPeriodAdjustmentSchema>;

// Export management types
export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = z.infer<typeof insertExportHistorySchema>;

export type ExportPreferences = typeof exportPreferences.$inferSelect;
export type InsertExportPreferences = z.infer<typeof insertExportPreferencesSchema>;

export type ExportJob = typeof exportJobs.$inferSelect;
export type InsertExportJob = z.infer<typeof insertExportJobSchema>;

// Workflow validation types
export type WorkflowValidation = typeof workflowValidations.$inferSelect;
export type InsertWorkflowValidation = z.infer<typeof insertWorkflowValidationSchema>;

// AI Response Types

export interface PurchaseRecommendationResponse {
  recommendations: Array<{
    supplierId: string;
    suggestedQuantity: number;
    suggestedPriceRange: { min: number; max: number };
    reasoning: string;
    confidence: number;
    timing: 'immediate' | 'within_week' | 'within_month';
  }>;
  marketInsights: string;
  riskAssessment: string;
}

export interface SupplierRecommendationResponse {
  rankedSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  }>;
  insights: string;
}

export interface CapitalOptimizationResponse {
  optimizations: Array<{
    type: 'cash_flow' | 'capital_allocation' | 'payment_timing' | 'risk_management';
    suggestion: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  cashFlowForecast: string;
  riskAlerts: string[];
}

export interface InventoryRecommendationResponse {
  actions: Array<{
    stockId: string;
    action: 'filter' | 'move_to_final' | 'process' | 'hold' | 'sell';
    reasoning: string;
    urgency: 'high' | 'medium' | 'low';
    expectedBenefit: string;
  }>;
  insights: string;
  qualityAlerts: string[];
}

export interface FinancialTrendAnalysisResponse {
  trends: Array<{
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    confidence: number;
    prediction: string;
    recommendation: string;
  }>;
  predictions: {
    nextQuarter: any;
    risks: string[];
    opportunities: string[];
  };
  insights: string;
}

export interface MarketTimingAnalysisResponse {
  recommendation: 'buy_now' | 'wait' | 'sell_first' | 'hold_position';
  confidence: number;
  reasoning: string;
  priceTargets: {
    buyBelow: number;
    sellAbove: number;
  };
  marketOutlook: string;
  riskFactors: string[];
}

export interface ExecutiveSummaryResponse {
  summary: string;
  keyMetrics: Array<{
    metric: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    significance: 'high' | 'medium' | 'low';
  }>;
  priorities: string[];
  recommendations: string[];
}

export interface AnomalyDetectionResponse {
  anomalies: Array<{
    type: 'financial' | 'operational' | 'inventory' | 'supplier';
    description: string;
    severity: 'critical' | 'warning' | 'info';
    impact: string;
    recommendation: string;
  }>;
  patterns: string[];
  alerts: string[];
}

export interface ContextualHelpResponse {
  help: string;
  suggestions: string[];
  quickActions: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface ChatAssistantResponse {
  response: string;
  suggestions: string[];
  actionItems?: string[];
}

// AI Request schemas
export const aiPurchaseRecommendationRequestSchema = z.object({
  marketConditions: z.record(z.any()).optional(),
  timeframe: z.enum(['immediate', 'short_term', 'long_term']).optional(),
});

export const aiSupplierRecommendationRequestSchema = z.object({
  quantity: z.number().positive(),
  quality: z.string(),
  budget: z.number().positive(),
});

export const aiCapitalOptimizationRequestSchema = z.object({
  timeHorizon: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
  includeForecasting: z.boolean().optional().default(true),
});

export const aiChatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export const aiContextualHelpRequestSchema = z.object({
  currentPage: z.string(),
  userRole: z.string(),
  currentData: z.record(z.any()).optional(),
});

// AI Request types
export type AiPurchaseRecommendationRequest = z.infer<typeof aiPurchaseRecommendationRequestSchema>;
export type AiSupplierRecommendationRequest = z.infer<typeof aiSupplierRecommendationRequestSchema>;
export type AiCapitalOptimizationRequest = z.infer<typeof aiCapitalOptimizationRequestSchema>;
export type AiChatRequest = z.infer<typeof aiChatRequestSchema>;
export type AiContextualHelpRequest = z.infer<typeof aiContextualHelpRequestSchema>;
