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
export type AllowedRole = 'admin' | 'finance' | 'purchasing' | 'warehouse' | 'sales' | 'worker';

// User role update schema for role change operations
export const userRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker'])
});

// Quality grades enum for coffee grading
export const qualityGradeEnum = pgEnum('quality_grade', ['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']);

// Approval system enums
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'cancelled', 'escalated']);
export const approvalOperationTypeEnum = pgEnum('approval_operation_type', [
  'capital_entry', 'purchase', 'sale_order', 'warehouse_operation', 'shipping_operation', 
  'financial_adjustment', 'user_role_change', 'system_setting_change', 'system_startup', 'system_diagnostics',
  'operating_expense', 'supply_purchase', 'supply_create', 'supply_consumption', 'expense_category_create',
  'revenue_management', 'notification_delivery', 'monitoring_check', 'hourly_stats', 'notification_configuration'
]);

// Capital entry types enum for Stage 1 Working Capital
export const capitalEntryTypeEnum = pgEnum('capital_entry_type', [
  'CapitalIn', 'CapitalOut', 'Reverse', 'Reclass', 'Opening'
]);

// Revenue entry types enum for Stage 7 Revenue Management
export const revenueEntryTypeEnum = pgEnum('revenue_entry_type', [
  'customer_receipt', 'customer_refund', 'withdrawal', 'reinvest_out', 'transfer_fee', 'reclass', 'reverse'
]);

// Reinvestment allocation policy enum
export const reinvestmentAllocationPolicyEnum = pgEnum('reinvestment_allocation_policy', [
  'aggregate', 'pro_rata', 'specified'
]);
export const auditActionEnum = pgEnum('audit_action', [
  'create', 'update', 'delete', 'view', 'approve', 'reject', 'login', 'logout', 'export', 'import', 'validate', 'auto_correct', 'password_reset_failed'
]);
export const permissionScopeEnum = pgEnum('permission_scope', [
  'system', 'module', 'operation', 'record', 'field'
]);

// Auth provider enum for user authentication method
export const authProviderEnum = pgEnum('auth_provider', ['replit', 'supabase']);

// Payment and funding enums for financial operations
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'advance', 'credit', 'bank_transfer', 'check']);
export const fundingSourceEnum = pgEnum('funding_source', ['capital', 'external', 'credit_line', 'retained_earnings']);

// Purchase status enum
export const purchaseStatusEnum = pgEnum('purchase_status', ['pending', 'partial', 'paid', 'cancelled', 'on_hold']);

// Warehouse stock status enum
export const warehouseStockStatusEnum = pgEnum('warehouse_stock_status', [
  'AWAITING_DECISION', 'FILTERING', 'FILTERED', 'PACKED', 'RESERVED', 'CONSUMED',
  'READY_TO_SHIP', 'NON_CLEAN', 'READY_FOR_SALE', 'AWAITING_FILTER'
]);

// Shipment method and status enums
export const shipmentMethodEnum = pgEnum('shipment_method', ['air', 'sea', 'land', 'rail', 'multimodal']);
export const shipmentStatusEnum = pgEnum('shipment_status', ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']);

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

// Capital entries table
export const capitalEntries = pgTable("capital_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").notNull().unique().$defaultFn(() => `CAP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  date: timestamp("date").notNull().defaultNow(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: capitalEntryTypeEnum("type").notNull(),
  reference: varchar("reference"), // order_id, purchase_id, etc.
  description: text("description"),
  fundingSource: varchar("funding_source").default('external'), // external, internal, commission
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

// Purchases table
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseNumber: varchar("purchase_number").notNull().unique(),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  orderId: varchar("order_id").references(() => orders.id), // Made optional - not all purchases need an order
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
  // Performance indexes for purchase operations
  index("idx_purchases_supplier").on(table.supplierId),
  index("idx_purchases_status").on(table.status),
  index("idx_purchases_date").on(table.date),
  index("idx_purchases_created_by").on(table.createdBy),
  index("idx_purchases_funding").on(table.fundingSource),
]);

// Purchase payments table for multiple payments per purchase
export const purchasePayments = pgTable("purchase_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  paymentNumber: varchar("payment_number").notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // cash, credit, advance, other
  fundingSource: varchar("funding_source").notNull(), // capital, external
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }),
  reference: varchar("reference"), // Reference number or note
  description: text("description"),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Warehouse stock table (enhanced with quality and batch tracking)
export const warehouseStock = pgTable("warehouse_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  orderId: varchar("order_id").references(() => orders.id), // Made optional to match purchases table
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  batchId: varchar("batch_id"), // Link to batch for traceability - foreign key added later
  warehouse: varchar("warehouse").notNull(), // FIRST, FINAL
  status: warehouseStockStatusEnum("status").notNull().default('AWAITING_DECISION'),
  qualityGrade: qualityGradeEnum("quality_grade").default('ungraded'),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  lastInspectionId: varchar("last_inspection_id"), // Foreign key added later
  qtyKgTotal: decimal("qty_kg_total", { precision: 10, scale: 2 }).notNull(),
  qtyKgClean: decimal("qty_kg_clean", { precision: 10, scale: 2 }).notNull(),
  qtyKgNonClean: decimal("qty_kg_non_clean", { precision: 10, scale: 2 }).notNull().default('0'),
  qtyKgReserved: decimal("qty_kg_reserved", { precision: 10, scale: 2 }).notNull().default('0'),
  qtyKgConsumed: decimal("qty_kg_consumed", { precision: 10, scale: 2 }).notNull().default('0'), // Track total consumption
  cartonsCount: integer("cartons_count").default(0),
  unitCostCleanUsd: decimal("unit_cost_clean_usd", { precision: 10, scale: 4 }),
  lastActivityAt: timestamp("last_activity_at"), // Track aging for rotation management
  fifoSequence: integer("fifo_sequence"), // For FIFO tracking
  createdAt: timestamp("created_at").defaultNow(),
  statusChangedAt: timestamp("status_changed_at"),
  filteredAt: timestamp("filtered_at"),
  packedAt: timestamp("packed_at"),
  gradedAt: timestamp("graded_at"), // When quality grade was assigned
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for warehouse operations
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

// Shipping and Logistics Tables

// Carriers table
export const carriers = pgTable("carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  serviceTypes: text("service_types").array(), // Types of shipping services offered
  rating: decimal("rating", { precision: 3, scale: 2 }), // Performance rating out of 5
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
  paymentMethod: varchar("payment_method"), // cash, advance, credit
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  fundingSource: varchar("funding_source").notNull(), // capital, external
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
  proofOfDelivery: text("proof_of_delivery"), // URL or reference to delivery proof
  exceptionDetails: text("exception_details"), // Details if delivery exception
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipment legs table - Multi-leg shipping support (Stage 4)
export const shipmentLegs = pgTable("shipment_legs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  legNumber: integer("leg_number").notNull(), // 1, 2, 3... for sequence
  carrierId: varchar("carrier_id").notNull().references(() => carriers.id),
  method: shipmentMethodEnum("method").notNull(),
  status: shipmentStatusEnum("status").notNull().default('pending'),
  
  // Weight details per workflow_reference.json lines 622-624
  netWeightKg: decimal("net_weight_kg", { precision: 10, scale: 2 }).notNull(), // Actual product weight
  cartonWeightKg: decimal("carton_weight_kg", { precision: 10, scale: 2 }).notNull(), // Packaging weight
  grossWeightKg: decimal("gross_weight_kg", { precision: 10, scale: 2 }).notNull(), // Net + carton
  chargeableWeightKg: decimal("chargeable_weight_kg", { precision: 10, scale: 2 }).notNull(), // Carrier billing weight
  
  // Addresses and routing
  originAddress: text("origin_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  intermediateLocation: text("intermediate_location"), // For multi-leg routing
  
  // Pricing per workflow_reference.json lines 625-629
  ratePerKg: decimal("rate_per_kg", { precision: 10, scale: 4 }).notNull(), // Rate per kg
  legBaseCost: decimal("leg_base_cost", { precision: 12, scale: 2 }).notNull(), // rate_per_kg × chargeable_weight
  transferCommissionPercent: decimal("transfer_commission_percent", { precision: 5, scale: 2 }).default('0.00'), // Commission %
  transferCommissionUsd: decimal("transfer_commission_usd", { precision: 10, scale: 2 }).default('0.00'), // Commission amount
  legTotalCost: decimal("leg_total_cost", { precision: 12, scale: 2 }).notNull(), // Base + commission
  
  // Dates and tracking
  estimatedDepartureDate: timestamp("estimated_departure_date"),
  actualDepartureDate: timestamp("actual_departure_date"),
  estimatedArrivalDate: timestamp("estimated_arrival_date"),
  actualArrivalDate: timestamp("actual_arrival_date"),
  trackingNumber: varchar("tracking_number"),
  
  // Funding and payment
  fundingSource: varchar("funding_source").notNull(), // capital, external
  paymentCurrency: varchar("payment_currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  
  // Status tracking
  isConfirmed: boolean("is_confirmed").notNull().default(false), // Confirmation per workflow_reference.json line 610
  confirmedBy: varchar("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_shipment_legs_shipment_id").on(table.shipmentId),
  index("idx_shipment_legs_leg_number").on(table.shipmentId, table.legNumber),
  index("idx_shipment_legs_confirmed").on(table.isConfirmed),
  uniqueIndex("unique_shipment_leg_number").on(table.shipmentId, table.legNumber),
]);

// Arrival costs table - Separate from leg costs per workflow_reference.json lines 631-632  
export const arrivalCosts = pgTable("arrival_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  costType: varchar("cost_type").notNull(), // broker, delivery, customs, inspection, handling, other
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  
  // Funding and payment
  fundingSource: varchar("funding_source").notNull(), // capital, external  
  paymentMethod: varchar("payment_method"), // cash, advance, credit
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  paidDate: timestamp("paid_date"),
  
  invoiceReference: varchar("invoice_reference"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_arrival_costs_shipment_id").on(table.shipmentId),
  index("idx_arrival_costs_cost_type").on(table.costType),
]);

// Shipment inspections table - Final inspection per workflow_reference.json lines 634-636
export const shipmentInspections = pgTable("shipment_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  inspectionNumber: varchar("inspection_number").notNull().unique().$defaultFn(() => `SHIP-INSP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  
  // Inspection results per workflow_reference.json line 635
  expectedWeightKg: decimal("expected_weight_kg", { precision: 10, scale: 2 }).notNull(), // Net weight expected
  receivedWeightKg: decimal("received_weight_kg", { precision: 10, scale: 2 }).notNull(), // Total received
  grossWeightKg: decimal("gross_weight_kg", { precision: 10, scale: 2 }), // Gross weight including packaging
  cleanWeightKg: decimal("clean_weight_kg", { precision: 10, scale: 2 }).notNull(), // Good condition
  damagedWeightKg: decimal("damaged_weight_kg", { precision: 10, scale: 2 }).notNull(), // Damaged/loss
  
  // Inspection status and actions
  status: varchar("status").notNull().default('pending'), // pending, completed, requires_settlement
  inspectionDate: timestamp("inspection_date").notNull().defaultNow(),
  
  // Settlement options per workflow_reference.json lines 597-600
  settlementRequired: boolean("settlement_required").notNull().default(false),
  settlementAction: varchar("settlement_action"), // accept_difference, request_correction, write_off
  settlementType: varchar("settlement_type"), // accept, return, discount
  settlementNotes: text("settlement_notes"),
  
  // Final warehouse transfer per workflow_reference.json line 636
  finalWarehouseTransferred: boolean("final_warehouse_transferred").notNull().default(false),
  transferredAt: timestamp("transferred_at"),
  
  inspectedBy: varchar("inspected_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_shipment_inspections_shipment_id").on(table.shipmentId),
  index("idx_shipment_inspections_status").on(table.status),
]);

// Landed cost calculations table - Stores calculated landed costs per shipment
export const landedCostCalculations = pgTable("landed_cost_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  calculationDate: timestamp("calculation_date").notNull().defaultNow(),
  
  // Base costs
  totalLegCosts: decimal("total_leg_costs", { precision: 12, scale: 2 }).notNull().default('0'),
  totalArrivalCosts: decimal("total_arrival_costs", { precision: 12, scale: 2 }).notNull().default('0'),
  totalLandedCost: decimal("total_landed_cost", { precision: 12, scale: 2 }).notNull().default('0'),
  
  // Weight allocation basis
  totalNetWeightKg: decimal("total_net_weight_kg", { precision: 10, scale: 2 }).notNull(),
  costPerKg: decimal("cost_per_kg", { precision: 10, scale: 4 }).notNull(),
  
  // Currency and exchange
  baseCurrency: varchar("base_currency").notNull().default('USD'),
  exchangeRateUsed: decimal("exchange_rate_used", { precision: 10, scale: 4 }),
  
  // Calculation metadata
  includedLegIds: jsonb("included_leg_ids").$type<string[]>().notNull(),
  includedArrivalCostIds: jsonb("included_arrival_cost_ids").$type<string[]>().notNull(),
  calculationMethod: varchar("calculation_method").notNull().default('weight_basis'), // weight_basis, value_basis
  
  // Status and approval
  status: varchar("status").notNull().default('draft'), // draft, approved, finalized
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  calculatedBy: varchar("calculated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_landed_cost_calculations_shipment_id").on(table.shipmentId),
  index("idx_landed_cost_calculations_status").on(table.status),
  index("idx_landed_cost_calculations_date").on(table.calculationDate),
]);

// Advanced Warehouse Operations Tables

// Quality standards table
export const qualityStandards = pgTable("quality_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grade: qualityGradeEnum("grade").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  criteriaJson: jsonb("criteria_json").notNull(), // Grading criteria with scoring
  minScore: decimal("min_score", { precision: 5, scale: 2 }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }),
  priceMultiplier: decimal("price_multiplier", { precision: 5, scale: 4 }).notNull().default('1.0000'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouse batches table for lot tracking
export const warehouseBatches = pgTable("warehouse_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchNumber: varchar("batch_number").notNull().unique().$defaultFn(() => `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  qualityGrade: qualityGradeEnum("quality_grade").default('ungraded'),
  originCountry: varchar("origin_country"),
  processingDate: timestamp("processing_date"),
  harvestDate: timestamp("harvest_date"),
  traceabilityInfo: jsonb("traceability_info"), // Farm details, certifications, etc.
  totalQuantityKg: decimal("total_quantity_kg", { precision: 10, scale: 2 }).notNull(),
  remainingQuantityKg: decimal("remaining_quantity_kg", { precision: 10, scale: 2 }).notNull(),
  avgMoistureContent: decimal("avg_moisture_content", { precision: 5, scale: 2 }),
  avgDefectRate: decimal("avg_defect_rate", { precision: 5, scale: 2 }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quality inspections table
export const qualityInspections = pgTable("quality_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionNumber: varchar("inspection_number").notNull().unique().$defaultFn(() => `INSP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  batchId: varchar("batch_id").references(() => warehouseBatches.id),
  purchaseId: varchar("purchase_id").references(() => purchases.id),
  warehouseStockId: varchar("warehouse_stock_id").references(() => warehouseStock.id),
  shipmentId: varchar("shipment_id").references(() => shipments.id),
  inspectionType: varchar("inspection_type").notNull(), // incoming, processing, outgoing, quality_control
  status: varchar("status").notNull().default('pending'), // pending, in_progress, completed, failed, approved, rejected
  qualityGrade: qualityGradeEnum("quality_grade"),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  moistureContent: decimal("moisture_content", { precision: 5, scale: 2 }),
  defectRate: decimal("defect_rate", { precision: 5, scale: 2 }),
  screenSize: varchar("screen_size"),
  cupQualityScore: decimal("cup_quality_score", { precision: 5, scale: 2 }),
  visualInspection: jsonb("visual_inspection"), // Color, appearance, etc.
  testResults: jsonb("test_results"), // Detailed test results
  defectsFound: jsonb("defects_found"), // Array of defects with quantities
  recommendations: text("recommendations"),
  rejectionReason: text("rejection_reason"),
  inspectedBy: varchar("inspected_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  inspectionDate: timestamp("inspection_date").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory consumption table for tracking stock usage
export const inventoryConsumption = pgTable("inventory_consumption", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumptionNumber: varchar("consumption_number").notNull().unique().$defaultFn(() => `CONS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  batchId: varchar("batch_id").references(() => warehouseBatches.id),
  orderId: varchar("order_id").references(() => orders.id),
  consumptionType: varchar("consumption_type").notNull(), // sale, transfer, processing, adjustment, loss
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(),
  unitCostUsd: decimal("unit_cost_usd", { precision: 10, scale: 4 }).notNull(),
  totalCostUsd: decimal("total_cost_usd", { precision: 12, scale: 2 }).notNull(),
  fifoSequence: integer("fifo_sequence").notNull(), // For FIFO tracking
  allocatedTo: varchar("allocated_to"), // customer_id, order_id, process_id
  reason: text("reason"),
  documentReference: varchar("document_reference"), // Invoice, transfer doc, etc.
  consumedBy: varchar("consumed_by").notNull().references(() => users.id),
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Processing operations table
export const processingOperations = pgTable("processing_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationNumber: varchar("operation_number").notNull().unique().$defaultFn(() => `OPR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  operationType: varchar("operation_type").notNull(), // washing, drying, hulling, sorting, milling
  status: varchar("status").notNull().default('planned'), // planned, in_progress, completed, cancelled
  batchId: varchar("batch_id").notNull().references(() => warehouseBatches.id),
  inputQuantityKg: decimal("input_quantity_kg", { precision: 10, scale: 2 }).notNull(),
  outputQuantityKg: decimal("output_quantity_kg", { precision: 10, scale: 2 }),
  yieldPercentage: decimal("yield_percentage", { precision: 5, scale: 2 }),
  lossQuantityKg: decimal("loss_quantity_kg", { precision: 10, scale: 2 }),
  qualityBefore: qualityGradeEnum("quality_before"),
  qualityAfter: qualityGradeEnum("quality_after"),
  processingCostUsd: decimal("processing_cost_usd", { precision: 10, scale: 2 }),
  laborCostUsd: decimal("labor_cost_usd", { precision: 10, scale: 2 }),
  equipmentCostUsd: decimal("equipment_cost_usd", { precision: 10, scale: 2 }),
  totalCostUsd: decimal("total_cost_usd", { precision: 12, scale: 2 }),
  processingParameters: jsonb("processing_parameters"), // Temperature, humidity, duration, etc.
  qualityImpact: jsonb("quality_impact"), // How processing affected quality metrics
  operatorId: varchar("operator_id").notNull().references(() => users.id),
  supervisorId: varchar("supervisor_id").references(() => users.id),
  notes: text("notes"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock transfers table
export const stockTransfers = pgTable("stock_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferNumber: varchar("transfer_number").notNull().unique().$defaultFn(() => `XFER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  transferType: varchar("transfer_type").notNull(), // warehouse_to_warehouse, location_to_location, batch_split, batch_merge
  status: varchar("status").notNull().default('pending'), // pending, in_transit, completed, cancelled
  fromWarehouseStockId: varchar("from_warehouse_stock_id").references(() => warehouseStock.id),
  toWarehouseStockId: varchar("to_warehouse_stock_id").references(() => warehouseStock.id),
  fromBatchId: varchar("from_batch_id").references(() => warehouseBatches.id),
  toBatchId: varchar("to_batch_id").references(() => warehouseBatches.id),
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(),
  unitCostUsd: decimal("unit_cost_usd", { precision: 10, scale: 4 }),
  reason: text("reason").notNull(),
  authorizedBy: varchar("authorized_by").notNull().references(() => users.id),
  executedBy: varchar("executed_by").references(() => users.id),
  transferredAt: timestamp("transferred_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory adjustments table
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adjustmentNumber: varchar("adjustment_number").notNull().unique().$defaultFn(() => `ADJ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  adjustmentType: varchar("adjustment_type").notNull(), // cycle_count, reconciliation, correction, write_off
  status: varchar("status").notNull().default('pending'), // pending, approved, rejected
  warehouseStockId: varchar("warehouse_stock_id").notNull().references(() => warehouseStock.id),
  batchId: varchar("batch_id").references(() => warehouseBatches.id),
  quantityBefore: decimal("quantity_before", { precision: 10, scale: 2 }).notNull(),
  quantityAfter: decimal("quantity_after", { precision: 10, scale: 2 }).notNull(),
  adjustmentQuantity: decimal("adjustment_quantity", { precision: 10, scale: 2 }).notNull(),
  unitCostUsd: decimal("unit_cost_usd", { precision: 10, scale: 4 }),
  adjustmentValueUsd: decimal("adjustment_value_usd", { precision: 12, scale: 2 }),
  reason: text("reason").notNull(),
  justification: text("justification"),
  supportingDocuments: text("supporting_documents").array(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  adjustmentDate: timestamp("adjustment_date").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== OPERATING EXPENSES SYSTEM TABLES (STAGE 5) =====

// Supply types enum
export const supplyTypeEnum = pgEnum('supply_type', ['cartons_8kg', 'cartons_20kg', 'labels', 'wraps', 'other']);

// Operating expense category enum
export const expenseCategoryEnum = pgEnum('expense_category', ['wages', 'rent', 'utilities', 'supplies', 'transfer_fees', 'other']);

// Supplies table - Inventory of cartons, labels, wraps, etc.
export const supplies = pgTable("supplies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplyNumber: varchar("supply_number").notNull().unique(),
  name: varchar("name").notNull(),
  supplyType: supplyTypeEnum("supply_type").notNull(),
  description: text("description"),
  unitOfMeasure: varchar("unit_of_measure").notNull(), // pieces, boxes, rolls, etc.
  
  // Inventory tracking
  quantityOnHand: decimal("quantity_on_hand", { precision: 10, scale: 2 }).notNull().default('0'),
  minimumStock: decimal("minimum_stock", { precision: 10, scale: 2 }).notNull().default('0'),
  reorderPoint: decimal("reorder_point", { precision: 10, scale: 2 }).notNull().default('0'),
  
  // Cost tracking
  unitCostUsd: decimal("unit_cost_usd", { precision: 10, scale: 4 }).notNull(),
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }).notNull().default('0'),
  
  // Purchase information
  lastPurchaseDate: timestamp("last_purchase_date"),
  lastPurchasePrice: decimal("last_purchase_price", { precision: 10, scale: 4 }),
  
  // Usage tracking for packing
  usagePerCarton: decimal("usage_per_carton", { precision: 5, scale: 2 }), // How much used per carton packed
  
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Operating expense categories table
export const operatingExpenseCategories = pgTable("operating_expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryName: varchar("category_name").notNull().unique(),
  category: expenseCategoryEnum("category").notNull(),
  description: text("description"),
  budgetAllocated: decimal("budget_allocated", { precision: 12, scale: 2 }),
  
  // Allocation method for order costing
  allocationMethod: varchar("allocation_method").notNull().default('direct'), // direct, time_based, order_count, weight_based
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Operating expenses table - Wages, rent, utilities, etc.
export const operatingExpenses = pgTable("operating_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseNumber: varchar("expense_number").notNull().unique(),
  categoryId: varchar("category_id").notNull().references(() => operatingExpenseCategories.id),
  
  // Expense details
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  
  // Payment tracking
  paymentMethod: varchar("payment_method").notNull(), // cash, bank_transfer, credit
  fundingSource: varchar("funding_source").notNull(), // capital, external
  totalValueUsd: decimal("total_value_usd", { precision: 12, scale: 2 }),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  
  // Period and allocation
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  
  // Order allocation (for period expenses like rent)
  orderId: varchar("order_id").references(() => orders.id), // Direct allocation to specific order
  allocationToOrders: jsonb("allocation_to_orders"), // JSON with order_id: allocation_amount pairs
  
  // Approval and audit
  isApproved: boolean("is_approved").notNull().default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supply consumption table - Track supplies used during packing
export const supplyConsumption = pgTable("supply_consumption", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consumptionNumber: varchar("consumption_number").notNull().unique(),
  
  // What was consumed
  supplyId: varchar("supply_id").notNull().references(() => supplies.id),
  quantityConsumed: decimal("quantity_consumed", { precision: 10, scale: 2 }).notNull(),
  unitCostUsd: decimal("unit_cost_usd", { precision: 10, scale: 4 }).notNull(),
  totalCostUsd: decimal("total_cost_usd", { precision: 12, scale: 2 }).notNull(),
  
  // What it was used for
  orderId: varchar("order_id").notNull().references(() => orders.id),
  warehouseStockId: varchar("warehouse_stock_id").references(() => warehouseStock.id),
  packingOperation: varchar("packing_operation").notNull(), // packing, labeling, wrapping
  cartonsProcessed: integer("cartons_processed"), // Number of cartons packed
  
  // Automatic vs manual consumption
  consumptionType: varchar("consumption_type").notNull().default('automatic'), // automatic, manual, adjustment
  
  consumedBy: varchar("consumed_by").notNull().references(() => users.id),
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Supply inventory table - Missing supply inventory management system (Stage 5)
export const supplyInventory = pgTable("supply_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: varchar("item_type").notNull(), // cartons, tape, labels
  itemName: varchar("item_name").notNull(),
  itemDescription: text("item_description"),
  unitOfMeasure: varchar("unit_of_measure").notNull(), // pieces, kg, meters
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull().default('0'),
  minimumLevel: decimal("minimum_level", { precision: 10, scale: 2 }).notNull().default('0'),
  reorderLevel: decimal("reorder_level", { precision: 10, scale: 2 }).notNull().default('0'),
  unitCost: decimal("unit_cost", { precision: 10, scale: 4 }).notNull(),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull().default('0'),
  lastPurchaseDate: timestamp("last_purchase_date"),
  lastUsageDate: timestamp("last_usage_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supply purchases table - Track supply purchases (separate from goods purchases)
export const supplyPurchases = pgTable("supply_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseNumber: varchar("purchase_number").notNull().unique(),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  supplyInventoryId: varchar("supply_inventory_id").notNull().references(() => supplyInventory.id),
  
  // Purchase details
  supplyId: varchar("supply_id").notNull().references(() => supplies.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 4 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  
  // Payment and funding
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  fundingSource: varchar("funding_source").notNull(), // capital, external
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default('0'),
  remaining: decimal("remaining", { precision: 12, scale: 2 }).notNull(),
  
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  receivedDate: timestamp("received_date"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== DOCUMENT MANAGEMENT SYSTEM TABLES =====

// Document category enum
export const documentCategoryEnum = pgEnum('document_category', [
  'invoice', 'contract', 'compliance_record', 'certificate', 'receipt', 
  'purchase_order', 'shipping_document', 'quality_report', 'financial_statement', 
  'audit_document', 'insurance_policy', 'license', 'permit', 'regulation_document'
]);

// Document status enum
export const documentStatusEnum = pgEnum('document_status', [
  'draft', 'under_review', 'approved', 'final', 'expired', 'archived', 'rejected', 'cancelled'
]);

// Compliance status enum
export const complianceStatusEnum = pgEnum('compliance_status', [
  'compliant', 'non_compliant', 'pending_review', 'expiring_soon', 'expired', 'renewal_required'
]);

// Document access level enum
export const documentAccessLevelEnum = pgEnum('document_access_level', [
  'public', 'internal', 'confidential', 'restricted', 'classified'
]);

// Documents table - Main document registry
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentNumber: varchar("document_number").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: documentCategoryEnum("category").notNull(),
  subCategory: varchar("sub_category"), // More specific categorization
  status: documentStatusEnum("status").notNull().default('draft'),
  accessLevel: documentAccessLevelEnum("access_level").notNull().default('internal'),
  
  // File information
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  contentType: varchar("content_type").notNull(),
  fileSize: integer("file_size").notNull(), // Size in bytes
  checksum: varchar("checksum").notNull(), // For file integrity verification
  
  // Document metadata
  documentDate: timestamp("document_date"), // Document creation/issue date
  expiryDate: timestamp("expiry_date"), // When document expires
  effectiveDate: timestamp("effective_date"), // When document becomes effective
  reminderDate: timestamp("reminder_date"), // When to send reminder for renewal
  
  // Business relationships
  relatedEntityType: varchar("related_entity_type"), // supplier, customer, purchase, sale, shipment, etc.
  relatedEntityId: varchar("related_entity_id"), // ID of the related entity
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  customerId: varchar("customer_id").references(() => customers.id),
  purchaseId: varchar("purchase_id").references(() => purchases.id),
  orderId: varchar("order_id").references(() => orders.id),
  shipmentId: varchar("shipment_id").references(() => shipments.id),
  
  // Version control
  currentVersion: integer("current_version").notNull().default(1),
  isLatestVersion: boolean("is_latest_version").notNull().default(true),
  parentDocumentId: varchar("parent_document_id"), // For document hierarchies
  
  // Search and organization
  tags: text("tags").array(), // Tags for searching and organization
  keywords: text("keywords"), // Additional searchable keywords
  
  // Compliance tracking
  requiresCompliance: boolean("requires_compliance").notNull().default(false),
  complianceType: varchar("compliance_type"), // regulatory, internal, certification, etc.
  
  // Security and access
  encryptionStatus: varchar("encryption_status").default('none'), // none, encrypted, secured
  passwordProtected: boolean("password_protected").notNull().default(false),
  digitalSignature: varchar("digital_signature"), // Digital signature information
  
  // Audit fields
  createdBy: varchar("created_by").notNull().references(() => users.id),
  modifiedBy: varchar("modified_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  archivedBy: varchar("archived_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  archivedAt: timestamp("archived_at"),
}, (table) => [  
  foreignKey({
    columns: [table.parentDocumentId],
    foreignColumns: [table.id],
    name: "documents_parent_document_fk"
  })
]);

// Document versions table - Version control system
export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  version: integer("version").notNull(),
  versionLabel: varchar("version_label"), // v1.0, v2.1, etc.
  
  // File information for this version
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  contentType: varchar("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  checksum: varchar("checksum").notNull(),
  
  // Version metadata
  changeDescription: text("change_description"), // What changed in this version
  changeReason: text("change_reason"), // Why the change was made
  changeType: varchar("change_type"), // major, minor, patch, correction, approval
  approvalRequired: boolean("approval_required").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(false),
  
  // Version relationships
  previousVersionId: varchar("previous_version_id"),
  mergedFromVersionIds: text("merged_from_version_ids").array(), // If version was created by merging
  
  // Version lifecycle
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  supersededBy: varchar("superseded_by"),
  
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  supersededAt: timestamp("superseded_at"),
}, (table) => [
  index("idx_document_versions_document_id").on(table.documentId),
  index("idx_document_versions_version").on(table.documentId, table.version),
  foreignKey({
    columns: [table.previousVersionId],
    foreignColumns: [table.id],
    name: "document_versions_previous_fk"
  }),
  foreignKey({
    columns: [table.supersededBy],
    foreignColumns: [table.id],
    name: "document_versions_superseded_fk"
  })
]);

// Document metadata table - Flexible key-value metadata storage
export const documentMetadata = pgTable("document_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  metadataKey: varchar("metadata_key").notNull(),
  metadataValue: text("metadata_value"),
  metadataType: varchar("metadata_type").notNull().default('text'), // text, number, date, boolean, json
  isRequired: boolean("is_required").notNull().default(false),
  isSearchable: boolean("is_searchable").notNull().default(true),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_metadata_document_id").on(table.documentId),
  index("idx_document_metadata_key").on(table.metadataKey),
  index("idx_document_metadata_searchable").on(table.isSearchable),
]);

// Document compliance table - Compliance tracking and monitoring
export const documentCompliance = pgTable("document_compliance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  
  // Compliance requirement details
  requirementType: varchar("requirement_type").notNull(), // regulatory, certification, internal_policy, legal
  requirementName: varchar("requirement_name").notNull(),
  requirementDescription: text("requirement_description"),
  regulatoryBody: varchar("regulatory_body"), // Which organization sets this requirement
  
  // Compliance status and dates
  status: complianceStatusEnum("status").notNull().default('pending_review'),
  complianceDate: timestamp("compliance_date"), // When compliance was achieved
  expiryDate: timestamp("expiry_date"), // When compliance expires
  renewalDate: timestamp("renewal_date"), // When renewal is required
  gracePeriosDate: timestamp("grace_period_date"), // Grace period end date
  
  // Compliance details
  complianceLevel: varchar("compliance_level"), // full, partial, conditional
  certificateNumber: varchar("certificate_number"),
  issuingAuthority: varchar("issuing_authority"),
  validationMethod: varchar("validation_method"), // self_attestation, third_party, audit
  
  // Renewal and alerts
  autoRenewal: boolean("auto_renewal").notNull().default(false),
  reminderDaysBefore: integer("reminder_days_before").default(30),
  lastReminderSent: timestamp("last_reminder_sent"),
  nextReminderDate: timestamp("next_reminder_date"),
  
  // Non-compliance tracking
  nonComplianceReason: text("non_compliance_reason"),
  correctionRequired: boolean("correction_required").notNull().default(false),
  correctionDeadline: timestamp("correction_deadline"),
  correctionActions: text("correction_actions").array(),
  
  // Audit trail
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  lastReviewedBy: varchar("last_reviewed_by").references(() => users.id),
  lastReviewedAt: timestamp("last_reviewed_at"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_compliance_document_id").on(table.documentId),
  index("idx_document_compliance_status").on(table.status),
  index("idx_document_compliance_expiry").on(table.expiryDate),
  index("idx_document_compliance_renewal").on(table.renewalDate),
]);

// Document access logs table - Audit trail for document access and modifications
export const documentAccessLogs = pgTable("document_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  versionId: varchar("version_id").references(() => documentVersions.id),
  
  // Access details
  accessType: varchar("access_type").notNull(), // view, download, edit, delete, share, print
  accessMethod: varchar("access_method"), // web, api, mobile, export
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  sessionId: varchar("session_id"),
  
  // User information
  userId: varchar("user_id").references(() => users.id),
  userName: varchar("user_name"), // Stored for audit purposes even if user is deleted
  userRole: varchar("user_role"),
  
  // Access context
  reason: text("reason"), // Why document was accessed
  businessContext: varchar("business_context"), // approval_process, compliance_check, etc.
  
  // Security information
  wasSuccessful: boolean("was_successful").notNull().default(true),
  failureReason: text("failure_reason"),
  securityAlert: boolean("security_alert").notNull().default(false),
  
  // Timing
  accessedAt: timestamp("accessed_at").notNull().defaultNow(),
  sessionDuration: integer("session_duration"), // How long document was accessed (seconds)
}, (table) => [
  index("idx_document_access_logs_document_id").on(table.documentId),
  index("idx_document_access_logs_user_id").on(table.userId),
  index("idx_document_access_logs_accessed_at").on(table.accessedAt),
  index("idx_document_access_logs_access_type").on(table.accessType),
]);

// Document workflow states table - Track documents through approval workflows
export const documentWorkflowStates = pgTable("document_workflow_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id),
  versionId: varchar("version_id").references(() => documentVersions.id),
  
  // Workflow information
  workflowType: varchar("workflow_type").notNull(), // approval, review, compliance_check
  workflowStage: varchar("workflow_stage").notNull(), // submitted, under_review, approved, rejected
  workflowDefinitionId: varchar("workflow_definition_id"), // Reference to workflow definition
  
  // Assignment and timing
  assignedTo: varchar("assigned_to").references(() => users.id),
  assignedRole: varchar("assigned_role"), // Which role should handle this
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  
  // Workflow state
  isActive: boolean("is_active").notNull().default(true),
  isCompleted: boolean("is_completed").notNull().default(false),
  outcome: varchar("outcome"), // approved, rejected, returned_for_revision
  comments: text("comments"),
  
  // Workflow tracking
  previousStateId: varchar("previous_state_id"),
  nextStateId: varchar("next_state_id"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_workflow_states_document_id").on(table.documentId),
  index("idx_document_workflow_states_assigned_to").on(table.assignedTo),
  index("idx_document_workflow_states_active").on(table.isActive),
  foreignKey({
    columns: [table.previousStateId],
    foreignColumns: [table.id],
    name: "document_workflow_states_previous_fk"
  }),
  foreignKey({
    columns: [table.nextStateId],
    foreignColumns: [table.id],
    name: "document_workflow_states_next_fk"
  })
]);

// ===============================================
// NOTIFICATION AND ALERT SYSTEM TABLES
// ===============================================

// Notification system enums
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'failed', 'read', 'dismissed']);
export const notificationChannelEnum = pgEnum('notification_channel', ['in_app', 'email', 'sms', 'webhook']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'medium', 'high', 'critical']);
export const alertTypeEnum = pgEnum('alert_type', [
  'threshold_alert', 'business_alert', 'system_alert', 'compliance_alert', 
  'financial_alert', 'operational_alert', 'security_alert', 'workflow_alert'
]);
export const alertCategoryEnum = pgEnum('alert_category', [
  'capital_threshold', 'inventory_level', 'purchase_order', 'sales_order', 
  'document_expiry', 'approval_workflow', 'financial_health', 'operational_delay', 
  'compliance_issue', 'market_timing', 'system_health', 'quality_issue', 
  'supplier_issue', 'shipping_delay', 'payment_due', 'currency_fluctuation'
]);
export const notificationFrequencyEnum = pgEnum('notification_frequency', ['immediate', 'daily_digest', 'weekly_summary', 'monthly_report']);

// Notification settings table - User preferences and thresholds
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Channel preferences
  enableInApp: boolean("enable_in_app").notNull().default(true),
  enableEmail: boolean("enable_email").notNull().default(true),
  enableSms: boolean("enable_sms").notNull().default(false),
  enableWebhook: boolean("enable_webhook").notNull().default(false),
  
  // Alert category preferences
  alertCategories: alertCategoryEnum("alert_categories").array().default([]),
  
  // Frequency settings
  defaultFrequency: notificationFrequencyEnum("default_frequency").notNull().default('immediate'),
  digestTime: varchar("digest_time").default('08:00'), // Time for daily digest (HH:mm format)
  weeklyDigestDay: integer("weekly_digest_day").default(1), // 1 = Monday
  monthlyDigestDay: integer("monthly_digest_day").default(1), // Day of month
  
  // Contact information
  emailAddress: varchar("email_address"),
  phoneNumber: varchar("phone_number"),
  webhookUrl: varchar("webhook_url"),
  
  // Threshold configurations (JSON object storing various thresholds)
  thresholds: jsonb("thresholds").default('{}'),
  
  // Escalation settings
  escalationEnabled: boolean("escalation_enabled").notNull().default(false),
  escalationTimeoutMinutes: integer("escalation_timeout_minutes").default(60),
  escalationRecipients: text("escalation_recipients").array().default([]),
  
  // Quiet hours
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(false),
  quietHoursStart: varchar("quiet_hours_start").default('22:00'),
  quietHoursEnd: varchar("quiet_hours_end").default('06:00'),
  quietHoursTimezone: varchar("quiet_hours_timezone").default('UTC'),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_settings_user_id").on(table.userId),
  index("idx_notification_settings_active").on(table.isActive),
]);

// Notification templates table - Email/SMS templates for different alert types
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template identification
  name: varchar("name").notNull(),
  description: text("description"),
  alertType: alertTypeEnum("alert_type").notNull(),
  alertCategory: alertCategoryEnum("alert_category").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  
  // Template content
  subject: varchar("subject"), // For email templates
  bodyTemplate: text("body_template").notNull(), // Template with placeholders like {{amount}}, {{threshold}}
  htmlTemplate: text("html_template"), // HTML version for email
  smsTemplate: text("sms_template"), // SMS version for SMS channel
  
  // Template variables and formatting
  templateVariables: jsonb("template_variables").default('[]'), // Array of variable names used in template
  formatting: jsonb("formatting").default('{}'), // Formatting rules for variables
  
  // Localization
  language: varchar("language").default('en'),
  locale: varchar("locale").default('en_US'),
  
  // Template metadata
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  priority: notificationPriorityEnum("priority").notNull().default('medium'),
  
  // Customization
  customCss: text("custom_css"), // For email HTML styling
  attachmentAllowed: boolean("attachment_allowed").notNull().default(false),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_templates_alert_type").on(table.alertType),
  index("idx_notification_templates_category").on(table.alertCategory),
  index("idx_notification_templates_channel").on(table.channel),
  index("idx_notification_templates_active").on(table.isActive),
  uniqueIndex("idx_notification_templates_unique").on(table.alertType, table.alertCategory, table.channel, table.language),
]);

// Notification queue table - Pending notifications with delivery status
export const notificationQueue = pgTable("notification_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Recipient information
  userId: varchar("user_id").notNull().references(() => users.id),
  recipientEmail: varchar("recipient_email"),
  recipientPhone: varchar("recipient_phone"),
  recipientWebhook: varchar("recipient_webhook"),
  
  // Notification details
  alertType: alertTypeEnum("alert_type").notNull(),
  alertCategory: alertCategoryEnum("alert_category").notNull(),
  priority: notificationPriorityEnum("priority").notNull().default('medium'),
  channel: notificationChannelEnum("channel").notNull(),
  
  // Content
  subject: varchar("subject"),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  htmlContent: text("html_content"),
  
  // Context and linking
  entityType: varchar("entity_type"), // purchase, capital_entry, shipment, etc.
  entityId: varchar("entity_id"), // ID of the related business entity
  actionUrl: varchar("action_url"), // URL for user to take action
  
  // Delivery metadata
  templateId: varchar("template_id").references(() => notificationTemplates.id),
  templateData: jsonb("template_data").default('{}'), // Data used to populate template
  
  // Scheduling and timing
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  frequency: notificationFrequencyEnum("frequency").notNull().default('immediate'),
  
  // Delivery status and tracking
  status: notificationStatusEnum("status").notNull().default('pending'),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  dismissedAt: timestamp("dismissed_at"),
  
  // Retry and error handling
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastAttemptAt: timestamp("last_attempt_at"),
  errorMessage: text("error_message"),
  
  // External system tracking
  externalId: varchar("external_id"), // ID from email service, SMS service, etc.
  deliveryMetadata: jsonb("delivery_metadata").default('{}'),
  
  // Grouping and deduplication
  groupId: varchar("group_id"), // For grouping related notifications
  deduplicationKey: varchar("deduplication_key"), // To prevent duplicate notifications
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_queue_user_id").on(table.userId),
  index("idx_notification_queue_status").on(table.status),
  index("idx_notification_queue_priority").on(table.priority),
  index("idx_notification_queue_scheduled_for").on(table.scheduledFor),
  index("idx_notification_queue_entity").on(table.entityType, table.entityId),
  index("idx_notification_queue_deduplication").on(table.deduplicationKey),
  index("idx_notification_queue_group").on(table.groupId),
]);

// Alert configurations table - Business rule definitions and thresholds
export const alertConfigurations = pgTable("alert_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Configuration identification
  name: varchar("name").notNull(),
  description: text("description"),
  alertType: alertTypeEnum("alert_type").notNull(),
  alertCategory: alertCategoryEnum("alert_category").notNull(),
  
  // Scope and targeting
  isGlobal: boolean("is_global").notNull().default(true), // Applies to all users or specific roles
  targetRoles: userRoleEnum("target_roles").array().default([]),
  targetUsers: text("target_users").array().default([]), // Specific user IDs
  
  // Alert conditions and thresholds
  conditions: jsonb("conditions").notNull(), // Complex condition definitions
  thresholds: jsonb("thresholds").default('{}'), // Numeric thresholds
  
  // Monitoring settings
  monitoringEnabled: boolean("monitoring_enabled").notNull().default(true),
  checkIntervalMinutes: integer("check_interval_minutes").default(60),
  monitoringSchedule: varchar("monitoring_schedule"), // Cron expression for scheduled checks
  
  // Alert behavior
  priority: notificationPriorityEnum("priority").notNull().default('medium'),
  channels: notificationChannelEnum("channels").array().default(['in_app']),
  frequency: notificationFrequencyEnum("frequency").notNull().default('immediate'),
  
  // Escalation rules
  escalationEnabled: boolean("escalation_enabled").notNull().default(false),
  escalationTimeoutMinutes: integer("escalation_timeout_minutes").default(60),
  escalationLevels: jsonb("escalation_levels").default('[]'), // Escalation level definitions
  
  // Deduplication and throttling
  deduplicationEnabled: boolean("deduplication_enabled").notNull().default(true),
  deduplicationWindowMinutes: integer("deduplication_window_minutes").default(60),
  throttlingEnabled: boolean("throttling_enabled").notNull().default(false),
  maxAlertsPerHour: integer("max_alerts_per_hour").default(10),
  
  // Business context
  businessImpact: varchar("business_impact"), // low, medium, high, critical
  slaMinutes: integer("sla_minutes"), // Expected response time
  
  // Configuration metadata
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").notNull().default(0),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_alert_configurations_type").on(table.alertType),
  index("idx_alert_configurations_category").on(table.alertCategory),
  index("idx_alert_configurations_active").on(table.isActive),
  index("idx_alert_configurations_monitoring").on(table.monitoringEnabled),
  index("idx_alert_configurations_global").on(table.isGlobal),
]);

// Notification history table - Audit trail of all sent notifications
export const notificationHistory = pgTable("notification_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Original notification reference
  originalNotificationId: varchar("original_notification_id").references(() => notificationQueue.id),
  
  // Recipient information
  userId: varchar("user_id").notNull().references(() => users.id),
  recipientEmail: varchar("recipient_email"),
  recipientPhone: varchar("recipient_phone"),
  recipientWebhook: varchar("recipient_webhook"),
  
  // Notification details
  alertType: alertTypeEnum("alert_type").notNull(),
  alertCategory: alertCategoryEnum("alert_category").notNull(),
  priority: notificationPriorityEnum("priority").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  
  // Content snapshot
  subject: varchar("subject"),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  
  // Context and linking
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  actionUrl: varchar("action_url"),
  
  // Delivery information
  status: notificationStatusEnum("status").notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  dismissedAt: timestamp("dismissed_at"),
  
  // Delivery attempts and results
  totalAttempts: integer("total_attempts").notNull().default(0),
  finalStatus: varchar("final_status").notNull(), // success, failed, partially_delivered
  errorDetails: text("error_details"),
  
  // External system tracking
  externalId: varchar("external_id"),
  deliveryMetadata: jsonb("delivery_metadata").default('{}'),
  
  // Performance tracking
  processingTimeMs: integer("processing_time_ms"),
  deliveryTimeMs: integer("delivery_time_ms"),
  
  // Configuration snapshot (for audit purposes)
  configurationSnapshot: jsonb("configuration_snapshot").default('{}'),
  templateSnapshot: jsonb("template_snapshot").default('{}'),
  
  // User interaction tracking
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  clickCount: integer("click_count").notNull().default(0),
  lastClickAt: timestamp("last_click_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notification_history_user_id").on(table.userId),
  index("idx_notification_history_alert_type").on(table.alertType),
  index("idx_notification_history_category").on(table.alertCategory),
  index("idx_notification_history_status").on(table.status),
  index("idx_notification_history_sent_at").on(table.sentAt),
  index("idx_notification_history_entity").on(table.entityType, table.entityId),
  index("idx_notification_history_created_at").on(table.createdAt),
]);

// Sales Pipeline Tables

// Customer categories enum
export const customerCategoryEnum = pgEnum('customer_category', ['retail', 'wholesale', 'export', 'domestic', 'distributor', 'processor']);

// Sales order status enum
export const salesOrderStatusEnum = pgEnum('sales_order_status', ['draft', 'confirmed', 'in_progress', 'fulfilled', 'delivered', 'cancelled', 'on_hold']);

// Payment terms enum
export const paymentTermsEnum = pgEnum('payment_terms', ['net_15', 'net_30', 'net_45', 'net_60', 'cash_on_delivery', 'advance_payment', 'credit']);

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerNumber: varchar("customer_number").notNull().unique(),
  name: varchar("name").notNull(),
  tradeName: varchar("trade_name"),
  category: customerCategoryEnum("category").notNull().default('retail'),
  taxId: varchar("tax_id"),
  
  // Contact information
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  contactPerson: varchar("contact_person"),
  contactTitle: varchar("contact_title"),
  
  // Addresses
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country").notNull().default('ETB'),
  postalCode: varchar("postal_code"),
  
  // Business terms
  paymentTerms: paymentTermsEnum("payment_terms").notNull().default('net_30'),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default('0'),
  currentCredit: decimal("current_credit", { precision: 12, scale: 2 }).default('0'),
  currency: varchar("currency").notNull().default('USD'),
  
  // Pricing and discounts
  priceCategory: varchar("price_category").default('standard'), // standard, premium, volume, export
  defaultDiscountPercent: decimal("default_discount_percent", { precision: 5, scale: 2 }).default('0'),
  qualityPremiumPercent: decimal("quality_premium_percent", { precision: 5, scale: 2 }).default('0'),
  
  // Performance tracking
  totalOrdersCount: integer("total_orders_count").default(0),
  totalRevenueUsd: decimal("total_revenue_usd", { precision: 12, scale: 2 }).default('0'),
  averageOrderValueUsd: decimal("average_order_value_usd", { precision: 12, scale: 2 }).default('0'),
  lastOrderDate: timestamp("last_order_date"),
  
  // Status and metadata
  isActive: boolean("is_active").notNull().default(true),
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  notes: text("notes"),
  tags: text("tags").array(),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== APPROVAL WORKFLOW AND AUDIT SYSTEM TABLES =====

// Approval chains table - defines approval processes and thresholds
export const approvalChains = pgTable("approval_chains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationType: approvalOperationTypeEnum("operation_type").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  
  // Thresholds for triggering approval
  minAmount: decimal("min_amount", { precision: 12, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency").default('USD'),
  
  // Approval chain configuration
  requiredRoles: userRoleEnum("required_roles").array().notNull(), // Ordered array of roles
  requiredApprovals: integer("required_approvals").notNull().default(1),
  allowParallelApprovals: boolean("allow_parallel_approvals").notNull().default(false),
  escalationTimeoutHours: integer("escalation_timeout_hours").default(24),
  estimatedTimeHours: decimal("estimated_time_hours", { precision: 5, scale: 2 }),
  
  // Auto-approval rules
  autoApproveBelow: decimal("auto_approve_below", { precision: 12, scale: 2 }),
  autoApproveSameUser: boolean("auto_approve_same_user").notNull().default(false),
  
  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0), // Higher priority chains checked first
  conditions: jsonb("conditions"), // Additional JSON conditions
  
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Approval requests table - tracks individual approval workflows
export const approvalRequests = pgTable("approval_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: varchar("request_number").notNull().unique().$defaultFn(() => `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
  approvalChainId: varchar("approval_chain_id").notNull().references(() => approvalChains.id, { onDelete: 'restrict' }),
  
  // Request details
  operationType: approvalOperationTypeEnum("operation_type").notNull(),
  operationId: varchar("operation_id"), // ID of the operation being approved
  operationData: jsonb("operation_data").notNull(), // Snapshot of operation data
  
  // Financial details
  requestedAmount: decimal("requested_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency").default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }),
  
  // Request metadata
  title: varchar("title").notNull(),
  description: text("description"),
  justification: text("justification"),
  attachments: text("attachments").array(),
  priority: varchar("priority").notNull().default('normal'), // low, normal, high, urgent
  
  // Status and timing - with integrity constraints
  status: approvalStatusEnum("status").notNull().default('pending'),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  requiredBy: timestamp("required_by"), // Deadline for approval
  estimatedTimeHours: decimal("estimated_time_hours", { precision: 5, scale: 2 }),
  completedAt: timestamp("completed_at"),
  escalatedAt: timestamp("escalated_at"),
  
  // User tracking - with proper foreign keys and cascading
  requestedBy: varchar("requested_by").notNull().references(() => users.id, { onDelete: 'restrict' }),
  currentApprover: varchar("current_approver").references(() => users.id, { onDelete: 'set null' }),
  finalApprover: varchar("final_approver").references(() => users.id, { onDelete: 'set null' }),
  
  // Workflow state - with validation constraints
  currentStep: integer("current_step").notNull().default(1),
  totalSteps: integer("total_steps").notNull(),
  approvalHistory: jsonb("approval_history"), // Array of approval steps with timestamps
  rejectionReason: text("rejection_reason"),
  
  // System metadata
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  systemContext: jsonb("system_context"), // Additional system context
  
  // SECURITY: Single-use consumption tracking to prevent replay attacks
  consumedAt: timestamp("consumed_at"), // When approval was consumed/executed
  consumedBy: varchar("consumed_by").references(() => users.id, { onDelete: 'set null' }), // Who executed the approved operation
  consumedOperationId: varchar("consumed_operation_id"), // ID of the operation that consumed this approval
  consumedOperationType: approvalOperationTypeEnum("consumed_operation_type"), // Type verification
  consumedAmount: decimal("consumed_amount", { precision: 12, scale: 2 }), // Amount verification
  consumedCurrency: varchar("consumed_currency"), // Currency verification
  consumedEntityId: varchar("consumed_entity_id"), // Entity ID verification (customer, supplier, etc.)
  operationChecksum: varchar("operation_checksum"), // Checksum of operation data to prevent tampering
  
  // SECURITY: Prevent reuse and ensure single-use consumption
  isConsumed: boolean("is_consumed").notNull().default(false),
  consumptionAttempts: integer("consumption_attempts").notNull().default(0), // Track consumption attempts
  maxConsumptions: integer("max_consumptions").notNull().default(1), // Usually 1 for single-use
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for approval queries
  index("idx_approval_requests_status_approver").on(table.status, table.currentApprover),
  index("idx_approval_requests_requested_by").on(table.requestedBy),
  index("idx_approval_requests_submitted_at").on(table.submittedAt),
  index("idx_approval_requests_operation_type").on(table.operationType),
  index("idx_approval_requests_chain_status").on(table.approvalChainId, table.status),
  index("idx_approval_requests_priority_status").on(table.priority, table.status),
  index("idx_approval_requests_amount_currency").on(table.amountUsd, table.currency),
  // SECURITY: Indexes for consumption tracking and validation
  index("idx_approval_requests_consumption").on(table.isConsumed, table.consumedAt),
  index("idx_approval_requests_operation_validation").on(table.operationType, table.requestedAmount, table.currency),
  index("idx_approval_requests_requester_type").on(table.requestedBy, table.operationType),
  
  // CRITICAL SECURITY: Unique constraint to prevent double consumption
  // This ensures that only one operation can consume an approval (atomic single-use)
  // The partial unique index ensures only unconsumed approvals (isConsumed = false) are unique
  uniqueIndex("unique_approval_request_unconsumed").on(table.id).where(sql`${table.isConsumed} = false`),
]);

// Audit logs table - immutable audit trail for all operations
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Operation details
  action: auditActionEnum("action").notNull(),
  entityType: varchar("entity_type").notNull(), // Table/resource name
  entityId: varchar("entity_id"), // Primary key of affected entity
  operationType: approvalOperationTypeEnum("operation_type"),
  
  // Change tracking
  oldValues: jsonb("old_values"), // Before state
  newValues: jsonb("new_values"), // After state  
  changedFields: text("changed_fields").array(), // List of modified fields
  
  // Context and metadata
  description: text("description").notNull(),
  businessContext: text("business_context"), // Business meaning of the action
  correlationId: varchar("correlation_id"), // Group related actions
  sessionId: varchar("session_id"),
  
  // Financial impact tracking
  financialImpact: decimal("financial_impact", { precision: 12, scale: 2 }),
  currency: varchar("currency").default('USD'),
  
  // User and system info
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  userName: varchar("user_name"),
  userRole: userRoleEnum("user_role"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  // Approval context
  approvalRequestId: varchar("approval_request_id").references(() => approvalRequests.id, { onDelete: 'set null' }),
  approvalStatus: approvalStatusEnum("approval_status"),
  approverComments: text("approver_comments"),
  
  // System metadata
  source: varchar("source").notNull().default('system'), // system, api, ui, import
  severity: varchar("severity").notNull().default('info'), // info, warning, error, critical
  
  // Immutable timestamp - APPEND-ONLY: No updatedAt column to enforce immutability
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  // Data integrity - Required for tamper detection
  checksum: varchar("checksum").notNull(), // Data integrity verification
}, (table) => [
  // Performance indexes for audit log queries
  index("idx_audit_logs_entity_timestamp").on(table.entityId, table.timestamp),
  index("idx_audit_logs_user_timestamp").on(table.userId, table.timestamp),
  index("idx_audit_logs_timestamp").on(table.timestamp),
  index("idx_audit_logs_entity_type_id").on(table.entityType, table.entityId),
  index("idx_audit_logs_approval_request").on(table.approvalRequestId),
  index("idx_audit_logs_correlation_id").on(table.correlationId),
  index("idx_audit_logs_session_id").on(table.sessionId),
]);

// Permission grants table - temporary and context-specific permissions
export const permissionGrants = pgTable("permission_grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Permission details
  userId: varchar("user_id").notNull().references(() => users.id),
  permission: varchar("permission").notNull(), // Permission identifier
  scope: permissionScopeEnum("scope").notNull(),
  resourceType: varchar("resource_type"), // What resource type this applies to
  resourceId: varchar("resource_id"), // Specific resource ID (optional)
  
  // Context restrictions
  operationType: approvalOperationTypeEnum("operation_type"),
  conditions: jsonb("conditions"), // Additional JSON conditions
  
  // Value-based restrictions
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency").default('USD'),
  
  // Time-based restrictions
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  maxUsageCount: integer("max_usage_count"), // Limit number of uses
  currentUsageCount: integer("current_usage_count").notNull().default(0),
  
  // Grant metadata
  reason: text("reason").notNull(),
  grantedBy: varchar("granted_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isTemporary: boolean("is_temporary").notNull().default(true),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id),
  revocationReason: text("revocation_reason"),
  
  // Audit trail
  lastUsedAt: timestamp("last_used_at"),
  usageLog: jsonb("usage_log"), // Array of usage records
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales orders table
export const salesOrders = pgTable("sales_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesOrderNumber: varchar("sales_order_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  orderId: varchar("order_id").references(() => orders.id), // Link to internal order for fulfillment
  
  // Order details
  status: salesOrderStatusEnum("status").notNull().default('draft'),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  requestedDeliveryDate: timestamp("requested_delivery_date"),
  confirmedDeliveryDate: timestamp("confirmed_delivery_date"),
  
  // Pricing and currency
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  subtotalAmount: decimal("subtotal_amount", { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  shippingAmount: decimal("shipping_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmountUsd: decimal("total_amount_usd", { precision: 12, scale: 2 }).notNull(),
  
  // Payment tracking
  paymentTerms: paymentTermsEnum("payment_terms").notNull().default('net_30'),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default('0'),
  balanceDue: decimal("balance_due", { precision: 12, scale: 2 }).notNull(),
  
  // Shipping information
  shippingAddress: text("shipping_address"),
  shippingMethod: varchar("shipping_method"),
  trackingNumber: varchar("tracking_number"),
  
  // Sales tracking
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default('0'),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }).default('0'),
  
  // Status tracking
  confirmedAt: timestamp("confirmed_at"),
  fulfilledAt: timestamp("fulfilled_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  
  // Metadata
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  reference: varchar("reference"), // Customer's PO number
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales order items table
export const salesOrderItems = pgTable("sales_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesOrderId: varchar("sales_order_id").notNull().references(() => salesOrders.id),
  warehouseStockId: varchar("warehouse_stock_id").references(() => warehouseStock.id),
  
  // Product details
  productDescription: text("product_description").notNull(),
  qualityGrade: qualityGradeEnum("quality_grade"),
  origin: varchar("origin"),
  processingType: varchar("processing_type"),
  
  // Quantity and pricing
  quantityKg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(),
  unitPriceUsd: decimal("unit_price_usd", { precision: 10, scale: 4 }).notNull(),
  unitPriceLocal: decimal("unit_price_local", { precision: 10, scale: 4 }),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
  lineTotalUsd: decimal("line_total_usd", { precision: 12, scale: 2 }).notNull(),
  
  // Cost tracking for margin analysis
  unitCostUsd: decimal("unit_cost_usd", { precision: 10, scale: 4 }),
  totalCostUsd: decimal("total_cost_usd", { precision: 12, scale: 2 }),
  marginAmount: decimal("margin_amount", { precision: 12, scale: 2 }),
  marginPercent: decimal("margin_percent", { precision: 5, scale: 2 }),
  
  // Fulfillment tracking
  quantityReserved: decimal("quantity_reserved", { precision: 10, scale: 2 }).default('0'),
  quantityFulfilled: decimal("quantity_fulfilled", { precision: 10, scale: 2 }).default('0'),
  quantityDelivered: decimal("quantity_delivered", { precision: 10, scale: 2 }).default('0'),
  
  // Quality and packaging
  packagingType: varchar("packaging_type"), // bags, containers, bulk
  packagingCount: integer("packaging_count"),
  qualitySpecs: jsonb("quality_specs"), // Detailed quality requirements
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales returns table - Stage 6 compliance (storage-backed return processing)
export const salesReturns = pgTable("sales_returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnNumber: varchar("return_number").notNull().unique(),
  
  // Return source tracking
  originalSalesOrderId: varchar("original_sales_order_id").notNull().references(() => salesOrders.id),
  originalSalesOrderItemId: varchar("original_sales_order_item_id").references(() => salesOrderItems.id),
  
  // Return details
  quantityReturned: decimal("quantity_returned", { precision: 10, scale: 2 }).notNull(),
  returnReason: varchar("return_reason").notNull(), // quality_issue, damaged, incorrect_order, customer_request
  returnCondition: varchar("return_condition").notNull(), // clean, non_clean, damaged
  
  // Warehouse compliance - enforce same warehouse return rule per workflow_reference.json
  returnToWarehouse: varchar("return_to_warehouse").notNull(),
  warehouseStockId: varchar("warehouse_stock_id").references(() => warehouseStock.id),
  
  // Financial impact
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }),
  restockingFee: decimal("restocking_fee", { precision: 12, scale: 2 }).default('0'),
  
  // Status and processing
  status: varchar("status").notNull().default('pending'), // pending, approved, processed, rejected
  processedAt: timestamp("processed_at"),
  
  // Approval tracking
  isApproved: boolean("is_approved").notNull().default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Audit trail
  returnedBy: varchar("returned_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer communications table
export const customerCommunications = pgTable("customer_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  
  // Communication details
  type: varchar("type").notNull(), // email, phone, meeting, note, quote, proposal
  subject: varchar("subject"),
  content: text("content").notNull(),
  direction: varchar("direction").notNull(), // inbound, outbound
  
  // Contact information
  contactPerson: varchar("contact_person"),
  contactMethod: varchar("contact_method"), // email, phone, in_person, video_call
  
  // Status and follow-up
  priority: varchar("priority").default('normal'), // low, normal, high, urgent
  status: varchar("status").default('completed'), // pending, completed, follow_up_required
  followUpDate: timestamp("follow_up_date"),
  followUpNotes: text("follow_up_notes"),
  
  // Attachments and references
  attachments: text("attachments").array(),
  relatedDocuments: text("related_documents").array(),
  
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue transactions table
export const revenueTransactions = pgTable("revenue_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionNumber: varchar("transaction_number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  
  // Transaction details
  type: varchar("type").notNull(), // sale, payment, refund, adjustment, write_off
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  
  // Payment details
  paymentMethod: varchar("payment_method"), // cash, bank_transfer, credit_card, check, trade_credit
  paymentReference: varchar("payment_reference"), // Check number, transfer reference, etc.
  bankAccount: varchar("bank_account"),
  
  // Revenue recognition
  recognitionDate: timestamp("recognition_date").notNull().defaultNow(),
  accountingPeriod: varchar("accounting_period"),
  revenueCategory: varchar("revenue_category"), // product_sales, shipping, handling, other
  
  // Cost of goods sold tracking
  cogs: decimal("cogs", { precision: 12, scale: 2 }),
  grossMargin: decimal("gross_margin", { precision: 12, scale: 2 }),
  grossMarginPercent: decimal("gross_margin_percent", { precision: 5, scale: 2 }),
  
  // Status and approvals
  status: varchar("status").notNull().default('pending'), // pending, confirmed, cancelled, reversed
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Metadata
  notes: text("notes"),
  description: text("description"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for revenue transaction aggregations  
  index("idx_revenue_transactions_type").on(table.type),
  index("idx_revenue_transactions_created_at").on(table.createdAt),
  index("idx_revenue_transactions_type_created").on(table.type, table.createdAt),
  index("idx_revenue_transactions_customer").on(table.customerId),
  index("idx_revenue_transactions_transaction_type").on(table.type),
  index("idx_revenue_transactions_recognition_date").on(table.recognitionDate),
]);

// Sales performance metrics table
export const salesPerformanceMetrics = pgTable("sales_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Period and scope
  periodType: varchar("period_type").notNull(), // daily, weekly, monthly, quarterly, yearly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  customerId: varchar("customer_id").references(() => customers.id),
  customerCategory: customerCategoryEnum("customer_category"),
  
  // Sales metrics
  ordersCount: integer("orders_count").default(0),
  totalRevenueUsd: decimal("total_revenue_usd", { precision: 12, scale: 2 }).default('0'),
  totalCostUsd: decimal("total_cost_usd", { precision: 12, scale: 2 }).default('0'),
  grossMarginUsd: decimal("gross_margin_usd", { precision: 12, scale: 2 }).default('0'),
  grossMarginPercent: decimal("gross_margin_percent", { precision: 5, scale: 2 }).default('0'),
  
  // Volume metrics
  totalQuantityKg: decimal("total_quantity_kg", { precision: 10, scale: 2 }).default('0'),
  averageOrderValueUsd: decimal("average_order_value_usd", { precision: 12, scale: 2 }).default('0'),
  averagePricePerKg: decimal("average_price_per_kg", { precision: 10, scale: 4 }).default('0'),
  
  // Performance indicators
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default('0'), // quotes to orders
  customerRetentionRate: decimal("customer_retention_rate", { precision: 5, scale: 2 }).default('0'),
  averageOrderCycle: integer("average_order_cycle").default(0), // Days from order to delivery
  
  // Commission tracking
  commissionEarned: decimal("commission_earned", { precision: 12, scale: 2 }).default('0'),
  commissionPaid: decimal("commission_paid", { precision: 12, scale: 2 }).default('0'),
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer credit limits table
export const customerCreditLimits = pgTable("customer_credit_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  
  // Credit limit details
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default('0'),
  availableCredit: decimal("available_credit", { precision: 12, scale: 2 }).notNull(),
  
  // Risk assessment
  creditRating: varchar("credit_rating"), // AAA, AA, A, BBB, BB, B, CCC, CC, C, D
  riskCategory: varchar("risk_category"), // low, medium, high, restricted
  paymentHistory: jsonb("payment_history"), // Historical payment performance
  
  // Terms and conditions
  paymentTerms: paymentTermsEnum("payment_terms").notNull().default('net_30'),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default('0'),
  lateFeePercent: decimal("late_fee_percent", { precision: 5, scale: 2 }).default('0'),
  
  // Review and approval
  approvedBy: varchar("approved_by").notNull().references(() => users.id),
  reviewDate: timestamp("review_date").notNull(),
  nextReviewDate: timestamp("next_review_date"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing rules table
export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Rule identification
  ruleName: varchar("rule_name").notNull(),
  ruleType: varchar("rule_type").notNull(), // base_price, category_discount, volume_discount, quality_premium, seasonal_adjustment
  priority: integer("priority").default(0), // Higher numbers = higher priority
  
  // Conditions
  customerCategory: customerCategoryEnum("customer_category"),
  qualityGrade: qualityGradeEnum("quality_grade"),
  minQuantityKg: decimal("min_quantity_kg", { precision: 10, scale: 2 }),
  maxQuantityKg: decimal("max_quantity_kg", { precision: 10, scale: 2 }),
  minOrderValue: decimal("min_order_value", { precision: 12, scale: 2 }),
  maxOrderValue: decimal("max_order_value", { precision: 12, scale: 2 }),
  
  // Pricing adjustments
  basePriceUsd: decimal("base_price_usd", { precision: 10, scale: 4 }),
  adjustmentType: varchar("adjustment_type").notNull(), // fixed_amount, percentage, multiplier
  adjustmentValue: decimal("adjustment_value", { precision: 10, scale: 4 }).notNull(),
  
  // Validity
  effectiveDate: timestamp("effective_date").notNull().defaultNow(),
  expirationDate: timestamp("expiration_date"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Metadata
  description: text("description"),
  conditions: jsonb("conditions"), // Complex rule conditions
  
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== STAGE 7 REVENUE MANAGEMENT TABLES =====

// Revenue ledger table - central ledger for all revenue-related transactions
export const revenueLedger = pgTable("revenue_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  revEntryId: varchar("rev_entry_id").notNull().unique(),
  
  // Entry details
  date: timestamp("date").notNull().defaultNow(),
  type: revenueEntryTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  
  // Currency handling with historical FX
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  
  // References to source transactions
  customerId: varchar("customer_id").references(() => customers.id),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  invoiceId: varchar("invoice_id"), // External invoice reference
  receiptId: varchar("receipt_id"), // External receipt reference
  returnId: varchar("return_id"), // External return reference
  withdrawalId: varchar("withdrawal_id").references(() => withdrawalRecords.id),
  reinvestmentId: varchar("reinvestment_id").references(() => reinvestments.id),
  
  // Business context
  description: text("description").notNull(),
  note: text("note"),
  orderIds: text("order_ids").array(), // For per-order analysis
  
  // Accounting period tracking
  accountingPeriod: varchar("accounting_period").notNull(),
  periodClosed: boolean("period_closed").notNull().default(false),
  
  // Audit fields
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_revenue_ledger_date").on(table.date),
  index("idx_revenue_ledger_type").on(table.type),
  index("idx_revenue_ledger_customer").on(table.customerId),
  index("idx_revenue_ledger_period").on(table.accountingPeriod),
  index("idx_revenue_ledger_withdrawal").on(table.withdrawalId),
  index("idx_revenue_ledger_reinvestment").on(table.reinvestmentId),
  // Performance indexes for aggregation queries
  index("idx_revenue_ledger_type_date").on(table.type, table.date),
  index("idx_revenue_ledger_created_at").on(table.createdAt),
]);

// Withdrawal records table - partner withdrawals from revenue balance
export const withdrawalRecords = pgTable("withdrawal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  withdrawalId: varchar("withdrawal_id").notNull().unique(),
  
  // Withdrawal details
  partner: varchar("partner").notNull(), // Partner/owner name
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 2 }).notNull(),
  
  // Withdrawal metadata
  date: timestamp("date").notNull().defaultNow(),
  note: text("note"),
  paymentMethod: varchar("payment_method"), // bank_transfer, cash, check
  bankAccount: varchar("bank_account"),
  reference: varchar("reference"), // Bank reference or check number
  
  // Approval tracking
  approvalRequestId: varchar("approval_request_id").references(() => approvalRequests.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Status
  status: varchar("status").notNull().default('pending'), // pending, completed, cancelled
  completedAt: timestamp("completed_at"),
  
  // Audit fields
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_withdrawal_records_date").on(table.date),
  index("idx_withdrawal_records_partner").on(table.partner),
  index("idx_withdrawal_records_status").on(table.status),
  index("idx_withdrawal_records_approval").on(table.approvalRequestId),
]);

// Reinvestments table - transferring revenue balance to working capital
export const reinvestments = pgTable("reinvestments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reinvestId: varchar("reinvest_id").notNull().unique(),
  
  // Transfer details
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Amount to transfer to capital
  transferCost: decimal("transfer_cost", { precision: 12, scale: 2 }).notNull().default('0'), // Bank/wire/spread fees
  
  // Fee currency handling
  feeCurrency: varchar("fee_currency").notNull().default('USD'),
  feeExchangeRate: decimal("fee_exchange_rate", { precision: 10, scale: 4 }),
  transferCostUsd: decimal("transfer_cost_usd", { precision: 12, scale: 2 }).notNull(),
  
  // Transfer metadata
  date: timestamp("date").notNull().defaultNow(),
  note: text("note"),
  counterparty: varchar("counterparty"), // Bank/internal entry
  bankReference: varchar("bank_reference"),
  
  // Allocation policy
  allocationPolicy: reinvestmentAllocationPolicyEnum("allocation_policy").notNull().default('aggregate'),
  allocatedOrderIds: text("allocated_order_ids").array(), // For pro-rata or specified allocation
  allocationDetails: jsonb("allocation_details"), // Detailed allocation breakdown
  
  // Generated entries tracking
  capitalEntryId: varchar("capital_entry_id").references(() => capitalEntries.id), // Link to generated capital entry
  operatingExpenseId: varchar("operating_expense_id").references(() => operatingExpenses.id), // Link to transfer fee expense
  
  // Approval tracking
  approvalRequestId: varchar("approval_request_id").references(() => approvalRequests.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Status
  status: varchar("status").notNull().default('pending'), // pending, completed, cancelled
  completedAt: timestamp("completed_at"),
  
  // Audit fields
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reinvestments_date").on(table.date),
  index("idx_reinvestments_status").on(table.status),
  index("idx_reinvestments_policy").on(table.allocationPolicy),
  index("idx_reinvestments_capital").on(table.capitalEntryId),
  index("idx_reinvestments_approval").on(table.approvalRequestId),
]);

// Revenue balance summary table - computed balance for quick access
export const revenueBalanceSummary = pgTable("revenue_balance_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Period details
  accountingPeriod: varchar("accounting_period").notNull().unique(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Revenue totals (accounting view)
  totalCustomerReceipts: decimal("total_customer_receipts", { precision: 12, scale: 2 }).notNull().default('0'),
  totalCustomerRefunds: decimal("total_customer_refunds", { precision: 12, scale: 2 }).notNull().default('0'),
  netAccountingRevenue: decimal("net_accounting_revenue", { precision: 12, scale: 2 }).notNull().default('0'),
  
  // Withdrawable balance (cash view)
  totalWithdrawals: decimal("total_withdrawals", { precision: 12, scale: 2 }).notNull().default('0'),
  totalReinvestments: decimal("total_reinvestments", { precision: 12, scale: 2 }).notNull().default('0'),
  totalTransferFees: decimal("total_transfer_fees", { precision: 12, scale: 2 }).notNull().default('0'),
  withdrawableBalance: decimal("withdrawable_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  
  // Currency breakdown
  balanceBreakdown: jsonb("balance_breakdown"), // By currency analysis
  
  // Status and metadata
  isLocked: boolean("is_locked").notNull().default(false),
  lastCalculatedAt: timestamp("last_calculated_at").notNull().defaultNow(),
  calculatedBy: varchar("calculated_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_revenue_balance_period").on(table.accountingPeriod),
  index("idx_revenue_balance_dates").on(table.periodStart, table.periodEnd),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  capitalEntries: many(capitalEntries),
  purchases: many(purchases),
  filterRecords: many(filterRecords),
  customers: many(customers),
  salesOrders: many(salesOrders),
  customerCommunications: many(customerCommunications),
  revenueTransactions: many(revenueTransactions),
  pricingRules: many(pricingRules),
}));

// Sales Pipeline Relations
export const customersRelations = relations(customers, ({ one, many }) => ({
  salesRep: one(users, {
    fields: [customers.salesRepId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [customers.createdBy],
    references: [users.id],
  }),
  salesOrders: many(salesOrders),
  communications: many(customerCommunications),
  revenueTransactions: many(revenueTransactions),
  performanceMetrics: many(salesPerformanceMetrics),
  creditLimits: many(customerCreditLimits),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [salesOrders.orderId],
    references: [orders.id],
  }),
  salesRep: one(users, {
    fields: [salesOrders.salesRepId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [salesOrders.createdBy],
    references: [users.id],
  }),
  items: many(salesOrderItems),
  communications: many(customerCommunications),
  revenueTransactions: many(revenueTransactions),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.salesOrderId],
    references: [salesOrders.id],
  }),
  warehouseStock: one(warehouseStock, {
    fields: [salesOrderItems.warehouseStockId],
    references: [warehouseStock.id],
  }),
}));

export const salesReturnsRelations = relations(salesReturns, ({ one }) => ({
  originalSalesOrder: one(salesOrders, {
    fields: [salesReturns.originalSalesOrderId],
    references: [salesOrders.id],
  }),
  originalSalesOrderItem: one(salesOrderItems, {
    fields: [salesReturns.originalSalesOrderItemId],
    references: [salesOrderItems.id],
  }),
  warehouseStock: one(warehouseStock, {
    fields: [salesReturns.warehouseStockId],
    references: [warehouseStock.id],
  }),
  returnedBy: one(users, {
    fields: [salesReturns.returnedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [salesReturns.approvedBy],
    references: [users.id],
  }),
}));

export const customerCommunicationsRelations = relations(customerCommunications, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCommunications.customerId],
    references: [customers.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [customerCommunications.salesOrderId],
    references: [salesOrders.id],
  }),
  createdBy: one(users, {
    fields: [customerCommunications.createdBy],
    references: [users.id],
  }),
}));

export const revenueTransactionsRelations = relations(revenueTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [revenueTransactions.customerId],
    references: [customers.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [revenueTransactions.salesOrderId],
    references: [salesOrders.id],
  }),
  createdBy: one(users, {
    fields: [revenueTransactions.createdBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [revenueTransactions.approvedBy],
    references: [users.id],
  }),
}));

export const salesPerformanceMetricsRelations = relations(salesPerformanceMetrics, ({ one }) => ({
  salesRep: one(users, {
    fields: [salesPerformanceMetrics.salesRepId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [salesPerformanceMetrics.customerId],
    references: [customers.id],
  }),
}));

export const customerCreditLimitsRelations = relations(customerCreditLimits, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCreditLimits.customerId],
    references: [customers.id],
  }),
  approvedBy: one(users, {
    fields: [customerCreditLimits.approvedBy],
    references: [users.id],
  }),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  createdBy: one(users, {
    fields: [pricingRules.createdBy],
    references: [users.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
  warehouseStock: many(warehouseStock),
  qualityAssessments: many(supplierQualityAssessments),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  purchases: many(purchases),
  warehouseStock: many(warehouseStock),
  shipments: many(shipments),
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
  shipmentItems: many(shipmentItems),
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

export const capitalEntriesRelations = relations(capitalEntries, ({ one }) => ({
  createdBy: one(users, {
    fields: [capitalEntries.createdBy],
    references: [users.id],
  }),
}));

// Shipping relations
export const carriersRelations = relations(carriers, ({ many }) => ({
  shipments: many(shipments),
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
  shipmentItems: many(shipmentItems),
  shippingCosts: many(shippingCosts),
  deliveryTracking: many(deliveryTracking),
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

export const shippingCostsRelations = relations(shippingCosts, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shippingCosts.shipmentId],
    references: [shipments.id],
  }),
  createdBy: one(users, {
    fields: [shippingCosts.createdBy],
    references: [users.id],
  }),
}));

export const deliveryTrackingRelations = relations(deliveryTracking, ({ one }) => ({
  shipment: one(shipments, {
    fields: [deliveryTracking.shipmentId],
    references: [shipments.id],
  }),
  createdBy: one(users, {
    fields: [deliveryTracking.createdBy],
    references: [users.id],
  }),
}));

// Advanced warehouse relations
export const warehouseBatchesRelations = relations(warehouseBatches, ({ one, many }) => ({
  purchase: one(purchases, {
    fields: [warehouseBatches.purchaseId],
    references: [purchases.id],
  }),
  order: one(orders, {
    fields: [warehouseBatches.orderId],
    references: [orders.id],
  }),
  supplier: one(suppliers, {
    fields: [warehouseBatches.supplierId],
    references: [suppliers.id],
  }),
  createdBy: one(users, {
    fields: [warehouseBatches.createdBy],
    references: [users.id],
  }),
  warehouseStock: many(warehouseStock),
  qualityInspections: many(qualityInspections),
  inventoryConsumption: many(inventoryConsumption),
  processingOperations: many(processingOperations),
  transfersFrom: many(stockTransfers, {
    relationName: "batchTransfersFrom"
  }),
  transfersTo: many(stockTransfers, {
    relationName: "batchTransfersTo"
  }),
  inventoryAdjustments: many(inventoryAdjustments),
}));

export const qualityInspectionsRelations = relations(qualityInspections, ({ one, many }) => ({
  batch: one(warehouseBatches, {
    fields: [qualityInspections.batchId],
    references: [warehouseBatches.id],
  }),
  purchase: one(purchases, {
    fields: [qualityInspections.purchaseId],
    references: [purchases.id],
  }),
  warehouseStock: one(warehouseStock, {
    fields: [qualityInspections.warehouseStockId],
    references: [warehouseStock.id],
  }),
  inspectedBy: one(users, {
    fields: [qualityInspections.inspectedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [qualityInspections.approvedBy],
    references: [users.id],
  }),
  warehouseStockInspections: many(warehouseStock, {
    relationName: "lastInspectionRelation"
  }),
}));

export const inventoryConsumptionRelations = relations(inventoryConsumption, ({ one }) => ({
  warehouseStock: one(warehouseStock, {
    fields: [inventoryConsumption.warehouseStockId],
    references: [warehouseStock.id],
  }),
  batch: one(warehouseBatches, {
    fields: [inventoryConsumption.batchId],
    references: [warehouseBatches.id],
  }),
  order: one(orders, {
    fields: [inventoryConsumption.orderId],
    references: [orders.id],
  }),
  consumedBy: one(users, {
    fields: [inventoryConsumption.consumedBy],
    references: [users.id],
  }),
}));

export const processingOperationsRelations = relations(processingOperations, ({ one }) => ({
  batch: one(warehouseBatches, {
    fields: [processingOperations.batchId],
    references: [warehouseBatches.id],
  }),
  operator: one(users, {
    fields: [processingOperations.operatorId],
    references: [users.id],
  }),
  supervisor: one(users, {
    fields: [processingOperations.supervisorId],
    references: [users.id],
  }),
}));

export const stockTransfersRelations = relations(stockTransfers, ({ one }) => ({
  fromWarehouseStock: one(warehouseStock, {
    fields: [stockTransfers.fromWarehouseStockId],
    references: [warehouseStock.id],
    relationName: "transfersFrom"
  }),
  toWarehouseStock: one(warehouseStock, {
    fields: [stockTransfers.toWarehouseStockId],
    references: [warehouseStock.id],
    relationName: "transfersTo"
  }),
  fromBatch: one(warehouseBatches, {
    fields: [stockTransfers.fromBatchId],
    references: [warehouseBatches.id],
    relationName: "batchTransfersFrom"
  }),
  toBatch: one(warehouseBatches, {
    fields: [stockTransfers.toBatchId],
    references: [warehouseBatches.id],
    relationName: "batchTransfersTo"
  }),
  authorizedBy: one(users, {
    fields: [stockTransfers.authorizedBy],
    references: [users.id],
  }),
  executedBy: one(users, {
    fields: [stockTransfers.executedBy],
    references: [users.id],
  }),
}));

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one }) => ({
  warehouseStock: one(warehouseStock, {
    fields: [inventoryAdjustments.warehouseStockId],
    references: [warehouseStock.id],
  }),
  batch: one(warehouseBatches, {
    fields: [inventoryAdjustments.batchId],
    references: [warehouseBatches.id],
  }),
  createdBy: one(users, {
    fields: [inventoryAdjustments.createdBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [inventoryAdjustments.approvedBy],
    references: [users.id],
  }),
}));

// ===== APPROVAL WORKFLOW AND AUDIT SYSTEM RELATIONS =====

export const approvalChainsRelations = relations(approvalChains, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [approvalChains.createdBy],
    references: [users.id],
  }),
  approvalRequests: many(approvalRequests),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  approvalChain: one(approvalChains, {
    fields: [approvalRequests.approvalChainId],
    references: [approvalChains.id],
  }),
  requestedBy: one(users, {
    fields: [approvalRequests.requestedBy],
    references: [users.id],
  }),
  currentApprover: one(users, {
    fields: [approvalRequests.currentApprover],
    references: [users.id],
  }),
  finalApprover: one(users, {
    fields: [approvalRequests.finalApprover],
    references: [users.id],
  }),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  approvalRequest: one(approvalRequests, {
    fields: [auditLogs.approvalRequestId],
    references: [approvalRequests.id],
  }),
}));

export const permissionGrantsRelations = relations(permissionGrants, ({ one }) => ({
  user: one(users, {
    fields: [permissionGrants.userId],
    references: [users.id],
  }),
  grantedBy: one(users, {
    fields: [permissionGrants.grantedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [permissionGrants.approvedBy],
    references: [users.id],
  }),
  revokedBy: one(users, {
    fields: [permissionGrants.revokedBy],
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

// Stage 1 Compliance: Purchases use central FX only - no client exchangeRate accepted
export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchaseNumber: true,
  exchangeRate: true, // Stage 1 Compliance: No client-provided exchange rates
  createdAt: true,
  updatedAt: true,
});

// Purchase payment schema for multiple payments per purchase
export const insertPurchasePaymentSchema = createInsertSchema(purchasePayments).omit({
  id: true,
  paymentNumber: true,
  exchangeRate: true, // Stage 1 Compliance: No client-provided exchange rates
  createdAt: true,
});

export const insertCapitalEntrySchema = createInsertSchema(capitalEntries).omit({
  id: true,
  entryId: true, // Stage 1 Compliance: Server-generated CAP- prefixed IDs only
  exchangeRate: true, // Stage 1 Compliance: No client-provided exchange rates
  createdAt: true,
});

// Stage 1: Multi-order capital entry schema for enhancement features
export const multiOrderCapitalEntrySchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  exchangeRate: z.number().positive().optional(),
  description: z.string().min(1),
  fundingSource: z.enum(['external', 'reinvestment']),
  orderAllocations: z.array(z.object({
    orderId: z.string().min(1),
    amount: z.number().positive(),
    description: z.string().optional(),
  })).min(1),
});

// Stage 2: Supplier enhancement schemas
export const supplierQualityAssessmentSchema = z.object({
  supplierId: z.string().min(1),
  qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']),
  qualityScore: z.number().min(0).max(5), // Align with service threshold logic
  assessmentDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : new Date()),
  assessmentCriteria: z.object({
    consistency: z.number().min(0).max(5),
    defectRate: z.number().min(0).max(5),
    deliveryTimeliness: z.number().min(0).max(5),
    packaging: z.number().min(0).max(5),
    overall: z.number().min(0).max(5),
  }),
  assessedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const purchaseReturnSchema = z.object({
  originalPurchaseId: z.string().min(1),
  returnQuantityKg: z.number().positive(),
  returnAmountUsd: z.number().positive(),
  returnReason: z.enum(['quality_defect', 'delivery_delay', 'specification_mismatch', 'damage', 'other']),
  returnDate: z.string().datetime().transform(d => new Date(d)),
  approvedBy: z.string().min(1),
  refundMethod: z.enum(['credit_balance', 'capital_refund', 'advance_credit']),
  qualityIssues: z.array(z.string()).optional(),
  notes: z.string().optional(),
}).strict();

// Stage 2: Advance lifecycle schemas
export const supplierAdvanceIssueSchema = z.object({
  supplierId: z.string().min(1),
  amountUsd: z.number().positive(),
  issuedDate: z.string().datetime().transform(d => new Date(d)),
  notes: z.string().optional(),
  fundingSource: z.enum(['capital', 'external']).default('external'),
}).strict();

export const supplierAdvanceConsumeSchema = z.object({
  supplierId: z.string().min(1),
  amountUsd: z.number().positive(),
  consumedDate: z.string().datetime().transform(d => new Date(d)),
  referencePurchaseId: z.string().optional(),
  notes: z.string().optional(),
}).strict();

// Stage 3: Warehouse enhancement schemas  
export const filteringDelayThresholdSchema = z.object({
  thresholdDays: z.number().positive().default(7),
  priorityLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const costRedistributionValidationSchema = z.object({
  orderId: z.string().min(1),
  inputQuantityKg: z.number().positive(),
  cleanOutputKg: z.number().positive(), 
  nonCleanOutputKg: z.number().positive(),
  validateCostCalculation: z.boolean().default(true),
});

// Stage 3: Warehouse cost validation request schemas
export const warehouseCostValidationSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
}).strict();

export const warehouseCostCorrectionSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
}).strict();

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

// Shipping insert schemas
export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  shipmentNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentItemSchema = createInsertSchema(shipmentItems).omit({
  id: true,
  createdAt: true,
});

export const insertShippingCostSchema = createInsertSchema(shippingCosts).omit({
  id: true,
  createdAt: true,
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

export const insertDeliveryTrackingSchema = createInsertSchema(deliveryTracking).omit({
  id: true,
  createdAt: true,
});

// Stage 4: Multi-leg shipping insert schemas
export const insertShipmentLegSchema = createInsertSchema(shipmentLegs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmedAt: true,
});

export const insertArrivalCostSchema = createInsertSchema(arrivalCosts).omit({
  id: true,
  createdAt: true,
});

export const insertShipmentInspectionSchema = createInsertSchema(shipmentInspections).omit({
  id: true,
  inspectionNumber: true,
  createdAt: true,
  completedAt: true,
});

export const insertLandedCostCalculationSchema = createInsertSchema(landedCostCalculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

// Advanced warehouse insert schemas
export const insertQualityStandardSchema = createInsertSchema(qualityStandards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWarehouseBatchSchema = createInsertSchema(warehouseBatches).omit({
  id: true,
  batchNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQualityInspectionSchema = createInsertSchema(qualityInspections).omit({
  id: true,
  inspectionNumber: true,
  completedAt: true,
  approvedAt: true,
  createdAt: true,
});

export const insertInventoryConsumptionSchema = createInsertSchema(inventoryConsumption).omit({
  id: true,
  consumptionNumber: true,
  createdAt: true,
});

export const insertProcessingOperationSchema = createInsertSchema(processingOperations).omit({
  id: true,
  operationNumber: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertStockTransferSchema = createInsertSchema(stockTransfers).omit({
  id: true,
  transferNumber: true,
  transferredAt: true,
  createdAt: true,
});

export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).omit({
  id: true,
  adjustmentNumber: true,
  approvedAt: true,
  createdAt: true,
});

// Sales Pipeline Insert Schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  customerNumber: true,
  totalOrdersCount: true,
  totalRevenueUsd: true,
  averageOrderValueUsd: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCustomerSchema = insertCustomerSchema.partial().omit({
  createdBy: true,
});

const baseSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  salesOrderNumber: true,
  subtotalAmount: true,
  totalAmount: true,
  totalAmountUsd: true,
  balanceDue: true,
  confirmedAt: true,
  fulfilledAt: true,
  deliveredAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesOrderSchema = baseSalesOrderSchema.refine((data) => {
  // Require exchangeRate for non-USD currencies
  if (data.currency !== 'USD' && (!data.exchangeRate || data.exchangeRate === '0')) {
    return false;
  }
  return true;
}, {
  message: "Exchange rate is required for non-USD currencies",
  path: ["exchangeRate"],
});

export const updateSalesOrderSchema = baseSalesOrderSchema.partial().omit({
  customerId: true,
  salesRepId: true,
  createdBy: true,
}).refine((data) => {
  // Require exchangeRate for non-USD currencies when currency is provided
  if (data.currency && data.currency !== 'USD' && (!data.exchangeRate || data.exchangeRate === '0')) {
    return false;
  }
  return true;
}, {
  message: "Exchange rate is required for non-USD currencies",
  path: ["exchangeRate"],
});

export const insertSalesOrderItemSchema = createInsertSchema(salesOrderItems).omit({
  id: true,
  lineTotal: true,
  lineTotalUsd: true,
  totalCostUsd: true,
  marginAmount: true,
  marginPercent: true,
  quantityReserved: true,
  quantityFulfilled: true,
  quantityDelivered: true,
  createdAt: true,
});

export const updateSalesOrderItemSchema = insertSalesOrderItemSchema.partial().omit({
  salesOrderId: true,
});

export const insertSalesReturnSchema = createInsertSchema(salesReturns).omit({
  id: true,
  returnNumber: true,
  status: true,
  processedAt: true,
  isApproved: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSalesReturnSchema = insertSalesReturnSchema.partial().omit({
  originalSalesOrderId: true,
  originalSalesOrderItemId: true,
  returnedBy: true,
});

export const insertCustomerCommunicationSchema = createInsertSchema(customerCommunications).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueTransactionSchema = createInsertSchema(revenueTransactions).omit({
  id: true,
  transactionNumber: true,
  amountUsd: true,
  grossMargin: true,
  grossMarginPercent: true,
  approvedAt: true,
  createdAt: true,
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

export const insertSalesPerformanceMetricSchema = createInsertSchema(salesPerformanceMetrics).omit({
  id: true,
  calculatedAt: true,
  createdAt: true,
});

export const insertCustomerCreditLimitSchema = createInsertSchema(customerCreditLimits).omit({
  id: true,
  currentBalance: true,
  availableCredit: true,
  suspendedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ===== OPERATING EXPENSES SYSTEM SCHEMAS (STAGE 5) =====

export const insertSupplySchema = createInsertSchema(supplies).omit({
  id: true,
  supplyNumber: true,
  totalValueUsd: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOperatingExpenseCategorySchema = createInsertSchema(operatingExpenseCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOperatingExpenseSchema = createInsertSchema(operatingExpenses).omit({
  id: true,
  expenseNumber: true,
  amountUsd: true,
  remaining: true,
  approvedAt: true,
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

export const insertSupplyConsumptionSchema = createInsertSchema(supplyConsumption).omit({
  id: true,
  consumptionNumber: true,
  totalCostUsd: true,
  createdAt: true,
});

export const insertSupplyPurchaseSchema = createInsertSchema(supplyPurchases).omit({
  id: true,
  purchaseNumber: true,
  totalAmount: true,
  amountUsd: true,
  remaining: true,
  exchangeRate: true, // Stage 1 Compliance: No client-provided exchange rates
  receivedDate: true,
  createdAt: true,
  updatedAt: true,
});
// Note: exchangeRate validation removed since it's omitted from schema (handled server-side)

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;
export type InsertUserWarehouseScope = typeof userWarehouseScopes.$inferInsert;
export type SelectUserWarehouseScope = typeof userWarehouseScopes.$inferSelect;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// STAGE 2 COMPLIANCE: Quality assessment types
export type SupplierQualityAssessment = typeof supplierQualityAssessments.$inferSelect;
export const insertSupplierQualityAssessmentSchema = createInsertSchema(supplierQualityAssessments).omit({
  id: true,
  createdAt: true,
});
export type InsertSupplierQualityAssessment = z.infer<typeof insertSupplierQualityAssessmentSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type PurchasePayment = typeof purchasePayments.$inferSelect;
export type InsertPurchasePayment = z.infer<typeof insertPurchasePaymentSchema>;

export type CapitalEntry = typeof capitalEntries.$inferSelect;
export type InsertCapitalEntry = z.infer<typeof insertCapitalEntrySchema>;

export type WarehouseStock = typeof warehouseStock.$inferSelect;
export type InsertWarehouseStock = z.infer<typeof insertWarehouseStockSchema>;

export type FilterRecord = typeof filterRecords.$inferSelect;
export type InsertFilterRecord = z.infer<typeof insertFilterRecordSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Shipping types
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = z.infer<typeof insertShipmentItemSchema>;

export type ShippingCost = typeof shippingCosts.$inferSelect;
export type InsertShippingCost = z.infer<typeof insertShippingCostSchema>;

// Stage 4: Multi-leg shipping types
export type ShipmentLeg = typeof shipmentLegs.$inferSelect;
export type InsertShipmentLeg = z.infer<typeof insertShipmentLegSchema>;

export type ArrivalCost = typeof arrivalCosts.$inferSelect;
export type InsertArrivalCost = z.infer<typeof insertArrivalCostSchema>;

export type ShipmentInspection = typeof shipmentInspections.$inferSelect;
export type InsertShipmentInspection = z.infer<typeof insertShipmentInspectionSchema>;

export type LandedCostCalculation = typeof landedCostCalculations.$inferSelect;
export type InsertLandedCostCalculation = z.infer<typeof insertLandedCostCalculationSchema>;

export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type InsertDeliveryTracking = z.infer<typeof insertDeliveryTrackingSchema>;

// Advanced warehouse types
export type QualityStandard = typeof qualityStandards.$inferSelect;
export type InsertQualityStandard = z.infer<typeof insertQualityStandardSchema>;

export type WarehouseBatch = typeof warehouseBatches.$inferSelect;
export type InsertWarehouseBatch = z.infer<typeof insertWarehouseBatchSchema>;

export type QualityInspection = typeof qualityInspections.$inferSelect;
export type InsertQualityInspection = z.infer<typeof insertQualityInspectionSchema>;

export type InventoryConsumption = typeof inventoryConsumption.$inferSelect;
export type InsertInventoryConsumption = z.infer<typeof insertInventoryConsumptionSchema>;

export type ProcessingOperation = typeof processingOperations.$inferSelect;
export type InsertProcessingOperation = z.infer<typeof insertProcessingOperationSchema>;

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type InsertStockTransfer = z.infer<typeof insertStockTransferSchema>;

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;

// Sales Pipeline Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;
export type UpdateSalesOrder = z.infer<typeof updateSalesOrderSchema>;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertSalesOrderItem = z.infer<typeof insertSalesOrderItemSchema>;
export type UpdateSalesOrderItem = z.infer<typeof updateSalesOrderItemSchema>;

export type SalesReturn = typeof salesReturns.$inferSelect;
export type InsertSalesReturn = z.infer<typeof insertSalesReturnSchema>;
export type UpdateSalesReturn = z.infer<typeof updateSalesReturnSchema>;

export type CustomerCommunication = typeof customerCommunications.$inferSelect;
export type InsertCustomerCommunication = z.infer<typeof insertCustomerCommunicationSchema>;

export type RevenueTransaction = typeof revenueTransactions.$inferSelect;
export type InsertRevenueTransaction = z.infer<typeof insertRevenueTransactionSchema>;

export type SalesPerformanceMetric = typeof salesPerformanceMetrics.$inferSelect;
export type InsertSalesPerformanceMetric = z.infer<typeof insertSalesPerformanceMetricSchema>;

export type CustomerCreditLimit = typeof customerCreditLimits.$inferSelect;
export type InsertCustomerCreditLimit = z.infer<typeof insertCustomerCreditLimitSchema>;

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;

// ===== OPERATING EXPENSES SYSTEM TYPES (STAGE 5) =====

export type Supply = typeof supplies.$inferSelect;
export type InsertSupply = z.infer<typeof insertSupplySchema>;

export type OperatingExpenseCategory = typeof operatingExpenseCategories.$inferSelect;
export type InsertOperatingExpenseCategory = z.infer<typeof insertOperatingExpenseCategorySchema>;

export type OperatingExpense = typeof operatingExpenses.$inferSelect;
export type InsertOperatingExpense = z.infer<typeof insertOperatingExpenseSchema>;

export type SupplyConsumption = typeof supplyConsumption.$inferSelect;
export type InsertSupplyConsumption = z.infer<typeof insertSupplyConsumptionSchema>;

export type SupplyPurchase = typeof supplyPurchases.$inferSelect;
export type InsertSupplyPurchase = z.infer<typeof insertSupplyPurchaseSchema>;

// ===== APPROVAL WORKFLOW AND AUDIT SYSTEM SCHEMAS AND TYPES =====

// Approval system insert schemas
export const insertApprovalChainSchema = createInsertSchema(approvalChains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertPermissionGrantSchema = createInsertSchema(permissionGrants).omit({
  id: true,
  currentUsageCount: true,
  createdAt: true,
  updatedAt: true,
});

// Approval system types
export type ApprovalChain = typeof approvalChains.$inferSelect;
export type InsertApprovalChain = z.infer<typeof insertApprovalChainSchema>;

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type PermissionGrant = typeof permissionGrants.$inferSelect;
export type InsertPermissionGrant = z.infer<typeof insertPermissionGrantSchema>;

// Enhanced approval workflow validation schemas
export const approvalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'escalate']),
  comments: z.string().optional(),
  delegateTo: z.string().uuid().optional(),
  escalateTo: z.string().uuid().optional(),
});

export const approvalRequestSubmissionSchema = insertApprovalRequestSchema.extend({
  operationData: z.record(z.any()),
  attachments: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export const approvalChainConfigurationSchema = insertApprovalChainSchema.extend({
  requiredRoles: z.array(z.enum(['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker'])),
  conditions: z.record(z.any()).optional(),
});

export const permissionGrantRequestSchema = insertPermissionGrantSchema.extend({
  conditions: z.record(z.any()).optional(),
  usageLog: z.array(z.record(z.any())).optional(),
});

export const auditLogFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.enum(['create', 'update', 'delete', 'view', 'approve', 'reject', 'login', 'logout', 'export', 'import']).optional(),
  operationType: z.enum(['capital_entry', 'purchase', 'sale_order', 'warehouse_operation', 'shipping_operation', 'financial_adjustment', 'user_role_change', 'system_setting_change']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  correlationId: z.string().optional(),
});

export const approvalRequestFilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'escalated']).optional(),
  operationType: z.enum(['capital_entry', 'purchase', 'sale_order', 'warehouse_operation', 'shipping_operation', 'financial_adjustment', 'user_role_change', 'system_setting_change']).optional(),
  requestedBy: z.string().uuid().optional(),
  currentApprover: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Response types for approval system
export interface ApprovalRequestWithDetails extends ApprovalRequest {
  approvalChain: ApprovalChain;
  requestedByUser: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  currentApproverUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  finalApproverUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

export interface AuditLogWithDetails extends AuditLog {
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role: string;
  } | null;
  approvalRequest?: ApprovalRequest | null;
}

export interface PermissionGrantWithDetails extends PermissionGrant {
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role: string;
  };
  grantedByUser: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  approvedByUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  revokedByUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

// Request/response types for approval workflow operations
export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;
export type ApprovalRequestSubmission = z.infer<typeof approvalRequestSubmissionSchema>;
export type ApprovalChainConfiguration = z.infer<typeof approvalChainConfigurationSchema>;
export type PermissionGrantRequest = z.infer<typeof permissionGrantRequestSchema>;
export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>;
export type ApprovalRequestFilter = z.infer<typeof approvalRequestFilterSchema>;

// API Response Types
export interface AuthUserResponse {
  user: User | null;
}

export interface SettingsResponse {
  exchangeRate: number;
  preventNegativeBalance: boolean;
}

// Enhanced settings response from /api/settings endpoint
export interface EnhancedSettingsResponse {
  financial: {
    exchangeRate: number;
    preventNegativeBalance: boolean;
    approvalThreshold: number;
    currencyDisplayCode: string;
  };
  operational: {
    maxFileSize: number;
    timezone: string;
    businessAddress: string;
    enableNotifications: boolean;
    autoBackup: boolean;
  };
  numbering: any[];
  security: {
    sessionTimeout: number;
    passwordPolicy: string;
    auditRetention: number;
  };
  systemInfo: {
    version: string;
    lastSnapshot: string;
    configVersion: number;
  };
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

// Shipping API Response Types
export type CarriersResponse = Carrier[];
export type ShipmentsResponse = Shipment[];
export type ShipmentItemsResponse = ShipmentItem[];
export type ShippingCostsResponse = ShippingCost[];
export type DeliveryTrackingResponse = DeliveryTracking[];

export interface ShipmentWithDetailsResponse extends Shipment {
  carrier: Carrier;
  items: (ShipmentItem & { warehouseStock: WarehouseStock })[];
  costs: ShippingCost[];
  tracking: DeliveryTracking[];
}

export interface ShippingAnalyticsResponse {
  // Top-level properties that frontend expects directly
  totalShipments: number;
  totalShippingCosts: number;
  avgCostPerKg: number;
  onTimeDeliveryRate: number;
  methodDistribution: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  costBreakdown: {
    legs: number;
    arrival: number;
    [key: string]: number;
  };
  
  // Detailed nested data for advanced analytics
  summary: {
    totalShipments: number;
    inTransit: number;
    delivered: number;
    totalCostUsd: number;
    averageCostPerKg: number;
  };
  carrierPerformance: Array<{
    carrierId: string;
    carrierName: string;
    totalShipments: number;
    onTimeDeliveryRate: number;
    averageCostPerKg: number;
    rating: number;
  }>;
  costBreakdownDetailed: Array<{
    costType: string;
    totalUsd: number;
    percentage: number;
  }>;
  deliveryTimeAnalysis: {
    averageDeliveryDays: number;
    byMethod: Array<{
      method: string;
      averageDays: number;
    }>;
  };
}

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

// Shipping validation schemas
export const shipmentStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']),
  actualDepartureDate: z.string().optional(),
  actualArrivalDate: z.string().optional(),
  notes: z.string().optional(),
});

export const createShipmentFromStockSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  carrierId: z.string().min(1, "Carrier ID is required"),
  method: z.enum(['sea', 'air', 'land', 'rail', 'multimodal']),
  originAddress: z.string().min(1, "Origin address is required"),
  destinationAddress: z.string().min(1, "Destination address is required"),
  estimatedDepartureDate: z.string().optional(),
  estimatedArrivalDate: z.string().optional(),
  warehouseStockItems: z.array(z.object({
    warehouseStockId: z.string().min(1),
    quantity: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Quantity must be a positive number"),
    packingDetails: z.string().optional(),
  })).min(1, "At least one warehouse stock item is required"),
  notes: z.string().optional(),
});

export const addShippingCostSchema = z.object({
  shipmentId: z.string().min(1, "Shipment ID is required"),
  costType: z.enum(['freight', 'insurance', 'customs', 'handling', 'other']),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Amount must be a valid positive number"),
  currency: z.enum(['USD', 'ETB']).default('USD'),
  exchangeRate: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.enum(['cash', 'advance', 'credit']).optional(),
  amountPaid: z.string().optional(),
  fundingSource: z.enum(['capital', 'external']),
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

export const addDeliveryTrackingSchema = z.object({
  shipmentId: z.string().min(1, "Shipment ID is required"),
  status: z.string().min(1, "Status is required"),
  location: z.string().optional(),
  description: z.string().optional(),
  isCustomerNotified: z.boolean().default(false),
  proofOfDelivery: z.string().optional(),
  exceptionDetails: z.string().optional(),
});

export const carrierFilterSchema = z.object({
  isActive: z.boolean().optional(),
  isPreferred: z.boolean().optional(),
  serviceType: z.string().optional(),
});

export const shipmentFilterSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']).optional(),
  method: z.enum(['sea', 'air', 'land', 'rail', 'multimodal']).optional(),
  carrierId: z.string().optional(),
  orderId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Shipping validation types
export type ShipmentStatusUpdate = z.infer<typeof shipmentStatusUpdateSchema>;
export type CreateShipmentFromStock = z.infer<typeof createShipmentFromStockSchema>;
export type AddShippingCost = z.infer<typeof addShippingCostSchema>;
export type AddDeliveryTracking = z.infer<typeof addDeliveryTrackingSchema>;
export type CarrierFilter = z.infer<typeof carrierFilterSchema>;
export type ShipmentFilter = z.infer<typeof shipmentFilterSchema>;

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
    // Add missing properties that server expects
    totalRevenue: z.number(),
    totalCapitalIn: z.number(),
    totalPurchasePayments: z.number(),
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
  // Add missing property that frontend expects
  lowStockItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    currentStock: z.number(),
    minimumStock: z.number(),
    status: z.string(),
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
    amount: z.string().refine((val) => {
      try {
        const decimal = new Decimal(val);
        return !decimal.isNaN();
      } catch {
        return false;
      }
    }, 'Invalid amount'),
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

// Workflow Validation Response Interface - for Reports.tsx
export interface WorkflowValidationResponse {
  validationId: string; // Maps to id from workflowValidations
  completedAt: Date | string;
  summary: {
    criticalGaps?: number;
    highPriorityGaps?: number;
    totalGaps?: number;
    recommendations?: string[];
    [key: string]: any;
  };
  gapReport: {
    [key: string]: any;
  };
  overallStatus: string;
  stageResults: any;
  isLatest: boolean;
}

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
}, (table) => [
  index("idx_ai_conversations_user_session").on(table.userId, table.sessionId),
]);

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
  historicalPurchases: z.array(z.any()).optional(),
  currentMarketConditions: z.record(z.any()).optional(),
  availableCapital: z.number().optional(),
});

export const aiSupplierRecommendationRequestSchema = z.object({
  quantity: z.number().positive(),
  quality: z.string(),
  budget: z.number().positive(),
  suppliers: z.array(z.any()).optional(),
  supplierPerformance: z.record(z.any()).optional(),
  currentNeeds: z.record(z.any()).optional(),
});

export const aiCapitalOptimizationRequestSchema = z.object({
  timeHorizon: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
  includeForecasting: z.boolean().optional().default(true),
  capitalEntries: z.array(z.any()).optional(),
  financialSummary: z.record(z.any()).optional(),
  upcomingPayments: z.array(z.any()).optional(),
});

export const aiChatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  context: z.record(z.any()).optional(),
  businessContext: z.string().optional(),
  conversationHistory: z.array(z.any()).optional(),
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

// =====================================
// COMPREHENSIVE FINANCIAL REPORTING TABLES
// =====================================

// Financial periods for comparative reporting
export const financialPeriods = pgTable("financial_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodName: varchar("period_name").notNull(), // e.g., "Q1 2025", "Jan 2025"
  periodType: varchar("period_type").notNull(), // month, quarter, year, custom
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status").notNull().default('open'), // open, closed, locked
  exchangeRateSnapshot: jsonb("exchange_rate_snapshot"), // Exchange rates at period close
  closedBy: varchar("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial metrics for calculated KPIs and ratios
export const financialMetrics = pgTable("financial_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => financialPeriods.id),
  metricDate: timestamp("metric_date").notNull().defaultNow(),
  
  // Revenue metrics
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).notNull().default('0'),
  revenueGrowthRate: decimal("revenue_growth_rate", { precision: 8, scale: 4 }),
  averageOrderValue: decimal("average_order_value", { precision: 12, scale: 2 }),
  revenuePerCustomer: decimal("revenue_per_customer", { precision: 12, scale: 2 }),
  
  // Cost and margin metrics  
  totalCogs: decimal("total_cogs", { precision: 15, scale: 2 }).notNull().default('0'),
  grossMargin: decimal("gross_margin", { precision: 15, scale: 2 }).notNull().default('0'),
  grossMarginPercent: decimal("gross_margin_percent", { precision: 8, scale: 4 }),
  operatingExpenses: decimal("operating_expenses", { precision: 15, scale: 2 }).notNull().default('0'),
  operatingMargin: decimal("operating_margin", { precision: 15, scale: 2 }).notNull().default('0'),
  operatingMarginPercent: decimal("operating_margin_percent", { precision: 8, scale: 4 }),
  netProfit: decimal("net_profit", { precision: 15, scale: 2 }).notNull().default('0'),
  netProfitMargin: decimal("net_profit_margin", { precision: 8, scale: 4 }),
  
  // Working capital and cash flow metrics
  workingCapital: decimal("working_capital", { precision: 15, scale: 2 }).notNull().default('0'),
  workingCapitalRatio: decimal("working_capital_ratio", { precision: 8, scale: 4 }),
  cashFlowFromOperations: decimal("cash_flow_from_operations", { precision: 15, scale: 2 }),
  cashConversionCycle: integer("cash_conversion_cycle"), // Days
  
  // Inventory and efficiency metrics
  inventoryValue: decimal("inventory_value", { precision: 15, scale: 2 }).notNull().default('0'),
  inventoryTurnover: decimal("inventory_turnover", { precision: 8, scale: 4 }),
  daysInventoryOutstanding: integer("days_inventory_outstanding"),
  assetUtilizationRatio: decimal("asset_utilization_ratio", { precision: 8, scale: 4 }),
  
  // Customer and supplier metrics
  customerAcquisitionCost: decimal("customer_acquisition_cost", { precision: 12, scale: 2 }),
  customerLifetimeValue: decimal("customer_lifetime_value", { precision: 12, scale: 2 }),
  supplierConcentrationRisk: decimal("supplier_concentration_risk", { precision: 8, scale: 4 }),
  
  // Currency and exchange metrics
  currencyExposure: jsonb("currency_exposure"), // Currency exposure breakdown
  exchangeRateImpact: decimal("exchange_rate_impact", { precision: 12, scale: 2 }),
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
  calculatedBy: varchar("calculated_by").references(() => users.id),
});

// Profit and loss statements with detailed breakdowns
export const profitLossStatements = pgTable("profit_loss_statements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => financialPeriods.id),
  statementDate: timestamp("statement_date").notNull().defaultNow(),
  statementType: varchar("statement_type").notNull(), // monthly, quarterly, annual, custom
  
  // Revenue breakdown
  productSalesRevenue: decimal("product_sales_revenue", { precision: 15, scale: 2 }).notNull().default('0'),
  shippingRevenue: decimal("shipping_revenue", { precision: 15, scale: 2 }).default('0'),
  otherRevenue: decimal("other_revenue", { precision: 15, scale: 2 }).default('0'),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Cost of goods sold breakdown
  directMaterialCosts: decimal("direct_material_costs", { precision: 15, scale: 2 }).notNull().default('0'),
  directLaborCosts: decimal("direct_labor_costs", { precision: 15, scale: 2 }).default('0'),
  warehouseOperationCosts: decimal("warehouse_operation_costs", { precision: 15, scale: 2 }).default('0'),
  shippingCosts: decimal("shipping_costs", { precision: 15, scale: 2 }).default('0'),
  qualityControlCosts: decimal("quality_control_costs", { precision: 15, scale: 2 }).default('0'),
  totalCogs: decimal("total_cogs", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Gross profit
  grossProfit: decimal("gross_profit", { precision: 15, scale: 2 }).notNull().default('0'),
  grossProfitMargin: decimal("gross_profit_margin", { precision: 8, scale: 4 }),
  
  // Operating expenses breakdown
  salesExpenses: decimal("sales_expenses", { precision: 15, scale: 2 }).default('0'),
  marketingExpenses: decimal("marketing_expenses", { precision: 15, scale: 2 }).default('0'),
  administrativeExpenses: decimal("administrative_expenses", { precision: 15, scale: 2 }).default('0'),
  equipmentDepreciation: decimal("equipment_depreciation", { precision: 15, scale: 2 }).default('0'),
  facilityExpenses: decimal("facility_expenses", { precision: 15, scale: 2 }).default('0'),
  totalOperatingExpenses: decimal("total_operating_expenses", { precision: 15, scale: 2 }).default('0'),
  
  // Operating profit
  operatingProfit: decimal("operating_profit", { precision: 15, scale: 2 }).notNull().default('0'),
  operatingProfitMargin: decimal("operating_profit_margin", { precision: 8, scale: 4 }),
  
  // Other income/expenses
  interestIncome: decimal("interest_income", { precision: 15, scale: 2 }).default('0'),
  interestExpense: decimal("interest_expense", { precision: 15, scale: 2 }).default('0'),
  exchangeGainLoss: decimal("exchange_gain_loss", { precision: 15, scale: 2 }).default('0'),
  otherIncomeExpense: decimal("other_income_expense", { precision: 15, scale: 2 }).default('0'),
  
  // Net profit
  profitBeforeTax: decimal("profit_before_tax", { precision: 15, scale: 2 }).notNull().default('0'),
  taxExpense: decimal("tax_expense", { precision: 15, scale: 2 }).default('0'),
  netProfit: decimal("net_profit", { precision: 15, scale: 2 }).notNull().default('0'),
  netProfitMargin: decimal("net_profit_margin", { precision: 8, scale: 4 }),
  
  // Variance analysis (comparison to previous period)
  revenueVariance: decimal("revenue_variance", { precision: 15, scale: 2 }),
  cogsVariance: decimal("cogs_variance", { precision: 15, scale: 2 }),
  operatingExpenseVariance: decimal("operating_expense_variance", { precision: 15, scale: 2 }),
  netProfitVariance: decimal("net_profit_variance", { precision: 15, scale: 2 }),
  
  // Currency breakdown
  usdAmounts: jsonb("usd_amounts"), // All amounts normalized to USD
  originalCurrencyAmounts: jsonb("original_currency_amounts"), // Original currency amounts
  exchangeRatesUsed: jsonb("exchange_rates_used"), // Exchange rates applied
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

// Cash flow analysis with projection capabilities  
export const cashFlowAnalysis = pgTable("cash_flow_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => financialPeriods.id),
  analysisDate: timestamp("analysis_date").notNull().defaultNow(),
  analysisType: varchar("analysis_type").notNull(), // actual, forecast, budget
  forecastHorizon: integer("forecast_horizon"), // Days ahead for forecast
  
  // Operating cash flows
  operatingCashInflows: decimal("operating_cash_inflows", { precision: 15, scale: 2 }).notNull().default('0'),
  customerPayments: decimal("customer_payments", { precision: 15, scale: 2 }).default('0'),
  operatingCashOutflows: decimal("operating_cash_outflows", { precision: 15, scale: 2 }).notNull().default('0'),
  supplierPayments: decimal("supplier_payments", { precision: 15, scale: 2 }).default('0'),
  operatingExpenses: decimal("operating_expenses", { precision: 15, scale: 2 }).default('0'),
  netOperatingCashFlow: decimal("net_operating_cash_flow", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Investment cash flows
  investmentCashInflows: decimal("investment_cash_inflows", { precision: 15, scale: 2 }).default('0'),
  investmentCashOutflows: decimal("investment_cash_outflows", { precision: 15, scale: 2 }).default('0'),
  netInvestmentCashFlow: decimal("net_investment_cash_flow", { precision: 15, scale: 2 }).default('0'),
  
  // Financing cash flows
  financingCashInflows: decimal("financing_cash_inflows", { precision: 15, scale: 2 }).default('0'),
  capitalInjections: decimal("capital_injections", { precision: 15, scale: 2 }).default('0'),
  financingCashOutflows: decimal("financing_cash_outflows", { precision: 15, scale: 2 }).default('0'),
  capitalWithdrawals: decimal("capital_withdrawals", { precision: 15, scale: 2 }).default('0'),
  netFinancingCashFlow: decimal("net_financing_cash_flow", { precision: 15, scale: 2 }).default('0'),
  
  // Total cash flow
  totalCashInflows: decimal("total_cash_inflows", { precision: 15, scale: 2 }).notNull().default('0'),
  totalCashOutflows: decimal("total_cash_outflows", { precision: 15, scale: 2 }).notNull().default('0'),
  netCashFlow: decimal("net_cash_flow", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Cash position
  openingCashBalance: decimal("opening_cash_balance", { precision: 15, scale: 2 }).notNull().default('0'),
  closingCashBalance: decimal("closing_cash_balance", { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Forecast-specific fields
  outstandingReceivables: decimal("outstanding_receivables", { precision: 15, scale: 2 }),
  projectedCollections: decimal("projected_collections", { precision: 15, scale: 2 }),
  outstandingPayables: decimal("outstanding_payables", { precision: 15, scale: 2 }),
  projectedPayments: decimal("projected_payments", { precision: 15, scale: 2 }),
  
  // Liquidity analysis
  liquidityRatio: decimal("liquidity_ratio", { precision: 8, scale: 4 }),
  burnRate: decimal("burn_rate", { precision: 12, scale: 2 }), // Monthly burn rate
  runwayDays: integer("runway_days"), // Days of cash runway
  
  // Currency breakdown
  cashFlowByCurrency: jsonb("cash_flow_by_currency"), // Cash flows by currency
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Margin analysis by customer, product, and grade
export const marginAnalysis = pgTable("margin_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => financialPeriods.id),
  analysisDate: timestamp("analysis_date").notNull().defaultNow(),
  analysisType: varchar("analysis_type").notNull(), // customer, product, grade, transaction, combined
  
  // Analysis dimensions
  customerId: varchar("customer_id").references(() => customers.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  orderId: varchar("order_id").references(() => orders.id),
  qualityGrade: qualityGradeEnum("quality_grade"),
  country: varchar("country"),
  
  // Volume metrics
  totalQuantityKg: decimal("total_quantity_kg", { precision: 12, scale: 2 }).notNull().default('0'),
  totalTransactions: integer("total_transactions").notNull().default(0),
  averageTransactionSize: decimal("average_transaction_size", { precision: 12, scale: 2 }),
  
  // Revenue metrics
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).notNull().default('0'),
  averageSellingPrice: decimal("average_selling_price", { precision: 10, scale: 2 }),
  priceVariance: decimal("price_variance", { precision: 10, scale: 2 }),
  
  // Cost metrics
  totalCogs: decimal("total_cogs", { precision: 15, scale: 2 }).notNull().default('0'),
  averageCostPerKg: decimal("average_cost_per_kg", { precision: 10, scale: 2 }),
  directCosts: decimal("direct_costs", { precision: 15, scale: 2 }).default('0'),
  indirectCosts: decimal("indirect_costs", { precision: 15, scale: 2 }).default('0'),
  shippingCosts: decimal("shipping_costs", { precision: 15, scale: 2 }).default('0'),
  warehouseCosts: decimal("warehouse_costs", { precision: 15, scale: 2 }).default('0'),
  qualityControlCosts: decimal("quality_control_costs", { precision: 15, scale: 2 }).default('0'),
  
  // Margin calculations
  grossMargin: decimal("gross_margin", { precision: 15, scale: 2 }).notNull().default('0'),
  grossMarginPercent: decimal("gross_margin_percent", { precision: 8, scale: 4 }),
  grossMarginPerKg: decimal("gross_margin_per_kg", { precision: 10, scale: 2 }),
  contributionMargin: decimal("contribution_margin", { precision: 15, scale: 2 }),
  contributionMarginPercent: decimal("contribution_margin_percent", { precision: 8, scale: 4 }),
  
  // Quality impact analysis
  qualityPremium: decimal("quality_premium", { precision: 10, scale: 2 }),
  qualityDiscount: decimal("quality_discount", { precision: 10, scale: 2 }),
  filteringImpact: decimal("filtering_impact", { precision: 12, scale: 2 }),
  yieldEfficiency: decimal("yield_efficiency", { precision: 8, scale: 4 }),
  
  // Profitability ranking
  profitabilityScore: decimal("profitability_score", { precision: 8, scale: 4 }),
  profitabilityRank: integer("profitability_rank"),
  performanceCategory: varchar("performance_category"), // high, medium, low, unprofitable
  
  // Trend analysis
  marginTrend: varchar("margin_trend"), // improving, declining, stable, volatile
  volumeTrend: varchar("volume_trend"),
  priceTrend: varchar("price_trend"),
  
  // Risk factors
  concentrationRisk: decimal("concentration_risk", { precision: 8, scale: 4 }),
  priceVolatility: decimal("price_volatility", { precision: 8, scale: 4 }),
  customerDependency: decimal("customer_dependency", { precision: 8, scale: 4 }),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget tracking for budget vs actual analysis
export const budgetTracking = pgTable("budget_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").notNull().references(() => financialPeriods.id),
  budgetDate: timestamp("budget_date").notNull().defaultNow(),
  budgetType: varchar("budget_type").notNull(), // master, revised, forecast
  budgetVersion: integer("budget_version").notNull().default(1),
  
  // Budget categories
  category: varchar("category").notNull(), // revenue, cogs, operating_expenses, capital
  subcategory: varchar("subcategory"), // specific line items
  
  // Budget amounts
  budgetedAmount: decimal("budgeted_amount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 15, scale: 2 }).default('0'),
  forecastAmount: decimal("forecast_amount", { precision: 15, scale: 2 }),
  
  // Variance analysis
  variance: decimal("variance", { precision: 15, scale: 2 }),
  variancePercent: decimal("variance_percent", { precision: 8, scale: 4 }),
  varianceType: varchar("variance_type"), // favorable, unfavorable
  
  // Performance tracking
  budgetUtilization: decimal("budget_utilization", { precision: 8, scale: 4 }),
  performanceRating: varchar("performance_rating"), // excellent, good, poor, critical
  
  // Forecast updates
  revisedForecast: decimal("revised_forecast", { precision: 15, scale: 2 }),
  confidenceLevel: varchar("confidence_level"), // high, medium, low
  
  // Notes and explanations
  varianceExplanation: text("variance_explanation"),
  actionItems: text("action_items").array(),
  riskFactors: text("risk_factors").array(),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

// Financial reporting insert schemas
export const insertFinancialPeriodSchema = createInsertSchema(financialPeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

export const insertFinancialMetricSchema = createInsertSchema(financialMetrics).omit({
  id: true,
  calculatedAt: true,
});

export const insertProfitLossStatementSchema = createInsertSchema(profitLossStatements).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export const insertCashFlowAnalysisSchema = createInsertSchema(cashFlowAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertMarginAnalysisSchema = createInsertSchema(marginAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetTrackingSchema = createInsertSchema(budgetTracking).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

// Financial reporting types
export type FinancialPeriod = typeof financialPeriods.$inferSelect;
export type InsertFinancialPeriod = z.infer<typeof insertFinancialPeriodSchema>;

export type FinancialMetric = typeof financialMetrics.$inferSelect;
export type InsertFinancialMetric = z.infer<typeof insertFinancialMetricSchema>;

export type ProfitLossStatement = typeof profitLossStatements.$inferSelect;
export type InsertProfitLossStatement = z.infer<typeof insertProfitLossStatementSchema>;

export type CashFlowAnalysis = typeof cashFlowAnalysis.$inferSelect;
export type InsertCashFlowAnalysis = z.infer<typeof insertCashFlowAnalysisSchema>;

export type MarginAnalysis = typeof marginAnalysis.$inferSelect;
export type InsertMarginAnalysis = z.infer<typeof insertMarginAnalysisSchema>;

export type BudgetTracking = typeof budgetTracking.$inferSelect;
export type InsertBudgetTracking = z.infer<typeof insertBudgetTrackingSchema>;

// Financial reporting response types for comprehensive analytics
export interface AdvancedFinancialSummaryResponse {
  periodOverview: {
    periodName: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  keyMetrics: {
    totalRevenue: number;
    totalCogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    operatingExpenses: number;
    operatingMargin: number;
    operatingMarginPercent: number;
    netProfit: number;
    netProfitMargin: number;
    workingCapital: number;
    cashFlow: number;
  };
  trends: {
    revenueGrowth: number;
    marginTrend: string;
    profitabilityTrend: string;
    efficiencyTrend: string;
  };
  breakdown: {
    revenueByCategory: Array<{ category: string; amount: number; percentage: number }>;
    costsByCategory: Array<{ category: string; amount: number; percentage: number }>;
    expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  };
}

export interface ComprehensivePLResponse {
  statement: ProfitLossStatement;
  varianceAnalysis: {
    revenue: { amount: number; percentage: number; trend: string };
    cogs: { amount: number; percentage: number; trend: string };
    grossProfit: { amount: number; percentage: number; trend: string };
    operatingExpenses: { amount: number; percentage: number; trend: string };
    operatingProfit: { amount: number; percentage: number; trend: string };
    netProfit: { amount: number; percentage: number; trend: string };
  };
  breakdown: {
    revenueBySource: Array<{ source: string; amount: number; percentage: number }>;
    cogsByCategory: Array<{ category: string; amount: number; percentage: number }>;
    expensesByType: Array<{ type: string; amount: number; percentage: number }>;
  };
  insights: {
    keyFindings: string[];
    recommendations: string[];
    riskAreas: string[];
  };
}

export interface AdvancedCashFlowResponse {
  analysis: CashFlowAnalysis;
  forecast: {
    projections: Array<{
      date: string;
      inflows: number;
      outflows: number;
      netFlow: number;
      cumulativeBalance: number;
    }>;
    summary: {
      totalInflows: number;
      totalOutflows: number;
      netCashFlow: number;
      runwayDays: number;
      liquidityRatio: number;
    };
  };
  workingCapital: {
    currentAssets: number;
    currentLiabilities: number;
    workingCapital: number;
    workingCapitalRatio: number;
    cashConversionCycle: number;
  };
  optimization: Array<{
    area: string;
    currentValue: number;
    targetValue: number;
    impact: number;
    recommendation: string;
  }>;
}

export interface ComprehensiveMarginResponse {
  customerAnalysis: Array<{
    customerId: string;
    customerName: string;
    totalRevenue: number;
    totalCogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    volumeKg: number;
    profitabilityRank: number;
    performanceCategory: string;
    trend: string;
  }>;
  productAnalysis: Array<{
    qualityGrade: string;
    country: string;
    totalRevenue: number;
    totalCogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    volumeKg: number;
    qualityPremium: number;
    filteringImpact: number;
  }>;
  transactionAnalysis: Array<{
    orderId: string;
    customerId: string;
    customerName: string;
    totalRevenue: number;
    totalCogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    qualityGrade: string;
    country: string;
    date: Date;
  }>;
  insights: {
    topPerformers: string[];
    underperformers: string[];
    opportunities: string[];
    risks: string[];
  };
}

export interface FinancialKPIResponse {
  revenue: { current: number; previous: number; growth: number };
  grossMargin: { amount: number; percentage: number; trend: string };
  operatingMargin: { amount: number; percentage: number; trend: string };
  netProfit: { amount: number; percentage: number; trend: string };
  workingCapital: { amount: number; ratio: number; trend: string };
  inventoryTurnover: { ratio: number; days: number; trend: string };
  cashFlow: { operating: number; total: number; runway: number };
  efficiency: {
    assetTurnover: number;
    receivablesTurnover: number;
    payablesTurnover: number;
    inventoryTurnover: number;
  };
  profitability: {
    grossProfitMargin: number;
    operatingProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
}

export interface BudgetVarianceResponse {
  categories: Array<{
    category: string;
    subcategory?: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercent: number;
    varianceType: string;
    performanceRating: string;
  }>;
  summary: {
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
    totalVariancePercent: number;
    favorableVariances: number;
    unfavorableVariances: number;
  };
  insights: {
    significantVariances: string[];
    performanceHighlights: string[];
    areasOfConcern: string[];
    recommendations: string[];
  };
}

export interface BreakEvenAnalysisResponse {
  breakEvenRevenue: number;
  breakEvenUnits: number;
  marginOfSafety: number;
  marginOfSafetyPercent: number;
  contributionMargin: number;
  contributionMarginRatio: number;
  fixedCosts: number;
  variableCostRatio: number;
  scenarios: Array<{
    scenario: string;
    salesVolume: number;
    revenue: number;
    profit: number;
    marginOfSafety: number;
  }>;
}

export interface ROIAnalysisResponse {
  overallROI: number;
  purchaseROI: number;
  inventoryROI: number;
  workingCapitalROI: number;
  roiBySupplier: Array<{
    supplierId: string;
    supplierName: string;
    totalInvestment: number;
    totalReturn: number;
    roi: number;
    roiRank: number;
  }>;
  roiByQualityGrade: Array<{
    qualityGrade: string;
    totalInvestment: number;
    totalReturn: number;
    roi: number;
  }>;
  recommendations: string[];
}

export interface CurrencyExposureResponse {
  exposureByTransaction: Array<{
    currency: string;
    totalAmount: number;
    amountUsd: number;
    exchangeRate: number;
    exposurePercent: number;
  }>;
  hedgeRecommendations: Array<{
    currency: string;
    exposureAmount: number;
    hedgeAmount: number;
    strategy: string;
    costBenefit: number;
  }>;
  riskMetrics: {
    totalExposure: number;
    concentrationRisk: number;
    volatilityRisk: number;
  };
}

export interface FinancialForecastResponse {
  revenueForecast: Array<{
    period: string;
    forecastRevenue: number;
    confidence: number;
    factors: string[];
  }>;
  costForecast: Array<{
    period: string;
    forecastCogs: number;
    forecastExpenses: number;
    confidence: number;
  }>;
  profitForecast: Array<{
    period: string;
    forecastGrossProfit: number;
    forecastOperatingProfit: number;
    forecastNetProfit: number;
    confidence: number;
  }>;
  recommendations: string[];
  risks: Array<{
    risk: string;
    probability: number;
    impact: number;
    mitigation: string;
  }>;
}

// Financial reporting validation schemas
export const financialPeriodFilterSchema = z.object({
  status: z.enum(['open', 'closed', 'locked']).optional(),
  periodType: z.enum(['month', 'quarter', 'year', 'custom']).optional(),
});

export const financialAnalysisRequestSchema = z.object({
  periodId: z.string().optional(),
  comparisonPeriodId: z.string().optional(),
  analysisType: z.enum(['detailed', 'summary', 'forecast']).optional(),
  filters: z.object({
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
    qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']).optional(),
    country: z.string().optional(),
  }).optional(),
});

export const marginAnalysisRequestSchema = z.object({
  periodId: z.string().optional(),
  analysisType: z.enum(['customer', 'product', 'transaction', 'combined']).default('combined'),
  filters: z.object({
    customerId: z.string().optional(),
    supplierId: z.string().optional(),
    qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']).optional(),
    country: z.string().optional(),
    minMargin: z.number().optional(),
  }).optional(),
});

export const cashFlowAnalysisRequestSchema = z.object({
  periodId: z.string().optional(),
  analysisType: z.enum(['actual', 'forecast', 'budget']).default('actual'),
  forecastDays: z.number().min(1).max(365).optional(),
  includeProjections: z.boolean().default(true),
});

export const budgetTrackingRequestSchema = z.object({
  periodId: z.string(),
  category: z.string().optional(),
  includeVarianceAnalysis: z.boolean().default(true),
});

// Financial reporting request types
export type FinancialPeriodFilter = z.infer<typeof financialPeriodFilterSchema>;
export type FinancialAnalysisRequest = z.infer<typeof financialAnalysisRequestSchema>;
export type MarginAnalysisRequest = z.infer<typeof marginAnalysisRequestSchema>;
export type CashFlowAnalysisRequest = z.infer<typeof cashFlowAnalysisRequestSchema>;
export type BudgetTrackingRequest = z.infer<typeof budgetTrackingRequestSchema>;

// ===== DOCUMENT MANAGEMENT TYPES AND SCHEMAS =====

// Document management table types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;
export type DocumentMetadata = typeof documentMetadata.$inferSelect;
export type InsertDocumentMetadata = typeof documentMetadata.$inferInsert;
export type DocumentCompliance = typeof documentCompliance.$inferSelect;
export type InsertDocumentCompliance = typeof documentCompliance.$inferInsert;
export type DocumentAccessLog = typeof documentAccessLogs.$inferSelect;
export type InsertDocumentAccessLog = typeof documentAccessLogs.$inferInsert;
export type DocumentWorkflowState = typeof documentWorkflowStates.$inferSelect;
export type InsertDocumentWorkflowState = typeof documentWorkflowStates.$inferInsert;

// Document management insert schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  documentNumber: true,
  currentVersion: true,
  isLatestVersion: true,
  createdAt: true,
  modifiedAt: true,
  approvedAt: true,
  archivedAt: true,
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  supersededAt: true,
});

export const insertDocumentMetadataSchema = createInsertSchema(documentMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentComplianceSchema = createInsertSchema(documentCompliance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentAccessLogSchema = createInsertSchema(documentAccessLogs).omit({
  id: true,
  accessedAt: true,
});

export const insertDocumentWorkflowStateSchema = createInsertSchema(documentWorkflowStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Document management request schemas
export const documentUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(['invoice', 'contract', 'compliance_record', 'certificate', 'receipt', 'purchase_order', 'shipping_document', 'quality_report', 'financial_statement', 'audit_document', 'insurance_policy', 'license', 'permit', 'regulation_document']),
  subCategory: z.string().optional(),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  supplierId: z.string().optional(),
  customerId: z.string().optional(),
  purchaseId: z.string().optional(),
  orderId: z.string().optional(),
  shipmentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.string().optional(),
  requiresCompliance: z.boolean().default(false),
  complianceType: z.string().optional(),
  accessLevel: z.enum(['public', 'internal', 'confidential', 'restricted', 'classified']).default('internal'),
});

export const documentSearchSchema = z.object({
  query: z.string().optional(),
  category: z.enum(['invoice', 'contract', 'compliance_record', 'certificate', 'receipt', 'purchase_order', 'shipping_document', 'quality_report', 'financial_statement', 'audit_document', 'insurance_policy', 'license', 'permit', 'regulation_document']).optional(),
  status: z.enum(['draft', 'under_review', 'approved', 'final', 'expired', 'archived', 'rejected', 'cancelled']).optional(),
  accessLevel: z.enum(['public', 'internal', 'confidential', 'restricted', 'classified']).optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  supplierId: z.string().optional(),
  customerId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  expiryFrom: z.string().optional(),
  expiryTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['title', 'createdAt', 'modifiedAt', 'documentDate', 'expiryDate']).default('modifiedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const documentUpdateSchema = insertDocumentSchema.partial().extend({
  id: z.string(),
});

export const documentVersionCreateSchema = z.object({
  documentId: z.string(),
  changeDescription: z.string(),
  changeReason: z.string(),
  changeType: z.enum(['major', 'minor', 'patch', 'correction', 'approval']).default('minor'),
  approvalRequired: z.boolean().default(false),
});

export const documentComplianceUpdateSchema = z.object({
  documentId: z.string(),
  requirementType: z.string(),
  requirementName: z.string(),
  requirementDescription: z.string().optional(),
  regulatoryBody: z.string().optional(),
  status: z.enum(['compliant', 'non_compliant', 'pending_review', 'expiring_soon', 'expired', 'renewal_required']),
  complianceDate: z.string().optional(),
  expiryDate: z.string().optional(),
  renewalDate: z.string().optional(),
  complianceLevel: z.string().optional(),
  certificateNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  validationMethod: z.string().optional(),
  autoRenewal: z.boolean().default(false),
  reminderDaysBefore: z.number().default(30),
});

export const complianceFilterSchema = z.object({
  status: z.enum(['compliant', 'non_compliant', 'pending_review', 'expiring_soon', 'expired', 'renewal_required']).optional(),
  requirementType: z.string().optional(),
  expiryFrom: z.string().optional(),
  expiryTo: z.string().optional(),
  renewalFrom: z.string().optional(),
  renewalTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Document management request types
export type DocumentUploadRequest = z.infer<typeof documentUploadSchema>;
export type DocumentSearchRequest = z.infer<typeof documentSearchSchema>;
export type DocumentUpdateRequest = z.infer<typeof documentUpdateSchema>;
export type DocumentVersionCreateRequest = z.infer<typeof documentVersionCreateSchema>;
export type DocumentComplianceUpdateRequest = z.infer<typeof documentComplianceUpdateSchema>;
export type ComplianceFilterRequest = z.infer<typeof complianceFilterSchema>;

// Document management response types
export interface DocumentWithMetadata extends Document {
  metadata?: DocumentMetadata[];
  compliance?: DocumentCompliance[];
  currentVersionInfo?: DocumentVersion;
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted' | 'classified';
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
}

export interface DocumentSearchResponse {
  documents: DocumentWithMetadata[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DocumentVersionHistory {
  document: Document;
  versions: DocumentVersion[];
  canRollback: boolean;
}

export interface ComplianceAlert {
  documentId: string;
  documentTitle: string;
  requirementName: string;
  status: string;
  expiryDate?: string;
  renewalDate?: string;
  daysUntilExpiry?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceDashboard {
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    expiringSoon: number;
    expired: number;
    pendingReview: number;
  };
  alerts: ComplianceAlert[];
  upcomingRenewals: ComplianceAlert[];
  criticalItems: ComplianceAlert[];
}

export interface DocumentAnalytics {
  totalDocuments: number;
  documentsByCategory: Array<{ category: string; count: number }>;
  documentsByStatus: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    documentId: string;
    documentTitle: string;
    action: string;
    userName: string;
    timestamp: string;
  }>;
  storageUsed: number;
  averageFileSize: number;
}

// ===============================================
// NOTIFICATION SYSTEM ZOD SCHEMAS AND TYPES
// ===============================================

// Notification settings schemas
export const insertNotificationSettingSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationSettingSchema = insertNotificationSettingSchema.partial();

export const notificationSettingFilterSchema = z.object({
  userId: z.string().optional(),
  isActive: z.boolean().optional(),
  enableInApp: z.boolean().optional(),
  enableEmail: z.boolean().optional(),
  enableSms: z.boolean().optional(),
  enableWebhook: z.boolean().optional(),
});

// Notification template schemas
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationTemplateSchema = insertNotificationTemplateSchema.partial();

export const notificationTemplateFilterSchema = z.object({
  alertType: z.enum(['threshold_alert', 'business_alert', 'system_alert', 'compliance_alert', 'financial_alert', 'operational_alert', 'security_alert', 'workflow_alert']).optional(),
  alertCategory: z.enum(['capital_threshold', 'inventory_level', 'purchase_order', 'sales_order', 'document_expiry', 'approval_workflow', 'financial_health', 'operational_delay', 'compliance_issue', 'market_timing', 'system_health', 'quality_issue', 'supplier_issue', 'shipping_delay', 'payment_due', 'currency_fluctuation']).optional(),
  channel: z.enum(['in_app', 'email', 'sms', 'webhook']).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  language: z.string().optional(),
});

// Notification queue schemas
export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationQueueSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'sent', 'failed', 'read', 'dismissed']),
  readAt: z.string().optional(),
  dismissedAt: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const notificationQueueFilterSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'read', 'dismissed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  channel: z.enum(['in_app', 'email', 'sms', 'webhook']).optional(),
  alertType: z.enum(['threshold_alert', 'business_alert', 'system_alert', 'compliance_alert', 'financial_alert', 'operational_alert', 'security_alert', 'workflow_alert']).optional(),
  alertCategory: z.enum(['capital_threshold', 'inventory_level', 'purchase_order', 'sales_order', 'document_expiry', 'approval_workflow', 'financial_health', 'operational_delay', 'compliance_issue', 'market_timing', 'system_health', 'quality_issue', 'supplier_issue', 'shipping_delay', 'payment_due', 'currency_fluctuation']).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  scheduledFrom: z.string().optional(),
  scheduledTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const createNotificationSchema = z.object({
  userId: z.string(),
  alertType: z.enum(['threshold_alert', 'business_alert', 'system_alert', 'compliance_alert', 'financial_alert', 'operational_alert', 'security_alert', 'workflow_alert']),
  alertCategory: z.enum(['capital_threshold', 'inventory_level', 'purchase_order', 'sales_order', 'document_expiry', 'approval_workflow', 'financial_health', 'operational_delay', 'compliance_issue', 'market_timing', 'system_health', 'quality_issue', 'supplier_issue', 'shipping_delay', 'payment_due', 'currency_fluctuation']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  channels: z.array(z.enum(['in_app', 'email', 'sms', 'webhook'])).default(['in_app']),
  title: z.string(),
  message: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actionUrl: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  scheduledFor: z.string().optional(),
});

// Alert configuration schemas
export const insertAlertConfigurationSchema = createInsertSchema(alertConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAlertConfigurationSchema = insertAlertConfigurationSchema.partial().extend({
  id: z.string(),
});

export const alertConfigurationFilterSchema = z.object({
  alertType: z.enum(['threshold_alert', 'business_alert', 'system_alert', 'compliance_alert', 'financial_alert', 'operational_alert', 'security_alert', 'workflow_alert']).optional(),
  alertCategory: z.enum(['capital_threshold', 'inventory_level', 'purchase_order', 'sales_order', 'document_expiry', 'approval_workflow', 'financial_health', 'operational_delay', 'compliance_issue', 'market_timing', 'system_health', 'quality_issue', 'supplier_issue', 'shipping_delay', 'payment_due', 'currency_fluctuation']).optional(),
  isGlobal: z.boolean().optional(),
  isActive: z.boolean().optional(),
  monitoringEnabled: z.boolean().optional(),
  targetRole: z.enum(['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker']).optional(),
});

// Notification history schemas
export const notificationHistoryFilterSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'read', 'dismissed']).optional(),
  alertType: z.enum(['threshold_alert', 'business_alert', 'system_alert', 'compliance_alert', 'financial_alert', 'operational_alert', 'security_alert', 'workflow_alert']).optional(),
  alertCategory: z.enum(['capital_threshold', 'inventory_level', 'purchase_order', 'sales_order', 'document_expiry', 'approval_workflow', 'financial_health', 'operational_delay', 'compliance_issue', 'market_timing', 'system_health', 'quality_issue', 'supplier_issue', 'shipping_delay', 'payment_due', 'currency_fluctuation']).optional(),
  channel: z.enum(['in_app', 'email', 'sms', 'webhook']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Threshold configuration schema for various business metrics
export const thresholdConfigurationSchema = z.object({
  // Capital thresholds
  capitalThresholds: z.object({
    lowBalanceThreshold: z.number().min(0).default(5000),
    criticalBalanceThreshold: z.number().min(0).default(1000),
    highExposureThreshold: z.number().min(0).default(50000),
    currency: z.string().default('USD'),
  }).optional(),

  // Inventory thresholds
  inventoryThresholds: z.object({
    lowStockThreshold: z.number().min(0).default(100), // kg
    criticalStockThreshold: z.number().min(0).default(50), // kg
    expiryWarningDays: z.number().min(1).default(30),
    qualityGradeAlert: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial']).optional(),
  }).optional(),

  // Purchase thresholds
  purchaseThresholds: z.object({
    highValueThreshold: z.number().min(0).default(10000),
    urgentApprovalThreshold: z.number().min(0).default(25000),
    supplierRiskThreshold: z.number().min(1).max(5).default(3), // Risk score
    paymentDelayDays: z.number().min(1).default(7),
  }).optional(),

  // Sales thresholds
  salesThresholds: z.object({
    largeOrderThreshold: z.number().min(0).default(15000),
    creditLimitWarningPercent: z.number().min(0).max(100).default(80),
    paymentOverdueDays: z.number().min(1).default(5),
    fulfillmentDelayDays: z.number().min(1).default(3),
  }).optional(),

  // Financial KPI thresholds
  financialThresholds: z.object({
    grossMarginThreshold: z.number().min(0).max(100).default(15), // Percent
    cashFlowWarningDays: z.number().min(1).default(30),
    roiThreshold: z.number().min(0).default(10), // Percent
    currencyExposurePercent: z.number().min(0).max(100).default(25),
  }).optional(),

  // Operational thresholds
  operationalThresholds: z.object({
    shippingDelayDays: z.number().min(1).default(2),
    qualityIssueThreshold: z.number().min(1).max(5).default(3), // Score
    supplierPerformanceThreshold: z.number().min(0).max(100).default(80), // Percent
    documentExpiryWarningDays: z.number().min(1).default(30),
  }).optional(),
});

// Notification system TypeScript types
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;
export type UpdateNotificationSetting = z.infer<typeof updateNotificationSettingSchema>;
export type NotificationSettingFilter = z.infer<typeof notificationSettingFilterSchema>;

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type UpdateNotificationTemplate = z.infer<typeof updateNotificationTemplateSchema>;
export type NotificationTemplateFilter = z.infer<typeof notificationTemplateFilterSchema>;

export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;
export type UpdateNotificationQueue = z.infer<typeof updateNotificationQueueSchema>;
export type NotificationQueueFilter = z.infer<typeof notificationQueueFilterSchema>;
export type CreateNotification = z.infer<typeof createNotificationSchema>;

export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = z.infer<typeof insertAlertConfigurationSchema>;
export type UpdateAlertConfiguration = z.infer<typeof updateAlertConfigurationSchema>;
export type AlertConfigurationFilter = z.infer<typeof alertConfigurationFilterSchema>;

export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type NotificationHistoryFilter = z.infer<typeof notificationHistoryFilterSchema>;

export type ThresholdConfiguration = z.infer<typeof thresholdConfigurationSchema>;

// ===== STAGE 7 REVENUE MANAGEMENT SCHEMAS =====

// Revenue ledger schemas
export const insertRevenueLedgerSchema = createInsertSchema(revenueLedger).omit({
  id: true,
  revEntryId: true,
  amountUsd: true,
  createdAt: true,
});

export const updateRevenueLedgerSchema = insertRevenueLedgerSchema.partial().extend({
  id: z.string(),
});

export const revenueLedgerFilterSchema = z.object({
  type: z.enum(['customer_receipt', 'customer_refund', 'withdrawal', 'reinvest_out', 'transfer_fee', 'reclass', 'reverse']).optional(),
  customerId: z.string().optional(),
  salesOrderId: z.string().optional(),
  withdrawalId: z.string().optional(),
  reinvestmentId: z.string().optional(),
  accountingPeriod: z.string().optional(),
  periodClosed: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  currency: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Withdrawal records schemas
export const insertWithdrawalRecordSchema = createInsertSchema(withdrawalRecords).omit({
  id: true,
  withdrawalId: true,
  amountUsd: true,
  approvedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWithdrawalRecordSchema = insertWithdrawalRecordSchema.partial().extend({
  id: z.string(),
});

export const withdrawalRecordFilterSchema = z.object({
  partner: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  currency: z.string().optional(),
  paymentMethod: z.string().optional(),
  approvalRequestId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const withdrawalApprovalSchema = z.object({
  id: z.string(),
  approved: z.boolean(),
  note: z.string().optional(),
});

// Reinvestment schemas
export const insertReinvestmentSchema = createInsertSchema(reinvestments).omit({
  id: true,
  reinvestId: true,
  transferCostUsd: true,
  capitalEntryId: true,
  operatingExpenseId: true,
  approvedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReinvestmentSchema = insertReinvestmentSchema.partial().extend({
  id: z.string(),
});

export const reinvestmentFilterSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  allocationPolicy: z.enum(['aggregate', 'pro_rata', 'specified']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  counterparty: z.string().optional(),
  capitalEntryId: z.string().optional(),
  approvalRequestId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const reinvestmentApprovalSchema = z.object({
  id: z.string(),
  approved: z.boolean(),
  note: z.string().optional(),
});

// Revenue balance summary schemas
export const insertRevenueBalanceSummarySchema = createInsertSchema(revenueBalanceSummary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRevenueBalanceSummarySchema = insertRevenueBalanceSummarySchema.partial().extend({
  id: z.string(),
});

export const revenueBalanceSummaryFilterSchema = z.object({
  accountingPeriod: z.string().optional(),
  isLocked: z.boolean().optional(),
  periodStartFrom: z.string().optional(),
  periodStartTo: z.string().optional(),
  periodEndFrom: z.string().optional(),
  periodEndTo: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Revenue balance calculation schema
export const revenueBalanceCalculationSchema = z.object({
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  includeProjections: z.boolean().default(false),
  currencyBreakdown: z.boolean().default(true),
  includeOrderAnalysis: z.boolean().default(false),
});

// Customer receipt/refund schemas for revenue integration
export const customerReceiptSchema = z.object({
  customerId: z.string(),
  salesOrderId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  exchangeRate: z.number().positive().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  bankAccount: z.string().optional(),
  invoiceId: z.string().optional(),
  receiptId: z.string().optional(),
  orderIds: z.array(z.string()).optional(),
  description: z.string(),
  note: z.string().optional(),
  recognitionDate: z.string().optional(),
});

export const customerRefundSchema = z.object({
  customerId: z.string(),
  salesOrderId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  exchangeRate: z.number().positive().optional(),
  refundMethod: z.string().optional(),
  refundReference: z.string().optional(),
  originalInvoiceId: z.string().optional(),
  returnId: z.string().optional(),
  orderIds: z.array(z.string()).optional(),
  description: z.string(),
  note: z.string().optional(),
  refundDate: z.string().optional(),
});

// TypeScript types for Stage 7 Revenue Management
export type RevenueLedger = typeof revenueLedger.$inferSelect;
export type InsertRevenueLedger = z.infer<typeof insertRevenueLedgerSchema>;
export type UpdateRevenueLedger = z.infer<typeof updateRevenueLedgerSchema>;
export type RevenueLedgerFilter = z.infer<typeof revenueLedgerFilterSchema>;

export type WithdrawalRecord = typeof withdrawalRecords.$inferSelect;
export type InsertWithdrawalRecord = z.infer<typeof insertWithdrawalRecordSchema>;
export type UpdateWithdrawalRecord = z.infer<typeof updateWithdrawalRecordSchema>;
export type WithdrawalRecordFilter = z.infer<typeof withdrawalRecordFilterSchema>;
export type WithdrawalApproval = z.infer<typeof withdrawalApprovalSchema>;

export type Reinvestment = typeof reinvestments.$inferSelect;
export type InsertReinvestment = z.infer<typeof insertReinvestmentSchema>;
export type UpdateReinvestment = z.infer<typeof updateReinvestmentSchema>;
export type ReinvestmentFilter = z.infer<typeof reinvestmentFilterSchema>;
export type ReinvestmentApproval = z.infer<typeof reinvestmentApprovalSchema>;

export type RevenueBalanceSummary = typeof revenueBalanceSummary.$inferSelect;
export type InsertRevenueBalanceSummary = z.infer<typeof insertRevenueBalanceSummarySchema>;
export type UpdateRevenueBalanceSummary = z.infer<typeof updateRevenueBalanceSummarySchema>;
export type RevenueBalanceSummaryFilter = z.infer<typeof revenueBalanceSummaryFilterSchema>;

export type RevenueBalanceCalculation = z.infer<typeof revenueBalanceCalculationSchema>;
export type CustomerReceipt = z.infer<typeof customerReceiptSchema>;
export type CustomerRefund = z.infer<typeof customerRefundSchema>;

// Notification system response types
export interface NotificationCenterResponse {
  notifications: Array<NotificationQueue & {
    canDismiss: boolean;
    canMarkAsRead: boolean;
    timeAgo: string;
    actionText?: string;
  }>;
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface NotificationSettingsResponse extends NotificationSetting {
  effectiveThresholds: ThresholdConfiguration;
  availableChannels: Array<{
    channel: 'in_app' | 'email' | 'sms' | 'webhook';
    enabled: boolean;
    configured: boolean;
    requiresSetup: boolean;
  }>;
  recentActivity: Array<{
    alertType: string;
    alertCategory: string;
    triggeredAt: string;
    acknowledged: boolean;
  }>;
}

export interface AlertMonitoringDashboard {
  activeAlerts: Array<{
    id: string;
    alertType: string;
    alertCategory: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    entityType?: string;
    entityId?: string;
    triggeredAt: string;
    isAcknowledged: boolean;
    escalationLevel: number;
    assignedTo?: string;
  }>;
  alertMetrics: {
    totalAlerts: number;
    criticalAlerts: number;
    acknowledgedAlerts: number;
    averageResponseTime: number; // minutes
    alertTrends: Array<{
      date: string;
      count: number;
      critical: number;
    }>;
  };
  systemHealth: {
    monitoringActive: boolean;
    lastHealthCheck: string;
    alertsProcessed: number;
    notificationsSent: number;
    failureRate: number;
  };
}

export interface NotificationDeliveryStatus {
  notificationId: string;
  status: 'pending' | 'sent' | 'failed' | 'read' | 'dismissed';
  channels: Array<{
    channel: 'in_app' | 'email' | 'sms' | 'webhook';
    status: 'pending' | 'sent' | 'failed' | 'delivered';
    attemptCount: number;
    lastAttempt?: string;
    errorMessage?: string;
    deliveredAt?: string;
    readAt?: string;
  }>;
  metadata: {
    totalAttempts: number;
    processingTime: number;
    deliveryTime?: number;
  };
}

export interface NotificationAnalytics {
  deliveryStats: {
    totalSent: number;
    successRate: number;
    failureRate: number;
    averageDeliveryTime: number;
    channelBreakdown: Array<{
      channel: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
  };
  engagementStats: {
    openRate: number;
    clickRate: number;
    dismissalRate: number;
    responseRate: number;
    preferredChannels: Array<{
      channel: string;
      usage: number;
      engagement: number;
    }>;
  };
  alertEffectiveness: {
    mostTriggered: Array<{
      alertCategory: string;
      count: number;
      avgResponseTime: number;
    }>;
    leastEngaged: Array<{
      alertCategory: string;
      dismissalRate: number;
      suggestions: string[];
    }>;
  };
}

// Stage 10: Enhanced Settings System Insert Schemas

// Enhanced settings schema
export const insertSettingsHistorySchema = createInsertSchema(settingsHistory).omit({
  id: true,
  createdAt: true
});

export const insertNumberingSchemeSchema = createInsertSchema(numberingSchemes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConfigurationSnapshotSchema = createInsertSchema(configurationSnapshots).omit({
  id: true,
  createdAt: true
});

// Types for enhanced settings system
export type InsertSettingsHistory = z.infer<typeof insertSettingsHistorySchema>;
export type SelectSettingsHistory = typeof settingsHistory.$inferSelect;

export type InsertNumberingScheme = z.infer<typeof insertNumberingSchemeSchema>;
export type SelectNumberingScheme = typeof numberingSchemes.$inferSelect;

export type InsertConfigurationSnapshot = z.infer<typeof insertConfigurationSnapshotSchema>;
export type SelectConfigurationSnapshot = typeof configurationSnapshots.$inferSelect;

// Settings management schemas for API validation
export const settingUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
  category: z.string().default('general'),
  dataType: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  requiresApproval: z.boolean().default(false),
  changeReason: z.string().optional()
});

export const numberingSchemeUpdateSchema = z.object({
  entityType: z.string().min(1),
  prefix: z.string().default(''),
  currentNumber: z.number().int().min(0).default(0),
  increment: z.number().int().min(1).default(1),
  minDigits: z.number().int().min(1).max(10).default(4),
  suffix: z.string().default(''),
  format: z.string().default('{prefix}{number:0{minDigits}}{suffix}'),
  resetPeriod: z.enum(['annual', 'monthly', 'never']).optional()
});

export const configurationSnapshotCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  snapshotType: z.enum(['manual', 'periodic', 'pre_change']).default('manual')
});

// STAGE 4 SHIPPING LOGISTICS VALIDATION SCHEMAS
export const commissionCalculationSchema = z.object({
  shipmentLegId: z.string().min(1),
  chargeableWeightKg: z.coerce.number().positive(),
  ratePerKg: z.coerce.number().positive(),
  baseCost: z.coerce.number().positive(),
  commissionPercent: z.coerce.number().min(0).max(100).optional().default(0),
  fundingSource: z.enum(['capital', 'operational', 'supplier']).default('capital'),
  notes: z.string().optional()
});

export const landedCostCalculationSchema = z.object({
  shipmentId: z.string().min(1),
  includeShippingCosts: z.boolean().default(true),
  includeArrivalCosts: z.boolean().default(true),
  currency: z.string().default('USD'),
  exchangeRate: z.coerce.number().positive().optional()
});

export const inspectionSettlementSchema = z.discriminatedUnion('settlementType', [
  z.object({
    settlementType: z.literal('accept'),
    settlementReason: z.string().min(1),
    approvedBy: z.string().min(1),
    settlementDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : new Date())
  }),
  z.object({
    settlementType: z.literal('claim'),
    settlementReason: z.string().min(1),
    claimDetails: z.object({
      claimAmount: z.coerce.number().positive(),
      claimReason: z.string().min(1),
      supportingDocuments: z.array(z.string()).optional()
    }),
    approvedBy: z.string().min(1),
    settlementDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : new Date())
  }),
  z.object({
    settlementType: z.literal('return'),
    settlementReason: z.string().min(1),
    returnDetails: z.object({
      returnCost: z.coerce.number().positive(),
      returnMethod: z.string().min(1),
      returnSchedule: z.string().datetime().transform((s) => new Date(s))
    }),
    approvedBy: z.string().min(1),
    settlementDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : new Date())
  }),
  z.object({
    settlementType: z.literal('discount'),
    settlementReason: z.string().min(1),
    discountPercent: z.coerce.number().min(0).max(100),
    negotiatedAmount: z.coerce.number().positive().optional(),
    approvedBy: z.string().min(1),
    settlementDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : new Date())
  })
]);

// ===== APPROVAL GUARDS TABLE =====
// Approval guards table for operation-specific approval requirements
export const approvalGuards = pgTable("approval_guards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationType: approvalOperationTypeEnum("operation_type").notNull(),
  minimumAmount: decimal("minimum_amount", { precision: 15, scale: 2 }),
  maximumAmount: decimal("maximum_amount", { precision: 15, scale: 2 }),
  currencyCode: varchar("currency_code").notNull().default('USD'),
  requiredApprovals: integer("required_approvals").notNull().default(1),
  timeoutHours: integer("timeout_hours").default(24),
  escalationEnabled: boolean("escalation_enabled").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(100),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_approval_guards_operation_type").on(table.operationType),
  index("idx_approval_guards_active").on(table.isActive),
]);

// Approval guard schemas
export const insertApprovalGuardSchema = createInsertSchema(approvalGuards).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateApprovalGuardSchema = insertApprovalGuardSchema.partial();

// Approval guard types
export type ApprovalGuard = typeof approvalGuards.$inferSelect;
export type InsertApprovalGuard = z.infer<typeof insertApprovalGuardSchema>;
export type UpdateApprovalGuard = z.infer<typeof updateApprovalGuardSchema>;

// Settings category responses
export interface EnhancedSettingsResponse {
  financial: {
    exchangeRate: number;
    preventNegativeBalance: boolean;
    approvalThreshold: number;
    currencyDisplayCode: string;
  };
  operational: {
    maxFileSize: number;
    timezone: string;
    businessAddress: string;
    enableNotifications: boolean;
    autoBackup: boolean;
  };
  numbering: any[];
  security: {
    sessionTimeout: number;
    passwordPolicy: string;
    auditRetention: number;
  };
  systemInfo: {
    version: string;
    lastSnapshot: string;
    configVersion: number;
  };
}
