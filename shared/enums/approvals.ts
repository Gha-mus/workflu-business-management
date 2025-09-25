// Approval workflow related enums

export const ApprovalStatus = ['pending', 'approved', 'rejected', 'cancelled', 'escalated'] as const;
export type ApprovalStatus = typeof ApprovalStatus[number];

export const ApprovalOperationType = [
  'capital_entry', 'purchase', 'sale_order', 'financial_adjustment', 
  'user_role_change', 'system_setting_change', 'warehouse_operation',
  'shipping_operation', 'operating_expense', 'supply_purchase', 'notification_delivery', 'monitoring_check'
] as const;
export type ApprovalOperationType = typeof ApprovalOperationType[number];

export const AuditAction = ['create', 'update', 'delete', 'approve', 'reject', 'escalate', 'export', 'view', 'login', 'logout', 'import', 'validate', 'auto_correct', 'password_reset_failed'] as const;
export type AuditAction = typeof AuditAction[number];