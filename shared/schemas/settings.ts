import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core";

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

// ===== SETTINGS RELATIONS =====
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

// ===== SETTINGS TYPES =====

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