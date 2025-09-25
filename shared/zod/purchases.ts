import { z } from 'zod';
import { PurchaseStatus, PaymentMethod, FundingSource } from '../enums/purchases';

export const zPurchaseStatus = z.enum(PurchaseStatus);
export const zPaymentMethod = z.enum(PaymentMethod);
export const zFundingSource = z.enum(FundingSource);