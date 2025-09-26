/**
 * Sales order enums and constants
 */

export enum SalesOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export const SALES_ORDER_STATUS = SalesOrderStatus;

export const salesOrderStatusLabels: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.DRAFT]: 'Draft',
  [SalesOrderStatus.PENDING]: 'Pending',
  [SalesOrderStatus.CONFIRMED]: 'Confirmed',
  [SalesOrderStatus.PROCESSING]: 'Processing',
  [SalesOrderStatus.SHIPPED]: 'Shipped',
  [SalesOrderStatus.DELIVERED]: 'Delivered',
  [SalesOrderStatus.COMPLETED]: 'Completed',
  [SalesOrderStatus.CANCELLED]: 'Cancelled',
  [SalesOrderStatus.RETURNED]: 'Returned'
};

export const salesOrderStatusOptions = Object.entries(salesOrderStatusLabels).map(([value, label]) => ({
  value,
  label
}));

export const salesOrderStatusColors: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.DRAFT]: 'gray',
  [SalesOrderStatus.PENDING]: 'orange',
  [SalesOrderStatus.CONFIRMED]: 'blue',
  [SalesOrderStatus.PROCESSING]: 'purple',
  [SalesOrderStatus.SHIPPED]: 'indigo',
  [SalesOrderStatus.DELIVERED]: 'green',
  [SalesOrderStatus.COMPLETED]: 'green',
  [SalesOrderStatus.CANCELLED]: 'red',
  [SalesOrderStatus.RETURNED]: 'yellow'
};