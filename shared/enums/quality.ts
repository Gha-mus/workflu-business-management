// Quality control and inspection related enums

export const InspectionType = ['incoming', 'processing', 'outgoing', 'quality_control'] as const;
export type InspectionType = typeof InspectionType[number];

export const InspectionStatus = ['pending', 'in_progress', 'completed', 'failed', 'approved', 'rejected'] as const;
export type InspectionStatus = typeof InspectionStatus[number];

// Quality grade is also used in quality inspections
export const QualityGrade = ['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded'] as const;
export type QualityGrade = typeof QualityGrade[number];