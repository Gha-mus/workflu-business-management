import { createWriteStream } from 'fs';
import { mkdir, unlink, stat, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import * as csv from 'fast-csv';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import archiver from 'archiver';
import { storage } from './storage';
import { aiService } from './services/openai/aiService';
import type { 
  ExportHistory, 
  InsertExportHistory,
  ExportJob,
  InsertExportJob,
  ExportPreferences
} from '@shared/schema';

export class ExportService {
  private readonly exportDir = join(process.cwd(), 'exports');
  private readonly tempDir = join(process.cwd(), 'temp');
  
  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await mkdir(this.exportDir, { recursive: true });
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating export directories:', error);
    }
  }

  /**
   * Create a new export request and process it
   */
  async createExport(params: {
    userId: string;
    exportType: string;
    format: string;
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
    preferences?: {
      emailDelivery?: boolean;
      emailRecipients?: string[] | null;
      compression?: boolean;
      customFields?: unknown;
    };
  }): Promise<ExportHistory> {
    const fileName = this.generateFileName(params.exportType, params.format);
    
    // Create initial export record
    const exportRecord = await storage.createExportRequest({
      userId: params.userId,
      exportType: params.exportType,
      format: params.format,
      fileName,
      parameters: {
        dateRange: params.dateRange,
        filters: params.filters,
        preferences: params.preferences
      },
      status: 'queued'
    });

    // Process export asynchronously
    this.processExport(exportRecord.id, params).catch(error => {
      console.error(`Export processing failed for ${exportRecord.id}:`, error);
      storage.updateExportStatus(exportRecord.id, 'failed').catch(updateError => {
        console.error('Failed to update export status:', updateError);
      });
    });

    return exportRecord;
  }

  /**
   * Process an export request
   */
  private async processExport(
    exportId: string, 
    params: {
      userId: string;
      exportType: string;
      format: string;
      dateRange?: { start: Date; end: Date };
      filters?: Record<string, any>;
      preferences?: {
        emailDelivery?: boolean;
        emailRecipients?: string[] | null;
        compression?: boolean;
        customFields?: unknown;
      };
    }
  ): Promise<void> {
    try {
      // Update status to processing
      await storage.updateExportStatus(exportId, 'processing');

      // Get the data to export
      const data = await this.getExportData(params.exportType, params.filters, params.dateRange);
      
      // Generate the file based on format
      const filePath = await this.generateFile(data, params.exportType, params.format, exportId);
      
      // Optionally compress the file
      const finalPath = params.preferences?.compression 
        ? await this.compressFile(filePath)
        : filePath;

      // Get file stats
      const fileStats = await stat(finalPath);
      
      // Update export record with completion
      await storage.updateExportStatus(
        exportId, 
        'completed', 
        finalPath, 
        fileStats.size
      );

      // Send email if requested
      if (params.preferences?.emailDelivery && params.preferences.emailRecipients) {
        await this.sendExportEmail(
          params.preferences.emailRecipients,
          params.exportType,
          finalPath
        );
      }

      // Schedule cleanup
      this.scheduleCleanup(finalPath, 7 * 24 * 60 * 60 * 1000); // 7 days

    } catch (error) {
      console.error(`Export processing failed for ${exportId}:`, error);
      await storage.updateExportStatus(exportId, 'failed');
      throw error;
    }
  }

  /**
   * Get data for export based on type
   */
  private async getExportData(
    exportType: string, 
    filters?: Record<string, any>,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    switch (exportType) {
      case 'financial_summary':
        return await storage.getFinancialSummary({ 
          startDate: dateRange?.start?.toISOString(), 
          endDate: dateRange?.end?.toISOString() 
        });
        
      case 'purchases':
        const purchases = await storage.getPurchases();
        return this.applyFilters(purchases, filters, dateRange);
        
      case 'capital_entries':
        const entries = await storage.getCapitalEntries();
        return this.applyFilters(entries, filters, dateRange);
        
      case 'warehouse_stock':
        const stock = await storage.getWarehouseStock();
        return this.applyFilters(stock, filters, dateRange);
        
      case 'suppliers':
        return await storage.getSuppliers();
        
      case 'orders':
        const orders = await storage.getOrders();
        return this.applyFilters(orders, filters, dateRange);
        
      case 'trading_activity':
        return await storage.getTradingActivity();
        
      case 'inventory_analytics':
        return await storage.getInventoryAnalytics();
        
      case 'supplier_performance':
        return await storage.getSupplierPerformance();
        
      case 'all':
        return await this.getAllData(filters, dateRange);
        
      default:
        throw new Error(`Unsupported export type: ${exportType}`);
    }
  }

  /**
   * Apply filters and date range to data
   */
  private applyFilters(
    data: any[], 
    filters?: Record<string, any>,
    dateRange?: { start: Date; end: Date }
  ): any[] {
    let filtered = [...data];

    // Apply date range filter
    if (dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date || item.createdAt);
        return itemDate >= dateRange.start && itemDate <= dateRange.end;
      });
    }

    // Apply custom filters
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(item => {
            const itemValue = item[key];
            if (Array.isArray(value)) {
              return value.includes(itemValue);
            }
            return itemValue === value;
          });
        }
      });
    }

    return filtered;
  }

  /**
   * Get all data for comprehensive export
   */
  private async getAllData(
    filters?: Record<string, any>,
    dateRange?: { start: Date; end: Date }
  ): Promise<Record<string, any[]>> {
    const [
      purchases,
      capitalEntries,
      warehouseStock,
      suppliers,
      orders,
      financialSummary,
      tradingActivity,
      inventoryAnalytics,
      supplierPerformance
    ] = await Promise.all([
      storage.getPurchases(),
      storage.getCapitalEntries(),
      storage.getWarehouseStock(),
      storage.getSuppliers(),
      storage.getOrders(),
      storage.getFinancialSummary({ startDate: dateRange?.start?.toISOString(), endDate: dateRange?.end?.toISOString() }),
      storage.getTradingActivity(),
      storage.getInventoryAnalytics(),
      storage.getSupplierPerformance()
    ]);

    return {
      purchases: this.applyFilters(purchases, filters, dateRange),
      capitalEntries: this.applyFilters(capitalEntries, filters, dateRange),
      warehouseStock: this.applyFilters(warehouseStock, filters, dateRange),
      suppliers,
      orders: this.applyFilters(orders, filters, dateRange),
      financialSummary: [financialSummary],
      tradingActivity: [tradingActivity],
      inventoryAnalytics: [inventoryAnalytics],
      supplierPerformance: [supplierPerformance]
    };
  }

  /**
   * Generate file based on format
   */
  private async generateFile(
    data: any, 
    exportType: string, 
    format: string, 
    exportId: string
  ): Promise<string> {
    const fileName = this.generateFileName(exportType, format, exportId);
    const filePath = join(this.exportDir, fileName);

    switch (format.toLowerCase()) {
      case 'csv':
        return await this.generateCSV(data, filePath, exportType);
      case 'excel':
        return await this.generateExcel(data, filePath, exportType);
      case 'pdf':
        return await this.generatePDF(data, filePath, exportType);
      case 'json':
        return await this.generateJSON(data, filePath);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate CSV file using fast-csv
   */
  private async generateCSV(data: any, filePath: string, exportType: string): Promise<string> {
    await mkdir(dirname(filePath), { recursive: true });

    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      
      // Handle different data structures
      let csvData: any[];
      
      if (Array.isArray(data)) {
        csvData = data;
      } else if (typeof data === 'object' && data !== null) {
        // For complex objects (like financial summary), flatten the structure
        csvData = this.flattenForCSV(data, exportType);
      } else {
        csvData = [{ value: data }];
      }

      // Ensure we have data to write
      if (csvData.length === 0) {
        csvData = [{ message: 'No data available' }];
      }

      csv
        .write(csvData, { 
          headers: true,
          delimiter: ',',
          quote: '"',
          escape: '"',
          includeEndRowDelimiter: true
        })
        .pipe(writeStream)
        .on('finish', () => resolve(filePath))
        .on('error', reject);
    });
  }

  /**
   * Generate Excel file using exceljs
   */
  private async generateExcel(data: any, filePath: string, exportType: string): Promise<string> {
    await mkdir(dirname(filePath), { recursive: true });
    
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'WorkFlu Export System';
    workbook.lastModifiedBy = 'WorkFlu Export System';
    workbook.created = new Date();
    workbook.modified = new Date();

    if (Array.isArray(data)) {
      // Single sheet for array data
      const worksheet = workbook.addWorksheet(exportType.replace('_', ' ').toUpperCase());
      this.populateWorksheet(worksheet, data);
    } else if (typeof data === 'object' && data !== null) {
      // Multiple sheets for complex data
      Object.keys(data).forEach(key => {
        const sheetData = data[key];
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          const worksheet = workbook.addWorksheet(key.replace('_', ' ').toUpperCase());
          this.populateWorksheet(worksheet, sheetData);
        }
      });
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Populate Excel worksheet with data
   */
  private populateWorksheet(worksheet: ExcelJS.Worksheet, data: any[]): void {
    if (data.length === 0) {
      worksheet.addRow(['No data available']);
      return;
    }

    // Add headers
    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);
    
    // Style headers
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => row[header]);
      worksheet.addRow(values);
    });

    // Auto-fit columns
    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      let maxLength = header.length;
      
      data.forEach(row => {
        const value = String(row[header] || '');
        maxLength = Math.max(maxLength, value.length);
      });
      
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  /**
   * Generate PDF file using pdf-lib
   */
  private async generatePDF(data: any, filePath: string, exportType: string): Promise<string> {
    await mkdir(dirname(filePath), { recursive: true });
    
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    let yPosition = height - 50;

    // Title
    page.drawText(`WorkFlu ${exportType.replace('_', ' ').toUpperCase()} Report`, {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.5)
    });
    yPosition -= 40;

    // Generated timestamp
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    });
    yPosition -= 30;

    // Content
    const content = this.formatDataForPDF(data, exportType);
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (yPosition < 50) {
        // Add new page
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font
        });
      } else {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font
        });
      }
      yPosition -= 15;
    }

    const pdfBytes = await pdfDoc.save();
    await require('fs').promises.writeFile(filePath, pdfBytes);
    return filePath;
  }

  /**
   * Generate JSON file
   */
  private async generateJSON(data: any, filePath: string): Promise<string> {
    await mkdir(dirname(filePath), { recursive: true });
    
    const jsonContent = JSON.stringify(data, null, 2);
    await require('fs').promises.writeFile(filePath, jsonContent, 'utf8');
    return filePath;
  }

  /**
   * Flatten complex data for CSV export
   */
  private flattenForCSV(data: any, exportType: string): any[] {
    if (exportType === 'financial_summary') {
      return [
        {
          total_capital: data.totalCapital,
          total_purchases: data.totalPurchases,
          remaining_balance: data.remainingBalance,
          total_stock_value: data.totalStockValue,
          generated_at: new Date().toISOString()
        }
      ];
    }
    
    // For other complex objects, create key-value pairs
    return Object.keys(data).map(key => ({
      property: key,
      value: JSON.stringify(data[key])
    }));
  }

  /**
   * Format data for PDF display
   */
  private formatDataForPDF(data: any, exportType: string): string {
    if (Array.isArray(data)) {
      return data.map((item, index) => 
        `Item ${index + 1}:\n${JSON.stringify(item, null, 2)}`
      ).join('\n\n');
    }
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Compress file using archiver
   */
  private async compressFile(filePath: string): Promise<string> {
    const compressedPath = filePath + '.zip';
    
    return new Promise((resolve, reject) => {
      const output = createWriteStream(compressedPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(compressedPath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.file(filePath, { name: require('path').basename(filePath) });
      archive.finalize();
    });
  }

  /**
   * Send export via email
   */
  private async sendExportEmail(
    recipients: string[], 
    exportType: string, 
    filePath: string
  ): Promise<void> {
    // Implementation depends on email service (nodemailer, etc.)
    console.log(`Would send export ${exportType} to ${recipients.join(', ')}`);
    // TODO: Implement actual email sending
  }

  /**
   * Schedule file cleanup
   */
  private scheduleCleanup(filePath: string, delayMs: number): void {
    setTimeout(async () => {
      try {
        await unlink(filePath);
        console.log(`Cleaned up export file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to clean up file ${filePath}:`, error);
      }
    }, delayMs);
  }

  /**
   * Generate unique filename
   */
  private generateFileName(exportType: string, format: string, exportId?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = exportId ? `_${exportId.substring(0, 8)}` : '';
    return `${exportType}_${timestamp}${id}.${format}`;
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports(): Promise<void> {
    try {
      await storage.deleteExpiredExports();
      
      // Also clean up physical files
      const files = await readdir(this.exportDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const file of files) {
        const filePath = join(this.exportDir, file);
        try {
          const stats = await stat(filePath);
          if (now - stats.mtime.getTime() > maxAge) {
            await unlink(filePath);
            console.log(`Cleaned up expired file: ${file}`);
          }
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during export cleanup:', error);
    }
  }

  /**
   * Get export download URL
   */
  getDownloadUrl(exportId: string): string {
    return `/api/exports/download/${exportId}`;
  }

  /**
   * Get export file path for download
   */
  async getExportFile(exportId: string, userId: string): Promise<string> {
    try {
      const exportRecord = await storage.getExportJob(exportId);
      
      if (!exportRecord) {
        throw new Error('Export not found');
      }
      
      // Check if user owns this export
      if (exportRecord.userId !== userId) {
        throw new Error('Access denied');
      }
      
      if (exportRecord.status !== 'completed') {
        throw new Error('Export not completed yet');
      }
      
      if (!exportRecord.filePath) {
        throw new Error('Export file not available');
      }
      
      // Verify file exists
      try {
        await stat(exportRecord.filePath);
        return exportRecord.filePath;
      } catch (error) {
        throw new Error('Export file not found on disk');
      }
    } catch (error) {
      console.error(`Error getting export file ${exportId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule an export job
   */
  async scheduleExport(params: {
    userId: string;
    exportType: string;
    format: string;
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      time: string;
    };
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
    preferences?: {
      emailDelivery?: boolean;
      emailRecipients?: string[] | null;
      compression?: boolean;
      customFields?: unknown;
    };
  }): Promise<ExportJob> {
    try {
      // For now, create immediate export since scheduling infrastructure isn't set up
      // In a full implementation, this would create a scheduled job
      const exportRecord = await this.createExport({
        userId: params.userId,
        exportType: params.exportType,
        format: params.format,
        dateRange: params.dateRange,
        filters: params.filters,
        preferences: params.preferences
      });
      
      // Convert ExportHistory to ExportJob format
      const job: ExportJob = {
        id: exportRecord.id,
        userId: params.userId,
        jobName: `${params.exportType}_export_${exportRecord.id}`,
        exportType: params.exportType,
        format: params.format,
        createdAt: exportRecord.createdAt || new Date(),
        updatedAt: new Date(),
        parameters: exportRecord.parameters as any,
        emailRecipients: params.preferences?.emailRecipients || null,
        schedule: params.schedule ? JSON.stringify(params.schedule) : '',
        nextRun: null,
        lastRun: null,
        isActive: true
      };
      
      return job;
    } catch (error) {
      console.error('Error scheduling export:', error);
      throw error;
    }
  }

  /**
   * Validate export parameters
   */
  validateExportParams(params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.exportType) {
      errors.push('Export type is required');
    }

    if (!params.format) {
      errors.push('Export format is required');
    }

    const validTypes = [
      'financial_summary', 'purchases', 'capital_entries', 'warehouse_stock',
      'suppliers', 'orders', 'trading_activity', 'inventory_analytics',
      'supplier_performance', 'all'
    ];

    if (params.exportType && !validTypes.includes(params.exportType)) {
      errors.push(`Invalid export type. Must be one of: ${validTypes.join(', ')}`);
    }

    const validFormats = ['csv', 'excel', 'pdf', 'json'];
    if (params.format && !validFormats.includes(params.format.toLowerCase())) {
      errors.push(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const exportService = new ExportService();