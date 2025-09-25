// Purchase and supplier related enums

export const PurchaseStatus = ['pending', 'partial', 'paid', 'cancelled', 'on_hold'] as const;
export type PurchaseStatus = typeof PurchaseStatus[number];

export const RefundMethod = ['credit_balance', 'capital_refund', 'advance_credit'] as const;
export type RefundMethod = typeof RefundMethod[number];

export const PaymentMethod = ['cash', 'advance', 'credit', 'bank_transfer', 'check'] as const;
export type PaymentMethod = typeof PaymentMethod[number];

export const FundingSource = ['capital', 'external', 'credit_line', 'retained_earnings'] as const;
export type FundingSource = typeof FundingSource[number];