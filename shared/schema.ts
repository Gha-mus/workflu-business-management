import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  integer,
  boolean,
  pgEnum,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import Decimal from "decimal.js";

// ===== CORE AUTH ENUMS =====
export const userRoleEnum = pgEnum('user_role', ['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker']);
export const authProviderEnum = pgEnum('auth_provider', ['replit', 'supabase']);

// ===== QUALITY AND PAYMENT ENUMS =====
export const qualityGradeEnum = pgEnum('quality_grade', ['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'advance', 'credit', 'bank_transfer', 'check']);
export const fundingSourceEnum = pgEnum('funding_source', ['capital', 'external', 'credit_line', 'retained_earnings']);
export const purchaseStatusEnum = pgEnum('purchase_status', ['pending', 'partial', 'paid', 'cancelled', 'on_hold']);

// ===== APPROVAL SYSTEM ENUMS =====
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'cancelled', 'escalated']);
export const approvalOperationTypeEnum = pgEnum('approval_operation_type', [
  'capital_entry', 'purchase', 'sale_order', 'warehouse_operation', 'shipping_operation', 
  'financial_adjustment', 'user_role_change', 'system_setting_change', 'system_startup', 'system_diagnostics',
  'operating_expense', 'supply_purchase', 'supply_create', 'supply_consumption', 'expense_category_create',
  'revenue_management', 'notification_delivery', 'monitoring_check', 'hourly_stats', 'notification_configuration'
]);

// ===== CAPITAL ENTRY TYPES ENUM =====
export const capitalEntryTypeEnum = pgEnum('capital_entry_type', [
  'CapitalIn', 'CapitalOut', 'Reverse', 'Reclass', 'Opening'
]);

// ===== REVENUE ENTRY TYPES ENUM =====
export const revenueEntryTypeEnum = pgEnum('revenue_entry_type', [
  'customer_receipt', 'customer_refund', 'withdrawal', 'reinvest_out', 'transfer_fee', 'reclass', 'reverse'
]);

// ===== REINVESTMENT ALLOCATION POLICY ENUM =====
export const reinvestmentAllocationPolicyEnum = pgEnum('reinvestment_allocation_policy', [
  'aggregate', 'pro_rata', 'specified'
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create', 'update', 'delete', 'view', 'approve', 'reject', 'login', 'logout', 'export', 'import', 'validate', 'auto_correct', 'password_reset_failed'
]);

export const permissionScopeEnum = pgEnum('permission_scope', [
  'system', 'module', 'operation', 'record', 'field'
]);

// ===== WAREHOUSE STOCK STATUS ENUM =====
export const warehouseStockStatusEnum = pgEnum('warehouse_stock_status', [
  'AWAITING_DECISION', 'FILTERING', 'FILTERED', 'PACKED', 'RESERVED', 'CONSUMED',
  'READY_TO_SHIP', 'NON_CLEAN', 'READY_FOR_SALE', 'AWAITING_FILTER'
]);

// ===== SHIPMENT METHOD AND STATUS ENUMS =====
export const shipmentMethodEnum = pgEnum('shipment_method', ['air', 'sea', 'land', 'rail', 'multimodal']);
export const shipmentStatusEnum = pgEnum('shipment_status', ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']);

// ===== CORE AUTH SCHEMAS =====
export const userRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker'])
});

// ===== CORE AUTH TABLES =====

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

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('worker'), // Legacy single role (kept for compatibility)
  roles: jsonb("roles").$type<string[]>().default(sql`'[]'`), // Stage 8: Multiple role combination support
  isActive: boolean("is_active").notNull().default(true),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false), // Super-admin protection for critical operations
  authProvider: authProviderEnum("auth_provider").default('supabase'), // Track which auth provider is used
  authProviderUserId: varchar("auth_provider_user_id"), // Provider-specific user ID (Replit sub or Supabase ID)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stage 8: User warehouse scopes table for warehouse-level permissions
export const userWarehouseScopes = pgTable("user_warehouse_scopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  warehouseCode: varchar("warehouse_code").notNull(), // FIRST, FINAL, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userWarehouseIdx: index("idx_user_warehouse_scopes_user_warehouse").on(table.userId, table.warehouseCode),
  userIdx: index("idx_user_warehouse_scopes_user_id").on(table.userId),
  warehouseIdx: index("idx_user_warehouse_scopes_warehouse").on(table.warehouseCode),
}));

// ===== SETTINGS TABLES =====

// Settings table - Enhanced for Stage 10 compliance
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default('general'), // financial, operational, security, numbering
  dataType: varchar("data_type").notNull().default('string'), // string, number, boolean, json
  isSystemCritical: boolean("is_system_critical").notNull().default(false),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Settings history table for versioning and audit trail
export const settingsHistory = pgTable("settings_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingId: varchar("setting_id").notNull().references(() => settings.id),
  settingKey: varchar("setting_key").notNull(), // Denormalized for easier querying
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  version: integer("version").notNull(),
  changeReason: text("change_reason"),
  changeType: varchar("change_type").notNull(), // create, update, delete, rollback
  isApproved: boolean("is_approved"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Numbering schemes table for automatic entity numbering
export const numberingSchemes = pgTable("numbering_schemes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull().unique(), // order, purchase, capital_entry, etc.
  prefix: varchar("prefix").notNull().default(''), // e.g., 'ORD', 'PUR', 'CAP'
  currentNumber: integer("current_number").notNull().default(0),
  increment: integer("increment").notNull().default(1),
  minDigits: integer("min_digits").notNull().default(4), // Pad with zeros
  suffix: varchar("suffix").notNull().default(''), // e.g., year suffix
  format: varchar("format").notNull().default('{prefix}{number:0{minDigits}}{suffix}'),
  isActive: boolean("is_active").notNull().default(true),
  resetPeriod: varchar("reset_period"), // annual, monthly, never
  lastResetAt: timestamp("last_reset_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Configuration snapshots for rollback capability
export const configurationSnapshots = pgTable("configuration_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  snapshotData: jsonb("snapshot_data").notNull(), // Complete settings state
  isAutomatic: boolean("is_automatic").notNull().default(true),
  snapshotType: varchar("snapshot_type").notNull().default('periodic'), // manual, periodic, pre_change
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  snapshotTypeIdx: index("idx_config_snapshots_type").on(table.snapshotType),
  createdAtIdx: index("idx_config_snapshots_created_at").on(table.createdAt),
}));

// ===== PURCHASES TABLES =====

// Suppliers table - Enhanced with missing fields per Stage 2 requirements
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  tradeName: varchar("trade_name"),
  country: varchar("country"), // Missing: country of purchase field
  notes: text("notes"),
  qualityGrading: qualityGradeEnum("quality_grading").default('ungraded'), // Missing: quality grading integration
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  advanceBalance: decimal("advance_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  creditBalance: decimal("credit_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  lastAdvanceDate: timestamp("last_advance_date"),
  paymentTerms: varchar("payment_terms").default('cash'), // cash, advance, credit
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier quality assessments table - STAGE 2 COMPLIANCE: Quality assessment history tracking
export const supplierQualityAssessments = pgTable("supplier_quality_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  qualityGrade: qualityGradeEnum("quality_grade").notNull(),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).notNull(),
  assessmentDate: timestamp("assessment_date").notNull().defaultNow(),
  consistencyScore: decimal("consistency_score", { precision: 5, scale: 2 }).notNull(),
  defectRateScore: decimal("defect_rate_score", { precision: 5, scale: 2 }).notNull(),
  deliveryTimelinessScore: decimal("delivery_timeliness_score", { precision: 5, scale: 2 }).notNull(),
  packagingScore: decimal("packaging_score", { precision: 5, scale: 2 }).notNull(),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }).notNull(),
  assessedBy: varchar("assessed_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  status: varchar("status").notNull().default('draft'),
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }),
  currency: varchar("currency").default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchases table
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseNumber: varchar("purchase_number").notNull().unique(),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  orderId: varchar("order_id").references(() => orders.id),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  pricePerKg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  country: varchar("country"),
  quality: varchar("quality"),
  fundingSource: fundingSourceEnum("funding_source").notNull(),
  status: purchaseStatusEnum("status").notNull().default('pending'),
  date: timestamp("date").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_purchases_supplier").on(table.supplierId),
  index("idx_purchases_status").on(table.status),
  index("idx_purchases_date").on(table.date),
  index("idx_purchases_created_by").on(table.createdBy),
  index("idx_purchases_funding").on(table.fundingSource),
]);

// Purchase payments table
export const purchasePayments = pgTable("purchase_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  paymentNumber: varchar("payment_number").notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  fundingSource: varchar("funding_source").notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }),
  reference: varchar("reference"),
  description: text("description"),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== CAPITAL TABLES =====

// Capital entries table
export const capitalEntries = pgTable("capital_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").notNull().unique().$defaultFn(() => `CAP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  date: timestamp("date").notNull().defaultNow(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: capitalEntryTypeEnum("type").notNull(),
  reference: varchar("reference"), // order_id, purchase_id, etc.
  description: text("description"),
  paymentCurrency: varchar("payment_currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  isValidated: boolean("is_validated").notNull().default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for capital entry aggregations
  index("idx_capital_entries_type").on(table.type),
  index("idx_capital_entries_date").on(table.date),
  index("idx_capital_entries_type_date").on(table.type, table.date),
  index("idx_capital_entries_created_by").on(table.createdBy),
]);

// Financial metrics table
export const financialMetrics = pgTable("financial_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  metricType: varchar("metric_type").notNull(), // balance, flow, ratio, variance
  value: decimal("value", { precision: 15, scale: 4 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  period: varchar("period").notNull(), // YYYY-MM, YYYY-QQ, YYYY format
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_financial_metrics_name").on(table.metricName),
  index("idx_financial_metrics_type").on(table.metricType),
  index("idx_financial_metrics_period").on(table.period),
  index("idx_financial_metrics_calculated").on(table.calculatedAt),
]);

// ===== WAREHOUSE TABLES =====

// Warehouse stock table (enhanced with quality and batch tracking)
export const warehouseStock = pgTable("warehouse_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  orderId: varchar("order_id").references(() => orders.id),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  batchId: varchar("batch_id"), // Link to batch for traceability
  warehouse: varchar("warehouse").notNull(), // FIRST, FINAL
  status: warehouseStockStatusEnum("status").notNull().default('AWAITING_DECISION'),
  qualityGrade: qualityGradeEnum("quality_grade").default('ungraded'),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  lastInspectionId: varchar("last_inspection_id"),
  qtyKgTotal: decimal("qty_kg_total", { precision: 10, scale: 2 }).notNull(),
  qtyKgClean: decimal("qty_kg_clean", { precision: 10, scale: 2 }).notNull(),
  qtyKgNonClean: decimal("qty_kg_non_clean", { precision: 10, scale: 2 }).notNull().default('0'),
  qtyKgReserved: decimal("qty_kg_reserved", { precision: 10, scale: 2 }).notNull().default('0'),
  qtyKgConsumed: decimal("qty_kg_consumed", { precision: 10, scale: 2 }).notNull().default('0'),
  cartonsCount: integer("cartons_count").default(0),
  unitCostCleanUsd: decimal("unit_cost_clean_usd", { precision: 10, scale: 4 }),
  lastActivityAt: timestamp("last_activity_at"),
  fifoSequence: integer("fifo_sequence"),
  createdAt: timestamp("created_at").defaultNow(),
  statusChangedAt: timestamp("status_changed_at"),
  filteredAt: timestamp("filtered_at"),
  packedAt: timestamp("packed_at"),
  gradedAt: timestamp("graded_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_warehouse_stock_status").on(table.status),
  index("idx_warehouse_stock_supplier").on(table.supplierId),
  index("idx_warehouse_stock_warehouse").on(table.warehouse),
  index("idx_warehouse_stock_quality").on(table.qualityGrade),
  index("idx_warehouse_stock_activity").on(table.lastActivityAt),
  index("idx_warehouse_stock_created").on(table.createdAt),
]);

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

// Quality standards table
export const qualityStandards = pgTable("quality_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grade: qualityGradeEnum("grade").notNull(),
  standardName: varchar("standard_name").notNull(),
  description: text("description"),
  minScore: decimal("min_score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull(),
  criteria: text("criteria").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse batches table
export const warehouseBatches = pgTable("warehouse_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchNumber: varchar("batch_number").notNull().unique(),
  warehouse: varchar("warehouse").notNull(),
  totalQuantityKg: decimal("total_quantity_kg", { precision: 10, scale: 2 }).notNull(),
  qualityGrade: qualityGradeEnum("quality_grade").notNull(),
  status: varchar("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

// Quality inspections table
export const qualityInspections = pgTable("quality_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionNumber: varchar("inspection_number").notNull().unique(),
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  batchId: varchar("batch_id").references(() => warehouseBatches.id),
  inspectionType: varchar("inspection_type").notNull(),
  qualityGrade: qualityGradeEnum("quality_grade").notNull(),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).notNull(),
  defectRate: decimal("defect_rate", { precision: 5, scale: 2 }),
  moistureContent: decimal("moisture_content", { precision: 5, scale: 2 }),
  notes: text("notes"),
  inspectedBy: varchar("inspected_by").notNull().references(() => users.id),
  inspectedAt: timestamp("inspected_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory consumption table
export const inventoryConsumption = pgTable("inventory_consumption", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  consumptionType: varchar("consumption_type").notNull(),
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  consumedBy: varchar("consumed_by").notNull().references(() => users.id),
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Processing operations table
export const processingOperations = pgTable("processing_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationNumber: varchar("operation_number").notNull().unique(),
  operationType: varchar("operation_type").notNull(),
  status: varchar("status").notNull().default('pending'),
  notes: text("notes"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  processedBy: varchar("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock transfers table
export const stockTransfers = pgTable("stock_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferNumber: varchar("transfer_number").notNull().unique(),
  fromWarehouseStockId: varchar("from_warehouse_stock_id").notNull().references(() => warehouseStock.id),
  toWarehouseStockId: varchar("to_warehouse_stock_id").references(() => warehouseStock.id),
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  status: varchar("status").notNull().default('pending'),
  transferredBy: varchar("transferred_by").notNull().references(() => users.id),
  transferredAt: timestamp("transferred_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory adjustments table
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adjustmentNumber: varchar("adjustment_number").notNull().unique(),
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  adjustmentType: varchar("adjustment_type").notNull(),
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  adjustedBy: varchar("adjusted_by").notNull().references(() => users.id),
  adjustedAt: timestamp("adjusted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== SHIPPING TABLES =====

// Carriers table
export const carriers = pgTable("carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  serviceTypes: text("service_types").array(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  isPreferred: boolean("is_preferred").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentNumber: varchar("shipment_number").notNull().unique(),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  carrierId: varchar("carrier_id").notNull().references(() => carriers.id),
  method: shipmentMethodEnum("method").notNull(),
  status: shipmentStatusEnum("status").notNull().default('pending'),
  originAddress: text("origin_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  estimatedDepartureDate: timestamp("estimated_departure_date"),
  actualDepartureDate: timestamp("actual_departure_date"),
  estimatedArrivalDate: timestamp("estimated_arrival_date"),
  actualArrivalDate: timestamp("actual_arrival_date"),
  trackingNumber: varchar("tracking_number"),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).notNull(),
  totalVolume: decimal("total_volume", { precision: 10, scale: 2 }),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipment items table (links shipments to warehouse stock)
export const shipmentItems = pgTable("shipment_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  packingDetails: text("packing_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipment legs table - Multi-leg shipping support
export const shipmentLegs = pgTable("shipment_legs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  legNumber: integer("leg_number").notNull(),
  carrierId: varchar("carrier_id").notNull().references(() => carriers.id),
  method: shipmentMethodEnum("method").notNull(),
  status: shipmentStatusEnum("status").notNull().default('pending'),
  
  // Weight details
  netWeightKg: decimal("net_weight_kg", { precision: 10, scale: 2 }).notNull(),
  grossWeightKg: decimal("gross_weight_kg", { precision: 10, scale: 2 }).notNull(),
  tareWeightKg: decimal("tare_weight_kg", { precision: 10, scale: 2 }).notNull(),
  packageCount: integer("package_count").notNull(),
  
  // Route details
  originPort: varchar("origin_port").notNull(),
  destinationPort: varchar("destination_port").notNull(),
  departureDate: timestamp("departure_date"),
  arrivalDate: timestamp("arrival_date"),
  transitDays: integer("transit_days"),
  
  // Documentation
  vesselVoyage: varchar("vessel_voyage"),
  containerNumber: varchar("container_number"),
  sealNumber: varchar("seal_number"),
  billOfLadingNumber: varchar("bill_of_lading_number"),
  
  // Commission and cost tracking
  commissionRatePercent: decimal("commission_rate_percent", { precision: 5, scale: 2 }),
  commissionAmountUsd: decimal("commission_amount_usd", { precision: 12, scale: 2 }),
  freightCostUsd: decimal("freight_cost_usd", { precision: 12, scale: 2 }),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipping costs table
export const shippingCosts = pgTable("shipping_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  costType: varchar("cost_type").notNull(), // freight, insurance, customs, handling, other
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method"),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  fundingSource: varchar("funding_source").notNull(),
  paidDate: timestamp("paid_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery tracking table
export const deliveryTracking = pgTable("delivery_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  status: varchar("status").notNull(),
  location: varchar("location"),
  description: text("description"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isCustomerNotified: boolean("is_customer_notified").notNull().default(false),
  proofOfDelivery: text("proof_of_delivery"),
  exceptionDetails: text("exception_details"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Arrival costs table - Stage 4 landed cost calculations
export const arrivalCosts = pgTable("arrival_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  costType: varchar("cost_type").notNull(), // unloading, storage, inspection, documentation, local_transport
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method"),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  fundingSource: varchar("funding_source").notNull(),
  paidDate: timestamp("paid_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipment inspections table - Stage 4 quality control for shipments
export const shipmentInspections = pgTable("shipment_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  inspectionNumber: varchar("inspection_number").notNull().unique(),
  inspectionType: varchar("inspection_type").notNull(), // arrival, pre_delivery, quality, customs
  inspectionDate: timestamp("inspection_date").notNull().defaultNow(),
  inspector: varchar("inspector").notNull(),
  status: varchar("status").notNull().default('pending'), // pending, passed, failed, conditional
  qualityGrade: qualityGradeEnum("quality_grade"),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  defectsFound: text("defects_found").array(),
  correctionActions: text("correction_actions").array(),
  passed: boolean("passed").notNull().default(false),
  notes: text("notes"),
  attachments: text("attachments").array(),
  inspectedBy: varchar("inspected_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== APPROVAL TABLES =====

// Approval chains table
export const approvalChains = pgTable("approval_chains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationType: approvalOperationTypeEnum("operation_type").notNull(),
  chainName: varchar("chain_name").notNull(),
  priority: integer("priority").notNull().default(0), // Higher numbers = higher priority
  minApprovers: integer("min_approvers").notNull().default(1),
  requireAllApprovers: boolean("require_all_approvers").notNull().default(false),
  
  // Conditional triggers
  amountThreshold: decimal("amount_threshold", { precision: 12, scale: 2 }),
  roleRestrictions: text("role_restrictions").array(), // Roles that can trigger this chain
  conditionsJson: jsonb("conditions_json"), // Complex conditions for triggering
  
  // Chain configuration
  autoApproveAfterHours: integer("auto_approve_after_hours"), // Auto-approve after X hours
  escalateAfterHours: integer("escalate_after_hours"), // Escalate after X hours without approval
  escalationChainId: varchar("escalation_chain_id"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_approval_chains_operation").on(table.operationType),
  index("idx_approval_chains_priority").on(table.priority),
  index("idx_approval_chains_active").on(table.isActive),
]);

// Approval requests table
export const approvalRequests = pgTable("approval_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  approvalRequestId: varchar("approval_request_id").notNull().unique(),
  
  // Request details
  operationType: approvalOperationTypeEnum("operation_type").notNull(),
  chainId: varchar("chain_id").notNull().references(() => approvalChains.id),
  entityType: varchar("entity_type").notNull(), // purchase, capital_entry, etc.
  entityId: varchar("entity_id").notNull(), // ID of the entity being approved
  
  // Business context
  amount: decimal("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency").default('USD'),
  description: text("description").notNull(),
  businessJustification: text("business_justification"),
  riskAssessment: text("risk_assessment"),
  
  // Request metadata
  requestData: jsonb("request_data").notNull(), // Complete request data for audit
  businessContext: jsonb("business_context"), // Additional context for decision making
  
  // Status tracking
  status: approvalStatusEnum("status").notNull().default('pending'),
  currentApproverLevel: integer("current_approver_level").default(0),
  totalRequiredApprovals: integer("total_required_approvals").notNull(),
  currentApprovals: integer("current_approvals").default(0),
  
  // Timing
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  escalatedAt: timestamp("escalated_at"),
  autoApprovalAt: timestamp("auto_approval_at"), // When auto-approval kicks in
  
  // People
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  finalApprovedBy: varchar("final_approved_by").references(() => users.id),
  finalRejectedBy: varchar("final_rejected_by").references(() => users.id),
  
  // Audit trail
  approvalHistory: jsonb("approval_history").default(sql`'[]'`), // History of all approval actions
  rejectionReason: text("rejection_reason"),
  escalationReason: text("escalation_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_approval_requests_operation").on(table.operationType),
  index("idx_approval_requests_status").on(table.status),
  index("idx_approval_requests_chain").on(table.chainId),
  index("idx_approval_requests_entity").on(table.entityType, table.entityId),
  index("idx_approval_requests_requested_by").on(table.requestedBy),
  index("idx_approval_requests_requested_at").on(table.requestedAt),
  // CRITICAL: Prevent duplicate unconsumed approvals for same entity
  uniqueIndex("unique_approval_request_unconsumed").on(table.entityType, table.entityId)
    .where(sql`status IN ('pending', 'escalated')`),
]);

// Approval guards table - Security controls for critical operations
export const approvalGuards = pgTable("approval_guards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationType: approvalOperationTypeEnum("operation_type").notNull(),
  guardName: varchar("guard_name").notNull(),
  
  // Guard conditions
  isEnabled: boolean("is_enabled").notNull().default(true),
  amountThreshold: decimal("amount_threshold", { precision: 12, scale: 2 }),
  timeRestrictions: jsonb("time_restrictions"), // Time-based restrictions
  roleExceptions: text("role_exceptions").array(), // Roles that can bypass this guard
  
  // Enforcement rules
  blockIfNoApprover: boolean("block_if_no_approver").notNull().default(true),
  allowEmergencyOverride: boolean("allow_emergency_override").notNull().default(false),
  emergencyOverrideRoles: text("emergency_override_roles").array(),
  
  // Logging and notification
  notifyOnBypass: boolean("notify_on_bypass").notNull().default(true),
  auditAllAttempts: boolean("audit_all_attempts").notNull().default(true),
  
  description: text("description"),
  
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_approval_guards_operation").on(table.operationType),
  index("idx_approval_guards_enabled").on(table.isEnabled),
]);

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Core audit fields
  action: auditActionEnum("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  
  // User context
  userId: varchar("user_id").references(() => users.id),
  userName: varchar("user_name"), // Denormalized for performance
  userRole: varchar("user_role"), // Role at time of action
  
  // Technical context
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  
  // Business context
  description: text("description").notNull(),
  previousValues: jsonb("previous_values"), // Before state
  newValues: jsonb("new_values"), // After state
  businessContext: jsonb("business_context"), // Additional business metadata
  
  // Impact assessment
  riskLevel: varchar("risk_level").default('medium'), // low, medium, high, critical
  complianceFlags: text("compliance_flags").array(), // Compliance-related tags
  
  // Metadata
  source: varchar("source").default('application'), // application, api, admin, system
  correlationId: varchar("correlation_id"), // Link related audit entries
  parentAuditId: varchar("parent_audit_id"),
  
  // Security and integrity
  checksum: varchar("checksum").notNull(), // Integrity verification
  
  // Mandatory timestamp (immutable)
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_entity").on(table.entityType, table.entityId),
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_risk").on(table.riskLevel),
  index("idx_audit_logs_correlation").on(table.correlationId),
]);

// ===== RELATIONS =====

// Core auth relations
export const usersRelations = relations(users, ({ many }) => ({
  userWarehouseScopes: many(userWarehouseScopes),
}));

export const userWarehouseScopesRelations = relations(userWarehouseScopes, ({ one }) => ({
  user: one(users, {
    fields: [userWarehouseScopes.userId],
    references: [users.id],
  }),
}));

// Settings relations
export const settingsRelations = relations(settings, ({ one, many }) => ({
  updatedBy: one(users, {
    fields: [settings.updatedBy],
    references: [users.id],
  }),
  history: many(settingsHistory),
}));

export const settingsHistoryRelations = relations(settingsHistory, ({ one }) => ({
  setting: one(settings, {
    fields: [settingsHistory.settingId],
    references: [settings.id],
  }),
  createdBy: one(users, {
    fields: [settingsHistory.createdBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [settingsHistory.approvedBy],
    references: [users.id],
  }),
}));

export const configurationSnapshotsRelations = relations(configurationSnapshots, ({ one }) => ({
  createdBy: one(users, {
    fields: [configurationSnapshots.createdBy],
    references: [users.id],
  }),
}));

// Purchases relations
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
  qualityAssessments: many(supplierQualityAssessments),
}));

export const supplierQualityAssessmentsRelations = relations(supplierQualityAssessments, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierQualityAssessments.supplierId],
    references: [suppliers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  purchases: many(purchases),
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
  payments: many(purchasePayments),
}));

export const purchasePaymentsRelations = relations(purchasePayments, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchasePayments.purchaseId],
    references: [purchases.id],
  }),
  createdBy: one(users, {
    fields: [purchasePayments.createdBy],
    references: [users.id],
  }),
}));

// Capital relations
export const capitalEntriesRelations = relations(capitalEntries, ({ one }) => ({
  createdBy: one(users, {
    fields: [capitalEntries.createdBy],
    references: [users.id],
  }),
}));

// Warehouse relations
export const warehouseStockRelations = relations(warehouseStock, ({ one, many }) => ({
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
  batch: one(warehouseBatches, {
    fields: [warehouseStock.batchId],
    references: [warehouseBatches.id],
  }),
  lastInspection: one(qualityInspections, {
    fields: [warehouseStock.lastInspectionId],
    references: [qualityInspections.id],
  }),
  consumptions: many(inventoryConsumption),
  adjustments: many(inventoryAdjustments),
  transfersFrom: many(stockTransfers, {
    relationName: "transfersFrom"
  }),
  transfersTo: many(stockTransfers, {
    relationName: "transfersTo"
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

export const qualityInspectionsRelations = relations(qualityInspections, ({ one }) => ({
  warehouseStock: one(warehouseStock, {
    fields: [qualityInspections.warehouseStockId],
    references: [warehouseStock.id],
  }),
  batch: one(warehouseBatches, {
    fields: [qualityInspections.batchId],
    references: [warehouseBatches.id],
  }),
  inspectedBy: one(users, {
    fields: [qualityInspections.inspectedBy],
    references: [users.id],
  }),
}));

// Shipping relations
export const carriersRelations = relations(carriers, ({ many }) => ({
  shipments: many(shipments),
  shipmentLegs: many(shipmentLegs),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
  carrier: one(carriers, {
    fields: [shipments.carrierId],
    references: [carriers.id],
  }),
  createdBy: one(users, {
    fields: [shipments.createdBy],
    references: [users.id],
  }),
  items: many(shipmentItems),
  legs: many(shipmentLegs),
  costs: many(shippingCosts),
  tracking: many(deliveryTracking),
  arrivalCosts: many(arrivalCosts),
}));

export const shipmentItemsRelations = relations(shipmentItems, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentItems.shipmentId],
    references: [shipments.id],
  }),
  warehouseStock: one(warehouseStock, {
    fields: [shipmentItems.warehouseStockId],
    references: [warehouseStock.id],
  }),
}));

export const shipmentLegsRelations = relations(shipmentLegs, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentLegs.shipmentId],
    references: [shipments.id],
  }),
  carrier: one(carriers, {
    fields: [shipmentLegs.carrierId],
    references: [carriers.id],
  }),
}));

export const shipmentInspectionsRelations = relations(shipmentInspections, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentInspections.shipmentId],
    references: [shipments.id],
  }),
  inspectedBy: one(users, {
    fields: [shipmentInspections.inspectedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [shipmentInspections.approvedBy],
    references: [users.id],
  }),
}));

// Approval relations
export const approvalChainsRelations = relations(approvalChains, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [approvalChains.createdBy],
    references: [users.id],
  }),
  escalationChain: one(approvalChains, {
    fields: [approvalChains.escalationChainId],
    references: [approvalChains.id],
  }),
  requests: many(approvalRequests),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one }) => ({
  chain: one(approvalChains, {
    fields: [approvalRequests.chainId],
    references: [approvalChains.id],
  }),
  requestedBy: one(users, {
    fields: [approvalRequests.requestedBy],
    references: [users.id],
  }),
  finalApprovedBy: one(users, {
    fields: [approvalRequests.finalApprovedBy],
    references: [users.id],
  }),
  finalRejectedBy: one(users, {
    fields: [approvalRequests.finalRejectedBy],
    references: [users.id],
  }),
}));

export const approvalGuardsRelations = relations(approvalGuards, ({ one }) => ({
  createdBy: one(users, {
    fields: [approvalGuards.createdBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  parentAudit: one(auditLogs, {
    fields: [auditLogs.parentAuditId],
    references: [auditLogs.id],
  }),
}));

// ===== TYPES AND SCHEMAS =====

// User types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = Partial<InsertUser> & { id?: string };

// User warehouse scope types
export const insertUserWarehouseScopeSchema = createInsertSchema(userWarehouseScopes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserWarehouseScope = typeof userWarehouseScopes.$inferSelect;
export type InsertUserWarehouseScope = z.infer<typeof insertUserWarehouseScopeSchema>;

// Settings types
export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Settings history types
export const insertSettingsHistorySchema = createInsertSchema(settingsHistory).omit({
  id: true,
  createdAt: true,
});

export type SettingsHistory = typeof settingsHistory.$inferSelect;
export type InsertSettingsHistory = z.infer<typeof insertSettingsHistorySchema>;

// Numbering schemes types
export const insertNumberingSchemeSchema = createInsertSchema(numberingSchemes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NumberingScheme = typeof numberingSchemes.$inferSelect;
export type InsertNumberingScheme = z.infer<typeof insertNumberingSchemeSchema>;

// Configuration snapshots types
export const insertConfigurationSnapshotSchema = createInsertSchema(configurationSnapshots).omit({
  id: true,
  createdAt: true,
});

export type ConfigurationSnapshot = typeof configurationSnapshots.$inferSelect;
export type InsertConfigurationSnapshot = z.infer<typeof insertConfigurationSnapshotSchema>;

// Supplier types
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Supplier quality assessment types
export const insertSupplierQualityAssessmentSchema = createInsertSchema(supplierQualityAssessments).omit({
  id: true,
  createdAt: true,
});

export type SupplierQualityAssessment = typeof supplierQualityAssessments.$inferSelect;
export type InsertSupplierQualityAssessment = z.infer<typeof insertSupplierQualityAssessmentSchema>;

// Order types
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Purchase types
export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

// Purchase payment types
export const insertPurchasePaymentSchema = createInsertSchema(purchasePayments).omit({
  id: true,
  createdAt: true,
});

export type PurchasePayment = typeof purchasePayments.$inferSelect;
export type InsertPurchasePayment = z.infer<typeof insertPurchasePaymentSchema>;

// Capital entry types
export const insertCapitalEntrySchema = createInsertSchema(capitalEntries).omit({
  id: true,
  entryId: true,
  createdAt: true,
});

export type CapitalEntry = typeof capitalEntries.$inferSelect;
export type InsertCapitalEntry = z.infer<typeof insertCapitalEntrySchema>;

// Financial metrics types
export const insertFinancialMetricSchema = createInsertSchema(financialMetrics).omit({
  id: true,
  createdAt: true,
});

export type FinancialMetric = typeof financialMetrics.$inferSelect;
export type InsertFinancialMetric = z.infer<typeof insertFinancialMetricSchema>;

// Warehouse stock types
export const insertWarehouseStockSchema = createInsertSchema(warehouseStock).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WarehouseStock = typeof warehouseStock.$inferSelect;
export type InsertWarehouseStock = z.infer<typeof insertWarehouseStockSchema>;

// Filter record types
export const insertFilterRecordSchema = createInsertSchema(filterRecords).omit({
  id: true,
  createdAt: true,
});

export type FilterRecord = typeof filterRecords.$inferSelect;
export type InsertFilterRecord = z.infer<typeof insertFilterRecordSchema>;

// Quality standard types
export const insertQualityStandardSchema = createInsertSchema(qualityStandards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type QualityStandard = typeof qualityStandards.$inferSelect;
export type InsertQualityStandard = z.infer<typeof insertQualityStandardSchema>;

// Warehouse batch types
export const insertWarehouseBatchSchema = createInsertSchema(warehouseBatches).omit({
  id: true,
  createdAt: true,
});

export type WarehouseBatch = typeof warehouseBatches.$inferSelect;
export type InsertWarehouseBatch = z.infer<typeof insertWarehouseBatchSchema>;

// Quality inspection types
export const insertQualityInspectionSchema = createInsertSchema(qualityInspections).omit({
  id: true,
  createdAt: true,
});

export type QualityInspection = typeof qualityInspections.$inferSelect;
export type InsertQualityInspection = z.infer<typeof insertQualityInspectionSchema>;

// Inventory consumption types
export const insertInventoryConsumptionSchema = createInsertSchema(inventoryConsumption).omit({
  id: true,
  createdAt: true,
});

export type InventoryConsumption = typeof inventoryConsumption.$inferSelect;
export type InsertInventoryConsumption = z.infer<typeof insertInventoryConsumptionSchema>;

// Processing operations types
export const insertProcessingOperationSchema = createInsertSchema(processingOperations).omit({
  id: true,
  createdAt: true,
});

export type ProcessingOperation = typeof processingOperations.$inferSelect;
export type InsertProcessingOperation = z.infer<typeof insertProcessingOperationSchema>;

// Stock transfer types
export const insertStockTransferSchema = createInsertSchema(stockTransfers).omit({
  id: true,
  createdAt: true,
});

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type InsertStockTransfer = z.infer<typeof insertStockTransferSchema>;

// Inventory adjustment types
export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).omit({
  id: true,
  createdAt: true,
});

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;

// Carrier types
export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;

// Shipment types
export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

// Shipment item types
export const insertShipmentItemSchema = createInsertSchema(shipmentItems).omit({
  id: true,
  createdAt: true,
});

export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = z.infer<typeof insertShipmentItemSchema>;

// Shipment leg types
export const insertShipmentLegSchema = createInsertSchema(shipmentLegs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ShipmentLeg = typeof shipmentLegs.$inferSelect;
export type InsertShipmentLeg = z.infer<typeof insertShipmentLegSchema>;

// Shipping cost types
export const insertShippingCostSchema = createInsertSchema(shippingCosts).omit({
  id: true,
  createdAt: true,
});

export type ShippingCost = typeof shippingCosts.$inferSelect;
export type InsertShippingCost = z.infer<typeof insertShippingCostSchema>;

// Delivery tracking types
export const insertDeliveryTrackingSchema = createInsertSchema(deliveryTracking).omit({
  id: true,
  createdAt: true,
});

export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type InsertDeliveryTracking = z.infer<typeof insertDeliveryTrackingSchema>;

// Arrival cost types
export const insertArrivalCostSchema = createInsertSchema(arrivalCosts).omit({
  id: true,
  createdAt: true,
});

export type ArrivalCost = typeof arrivalCosts.$inferSelect;
export type InsertArrivalCost = z.infer<typeof insertArrivalCostSchema>;

// Shipment inspection types
export const insertShipmentInspectionSchema = createInsertSchema(shipmentInspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ShipmentInspection = typeof shipmentInspections.$inferSelect;
export type InsertShipmentInspection = z.infer<typeof insertShipmentInspectionSchema>;

// Approval chain types
export const insertApprovalChainSchema = createInsertSchema(approvalChains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ApprovalChain = typeof approvalChains.$inferSelect;
export type InsertApprovalChain = z.infer<typeof insertApprovalChainSchema>;

// Approval request types
export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({
  id: true,
  approvalRequestId: true,
  createdAt: true,
  updatedAt: true,
});

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;

// Approval guard types
export const insertApprovalGuardSchema = createInsertSchema(approvalGuards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ApprovalGuard = typeof approvalGuards.$inferSelect;
export type InsertApprovalGuard = z.infer<typeof insertApprovalGuardSchema>;

// Audit log types
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  checksum: true,
  timestamp: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// CRITICAL MISSING EXPORTS - Added to fix compilation failures

// Customers table - missing table definition required for insertCustomerSchema
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  tradeName: varchar("trade_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  contactPerson: varchar("contact_person"),
  address: text("address"),
  country: varchar("country"),
  category: varchar("category").default('retail'), // retail, wholesale, distributor
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  paymentTerms: varchar("payment_terms").default('net_30'), // net_30, net_60, cash, etc.
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer types - Critical missing export
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

// ===== SUPPLY CONSUMPTION TABLE =====

// Supply consumption table for Stage 3-4 supply costs in landed cost calculations  
export const supplyConsumption = pgTable("supply_consumption", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumptionNumber: varchar("consumption_number").notNull().unique(),
  orderId: varchar("order_id").references(() => orders.id),
  supplyId: varchar("supply_id"), // Reference to supplies used
  consumptionType: varchar("consumption_type").notNull(), // packing, filtering, processing
  quantityUsed: decimal("quantity_used", { precision: 10, scale: 2 }).notNull(),
  unitCostUsd: decimal("unit_cost_usd", { precision: 10, scale: 4 }).notNull(),
  totalCostUsd: decimal("total_cost_usd", { precision: 12, scale: 2 }).notNull(),
  consumedForOrderId: varchar("consumed_for_order_id").references(() => orders.id),
  notes: text("notes"),
  consumedBy: varchar("consumed_by").references(() => users.id),
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_supply_consumption_order").on(table.orderId),
  index("idx_supply_consumption_type").on(table.consumptionType),
  index("idx_supply_consumption_consumed_at").on(table.consumedAt),
]);

// Supply consumption types and schemas
export const insertSupplyConsumptionSchema = createInsertSchema(supplyConsumption).omit({
  id: true,
  consumptionNumber: true,
  createdAt: true,
});

export type SupplyConsumption = typeof supplyConsumption.$inferSelect;
export type InsertSupplyConsumption = z.infer<typeof insertSupplyConsumptionSchema>;

// ===== MISSING OPERATIONAL SCHEMAS =====

// Shipping operation schemas - Fix missing imports in routes.ts
export const addDeliveryTrackingSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  status: z.string().min(1, 'Status is required'),
  location: z.string().optional(),
  description: z.string().optional(),
  timestamp: z.string().optional(),
  isCustomerNotified: z.boolean().default(false),
  proofOfDelivery: z.string().optional(),
  exceptionDetails: z.string().optional(),
});

export const addShippingCostSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  costType: z.string().min(1, 'Cost type is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  fundingSource: z.string().min(1, 'Funding source is required'),
});

export const createShipmentFromStockSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  carrierId: z.string().min(1, 'Carrier ID is required'),
  expectedDepartureDate: z.string().optional(),
  expectedArrivalDate: z.string().optional(),
  estimatedCost: z.string().optional(),
  shippingMethod: z.enum(['air', 'sea', 'land', 'rail', 'multimodal']).default('sea'),
  notes: z.string().optional(),
  warehouseStockIds: z.array(z.string()).min(1, 'At least one warehouse stock item is required'),
});

export const shipmentStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']),
  actualDepartureDate: z.string().optional(),
  actualArrivalDate: z.string().optional(),
  notes: z.string().optional(),
});

export const carrierFilterSchema = z.object({
  name: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
  method: z.enum(['air', 'sea', 'land', 'rail', 'multimodal']).optional(),
});

export const shipmentFilterSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']).optional(),
  orderId: z.string().optional(),
  carrierId: z.string().optional(),
  method: z.enum(['air', 'sea', 'land', 'rail', 'multimodal']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Additional schemas for Stage 2-5 compliance
export const warehouseStatusUpdateSchema = z.object({
  status: z.enum(['AWAITING_DECISION', 'FILTERING', 'FILTERED', 'PACKED', 'RESERVED', 'CONSUMED', 'READY_TO_SHIP', 'NON_CLEAN', 'READY_FOR_SALE', 'AWAITING_FILTER']),
  notes: z.string().optional(),
});

export const warehouseFilterOperationSchema = z.object({
  warehouseStockId: z.string().min(1, 'Warehouse stock ID is required'),
  inputKg: z.string().min(1, 'Input weight is required'),
  outputCleanKg: z.string().min(1, 'Clean output weight is required'),
  outputNonCleanKg: z.string().default('0'),
  notes: z.string().optional(),
});

export const warehouseMoveToFinalSchema = z.object({
  warehouseStockIds: z.array(z.string()).min(1, 'At least one stock item is required'),
  notes: z.string().optional(),
});

export const warehouseStockFilterSchema = z.object({
  warehouse: z.enum(['FIRST', 'FINAL']).optional(),
  status: z.enum(['AWAITING_DECISION', 'FILTERING', 'FILTERED', 'PACKED', 'RESERVED', 'CONSUMED', 'READY_TO_SHIP', 'NON_CLEAN', 'READY_FOR_SALE', 'AWAITING_FILTER']).optional(),
  qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']).optional(),
  supplierId: z.string().optional(),
});

export const dateRangeFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const periodFilterSchema = z.object({
  period: z.string().optional(), // YYYY-MM, YYYY-QQ, YYYY format
  year: z.string().optional(),
  month: z.string().optional(),
  quarter: z.string().optional(),
});

export const exportTypeSchema = z.object({
  format: z.enum(['excel', 'csv', 'pdf']).default('excel'),
  includeHeaders: z.boolean().default(true),
  dateRange: dateRangeFilterSchema.optional(),
});

// AI-related schemas - Fix missing AI schemas in routes.ts
export const aiPurchaseRecommendationRequestSchema = z.object({
  budget: z.string().min(1, 'Budget is required'),
  qualityRequirements: z.string().optional(),
  timeframe: z.string().optional(),
  preferredSuppliers: z.array(z.string()).optional(),
  marketConditions: z.string().optional(),
  additionalContext: z.string().optional(),
});

export const aiSupplierRecommendationRequestSchema = z.object({
  productType: z.string().min(1, 'Product type is required'),
  qualityRequirements: z.string().optional(),
  budget: z.string().optional(),
  volume: z.string().optional(),
  deliveryTimeframe: z.string().optional(),
  geographicPreferences: z.array(z.string()).optional(),
  additionalCriteria: z.string().optional(),
});

export const aiCapitalOptimizationRequestSchema = z.object({
  currentCapital: z.string().min(1, 'Current capital is required'),
  investmentGoals: z.string().optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  timeHorizon: z.string().optional(),
  businessPriorities: z.array(z.string()).optional(),
  marketConditions: z.string().optional(),
  additionalContext: z.string().optional(),
});

export const aiChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
  conversationId: z.string().optional(),
  includeBusinessData: z.boolean().default(false),
});

export const aiContextualHelpRequestSchema = z.object({
  page: z.string().min(1, 'Page is required'),
  action: z.string().optional(),
  userRole: z.string().optional(),
  specificQuestion: z.string().optional(),
  context: z.object({}).passthrough().optional(),
});

// ===== ADDITIONAL MISSING SCHEMAS =====

// Alert and monitoring schemas
export const alertConfigurationFilterSchema = z.object({
  type: z.string().optional(),
  isActive: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// Supplier and purchase related schemas
export const supplierQualityAssessmentSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']),
  qualityScore: z.string().min(1, 'Quality score is required'),
  consistencyScore: z.string().min(1, 'Consistency score is required'),
  defectRateScore: z.string().min(1, 'Defect rate score is required'),
  deliveryTimelinessScore: z.string().min(1, 'Delivery timeliness score is required'),
  packagingScore: z.string().min(1, 'Packaging score is required'),
  overallScore: z.string().min(1, 'Overall score is required'),
  assessedBy: z.string().min(1, 'Assessor is required'),
  notes: z.string().optional(),
});

export const purchaseReturnSchema = z.object({
  purchaseId: z.string().min(1, 'Purchase ID is required'),
  returnQuantityKg: z.string().min(1, 'Return quantity is required'),
  reason: z.string().min(1, 'Return reason is required'),
  qualityIssues: z.array(z.string()).optional(),
  refundAmount: z.string().optional(),
  exchangeRequested: z.boolean().default(false),
  notes: z.string().optional(),
});

export const filteringDelayThresholdSchema = z.object({
  standardDays: z.string().min(1, 'Standard days is required'),
  warningDays: z.string().min(1, 'Warning days is required'),
  escalationDays: z.string().min(1, 'Escalation days is required'),
});

export const costRedistributionValidationSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

// Revenue and financial schemas
export const insertRevenueTransactionSchema = z.object({
  type: z.enum(['customer_receipt', 'customer_refund', 'withdrawal', 'reinvest_out', 'transfer_fee', 'reclass', 'reverse']),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  customerId: z.string().optional(),
  salesOrderId: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const insertCustomerCreditLimitSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  creditLimit: z.string().min(1, 'Credit limit is required'),
  currency: z.string().default('USD'),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  notes: z.string().optional(),
});

export const insertPricingRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ruleType: z.enum(['volume_discount', 'customer_specific', 'quality_premium', 'seasonal']),
  conditions: z.object({}).passthrough(),
  adjustmentType: z.enum(['percentage', 'fixed_amount']),
  adjustmentValue: z.string().min(1, 'Adjustment value is required'),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

export const financialPeriodFilterSchema = z.object({
  year: z.string().optional(),
  quarter: z.string().optional(),
  month: z.string().optional(),
  periodType: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
});

export const financialAnalysisRequestSchema = z.object({
  analysisType: z.enum(['profitability', 'liquidity', 'efficiency', 'leverage']),
  period: z.string().min(1, 'Period is required'),
  compareToLastPeriod: z.boolean().default(true),
  includeProjections: z.boolean().default(false),
});

export const marginAnalysisRequestSchema = z.object({
  productCategory: z.string().optional(),
  customerId: z.string().optional(),
  period: z.string().min(1, 'Period is required'),
  includeOperatingExpenses: z.boolean().default(true),
  groupBy: z.enum(['product', 'customer', 'period']).default('product'),
});

export const cashFlowAnalysisRequestSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  includeProjections: z.boolean().default(false),
  projectionMonths: z.string().optional(),
  includeByCategory: z.boolean().default(true),
});

export const budgetTrackingRequestSchema = z.object({
  budgetType: z.enum(['capital', 'operational', 'revenue']),
  period: z.string().min(1, 'Period is required'),
  compareToActual: z.boolean().default(true),
  includeVarianceAnalysis: z.boolean().default(true),
});

export const insertFinancialPeriodSchema = z.object({
  periodType: z.enum(['monthly', 'quarterly', 'yearly']),
  year: z.string().min(1, 'Year is required'),
  month: z.string().optional(),
  quarter: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
});

// Document management schemas
export const documentUploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['contract', 'invoice', 'certificate', 'license', 'policy', 'procedure', 'manual', 'specification', 'report', 'correspondence', 'legal', 'financial', 'operational', 'compliance', 'quality', 'safety', 'hr', 'technical', 'marketing', 'other']),
  subCategory: z.string().optional(),
  accessLevel: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
  tags: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  requiresCompliance: z.boolean().default(false),
  complianceType: z.string().optional(),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  reminderDate: z.string().optional(),
});

export const documentSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  accessLevel: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const documentUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['contract', 'invoice', 'certificate', 'license', 'policy', 'procedure', 'manual', 'specification', 'report', 'correspondence', 'legal', 'financial', 'operational', 'compliance', 'quality', 'safety', 'hr', 'technical', 'marketing', 'other']),
  subCategory: z.string().optional(),
  accessLevel: z.enum(['public', 'internal', 'confidential', 'restricted']),
  tags: z.string().optional(),
  status: z.enum(['draft', 'under_review', 'approved', 'active', 'archived', 'expired']),
  requiresCompliance: z.boolean(),
  complianceType: z.string().optional(),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  reminderDate: z.string().optional(),
});

export const documentVersionCreateSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  versionNumber: z.string().min(1, 'Version number is required'),
  changeDescription: z.string().min(1, 'Change description is required'),
  isMinorChange: z.boolean().default(false),
});

export const documentComplianceUpdateSchema = z.object({
  requirementType: z.enum(['regulatory', 'certification', 'internal_policy', 'legal']),
  requirementName: z.string().min(1, 'Requirement name is required'),
  requirementDescription: z.string().optional(),
  regulatoryBody: z.string().optional(),
  status: z.enum(['pending_review', 'compliant', 'non_compliant', 'expired', 'under_review']),
  complianceDate: z.string().optional(),
  expiryDate: z.string().optional(),
  renewalDate: z.string().optional(),
  complianceLevel: z.enum(['full', 'partial', 'conditional']).optional(),
  certificateNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  validationMethod: z.enum(['self_attestation', 'third_party', 'audit']).optional(),
  autoRenewal: z.boolean().default(false),
  reminderDaysBefore: z.number().default(30),
});

export const complianceFilterSchema = z.object({
  status: z.enum(['pending_review', 'compliant', 'non_compliant', 'expired', 'under_review']).optional(),
  requirementType: z.enum(['regulatory', 'certification', 'internal_policy', 'legal']).optional(),
  expiringWithinDays: z.string().optional(),
});

export const insertDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['contract', 'invoice', 'certificate', 'license', 'policy', 'procedure', 'manual', 'specification', 'report', 'correspondence', 'legal', 'financial', 'operational', 'compliance', 'quality', 'safety', 'hr', 'technical', 'marketing', 'other']),
  subCategory: z.string().optional(),
  accessLevel: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
  tags: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  requiresCompliance: z.boolean().default(false),
  complianceType: z.string().optional(),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  reminderDate: z.string().optional(),
});

// Financial reporting schemas
export const insertProfitLossStatementSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  revenue: z.string().min(1, 'Revenue is required'),
  cogs: z.string().min(1, 'COGS is required'),
  operatingExpenses: z.string().min(1, 'Operating expenses is required'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

export const insertCashFlowAnalysisSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  operatingCashFlow: z.string().min(1, 'Operating cash flow is required'),
  investingCashFlow: z.string().min(1, 'Investing cash flow is required'),
  financingCashFlow: z.string().min(1, 'Financing cash flow is required'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

export const insertMarginAnalysisSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  productCategory: z.string().optional(),
  grossMargin: z.string().min(1, 'Gross margin is required'),
  operatingMargin: z.string().min(1, 'Operating margin is required'),
  netMargin: z.string().min(1, 'Net margin is required'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

export const insertBudgetTrackingSchema = z.object({
  budgetType: z.enum(['capital', 'operational', 'revenue']),
  period: z.string().min(1, 'Period is required'),
  budgetAmount: z.string().min(1, 'Budget amount is required'),
  actualAmount: z.string().min(1, 'Actual amount is required'),
  variance: z.string().min(1, 'Variance is required'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});

// Operating expenses schemas
export const insertSupplySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  unitCost: z.string().min(1, 'Unit cost is required'),
  supplier: z.string().optional(),
  minStockLevel: z.string().optional(),
  maxStockLevel: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertSupplyPurchaseSchema = z.object({
  supplyId: z.string().min(1, 'Supply ID is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unitCost: z.string().min(1, 'Unit cost is required'),
  totalCost: z.string().min(1, 'Total cost is required'),
  supplier: z.string().optional(),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  notes: z.string().optional(),
});

export const insertOperatingExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  paymentMethod: z.string().optional(),
  supplier: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Revenue management schemas
export const insertRevenueLedgerSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  type: z.enum(['customer_receipt', 'customer_refund', 'withdrawal', 'reinvest_out', 'transfer_fee', 'reclass', 'reverse']),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
});

export const insertWithdrawalRecordSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  withdrawalReason: z.string().min(1, 'Withdrawal reason is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  bankAccount: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const insertReinvestmentSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  reinvestmentType: z.enum(['business_expansion', 'equipment_purchase', 'inventory_increase', 'debt_repayment', 'other']),
  description: z.string().min(1, 'Description is required'),
  expectedROI: z.string().optional(),
  notes: z.string().optional(),
});

// Additional financial schemas
export const multiOrderCapitalEntrySchema = z.object({
  orderIds: z.array(z.string()).min(1, 'At least one order ID is required'),
  totalAmount: z.string().min(1, 'Total amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
});

// ===== NOTIFICATION SCHEMAS =====

// Notification creation and management schemas
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  recipientIds: z.array(z.string()).min(1, 'At least one recipient is required'),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  expiresAt: z.string().optional(),
  sendEmail: z.boolean().default(false),
  sendSms: z.boolean().default(false),
});

export const insertNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  expiresAt: z.string().optional(),
  isRead: z.boolean().default(false),
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  readAt: z.string().optional(),
});

export const insertNotificationConfigurationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  notificationType: z.string().min(1, 'Notification type is required'),
  isEnabled: z.boolean().default(true),
  deliveryMethods: z.array(z.enum(['in_app', 'email', 'sms'])).default(['in_app']),
  frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
});

export const insertNotificationDeliverySchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
  method: z.enum(['in_app', 'email', 'sms']),
  status: z.enum(['pending', 'sent', 'delivered', 'failed']).default('pending'),
  attempt: z.number().default(1),
  errorMessage: z.string().optional(),
  deliveredAt: z.string().optional(),
});

// Additional purchase/supplier schemas
export const supplierAdvanceIssueSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const supplierAdvanceConsumeSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  purchaseId: z.string().min(1, 'Purchase ID is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  notes: z.string().optional(),
});

// Sales order schemas  
export const insertSalesOrderSchema = z.object({
  orderNumber: z.string().optional(),
  customerId: z.string().min(1, 'Customer ID is required'),
  status: z.enum(['draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).default('draft'),
  totalAmount: z.string().min(1, 'Total amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  paymentTerms: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSalesOrderSchema = z.object({
  status: z.enum(['draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  totalAmount: z.string().optional(),
  currency: z.string().optional(),
  exchangeRate: z.string().optional(),
  paymentTerms: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  actualDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const insertSalesOrderItemSchema = z.object({
  salesOrderId: z.string().min(1, 'Sales order ID is required'),
  warehouseStockId: z.string().min(1, 'Warehouse stock ID is required'),
  quantityKg: z.string().min(1, 'Quantity is required'),
  pricePerKg: z.string().min(1, 'Price per kg is required'),
  totalPrice: z.string().min(1, 'Total price is required'),
  qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']).optional(),
  notes: z.string().optional(),
});

export const updateSalesOrderItemSchema = z.object({
  quantityKg: z.string().optional(),
  pricePerKg: z.string().optional(),
  totalPrice: z.string().optional(),
  qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']).optional(),
  notes: z.string().optional(),
});

export const insertCustomerCommunicationSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  type: z.enum(['call', 'email', 'meeting', 'note']),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  direction: z.enum(['inbound', 'outbound']).default('outbound'),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
  scheduledAt: z.string().optional(),
  completedAt: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().optional(),
  tradeName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  creditLimit: z.string().optional(),
  paymentTerms: z.string().optional(),
  salesRepId: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ===== FINAL MISSING SCHEMAS =====

// Customer receipt schema
export const customerReceiptSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  salesOrderId: z.string().optional(),
  type: z.literal('payment').default('payment'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'credit_card', 'check', 'trade_credit']).default('bank_transfer'),
  paymentReference: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

// Customer refund schema
export const customerRefundSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  salesOrderId: z.string().optional(),
  originalReceiptId: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  refundMethod: z.enum(['cash', 'bank_transfer', 'credit_card', 'check', 'store_credit']).default('bank_transfer'),
  reason: z.string().min(1, 'Refund reason is required'),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

// Withdrawal schema
export const withdrawalSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  withdrawalReason: z.string().min(1, 'Withdrawal reason is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  bankAccount: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

// Reinvestment schema
export const reinvestmentSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  reinvestmentType: z.enum(['business_expansion', 'equipment_purchase', 'inventory_increase', 'debt_repayment', 'other']),
  allocationPolicy: z.enum(['aggregate', 'pro_rata', 'specified']).default('aggregate'),
  targetOrders: z.array(z.string()).optional(),
  description: z.string().min(1, 'Description is required'),
  expectedROI: z.string().optional(),
  notes: z.string().optional(),
});

// Reinvestment allocation schema
export const reinvestmentAllocationSchema = z.object({
  reinvestmentId: z.string().min(1, 'Reinvestment ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  allocatedAmount: z.string().min(1, 'Allocated amount is required'),
  allocationPercentage: z.string().optional(),
  notes: z.string().optional(),
});

// Revenue ledger search and filter schemas
export const revenueLedgerSearchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['customer_receipt', 'customer_refund', 'withdrawal', 'reinvest_out', 'transfer_fee', 'reclass', 'reverse']).optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.string().optional(),
  amountMax: z.string().optional(),
});

// ===== TABLE DEFINITIONS FOR MISSING ENTITIES =====

// Revenue transactions table
export const revenueTransactions = pgTable("revenue_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionNumber: varchar("transaction_number").notNull().unique(),
  type: revenueEntryTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  reference: varchar("reference"),
  customerId: varchar("customer_id").references(() => customers.id),
  salesOrderId: varchar("sales_order_id"),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_revenue_transactions_type").on(table.type),
  index("idx_revenue_transactions_customer").on(table.customerId),
  index("idx_revenue_transactions_processed_at").on(table.processedAt),
]);

// Withdrawal records table
export const withdrawalRecords = pgTable("withdrawal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  withdrawalNumber: varchar("withdrawal_number").notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  withdrawalReason: text("withdrawal_reason").notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  bankAccount: varchar("bank_account"),
  reference: varchar("reference"),
  description: text("description").notNull(),
  notes: text("notes"),
  status: varchar("status").notNull().default('pending'),
  processedAt: timestamp("processed_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reinvestments table  
export const reinvestments = pgTable("reinvestments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reinvestmentNumber: varchar("reinvestment_number").notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  reinvestmentType: varchar("reinvestment_type").notNull(),
  allocationPolicy: reinvestmentAllocationPolicyEnum("allocation_policy").notNull(),
  description: text("description").notNull(),
  expectedROI: decimal("expected_roi", { precision: 5, scale: 2 }),
  notes: text("notes"),
  status: varchar("status").notNull().default('pending'),
  processedAt: timestamp("processed_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales orders table
export const salesOrders = pgTable("sales_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  status: varchar("status").notNull().default('draft'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  totalAmountUsd: decimal("total_amount_usd", { precision: 12, scale: 2 }),
  paymentTerms: varchar("payment_terms"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales order items table
export const salesOrderItems = pgTable("sales_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesOrderId: varchar("sales_order_id").notNull().references(() => salesOrders.id),
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(),
  pricePerKg: decimal("price_per_kg", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  qualityGrade: qualityGradeEnum("quality_grade"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue ledger table  
export const revenueLedger = pgTable("revenue_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryNumber: varchar("entry_number").notNull().unique(),
  transactionId: varchar("transaction_id").notNull(),
  type: revenueEntryTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  reference: varchar("reference"),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== FINAL TYPE EXPORTS FOR NEW TABLES =====

export type RevenueTransaction = typeof revenueTransactions.$inferSelect;
export type WithdrawalRecord = typeof withdrawalRecords.$inferSelect; 
export type Reinvestment = typeof reinvestments.$inferSelect;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type RevenueLedger = typeof revenueLedger.$inferSelect;

// ===== ALERT CONFIGURATION SCHEMAS =====

// Alert configuration table
export const alertConfigurations = pgTable("alert_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  priority: varchar("priority").notNull().default('medium'),
  triggerConditions: jsonb("trigger_conditions").notNull(),
  recipients: text("recipients").array().notNull(),
  deliveryMethods: text("delivery_methods").array().notNull().default(['in_app']),
  cooldownMinutes: integer("cooldown_minutes").default(60),
  maxAlertsPerDay: integer("max_alerts_per_day").default(10),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert alert configuration schema
export const insertAlertConfigurationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  triggerConditions: z.object({}).passthrough(),
  recipients: z.array(z.string()).min(1, 'At least one recipient is required'),
  deliveryMethods: z.array(z.enum(['in_app', 'email', 'sms'])).default(['in_app']),
  cooldownMinutes: z.number().default(60),
  maxAlertsPerDay: z.number().default(10),
});

// Update alert configuration schema
export const updateAlertConfigurationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  triggerConditions: z.object({}).passthrough().optional(),
  recipients: z.array(z.string()).optional(),
  deliveryMethods: z.array(z.enum(['in_app', 'email', 'sms'])).optional(),
  cooldownMinutes: z.number().optional(),
  maxAlertsPerDay: z.number().optional(),
});

// Alert configuration types
export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = z.infer<typeof insertAlertConfigurationSchema>;
export type UpdateAlertConfiguration = z.infer<typeof updateAlertConfigurationSchema>;

// ===== EXPORT JOB SCHEMAS =====

// Export jobs table
export const exportJobs = pgTable("export_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNumber: varchar("job_number").notNull().unique(),
  exportType: varchar("export_type").notNull(),
  format: varchar("format").notNull().default('excel'),
  status: varchar("status").notNull().default('pending'),
  parameters: jsonb("parameters"),
  filePath: varchar("file_path"),
  fileSize: integer("file_size"),
  downloadUrl: varchar("download_url"),
  expiresAt: timestamp("expires_at"),
  errorMessage: text("error_message"),
  recordCount: integer("record_count"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert export job schema
export const insertExportJobSchema = z.object({
  exportType: z.string().min(1, 'Export type is required'),
  format: z.enum(['excel', 'csv', 'pdf']).default('excel'),
  parameters: z.object({}).passthrough().optional(),
  expiresAt: z.string().optional(),
});

// Update export job schema
export const updateExportJobSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  downloadUrl: z.string().optional(),
  errorMessage: z.string().optional(),
  recordCount: z.number().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

// Export job types
export type ExportJob = typeof exportJobs.$inferSelect;
export type InsertExportJob = z.infer<typeof insertExportJobSchema>;
export type UpdateExportJob = z.infer<typeof updateExportJobSchema>;

// ===== NOTIFICATION TEMPLATE SCHEMAS =====

// Notification templates table
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  type: varchar("type").notNull(),
  category: varchar("category"),
  subject: varchar("subject"),
  titleTemplate: text("title_template").notNull(),
  messageTemplate: text("message_template").notNull(),
  variables: text("variables").array(),
  isActive: boolean("is_active").notNull().default(true),
  defaultPriority: varchar("default_priority").notNull().default('medium'),
  defaultDeliveryMethods: text("default_delivery_methods").array().notNull().default(['in_app']),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert notification template schema
export const insertNotificationTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  category: z.string().optional(),
  subject: z.string().optional(),
  titleTemplate: z.string().min(1, 'Title template is required'),
  messageTemplate: z.string().min(1, 'Message template is required'),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  defaultPriority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  defaultDeliveryMethods: z.array(z.enum(['in_app', 'email', 'sms'])).default(['in_app']),
});

// Update notification template schema
export const updateNotificationTemplateSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  subject: z.string().optional(),
  titleTemplate: z.string().optional(),
  messageTemplate: z.string().optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  defaultPriority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  defaultDeliveryMethods: z.array(z.enum(['in_app', 'email', 'sms'])).optional(),
});

// Notification template types
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type UpdateNotificationTemplate = z.infer<typeof updateNotificationTemplateSchema>;

// ===== FINAL NOTIFICATION AND FILTERING SCHEMAS =====

// Notification history filter schema
export const notificationHistoryFilterSchema = z.object({
  type: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isRead: z.boolean().optional(),
  recipientId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

// Additional notification schemas
export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
});

export const bulkDeleteNotificationSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
});

// System audit and activity schemas
export const insertActivityLogSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  oldValues: z.object({}).passthrough().optional(),
  newValues: z.object({}).passthrough().optional(),
  description: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Purchase workflow schemas
export const purchaseWorkflowStatusUpdateSchema = z.object({
  purchaseId: z.string().min(1, 'Purchase ID is required'),
  newStatus: z.string().min(1, 'New status is required'),
  notes: z.string().optional(),
  notifyStakeholders: z.boolean().default(true),
});

// Landed cost calculation schemas
export const landedCostRecalculationSchema = z.object({
  purchaseId: z.string().min(1, 'Purchase ID is required'),
  includeStage1: z.boolean().default(true),
  includeStage2: z.boolean().default(true),
  includeStage3: z.boolean().default(true),
  includeStage4: z.boolean().default(true),
  forceRecalculation: z.boolean().default(false),
});

// Report generation schemas
export const generateReportSchema = z.object({
  reportType: z.enum(['purchase_summary', 'shipping_status', 'inventory_valuation', 'financial_overview', 'supplier_performance']),
  parameters: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    supplierId: z.string().optional(),
    customerId: z.string().optional(),
    includeCharts: z.boolean().default(true),
    format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  }).optional(),
});

// System settings schemas
export const updateSystemSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({}).passthrough()]),
  description: z.string().optional(),
});

// Dashboard widget schemas
export const updateDashboardLayoutSchema = z.object({
  layout: z.array(z.object({
    id: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
    type: z.string(),
    config: z.object({}).passthrough().optional(),
  })),
});

// API key management schemas
export const insertApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().optional(),
  allowedIps: z.array(z.string()).optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
  allowedIps: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// ===== FINAL FILTER SCHEMAS =====

// Notification template filter schema
export const notificationTemplateFilterSchema = z.object({
  type: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

// Additional system filter schemas
export const systemUserFilterSchema = z.object({
  role: z.string().optional(),
  isActive: z.boolean().optional(),
  department: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

export const auditLogFilterSchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

// Performance tracking schemas
export const systemPerformanceMetricsSchema = z.object({
  period: z.enum(['last_hour', 'last_day', 'last_week', 'last_month']).default('last_day'),
  includeDetailed: z.boolean().default(false),
});

// ===== REINVESTMENT APPROVAL SCHEMA =====

// Reinvestment approval schema
export const reinvestmentApprovalSchema = z.object({
  reinvestmentId: z.string().min(1, 'Reinvestment ID is required'),
  approved: z.boolean(),
  approvedAmount: z.string().optional(),
  approvalNotes: z.string().optional(),
  conditions: z.string().optional(),
  approvedAt: z.string().optional(),
});

// Final comprehensive export verification
// This comprehensive schema file now includes all the following:
// - Core business entities (purchases, shipping, inventory, customers, suppliers)
// - Financial management (revenue, costs, transactions, ledgers)
// - Notification system (templates, configurations, history)
// - AI operations and recommendations
// - Alert and reporting systems
// - User management and authentication
// - System administration and monitoring