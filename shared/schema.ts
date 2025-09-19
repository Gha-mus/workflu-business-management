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

// Quality grades enum for coffee grading
export const qualityGradeEnum = pgEnum('quality_grade', ['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']);

// Approval system enums
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'cancelled', 'escalated']);
export const approvalOperationTypeEnum = pgEnum('approval_operation_type', [
  'capital_entry', 'purchase', 'sale_order', 'warehouse_operation', 'shipping_operation', 
  'financial_adjustment', 'user_role_change', 'system_setting_change', 'system_startup', 'system_diagnostics'
]);
export const auditActionEnum = pgEnum('audit_action', [
  'create', 'update', 'delete', 'view', 'approve', 'reject', 'login', 'logout', 'export', 'import'
]);
export const permissionScopeEnum = pgEnum('permission_scope', [
  'system', 'module', 'operation', 'record', 'field'
]);

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

// Warehouse stock table (enhanced with quality and batch tracking)
export const warehouseStock = pgTable("warehouse_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => purchases.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  batchId: varchar("batch_id").references(() => warehouseBatches.id), // Link to batch for traceability
  warehouse: varchar("warehouse").notNull(), // FIRST, FINAL
  status: varchar("status").notNull().default('AWAITING_DECISION'),
  qualityGrade: qualityGradeEnum("quality_grade").default('ungraded'),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  lastInspectionId: varchar("last_inspection_id").references(() => qualityInspections.id),
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

// Shipping and Logistics Tables

// Shipment status enum
export const shipmentStatusEnum = pgEnum('shipment_status', ['pending', 'in_transit', 'delivered', 'cancelled', 'delayed']);

// Shipment method enum
export const shipmentMethodEnum = pgEnum('shipment_method', ['sea_freight', 'air_freight', 'land_transport', 'courier']);

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
  batchNumber: varchar("batch_number").notNull().unique(),
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
  inspectionNumber: varchar("inspection_number").notNull().unique(),
  batchId: varchar("batch_id").references(() => warehouseBatches.id),
  purchaseId: varchar("purchase_id").references(() => purchases.id),
  warehouseStockId: varchar("warehouse_stock_id").references(() => warehouseStock.id),
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
  consumptionNumber: varchar("consumption_number").notNull().unique(),
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
  operationNumber: varchar("operation_number").notNull().unique(),
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
  transferNumber: varchar("transfer_number").notNull().unique(),
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
  adjustmentNumber: varchar("adjustment_number").notNull().unique(),
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
  requestNumber: varchar("request_number").notNull().unique(),
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
});

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

// Shipping types
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = z.infer<typeof insertShipmentItemSchema>;

export type ShippingCost = typeof shippingCosts.$inferSelect;
export type InsertShippingCost = z.infer<typeof insertShippingCostSchema>;

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
  costBreakdown: Array<{
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
  method: z.enum(['sea_freight', 'air_freight', 'land_transport', 'courier']),
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
  method: z.enum(['sea_freight', 'air_freight', 'land_transport', 'courier']).optional(),
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
