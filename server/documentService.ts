import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { storage } from './storage';
import { auditService } from './auditService';
import type { 
  Document, 
  InsertDocument, 
  DocumentVersion,
  DocumentCompliance,
  DocumentWithMetadata,
  DocumentSearchRequest,
  DocumentSearchResponse,
  ComplianceDashboard,
  DocumentAnalytics
} from '@shared/schema';

// Document management configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/documents';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Basic MIME type check (will be validated more thoroughly later)
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

export class DocumentService {
  
  /**
   * Validate uploaded file for security and compliance
   */
  static async validateFile(filePath: string, originalName: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fileInfo: {
      size: number;
      mimeType: string;
      extension: string;
      checksum: string;
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      
      // Check file size
      if (fileSize > MAX_FILE_SIZE) {
        errors.push(`File size ${fileSize} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
      }
      
      if (fileSize === 0) {
        errors.push('File is empty');
      }
      
      // Detect actual file type
      const fileType = await fileTypeFromFile(filePath);
      const detectedMimeType = fileType?.mime || mime.lookup(originalName) || 'application/octet-stream';
      
      // Verify MIME type
      if (!ALLOWED_MIME_TYPES.includes(detectedMimeType)) {
        errors.push(`File type ${detectedMimeType} is not allowed`);
      }
      
      // Check for executable files (security)
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
      const extension = path.extname(originalName).toLowerCase();
      if (dangerousExtensions.includes(extension)) {
        errors.push(`File extension ${extension} is not allowed for security reasons`);
      }
      
      // Calculate file checksum for integrity
      const checksum = await this.calculateFileChecksum(filePath);
      
      // Basic content validation for images
      if (detectedMimeType.startsWith('image/')) {
        try {
          const metadata = await sharp(filePath).metadata();
          if (!metadata.width || !metadata.height) {
            warnings.push('Image file may be corrupted');
          }
          if (metadata.width && metadata.height && (metadata.width > 10000 || metadata.height > 10000)) {
            warnings.push('Image dimensions are very large, consider resizing');
          }
        } catch (error) {
          warnings.push('Could not validate image file');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fileInfo: {
          size: fileSize,
          mimeType: detectedMimeType,
          extension,
          checksum
        }
      };
      
    } catch (error) {
      errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings,
        fileInfo: {
          size: 0,
          mimeType: 'unknown',
          extension: '',
          checksum: ''
        }
      };
    }
  }
  
  /**
   * Calculate SHA-256 checksum of a file
   */
  static async calculateFileChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const fileBuffer = await fs.readFile(filePath);
    hash.update(fileBuffer);
    return hash.digest('hex');
  }
  
  /**
   * Generate unique document number based on category
   */
  static async generateDocumentNumber(category: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Category prefix
    const categoryPrefixes: Record<string, string> = {
      'invoice': 'INV',
      'contract': 'CON',
      'compliance_record': 'COM',
      'certificate': 'CER',
      'receipt': 'REC',
      'purchase_order': 'PO',
      'shipping_document': 'SHP',
      'quality_report': 'QUA',
      'financial_statement': 'FIN',
      'audit_document': 'AUD',
      'insurance_policy': 'INS',
      'license': 'LIC',
      'permit': 'PER',
      'regulation_document': 'REG'
    };
    
    const prefix = categoryPrefixes[category] || 'DOC';
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `${prefix}-${year}${month}${day}-${random}`;
  }
  
  /**
   * Process uploaded file and create document record
   */
  static async processFileUpload(
    file: Express.Multer.File,
    documentData: Partial<InsertDocument>,
    userId: string
  ): Promise<{ document: Document; validation: any }> {
    
    // Validate the uploaded file
    const validation = await this.validateFile(file.path, file.originalname);
    
    if (!validation.isValid) {
      // Clean up the file if validation failed
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.warn('Failed to clean up invalid file:', error);
      }
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Generate document number
    const documentNumber = await this.generateDocumentNumber(documentData.category || 'document');
    
    // Prepare document data
    const insertData: InsertDocument = {
      ...documentData,
      documentNumber,
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path,
      contentType: validation.fileInfo.mimeType,
      fileSize: validation.fileInfo.size,
      checksum: validation.fileInfo.checksum,
      createdBy: userId,
      currentVersion: 1,
      isLatestVersion: true
    };
    
    // Create document in database
    const document = await storage.createDocument(insertData, {
      userId,
      userName: 'Document Upload',
      source: 'document_upload',
      businessContext: `Document upload: ${file.originalname}`
    });
    
    // Log document access
    await storage.logDocumentAccess({
      documentId: document.id,
      accessType: 'create',
      accessMethod: 'web',
      userId,
      userName: 'Document Upload',
      userRole: 'user',
      wasSuccessful: true,
      businessContext: 'document_creation'
    });
    
    return { document, validation };
  }
  
  /**
   * Create new document version
   */
  static async createDocumentVersion(
    documentId: string,
    file: Express.Multer.File,
    versionData: {
      changeDescription: string;
      changeReason: string;
      changeType: string;
    },
    userId: string
  ): Promise<{ document: Document; version: DocumentVersion }> {
    
    // Get existing document
    const existingDocument = await storage.getDocument(documentId);
    if (!existingDocument) {
      throw new Error('Document not found');
    }
    
    // Validate the new file
    const validation = await this.validateFile(file.path, file.originalname);
    if (!validation.isValid) {
      await fs.unlink(file.path);
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Create new version
    const newVersion = existingDocument.currentVersion + 1;
    
    // Update document record
    const updatedDocument = await storage.updateDocument(documentId, {
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path,
      contentType: validation.fileInfo.mimeType,
      fileSize: validation.fileInfo.size,
      checksum: validation.fileInfo.checksum,
      currentVersion: newVersion,
      modifiedBy: userId,
      modifiedAt: new Date()
    });
    
    // Create version record
    const version = await storage.createDocumentVersion({
      documentId,
      version: newVersion,
      versionLabel: `v${newVersion}.0`,
      fileName: file.filename,
      filePath: file.path,
      contentType: validation.fileInfo.mimeType,
      fileSize: validation.fileInfo.size,
      checksum: validation.fileInfo.checksum,
      changeDescription: versionData.changeDescription,
      changeReason: versionData.changeReason,
      changeType: versionData.changeType,
      createdBy: userId
    });
    
    // Log version creation
    await storage.logDocumentAccess({
      documentId,
      versionId: version.id,
      accessType: 'edit',
      accessMethod: 'web',
      userId,
      userName: 'Version Creation',
      userRole: 'user',
      wasSuccessful: true,
      businessContext: `version_creation: ${versionData.changeDescription}`
    });
    
    return { document: updatedDocument, version };
  }
  
  /**
   * Search documents with comprehensive filtering
   */
  static async searchDocuments(
    searchRequest: DocumentSearchRequest,
    userId?: string
  ): Promise<DocumentSearchResponse> {
    return await storage.searchDocuments(searchRequest, userId);
  }
  
  /**
   * Get compliance dashboard data
   */
  static async getComplianceDashboard(userId?: string): Promise<ComplianceDashboard> {
    return await storage.getComplianceDashboard(userId);
  }
  
  /**
   * Get document analytics
   */
  static async getDocumentAnalytics(dateFrom?: Date, dateTo?: Date): Promise<DocumentAnalytics> {
    return await storage.getDocumentAnalytics(dateFrom, dateTo);
  }
  
  /**
   * Download document file
   */
  static async downloadDocument(documentId: string, userId: string): Promise<{
    filePath: string;
    fileName: string;
    contentType: string;
  }> {
    const document = await storage.getDocument(documentId, userId);
    if (!document) {
      throw new Error('Document not found or access denied');
    }
    
    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch {
      throw new Error('Document file not found on disk');
    }
    
    // Log document access
    await storage.logDocumentAccess({
      documentId,
      accessType: 'download',
      accessMethod: 'web',
      userId,
      userName: 'Document Download',
      userRole: 'user',
      wasSuccessful: true,
      businessContext: 'document_download'
    });
    
    return {
      filePath: document.filePath,
      fileName: document.originalFileName,
      contentType: document.contentType
    };
  }
  
  /**
   * Delete document and cleanup files
   */
  static async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await storage.getDocument(documentId, userId);
    if (!document) {
      throw new Error('Document not found or access denied');
    }
    
    // Get all versions to clean up files
    const versions = await storage.getDocumentVersions(documentId);
    
    // Delete document from database first
    await storage.deleteDocument(documentId, {
      userId,
      userName: 'Document Deletion',
      source: 'document_management',
      businessContext: `Document deletion: ${document.title}`
    });
    
    // Clean up files
    const filesToDelete = [document.filePath, ...versions.map((v: { filePath: string }) => v.filePath)];
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error);
      }
    }
    
    // Log document deletion
    await storage.logDocumentAccess({
      documentId,
      accessType: 'delete',
      accessMethod: 'web',
      userId,
      userName: 'Document Deletion',
      userRole: 'admin',
      wasSuccessful: true,
      businessContext: 'document_deletion'
    });
  }
  
  /**
   * Check and send compliance reminders
   */
  static async checkComplianceReminders(): Promise<void> {
    const expiringItems = await storage.getExpiringCompliance(30); // 30 days warning
    
    for (const item of expiringItems) {
      // Here you would integrate with notification service
      console.log(`Compliance reminder: ${item.documentTitle} - ${item.requirementName} expires in ${item.daysUntilExpiry} days`);
      
      // Mark reminder as sent
      // await storage.markComplianceReminderSent(item.documentId);
    }
  }
}