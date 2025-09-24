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

// ===== PURCHASES ENUMS =====
export const qualityGradeEnum = pgEnum('quality_grade', ['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'advance', 'credit', 'bank_transfer', 'check']);
export const fundingSourceEnum = pgEnum('funding_source', ['capital', 'external', 'credit_line', 'retained_earnings']);
export const purchaseStatusEnum = pgEnum('purchase_status', ['pending', 'partial', 'paid', 'cancelled', 'on_hold']);

// ===== PURCHASES TABLES =====

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  tradeName: varchar("trade_name"),
  country: varchar("country"),
  notes: text("notes"),
  qualityGrading: qualityGradeEnum("quality_grading").default('ungraded'),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  advanceBalance: decimal("advance_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  creditBalance: decimal("credit_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  lastAdvanceDate: timestamp("last_advance_date"),
  paymentTerms: varchar("payment_terms").default('cash'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier quality assessments table
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

// ===== PURCHASES RELATIONS =====
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

// ===== PURCHASES TYPES =====

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