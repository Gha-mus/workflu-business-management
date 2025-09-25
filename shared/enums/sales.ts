// Sales and customer related enums

export const CustomerCategory = ['retail', 'wholesale', 'export', 'domestic', 'distributor', 'processor'] as const;
export type CustomerCategory = typeof CustomerCategory[number];

export const SalesOrderStatus = ['draft', 'confirmed', 'in_progress', 'fulfilled', 'delivered', 'cancelled', 'on_hold'] as const;
export type SalesOrderStatus = typeof SalesOrderStatus[number];

export const PaymentTerms = ['net_15', 'net_30', 'net_45', 'net_60', 'cash_on_delivery', 'advance_payment', 'credit'] as const;
export type PaymentTerms = typeof PaymentTerms[number];