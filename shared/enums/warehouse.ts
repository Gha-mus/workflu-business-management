// Warehouse and inventory related enums

export const WarehouseStockStatus = [
  'AWAITING_DECISION', 'FILTERING', 'FILTERED', 'PACKED', 'RESERVED', 
  'CONSUMED', 'READY_TO_SHIP', 'NON_CLEAN', 'READY_FOR_SALE', 'AWAITING_FILTER'
] as const;
export type WarehouseStockStatus = typeof WarehouseStockStatus[number];

export const QualityGrade = ['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded'] as const;
export type QualityGrade = typeof QualityGrade[number];

export const SupplyType = ['cartons_8kg', 'cartons_20kg', 'labels', 'wraps', 'other'] as const;
export type SupplyType = typeof SupplyType[number];

export const AdjustmentType = ['cycle_count', 'reconciliation', 'correction', 'write_off'] as const;
export type AdjustmentType = typeof AdjustmentType[number];

export const TransferType = ['warehouse_to_warehouse', 'location_to_location', 'batch_split', 'batch_merge'] as const;
export type TransferType = typeof TransferType[number];

export const OperationType = ['washing', 'drying', 'hulling', 'sorting', 'milling'] as const;
export type OperationType = typeof OperationType[number];

export const ExpenseCategory = ['wages', 'rent', 'utilities', 'supplies', 'transfer_fees', 'other'] as const;
export type ExpenseCategory = typeof ExpenseCategory[number];