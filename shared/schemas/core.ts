import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== CORE AUTH ENUMS =====
export const userRoleEnum = pgEnum('user_role', ['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker']);
export const authProviderEnum = pgEnum('auth_provider', ['replit', 'supabase']);

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

// ===== CORE AUTH RELATIONS =====
export const usersRelations = relations(users, ({ many }) => ({
  userWarehouseScopes: many(userWarehouseScopes),
}));

export const userWarehouseScopesRelations = relations(userWarehouseScopes, ({ one }) => ({
  user: one(users, {
    fields: [userWarehouseScopes.userId],
    references: [users.id],
  }),
}));

// ===== CORE AUTH TYPES =====

// User insert schema and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = Partial<InsertUser> & { id?: string };

// User warehouse scopes insert schema and types
export const insertUserWarehouseScopeSchema = createInsertSchema(userWarehouseScopes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserWarehouseScope = typeof userWarehouseScopes.$inferSelect;
export type InsertUserWarehouseScope = z.infer<typeof insertUserWarehouseScopeSchema>;