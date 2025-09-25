// Notification and alert related enums

export const NotificationStatus = ['pending', 'sent', 'failed', 'read', 'dismissed'] as const;
export type NotificationStatus = typeof NotificationStatus[number];

export const NotificationChannel = ['in_app', 'email', 'sms', 'webhook'] as const;
export type NotificationChannel = typeof NotificationChannel[number];

export const NotificationPriority = ['low', 'medium', 'high', 'critical'] as const;
export type NotificationPriority = typeof NotificationPriority[number];

export const AlertType = [
  'system', 'business', 'security', 'compliance', 'performance', 'data_quality'
] as const;
export type AlertType = typeof AlertType[number];

export const AlertCategory = [
  'capital_threshold', 'inventory_low', 'quality_issue', 'approval_pending',
  'deadline_approaching', 'system_health'
] as const;
export type AlertCategory = typeof AlertCategory[number];

export const NotificationFrequency = ['immediate', 'daily_digest', 'weekly_summary', 'monthly_report'] as const;
export type NotificationFrequency = typeof NotificationFrequency[number];

export const CommunicationStatus = ['pending', 'completed', 'follow_up_required'] as const;
export type CommunicationStatus = typeof CommunicationStatus[number];