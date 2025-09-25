import { z } from 'zod';
import { CapitalEntryType, RevenueEntryType, ReinvestmentAllocationPolicy, PeriodStatus } from '../enums/capital';

export const zCapitalEntryType = z.enum(CapitalEntryType);
export const zRevenueEntryType = z.enum(RevenueEntryType);
export const zReinvestmentAllocationPolicy = z.enum(ReinvestmentAllocationPolicy);
export const zPeriodStatus = z.enum(PeriodStatus);