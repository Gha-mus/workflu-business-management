// Capital and financial related enums

export const CapitalEntryType = ['CapitalIn', 'CapitalOut', 'Reverse', 'Reclass', 'Opening'] as const;
export type CapitalEntryType = typeof CapitalEntryType[number];

export const RevenueEntryType = [
  'revenue_in', 'revenue_out', 'transfer', 'adjustment', 'reversal',
  'customer_refund', 'withdrawal', 'reinvest_out'
] as const;
export type RevenueEntryType = typeof RevenueEntryType[number];

export const ReinvestmentAllocationPolicy = ['aggregate', 'pro_rata', 'specified'] as const;
export type ReinvestmentAllocationPolicy = typeof ReinvestmentAllocationPolicy[number];

export const PeriodStatus = ['open', 'pending_close', 'closed', 'locked'] as const;
export type PeriodStatus = typeof PeriodStatus[number];