// Analytics and reporting related enums

export const ExportStatus = ['queued', 'processing', 'completed', 'failed', 'cancelled'] as const;
export type ExportStatus = typeof ExportStatus[number];

export const DocumentCategory = [
  'purchase_order', 'invoice', 'contract', 'certificate', 'compliance', 'shipping',
  'quality_report', 'financial_statement', 'other'
] as const;
export type DocumentCategory = typeof DocumentCategory[number];

export const DocumentStatus = ['draft', 'pending_review', 'approved', 'rejected'] as const;
export type DocumentStatus = typeof DocumentStatus[number];

export const ComplianceStatus = ['compliant', 'non_compliant', 'pending_review'] as const;
export type ComplianceStatus = typeof ComplianceStatus[number];

export const DocumentAccessLevel = ['public', 'internal', 'restricted', 'confidential'] as const;
export type DocumentAccessLevel = typeof DocumentAccessLevel[number];