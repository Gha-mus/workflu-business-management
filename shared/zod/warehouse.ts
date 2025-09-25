import { z } from 'zod';
import { 
  WarehouseStockStatus, QualityGrade, SupplyType, AdjustmentType, 
  TransferType, OperationType, ExpenseCategory 
} from '../enums/warehouse';

export const zWarehouseStockStatus = z.enum(WarehouseStockStatus);
export const zQualityGrade = z.enum(QualityGrade);
export const zSupplyType = z.enum(SupplyType);
export const zAdjustmentType = z.enum(AdjustmentType);
export const zTransferType = z.enum(TransferType);
export const zOperationType = z.enum(OperationType);
export const zExpenseCategory = z.enum(ExpenseCategory);