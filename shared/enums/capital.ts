/**
 * Capital entry enums and constants
 */

export enum CapitalEntryType {
  INVESTMENT = 'investment',
  LOAN = 'loan',
  GRANT = 'grant',
  PROFIT_RETENTION = 'profit_retention',
  WITHDRAWAL = 'withdrawal'
}

export const CAPITAL_ENTRY_TYPE = CapitalEntryType;

export const capitalEntryTypeLabels: Record<CapitalEntryType, string> = {
  [CapitalEntryType.INVESTMENT]: 'Investment',
  [CapitalEntryType.LOAN]: 'Loan',
  [CapitalEntryType.GRANT]: 'Grant',
  [CapitalEntryType.PROFIT_RETENTION]: 'Profit Retention',
  [CapitalEntryType.WITHDRAWAL]: 'Withdrawal'
};

export const capitalEntryTypeOptions = Object.entries(capitalEntryTypeLabels).map(([value, label]) => ({
  value,
  label
}));