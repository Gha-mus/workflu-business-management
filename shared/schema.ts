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

// AI conversations table
export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }),
  conversationData: json('conversation_data'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Periods table for financial periods
export const periods = pgTable('periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: operationStatusEnum('status').notNull().default('pending'),
  isClosed: boolean('is_closed').notNull().default(false),
  closedBy: uuid('closed_by').references(() => users.id),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Period closing logs table
export const periodClosingLogs = pgTable('period_closing_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  periodId: uuid('period_id').notNull().references(() => periods.id),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description'),
  performedBy: uuid('performed_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Period adjustments table
export const periodAdjustments = pgTable('period_adjustments', {
  id: uuid('id').defaultRandom().primaryKey(),
  periodId: uuid('period_id').notNull().references(() => periods.id),
  adjustmentType: varchar('adjustment_type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  description: text('description'),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Export history table
export const exportHistory = pgTable('export_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  exportType: exportTypeEnum('export_type').notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  parameters: json('parameters'),
  recordCount: integer('record_count'),
  status: operationStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  downloadCount: integer('download_count').default(0),
  expiresAt: timestamp('expires_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});

// Export preferences table
export const exportPreferences = pgTable('export_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  preferredFormat: exportTypeEnum('preferred_format').notNull().default('excel'),
  includeHeaders: boolean('include_headers').notNull().default(true),
  dateFormat: varchar('date_format', { length: 20 }).default('YYYY-MM-DD'),
  customFields: json('custom_fields'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflow validations table
export const workflowValidations = pgTable('workflow_validations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowType: varchar('workflow_type', { length: 50 }).notNull(),
  validationRules: json('validation_rules').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').default(0),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Carriers table
export const carriers = pgTable('carriers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  contactInfo: json('contact_info'),
  serviceTypes: json('service_types'),
  isActive: boolean('is_active').notNull().default(true),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shipment items table
export const shipmentItems = pgTable('shipment_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id').references(() => orderItems.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  dimensions: json('dimensions'), // {length, width, height}
  packageType: varchar('package_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Arrival costs table
export const arrivalCosts = pgTable('arrival_costs', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  costType: varchar('cost_type', { length: 50 }).notNull(), // customs, handling, storage, etc.
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  description: text('description'),
  paidDate: timestamp('paid_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sales returns table
export const salesReturns = pgTable('sales_returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  returnNumber: varchar('return_number', { length: 50 }).notNull().unique(),
  reason: text('reason'),
  status: operationStatusEnum('status').notNull().default('pending'),
  refundAmount: decimal('refund_amount', { precision: 15, scale: 2 }),
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shipping costs table
export const shippingCosts = pgTable('shipping_costs', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  carrierId: uuid('carrier_id').references(() => carriers.id),
  baseCost: decimal('base_cost', { precision: 15, scale: 2 }).notNull(),
  fuelSurcharge: decimal('fuel_surcharge', { precision: 15, scale: 2 }),
  additionalFees: decimal('additional_fees', { precision: 15, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
});

// Delivery tracking table
export const deliveryTracking = pgTable('delivery_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id),
  trackingNumber: varchar('tracking_number', { length: 255 }).notNull(),
  status: deliveryTrackingStatusEnum('status').notNull().default('pending'),
  location: varchar('location', { length: 255 }),
  timestamp: timestamp('timestamp').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Quality standards table
export const qualityStandards = pgTable('quality_standards', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  category: varchar('category', { length: 100 }),
  standardName: varchar('standard_name', { length: 255 }).notNull(),
  criteria: json('criteria').notNull(),
  minScore: decimal('min_score', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Quality inspections table
export const qualityInspections = pgTable('quality_inspections', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id').references(() => warehouseBatches.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  inspectorId: uuid('inspector_id').notNull().references(() => users.id),
  qualityStandardId: uuid('quality_standard_id').references(() => qualityStandards.id),
  score: decimal('score', { precision: 5, scale: 2 }),
  grade: qualityGradeEnum('grade'),
  notes: text('notes'),
  status: operationStatusEnum('status').notNull().default('pending'),
  inspectedAt: timestamp('inspected_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inventory consumption table
export const inventoryConsumption = pgTable('inventory_consumption', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id),
  warehouseStockId: uuid('warehouse_stock_id').references(() => warehouseStock.id),
  consumedQuantity: decimal('consumed_quantity', { precision: 15, scale: 2 }).notNull(),
  consumptionType: varchar('consumption_type', { length: 50 }).notNull(), // production, sale, damage, etc.
  referenceId: uuid('reference_id'), // Reference to order, production batch, etc.
  referenceType: varchar('reference_type', { length: 50 }),
  consumedBy: uuid('consumed_by').notNull().references(() => users.id),
  consumedAt: timestamp('consumed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Processing operations table
export const processingOperations = pgTable('processing_operations', {
  id: uuid('id').defaultRandom().primaryKey(),
  operationType: varchar('operation_type', { length: 50 }).notNull(),
  inputProducts: json('input_products'), // [{productId, quantity}]
  outputProducts: json('output_products'), // [{productId, quantity}]
  status: operationStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  operatedBy: uuid('operated_by').notNull().references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Stock transfers table
export const stockTransfers = pgTable('stock_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  transferNumber: varchar('transfer_number', { length: 50 }).notNull().unique(),
  productId: uuid('product_id').notNull().references(() => products.id),
  fromLocationId: uuid('from_location_id').references(() => warehouseStock.id),
  toLocationId: uuid('to_location_id').references(() => warehouseStock.id),
  fromLocation: varchar('from_location', { length: 100 }),
  toLocation: varchar('to_location', { length: 100 }),
  quantity: decimal('quantity', { precision: 15, scale: 2 }).notNull(),
  status: transferStatusEnum('status').notNull().default('pending'),
  initiatedBy: uuid('initiated_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  completedBy: uuid('completed_by').references(() => users.id),
  notes: text('notes'),
  initiatedAt: timestamp('initiated_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inventory adjustments table
export const inventoryAdjustments = pgTable('inventory_adjustments', {
  id: uuid('id').defaultRandom().primaryKey(),
  adjustmentNumber: varchar('adjustment_number', { length: 50 }).notNull().unique(),
  productId: uuid('product_id').notNull().references(() => products.id),
  warehouseStockId: uuid('warehouse_stock_id').references(() => warehouseStock.id),
  adjustmentType: adjustmentTypeEnum('adjustment_type').notNull(),
  quantityBefore: decimal('quantity_before', { precision: 15, scale: 2 }),
  quantityAfter: decimal('quantity_after', { precision: 15, scale: 2 }),
  adjustmentQuantity: decimal('adjustment_quantity', { precision: 15, scale: 2 }).notNull(),
  reason: text('reason'),
  adjustedBy: uuid('adjusted_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  adjustedAt: timestamp('adjusted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Customers table  
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerNumber: varchar('customer_number', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').notNull().default(true),
  customerSince: timestamp('customer_since').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sales orders table (alias for orders)
export const salesOrders = orders;

// Sales order items table (alias for orderItems)
export const salesOrderItems = orderItems;

// Customer communications table
export const customerCommunications = pgTable('customer_communications', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  communicationType: varchar('communication_type', { length: 50 }).notNull(), // email, phone, meeting, etc.
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  direction: varchar('direction', { length: 10 }).notNull(), // inbound, outbound
  status: varchar('status', { length: 20 }).default('sent'),
  communicatedBy: uuid('communicated_by').notNull().references(() => users.id),
  communicatedAt: timestamp('communicated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sales performance metrics table
export const salesPerformanceMetrics = pgTable('sales_performance_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  customerId: uuid('customer_id').references(() => customers.id),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  totalSales: decimal('total_sales', { precision: 15, scale: 2 }).default('0'),
  totalOrders: integer('total_orders').default(0),
  averageOrderValue: decimal('average_order_value', { precision: 15, scale: 2 }),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }),
  customerSatisfactionScore: decimal('customer_satisfaction_score', { precision: 3, scale: 2 }),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Customer credit limits table
export const customerCreditLimits = pgTable('customer_credit_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  isActive: boolean('is_active').notNull().default(true),
  approvedBy: uuid('approved_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Pricing rules table
export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  customerId: uuid('customer_id').references(() => customers.id),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // discount, markup, fixed_price, etc.
  condition: json('condition'), // quantity thresholds, date ranges, etc.
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  valueType: varchar('value_type', { length: 20 }).notNull(), // percentage, fixed_amount
  priority: integer('priority').default(0),
  isActive: boolean('is_active').notNull().default(true),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Financial metrics table
export const financialMetrics = pgTable('financial_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  metricType: varchar('metric_type', { length: 50 }).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  calculationDetails: json('calculation_details'),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Supplies table (alias for suppliers)
export const supplies = suppliers;

// Operating expense categories table
export const operatingExpenseCategories: any = pgTable('operating_expense_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  parentCategoryId: uuid('parent_category_id').references((): any => operatingExpenseCategories.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Operating expenses table
export const operatingExpenses = pgTable('operating_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  expenseNumber: varchar('expense_number', { length: 50 }).notNull().unique(),
  categoryId: uuid('category_id').notNull().references(() => operatingExpenseCategories.id),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  expenseDate: timestamp('expense_date').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  receipts: json('receipts'), // File attachments
  vendor: varchar('vendor', { length: 255 }),
  notes: text('notes'),
  submittedBy: uuid('submitted_by').notNull().references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

// AI conversation types
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

// Period types
export type Period = typeof periods.$inferSelect;
export type InsertPeriod = typeof periods.$inferInsert;

// Period closing log types
export type PeriodClosingLog = typeof periodClosingLogs.$inferSelect;
export type InsertPeriodClosingLog = typeof periodClosingLogs.$inferInsert;

// Period adjustment types
export type PeriodAdjustment = typeof periodAdjustments.$inferSelect;
export type InsertPeriodAdjustment = typeof periodAdjustments.$inferInsert;

// Export history types
export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;

// Export preferences types
export type ExportPreferences = typeof exportPreferences.$inferSelect;
export type InsertExportPreferences = typeof exportPreferences.$inferInsert;

// Workflow validation types
export type WorkflowValidation = typeof workflowValidations.$inferSelect;
export type InsertWorkflowValidation = typeof workflowValidations.$inferInsert;

// Carrier types
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = typeof carriers.$inferInsert;

// Shipment item types
export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = typeof shipmentItems.$inferInsert;

// Arrival cost types
export type ArrivalCost = typeof arrivalCosts.$inferSelect;
export type InsertArrivalCost = typeof arrivalCosts.$inferInsert;

// Sales return types
export type SalesReturn = typeof salesReturns.$inferSelect;
export type InsertSalesReturn = typeof salesReturns.$inferInsert;

// Shipping cost types  
export type ShippingCost = typeof shippingCosts.$inferSelect;
export type InsertShippingCost = typeof shippingCosts.$inferInsert;

// Delivery tracking types
export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type InsertDeliveryTracking = typeof deliveryTracking.$inferInsert;

// Quality standard types
export type QualityStandard = typeof qualityStandards.$inferSelect;
export type InsertQualityStandard = typeof qualityStandards.$inferInsert;

// Quality inspection types
export type QualityInspection = typeof qualityInspections.$inferSelect;
export type InsertQualityInspection = typeof qualityInspections.$inferInsert;

// Inventory consumption types
export type InventoryConsumption = typeof inventoryConsumption.$inferSelect;
export type InsertInventoryConsumption = typeof inventoryConsumption.$inferInsert;

// Processing operation types
export type ProcessingOperation = typeof processingOperations.$inferSelect;
export type InsertProcessingOperation = typeof processingOperations.$inferInsert;

// Stock transfer types
export type StockTransfer = typeof stockTransfers.$inferSelect;
export type InsertStockTransfer = typeof stockTransfers.$inferInsert;

// Inventory adjustment types
export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type InsertInventoryAdjustment = typeof inventoryAdjustments.$inferInsert;

// Customer types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// Customer communication types
export type CustomerCommunication = typeof customerCommunications.$inferSelect;
export type InsertCustomerCommunication = typeof customerCommunications.$inferInsert;

// Sales performance metrics types
export type SalesPerformanceMetric = typeof salesPerformanceMetrics.$inferSelect;
export type InsertSalesPerformanceMetric = typeof salesPerformanceMetrics.$inferInsert;

// Customer credit limit types
export type CustomerCreditLimit = typeof customerCreditLimits.$inferSelect;
export type InsertCustomerCreditLimit = typeof customerCreditLimits.$inferInsert;

// Pricing rule types
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;

// Financial metrics types
export type FinancialMetric = typeof financialMetrics.$inferSelect;
export type InsertFinancialMetric = typeof financialMetrics.$inferInsert;

// Operating expense category types
export type OperatingExpenseCategory = typeof operatingExpenseCategories.$inferSelect;
export type InsertOperatingExpenseCategory = typeof operatingExpenseCategories.$inferInsert;

// Operating expense types
export type OperatingExpense = typeof operatingExpenses.$inferSelect;
export type InsertOperatingExpense = typeof operatingExpenses.$inferInsert;

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
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
  type: z.enum(['investment', 'loan', 'grant', 'profit_retention', 'withdrawal']),
  currency: z.string().length(3, "Currency must be 3 characters"),
});

// Supplier schemas
export const insertSupplierSchema = createInsertSchema(suppliers, {
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
});

// Purchase schemas
export const insertPurchaseSchema = createInsertSchema(purchases, {
  totalAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Total amount must be a positive number" }),
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
  quantity: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, { message: "Quantity must be a non-negative number" }),
  availableQuantity: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, { message: "Available quantity must be a non-negative number" }),
  qualityGrade: z.enum(['A', 'B', 'C', 'D', 'rejected']),
});

export const insertWarehouseBatchSchema = createInsertSchema(warehouseBatches, {
  quantity: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Quantity must be a positive number" }),
  qualityGrade: z.enum(['A', 'B', 'C', 'D', 'rejected']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'failed']),
});

// Revenue schemas
export const insertRevenueTransactionSchema = createInsertSchema(revenueTransactions, {
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a positive number" }),
  type: z.string().min(1, "Type is required"),
});

// Approval schemas
export const insertApprovalRequestSchema = createInsertSchema(approvals, {
  entityType: z.string().min(1, "Entity type is required"),
  status: z.enum(['pending', 'approved', 'rejected', 'escalated']),
});

// Settings schemas
export const insertSettingSchema = createInsertSchema(settings, {
  key: z.string().min(1, "Key is required"),
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
  summary?: {
    trend: 'up' | 'down' | 'stable';
    highlights: string[];
    concerns: string[];
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
  orderFulfillment?: {
    totalOrders: number;
    fulfilledOrders: number;
    fulfillmentRate: number;
  };
  volumeAnalysis?: {
    totalVolume: number;
    averageOrderSize: number;
    volumeTrend: 'up' | 'down' | 'stable';
  };
}