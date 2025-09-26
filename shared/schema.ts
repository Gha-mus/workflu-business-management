/**
 * Database Schema for WorkFlu Business Management System
 */

import { pgTable, serial, uuid, varchar, text, timestamp, decimal, integer, boolean, json, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ========== ENUMS ==========

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'manager', 'employee', 'viewer']);
export const capitalEntryTypeEnum = pgEnum('capital_entry_type', ['investment', 'loan', 'grant', 'profit_retention', 'withdrawal']);
export const purchaseStatusEnum = pgEnum('purchase_status', ['draft', 'pending', 'approved', 'ordered', 'received', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'partial', 'paid', 'overdue', 'cancelled']);
export const warehouseOperationEnum = pgEnum('warehouse_operation', ['inbound', 'outbound', 'transfer', 'adjustment']);
export const qualityGradeEnum = pgEnum('quality_grade', ['A', 'B', 'C', 'D', 'rejected']);
export const operationStatusEnum = pgEnum('operation_status', ['pending', 'in_progress', 'completed', 'cancelled', 'failed']);
export const transferStatusEnum = pgEnum('transfer_status', ['pending', 'in_transit', 'completed', 'cancelled']);
export const adjustmentTypeEnum = pgEnum('adjustment_type', ['increase', 'decrease', 'correction', 'damage', 'expire']);
export const deliveryTrackingStatusEnum = pgEnum('delivery_tracking_status', ['pending', 'picked_up', 'in_transit', 'delivered', 'delayed', 'failed']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'escalated']);
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'warning', 'error', 'success']);
export const documentTypeEnum = pgEnum('document_type', ['invoice', 'receipt', 'contract', 'report', 'certificate']);
export const exportTypeEnum = pgEnum('export_type', ['pdf', 'excel', 'csv', 'json']);

// ========== CORE TABLES ==========

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('employee'),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Capital entries table
export const capitalEntries = pgTable('capital_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  type: capitalEntryTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Suppliers table
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  paymentTerms: integer('payment_terms').default(30),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Products table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  unit: varchar('unit', { length: 50 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }),
  minStockLevel: decimal('min_stock_level', { precision: 15, scale: 2 }).default('0'),
  maxStockLevel: decimal('max_stock_level', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Purchases table
export const purchases = pgTable('purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id),
  status: purchaseStatusEnum('status').notNull().default('draft'),
  orderDate: timestamp('order_date').notNull(),
  expectedDate: timestamp('expected_date'),
  deliveryDate: timestamp('delivery_date'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  notes: text('notes'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Purchase items table
export const purchaseItems = pgTable('purchase_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull(),
  receivedQuantity: decimal('received_quantity', { precision: 15, scale: 2 }).default('0'),
  qualityGrade: qualityGradeEnum('quality_grade'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Warehouse stock table
export const warehouseStock = pgTable('warehouse_stock', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id),
  location: varchar('location', { length: 100 }),
  batchNumber: varchar('batch_number', { length: 100 }),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  reservedQuantity: decimal('reserved_quantity', { precision: 15, scale: 2 }).default('0'),
  availableQuantity: decimal('available_quantity', { precision: 15, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 15, scale: 2 }),
  qualityGrade: qualityGradeEnum('quality_grade'),
  expiryDate: timestamp('expiry_date'),
  receivedDate: timestamp('received_date'),
  lastMovement: timestamp('last_movement'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sales/Orders table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerAddress: text('customer_address'),
  status: purchaseStatusEnum('status').notNull().default('draft'),
  orderDate: timestamp('order_date').notNull(),
  deliveryDate: timestamp('delivery_date'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull(),
  shippedQuantity: decimal('shipped_quantity', { precision: 15, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shipments table
export const shipments = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  orderId: uuid('order_id').references(() => orders.id),
  carrierName: varchar('carrier_name', { length: 255 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  status: deliveryTrackingStatusEnum('status').notNull().default('pending'),
  shippedDate: timestamp('shipped_date'),
  deliveredDate: timestamp('delivered_date'),
  estimatedDelivery: timestamp('estimated_delivery'),
  shippingCost: decimal('shipping_cost', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shipment legs table
export const shipmentLegs = pgTable('shipment_legs', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  legNumber: integer('leg_number').notNull(),
  fromLocation: varchar('from_location', { length: 255 }).notNull(),
  toLocation: varchar('to_location', { length: 255 }).notNull(),
  carrierName: varchar('carrier_name', { length: 255 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  status: deliveryTrackingStatusEnum('status').notNull().default('pending'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  estimatedDate: timestamp('estimated_date'),
  cost: decimal('cost', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Revenue transactions table
export const revenueTransactions = pgTable('revenue_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: varchar('number', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  orderId: uuid('order_id').references(() => orders.id),  
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Reinvestments table
export const reinvestments = pgTable('reinvestments', {
  id: uuid('id').defaultRandom().primaryKey(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  targetArea: varchar('target_area', { length: 255 }),
  expectedReturn: decimal('expected_return', { precision: 5, scale: 2 }),
  status: operationStatusEnum('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Approvals table
export const approvals = pgTable('approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  status: approvalStatusEnum('status').notNull().default('pending'),
  comments: text('comments'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Approval chains table
export const approvalChains = pgTable('approval_chains', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  sequence: integer('sequence').notNull(),
  requiredRole: userRoleEnum('required_role').notNull(),
  minimumAmount: decimal('minimum_amount', { precision: 15, scale: 2 }),
  maximumAmount: decimal('maximum_amount', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
});

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: documentTypeEnum('type').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  oldValues: json('old_values'),
  newValues: json('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Settings table
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export jobs table
export const exportJobs = pgTable('export_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: exportTypeEnum('type').notNull(),
  parameters: json('parameters'),
  status: operationStatusEnum('status').notNull().default('pending'),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  progress: integer('progress').default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User warehouse scopes table
export const userWarehouseScopes = pgTable('user_warehouse_scopes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  warehouseLocation: varchar('warehouse_location', { length: 100 }).notNull(),
  accessLevel: varchar('access_level', { length: 50 }).notNull(),
  canView: boolean('can_view').notNull().default(true),
  canEdit: boolean('can_edit').notNull().default(false),
  canDelete: boolean('can_delete').notNull().default(false),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Approval requests table
export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  status: approvalStatusEnum('status').notNull().default('pending'),
  priority: varchar('priority', { length: 20 }).default('normal'),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  comments: text('comments'),
  approvalChainId: uuid('approval_chain_id').references(() => approvalChains.id),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Settings history table
export const settingsHistory = pgTable('settings_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  changeReason: text('change_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Numbering schemes table
export const numberingSchemes = pgTable('numbering_schemes', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  prefix: varchar('prefix', { length: 10 }),
  suffix: varchar('suffix', { length: 10 }),
  currentNumber: integer('current_number').notNull().default(0),
  numberLength: integer('number_length').notNull().default(6),
  isActive: boolean('is_active').notNull().default(true),
  resetFrequency: varchar('reset_frequency', { length: 20 }), // yearly, monthly, never
  lastReset: timestamp('last_reset'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Configuration snapshots table
export const configurationSnapshots = pgTable('configuration_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  configurationData: json('configuration_data').notNull(),
  version: varchar('version', { length: 50 }),
  isActive: boolean('is_active').notNull().default(false),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Purchase payments table
export const purchasePayments = pgTable('purchase_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  paymentDate: timestamp('payment_date').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  processedBy: uuid('processed_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI insights cache table
export const aiInsightsCache = pgTable('ai_insights_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  cacheKey: varchar('cache_key', { length: 255 }).notNull().unique(),
  insightType: varchar('insight_type', { length: 50 }).notNull(),
  requestParameters: json('request_parameters'),
  responseData: json('response_data'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastAccessed: timestamp('last_accessed').defaultNow().notNull(),
});

// Filter records table
export const filterRecords = pgTable('filter_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  filterName: varchar('filter_name', { length: 255 }),
  filterData: json('filter_data'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Warehouse batches table
export const warehouseBatches = pgTable('warehouse_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull().unique(),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 15, scale: 2 }),
  qualityGrade: qualityGradeEnum('quality_grade'),
  expiryDate: timestamp('expiry_date'),
  manufactureDate: timestamp('manufacture_date'),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  purchaseId: uuid('purchase_id').references(() => purchases.id),
  location: varchar('location', { length: 100 }),
  status: operationStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Withdrawal records table
export const withdrawalRecords = pgTable('withdrawal_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  description: text('description'),
  status: approvalStatusEnum('status').notNull().default('pending'),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ========== TYPE EXPORTS ==========

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Capital entry types
export type CapitalEntry = typeof capitalEntries.$inferSelect;
export type InsertCapitalEntry = typeof capitalEntries.$inferInsert;

// Supplier types
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// Product types
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Purchase types
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type InsertPurchaseItem = typeof purchaseItems.$inferInsert;

// Warehouse types
export type WarehouseStock = typeof warehouseStock.$inferSelect;
export type InsertWarehouseStock = typeof warehouseStock.$inferInsert;
export type WarehouseBatch = typeof warehouseBatches.$inferSelect;
export type InsertWarehouseBatch = typeof warehouseBatches.$inferInsert;

// Order types
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// Shipment types
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;
export type ShipmentLeg = typeof shipmentLegs.$inferSelect;
export type InsertShipmentLeg = typeof shipmentLegs.$inferInsert;

// Revenue types
export type RevenueTransaction = typeof revenueTransactions.$inferSelect;
export type InsertRevenueTransaction = typeof revenueTransactions.$inferInsert;
export type Reinvestment = typeof reinvestments.$inferSelect;
export type InsertReinvestment = typeof reinvestments.$inferInsert;
export type WithdrawalRecord = typeof withdrawalRecords.$inferSelect;
export type InsertWithdrawalRecord = typeof withdrawalRecords.$inferInsert;

// Approval types
export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;
export type ApprovalChain = typeof approvalChains.$inferSelect;
export type InsertApprovalChain = typeof approvalChains.$inferInsert;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Document types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Audit types
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Settings types
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// Export job types
export type ExportJob = typeof exportJobs.$inferSelect;
export type InsertExportJob = typeof exportJobs.$inferInsert;

// User warehouse scope types
export type UserWarehouseScope = typeof userWarehouseScopes.$inferSelect;
export type InsertUserWarehouseScope = typeof userWarehouseScopes.$inferInsert;

// Approval request types
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequests.$inferInsert;

// Settings history types
export type SettingsHistory = typeof settingsHistory.$inferSelect;
export type InsertSettingsHistory = typeof settingsHistory.$inferInsert;

// Numbering scheme types
export type NumberingScheme = typeof numberingSchemes.$inferSelect;
export type InsertNumberingScheme = typeof numberingSchemes.$inferInsert;

// Configuration snapshot types
export type ConfigurationSnapshot = typeof configurationSnapshots.$inferSelect;
export type InsertConfigurationSnapshot = typeof configurationSnapshots.$inferInsert;

// Purchase payment types
export type PurchasePayment = typeof purchasePayments.$inferSelect;
export type InsertPurchasePayment = typeof purchasePayments.$inferInsert;

// AI insights cache types
export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;
export type InsertAiInsightsCache = typeof aiInsightsCache.$inferInsert;

// Filter record types
export type FilterRecord = typeof filterRecords.$inferSelect;
export type InsertFilterRecord = typeof filterRecords.$inferInsert;

// ========== VALIDATION SCHEMAS ==========

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email(),
  name: (schema) => schema.name.min(1),
  role: z.enum(['super_admin', 'admin', 'manager', 'employee', 'viewer']),
});

export const upsertUserSchema = insertUserSchema.partial({ id: true });
export const userRoleUpdateSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'manager', 'employee', 'viewer']),
});

// Capital entry schemas
export const insertCapitalEntrySchema = createInsertSchema(capitalEntries, {
  amount: (schema) => schema.amount.positive(),
  type: z.enum(['investment', 'loan', 'grant', 'profit_retention', 'withdrawal']),
  currency: (schema) => schema.currency.length(3),
});

// Supplier schemas
export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: (schema) => schema.name.min(1),
  email: (schema) => schema.email.email().optional(),
});

// Purchase schemas
export const insertPurchaseSchema = createInsertSchema(purchases, {
  totalAmount: (schema) => schema.totalAmount.positive(),
  status: z.enum(['draft', 'pending', 'approved', 'ordered', 'received', 'cancelled']),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'overdue', 'cancelled']),
});

// Purchase payment schema
export const insertPurchasePaymentSchema = z.object({
  purchaseId: z.string().uuid(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime(),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Purchase return schema
export const purchaseReturnSchema = z.object({
  purchaseId: z.string().uuid(),
  items: z.array(z.object({
    purchaseItemId: z.string().uuid(),
    returnQuantity: z.number().positive(),
    reason: z.string(),
  })),
  notes: z.string().optional(),
});

// Supplier advance schemas
export const supplierAdvanceIssueSchema = z.object({
  supplierId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  purpose: z.string(),
  dueDate: z.string().datetime(),
  interestRate: z.number().optional(),
});

export const supplierAdvanceConsumeSchema = z.object({
  advanceId: z.string().uuid(),
  purchaseId: z.string().uuid(),
  amount: z.number().positive(),
});

// Supplier quality assessment schema
export const insertSupplierQualityAssessmentSchema = z.object({
  supplierId: z.string().uuid(),
  qualityScore: z.number().min(0).max(100),
  deliveryScore: z.number().min(0).max(100),
  serviceScore: z.number().min(0).max(100),
  overallRating: z.number().min(1).max(5),
  comments: z.string().optional(),
  assessedBy: z.string().uuid(),
});

// Warehouse schemas
export const insertWarehouseStockSchema = createInsertSchema(warehouseStock, {
  quantity: (schema) => schema.quantity.nonnegative(),
  availableQuantity: (schema) => schema.availableQuantity.nonnegative(),
  qualityGrade: z.enum(['A', 'B', 'C', 'D', 'rejected']),
});

export const insertWarehouseBatchSchema = createInsertSchema(warehouseBatches, {
  quantity: (schema) => schema.quantity.positive(),
  qualityGrade: z.enum(['A', 'B', 'C', 'D', 'rejected']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'failed']),
});

// Revenue schemas
export const insertRevenueTransactionSchema = createInsertSchema(revenueTransactions, {
  amount: (schema) => schema.amount.positive(),
  type: (schema) => schema.type.min(1),
});

// Approval schemas
export const insertApprovalRequestSchema = createInsertSchema(approvals, {
  entityType: (schema) => schema.entityType.min(1),
  status: z.enum(['pending', 'approved', 'rejected', 'escalated']),
});

// Settings schemas
export const insertSettingSchema = createInsertSchema(settings, {
  key: (schema) => schema.key.min(1),
});

// Filter record schemas
export const insertFilterRecordSchema = createInsertSchema(filterRecords, {
  entityType: (schema) => schema.entityType.min(1),
});

// User warehouse scope schemas
export const insertUserWarehouseScopeSchema = createInsertSchema(userWarehouseScopes, {
  warehouseLocation: (schema) => schema.warehouseLocation.min(1),
  accessLevel: (schema) => schema.accessLevel.min(1),
});

// Export type schema
export const exportTypeSchema = z.enum(['pdf', 'excel', 'csv', 'json']);

// ========== UTILITY TYPES ==========

export type AllowedRole = 'super_admin' | 'admin' | 'manager' | 'employee' | 'viewer';

// Financial summary response type
export interface FinancialSummaryResponse {
  totalCapital: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
  currency: string;
  period: {
    start: Date;
    end: Date;
  };
}

// Inventory analytics response type
export interface InventoryAnalyticsResponse {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStockLevel: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    value: number;
  }>;
}

// Supplier performance response type
export interface SupplierPerformanceResponse {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalValue: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  averageRating: number;
  lastOrderDate?: Date;
}

// Trading activity response type
export interface TradingActivityResponse {
  totalPurchases: number;
  totalSales: number;
  profitMargin: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: 'purchase' | 'sale';
    amount: number;
    date: Date;
    description: string;
  }>;
}