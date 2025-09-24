import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core";

// ===== APPROVAL ENUMS =====
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'cancelled', 'escalated']);
export const approvalOperationTypeEnum = pgEnum('approval_operation_type', [
  'capital_entry', 'purchase', 'sale_order', 'warehouse_operation', 'shipping_operation', 
  'financial_adjustment', 'user_role_change', 'system_setting_change', 'system_startup', 'system_diagnostics',
  'operating_expense', 'supply_purchase', 'supply_create', 'supply_consumption', 'expense_category_create',
  'revenue_management', 'notification_delivery', 'monitoring_check', 'hourly_stats', 'notification_configuration'
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create', 'update', 'delete', 'view', 'approve', 'reject', 'login', 'logout', 'export', 'import', 'validate', 'auto_correct', 'password_reset_failed'
]);

export const permissionScopeEnum = pgEnum('permission_scope', [
  'system', 'module', 'operation', 'record', 'field'
]);

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

// ===== APPROVAL RELATIONS =====
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

// ===== APPROVAL TYPES =====

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