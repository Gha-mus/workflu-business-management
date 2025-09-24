import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core";

// ===== CAPITAL ENUMS =====
export const capitalEntryTypeEnum = pgEnum('capital_entry_type', [
  'CapitalIn', 'CapitalOut', 'Reverse', 'Reclass', 'Opening'
]);

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

// ===== CAPITAL RELATIONS =====
export const capitalEntriesRelations = relations(capitalEntries, ({ one }) => ({
  createdBy: one(users, {
    fields: [capitalEntries.createdBy],
    references: [users.id],
  }),
}));

// ===== CAPITAL TYPES =====

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