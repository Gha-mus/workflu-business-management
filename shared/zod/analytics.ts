import { z } from 'zod';
import { 
  ExportStatus, DocumentCategory, DocumentStatus, 
  ComplianceStatus, DocumentAccessLevel 
} from '../enums/analytics';

export const zExportStatus = z.enum(ExportStatus);
export const zDocumentCategory = z.enum(DocumentCategory);
export const zDocumentStatus = z.enum(DocumentStatus);
export const zComplianceStatus = z.enum(ComplianceStatus);
export const zDocumentAccessLevel = z.enum(DocumentAccessLevel);