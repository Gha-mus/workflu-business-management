/**
 * Warehouse operation enums and constants
 */

export enum QualityGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  REJECTED = 'rejected'
}

export enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum TransferStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum AdjustmentType {
  INCREASE = 'increase',
  DECREASE = 'decrease',
  CORRECTION = 'correction',
  DAMAGE = 'damage',
  EXPIRE = 'expire'
}

export enum WarehouseAccessLevel {
  VIEW_ONLY = 'view_only',
  OPERATOR = 'operator',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

// Export constants for backward compatibility
export const QUALITY_GRADE = QualityGrade;
export const OPERATION_STATUS = OperationStatus;
export const TRANSFER_STATUS = TransferStatus;
export const ADJUSTMENT_TYPE = AdjustmentType;
export const WAREHOUSE_ACCESS_LEVEL = WarehouseAccessLevel;

// Labels for UI display
export const qualityGradeLabels: Record<QualityGrade, string> = {
  [QualityGrade.A]: 'Grade A (Premium)',
  [QualityGrade.B]: 'Grade B (Good)',
  [QualityGrade.C]: 'Grade C (Average)',
  [QualityGrade.D]: 'Grade D (Below Average)',
  [QualityGrade.REJECTED]: 'Rejected'
};

export const operationStatusLabels: Record<OperationStatus, string> = {
  [OperationStatus.PENDING]: 'Pending',
  [OperationStatus.IN_PROGRESS]: 'In Progress',
  [OperationStatus.COMPLETED]: 'Completed',
  [OperationStatus.CANCELLED]: 'Cancelled',
  [OperationStatus.FAILED]: 'Failed'
};

export const transferStatusLabels: Record<TransferStatus, string> = {
  [TransferStatus.PENDING]: 'Pending',
  [TransferStatus.IN_TRANSIT]: 'In Transit',
  [TransferStatus.COMPLETED]: 'Completed',
  [TransferStatus.CANCELLED]: 'Cancelled'
};

export const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  [AdjustmentType.INCREASE]: 'Increase',
  [AdjustmentType.DECREASE]: 'Decrease',
  [AdjustmentType.CORRECTION]: 'Correction',
  [AdjustmentType.DAMAGE]: 'Damage',
  [AdjustmentType.EXPIRE]: 'Expired'
};

export const warehouseAccessLevelLabels: Record<WarehouseAccessLevel, string> = {
  [WarehouseAccessLevel.VIEW_ONLY]: 'View Only',
  [WarehouseAccessLevel.OPERATOR]: 'Operator',
  [WarehouseAccessLevel.MANAGER]: 'Manager',
  [WarehouseAccessLevel.ADMIN]: 'Administrator'
};

// Options arrays for dropdowns
export const qualityGradeOptions = Object.entries(qualityGradeLabels).map(([value, label]) => ({
  value,
  label
}));

export const operationStatusOptions = Object.entries(operationStatusLabels).map(([value, label]) => ({
  value,
  label
}));

export const transferStatusOptions = Object.entries(transferStatusLabels).map(([value, label]) => ({
  value,
  label
}));

export const adjustmentTypeOptions = Object.entries(adjustmentTypeLabels).map(([value, label]) => ({
  value,
  label
}));

export const warehouseAccessLevelOptions = Object.entries(warehouseAccessLevelLabels).map(([value, label]) => ({
  value,
  label
}));

// Color mappings for status displays
export const qualityGradeColors: Record<QualityGrade, string> = {
  [QualityGrade.A]: 'green',
  [QualityGrade.B]: 'blue',
  [QualityGrade.C]: 'yellow',
  [QualityGrade.D]: 'orange',
  [QualityGrade.REJECTED]: 'red'
};

export const operationStatusColors: Record<OperationStatus, string> = {
  [OperationStatus.PENDING]: 'orange',
  [OperationStatus.IN_PROGRESS]: 'blue',
  [OperationStatus.COMPLETED]: 'green',
  [OperationStatus.CANCELLED]: 'gray',
  [OperationStatus.FAILED]: 'red'
};