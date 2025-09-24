import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
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
import { users } from "./core";
import { qualityGradeEnum, suppliers, orders, purchases } from "./purchases";

// ===== WAREHOUSE ENUMS =====
export const warehouseStockStatusEnum = pgEnum('warehouse_stock_status', [
  'AWAITING_DECISION', 'FILTERING', 'FILTERED', 'PACKED', 'RESERVED', 'CONSUMED',
  'READY_TO_SHIP', 'NON_CLEAN', 'READY_FOR_SALE', 'AWAITING_FILTER'
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

// ===== WAREHOUSE RELATIONS =====
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

// ===== WAREHOUSE TYPES =====

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