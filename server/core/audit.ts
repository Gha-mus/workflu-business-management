import { db } from "./db";
import { auditLogs, type InsertAuditLog } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import type { Request } from "express";

// Audit context for tracking business operations
interface AuditContext {
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  businessContext?: string;
  source?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

// Change tracking for database operations
interface ChangeRecord {
  entityType: string;
  entityId?: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject' | 'login' | 'logout' | 'export' | 'import';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  description: string;
  businessContext?: string;
  financialImpact?: number;
  currency?: string;
  operationType?: string;
  approvalRequestId?: string;
  approvalStatus?: string;
  approverComments?: string;
}

class AuditService {
  private static instance: AuditService;

  private constructor() {
    console.log("AuditService initialized for comprehensive business operation tracking");
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Generate correlation ID for grouping related operations
   */
  public generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  /**
   * Calculate checksum for data integrity verification
   */
  private calculateChecksum(data: any): string {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(jsonString).digest('hex').substring(0, 32);
  }

  /**
   * Extract audit context from HTTP request
   */
  public extractRequestContext(req: any): AuditContext {
    const user = req.user?.claims;
    return {
      userId: user?.sub,
      userName: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      userRole: req.userData?.role,
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0],
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionID,
      source: 'api',
      severity: 'info'
    };
  }

  /**
   * Log a business operation with comprehensive tracking
   */
  public async logOperation(
    context: AuditContext,
    change: ChangeRecord
  ): Promise<void> {
    try {
      const auditData: InsertAuditLog = {
        action: change.action,
        entityType: change.entityType,
        entityId: change.entityId,
        operationType: change.operationType as any,
        
        oldValues: change.oldValues || null,
        newValues: change.newValues || null,
        changedFields: change.changedFields || null,
        
        description: change.description,
        businessContext: context.businessContext || null,
        correlationId: context.correlationId || null,
        sessionId: context.sessionId || null,
        
        financialImpact: change.financialImpact ? change.financialImpact.toString() : null,
        currency: change.currency || 'USD',
        
        userId: context.userId || null,
        userName: context.userName || null,
        userRole: context.userRole as any,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        
        approvalRequestId: change.approvalRequestId || null,
        approvalStatus: change.approvalStatus as any,
        approverComments: change.approverComments || null,
        
        source: context.source || 'system',
        severity: context.severity || 'info',
        
        // Data integrity
        checksum: this.calculateChecksum({
          action: change.action,
          entityType: change.entityType,
          entityId: change.entityId,
          oldValues: change.oldValues,
          newValues: change.newValues,
          userId: context.userId,
          timestamp: new Date()
        })
      };

      await db.insert(auditLogs).values(auditData);
      
      // Log critical operations
      if (context.severity === 'critical' || context.severity === 'error') {
        console.error(`CRITICAL AUDIT EVENT: ${change.action} on ${change.entityType} by ${context.userName} (${context.userId})`);
      }
      
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw error to avoid disrupting business operations
      // Instead log to system error logs
      console.error(`AUDIT FAILURE: Unable to log ${change.action} on ${change.entityType} for user ${context.userId}`, error);
    }
  }

  /**
   * Log user authentication events
   */
  public async logAuthEvent(
    context: AuditContext,
    action: 'login' | 'logout',
    success: boolean = true
  ): Promise<void> {
    await this.logOperation(context, {
      entityType: 'user_session',
      entityId: context.userId,
      action,
      description: `User ${action} ${success ? 'successful' : 'failed'}`,
      businessContext: `Authentication event for user ${context.userName}`,
      newValues: success ? { status: 'authenticated', loginTime: new Date().toISOString() } : { status: 'failed', attempt: new Date().toISOString() }
    });
  }

  /**
   * Log capital entry operations with financial impact
   */
  public async logCapitalEntry(
    context: AuditContext,
    action: 'create' | 'update' | 'delete',
    entryData: any,
    oldData?: any
  ): Promise<void> {
    const financialImpact = parseFloat(entryData.amount || '0');
    const impactDirection = entryData.type === 'CapitalIn' ? 1 : -1;
    
    await this.logOperation(context, {
      entityType: 'capital_entries',
      entityId: entryData.id,
      action,
      description: `${action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'} capital entry ${entryData.entryId || 'N/A'} - ${entryData.type}`,
      businessContext: `Capital management: ${entryData.type} of ${entryData.paymentCurrency} ${entryData.amount}`,
      operationType: 'capital_entry',
      oldValues: oldData || null,
      newValues: entryData,
      changedFields: oldData ? Object.keys(entryData).filter(key => entryData[key] !== oldData[key]) : null,
      financialImpact: financialImpact * impactDirection,
      currency: entryData.paymentCurrency || 'USD'
    });
  }

  /**
   * Log purchase operations with supplier and financial tracking
   */
  public async logPurchase(
    context: AuditContext,
    action: 'create' | 'update' | 'delete',
    purchaseData: any,
    oldData?: any,
    supplierName?: string
  ): Promise<void> {
    const financialImpact = parseFloat(purchaseData.total || '0');
    
    await this.logOperation(context, {
      entityType: 'purchases',
      entityId: purchaseData.id,
      action,
      description: `${action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'} purchase ${purchaseData.purchaseNumber || 'N/A'} from ${supplierName || 'Unknown Supplier'}`,
      businessContext: `Purchase management: ${purchaseData.weight}kg at ${purchaseData.pricePerKg} per kg (${supplierName || 'Unknown Supplier'})`,
      operationType: 'purchase',
      oldValues: oldData || null,
      newValues: purchaseData,
      changedFields: oldData ? Object.keys(purchaseData).filter(key => purchaseData[key] !== oldData[key]) : null,
      financialImpact: -financialImpact, // Negative impact for purchases (outflow)
      currency: purchaseData.currency || 'USD'
    });
  }

  /**
   * Log warehouse operations with inventory tracking
   */
  public async logWarehouseOperation(
    context: AuditContext,
    action: 'create' | 'update' | 'delete',
    stockData: any,
    oldData?: any,
    operationDetails?: string
  ): Promise<void> {
    await this.logOperation(context, {
      entityType: 'warehouse_stock',
      entityId: stockData.id,
      action,
      description: `${action === 'create' ? 'Added to' : action === 'update' ? 'Updated' : 'Removed from'} warehouse: ${operationDetails || 'Stock operation'}`,
      businessContext: `Inventory management: ${stockData.warehouse} warehouse - ${stockData.qtyKgTotal}kg (${stockData.status})`,
      operationType: 'warehouse_operation',
      oldValues: oldData || null,
      newValues: stockData,
      changedFields: oldData ? Object.keys(stockData).filter(key => stockData[key] !== oldData[key]) : null
    });
  }

  /**
   * Log sales operations with customer and revenue tracking
   */
  public async logSalesOperation(
    context: AuditContext,
    action: 'create' | 'update' | 'delete',
    salesData: any,
    oldData?: any,
    customerName?: string
  ): Promise<void> {
    const financialImpact = parseFloat(salesData.totalAmountUsd || salesData.totalAmount || '0');
    
    await this.logOperation(context, {
      entityType: 'sales_orders',
      entityId: salesData.id,
      action,
      description: `${action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'} sales order ${salesData.salesOrderNumber || 'N/A'} for ${customerName || 'Unknown Customer'}`,
      businessContext: `Sales management: Order ${salesData.status} - ${salesData.currency} ${salesData.totalAmount} (${customerName || 'Unknown Customer'})`,
      operationType: 'sale_order',
      oldValues: oldData || null,
      newValues: salesData,
      changedFields: oldData ? Object.keys(salesData).filter(key => salesData[key] !== oldData[key]) : null,
      financialImpact: financialImpact, // Positive impact for sales (inflow)
      currency: salesData.currency || 'USD'
    });
  }

  /**
   * Log shipping operations with delivery tracking
   */
  public async logShippingOperation(
    context: AuditContext,
    action: 'create' | 'update' | 'delete',
    shipmentData: any,
    oldData?: any,
    carrierName?: string
  ): Promise<void> {
    await this.logOperation(context, {
      entityType: 'shipments',
      entityId: shipmentData.id,
      action,
      description: `${action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Deleted'} shipment ${shipmentData.shipmentNumber || 'N/A'} via ${carrierName || 'Unknown Carrier'}`,
      businessContext: `Logistics management: ${shipmentData.status} shipment - ${shipmentData.totalWeight}kg to ${shipmentData.destinationAddress}`,
      operationType: 'shipping_operation',
      oldValues: oldData || null,
      newValues: shipmentData,
      changedFields: oldData ? Object.keys(shipmentData).filter(key => shipmentData[key] !== oldData[key]) : null
    });
  }

  /**
   * Log approval workflow decisions
   */
  public async logApprovalDecision(
    context: AuditContext,
    approvalRequestId: string,
    decision: 'approve' | 'reject' | 'escalate',
    operationType: string,
    operationData: any,
    comments?: string
  ): Promise<void> {
    const action = decision === 'approve' ? 'approve' : 'reject';
    
    await this.logOperation(context, {
      entityType: 'approval_requests',
      entityId: approvalRequestId,
      action,
      description: `${decision.charAt(0).toUpperCase() + decision.slice(1)}d approval request for ${operationType}`,
      businessContext: `Approval workflow: ${decision} decision for ${operationType} operation`,
      operationType: operationType as any,
      approvalRequestId,
      approvalStatus: decision,
      approverComments: comments,
      newValues: { decision, timestamp: new Date().toISOString(), approver: context.userId }
    });
  }

  /**
   * Log system configuration changes
   */
  public async logSystemChange(
    context: AuditContext,
    changeType: 'user_role_change' | 'system_setting_change',
    entityId: string,
    description: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    await this.logOperation({
      ...context,
      severity: 'warning' // System changes are always important
    }, {
      entityType: changeType === 'user_role_change' ? 'users' : 'settings',
      entityId,
      action: 'update',
      description,
      businessContext: `System administration: ${changeType.replace('_', ' ')}`,
      operationType: changeType,
      oldValues,
      newValues,
      changedFields: oldValues && newValues ? Object.keys(newValues).filter(key => newValues[key] !== oldValues[key]) : null
    });
  }

  /**
   * Log data export operations for compliance
   */
  public async logDataExport(
    context: AuditContext,
    exportType: string,
    recordCount: number,
    filters?: any
  ): Promise<void> {
    await this.logOperation({
      ...context,
      severity: 'warning' // Data exports require tracking for compliance
    }, {
      entityType: 'exports',
      action: 'export',
      description: `Exported ${recordCount} ${exportType} records`,
      businessContext: `Data export: ${exportType} export operation`,
      newValues: { exportType, recordCount, filters, exportTime: new Date().toISOString() }
    });
  }

  /**
   * Get audit logs with filtering
   */
  public async getAuditLogs(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    correlationId?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }) {
    // This would be implemented with proper filtering logic
    // For now, return basic query structure
    const query = db.select().from(auditLogs);
    
    // Add filtering logic here based on the filters parameter
    // This is a placeholder for the full implementation
    
    return await query.limit(filters.limit || 100);
  }

  /**
   * Verify audit log integrity using checksums
   */
  public async verifyAuditIntegrity(auditLogId: string): Promise<boolean> {
    try {
      const [auditRecord] = await db.select().from(auditLogs).where(eq(auditLogs.id, auditLogId));
      
      if (!auditRecord || !auditRecord.checksum) {
        return false;
      }

      const recalculatedChecksum = this.calculateChecksum({
        action: auditRecord.action,
        entityType: auditRecord.entityType,
        entityId: auditRecord.entityId,
        oldValues: auditRecord.oldValues,
        newValues: auditRecord.newValues,
        userId: auditRecord.userId,
        timestamp: auditRecord.timestamp
      });

      return recalculatedChecksum === auditRecord.checksum;
    } catch (error) {
      console.error("Failed to verify audit integrity:", error);
      return false;
    }
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance();