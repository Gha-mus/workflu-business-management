import { z } from 'zod';
import { ApprovalStatus, ApprovalOperationType, AuditAction } from '../enums/approvals';

export const zApprovalStatus = z.enum(ApprovalStatus);
export const zApprovalOperationType = z.enum(ApprovalOperationType);
export const zAuditAction = z.enum(AuditAction);