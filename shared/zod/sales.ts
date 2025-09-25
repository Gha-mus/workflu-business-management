import { z } from 'zod';
import { CustomerCategory, SalesOrderStatus, PaymentTerms } from '../enums/sales';

export const zCustomerCategory = z.enum(CustomerCategory);
export const zSalesOrderStatus = z.enum(SalesOrderStatus);
export const zPaymentTerms = z.enum(PaymentTerms);