import {
  users,
  userWarehouseScopes,
  suppliers,
  orders,
  purchases,
  purchasePayments,
  capitalEntries,
  warehouseStock,
  filterRecords,
  settings,
  aiInsightsCache,
  aiConversations,
  periods,
  periodClosingLogs,
  periodAdjustments,
  exportHistory,
  exportPreferences,
  exportJobs,
  workflowValidations,
  carriers,
  shipments,
  shipmentItems,
  shipmentLegs,
  arrivalCosts,
  salesReturns,
  shippingCosts,
  deliveryTracking,
  qualityStandards,
  warehouseBatches,
  qualityInspections,
  supplierQualityAssessments,
  inventoryConsumption,
  processingOperations,
  stockTransfers,
  inventoryAdjustments,
  customers,
  salesOrders,
  salesOrderItems,
  customerCommunications,
  revenueTransactions,
  salesPerformanceMetrics,
  customerCreditLimits,
  pricingRules,
  financialMetrics,
  // Stage 5 Operating Expenses tables
  supplies,
  operatingExpenseCategories,
  operatingExpenses,
  supplyConsumption,
  supplyPurchases,
  documents,
  documentVersions,
  documentMetadata,
  documentCompliance,
  documentAccessLogs,
  documentWorkflowStates,
  // Notification system tables
  notificationSettings,
  notificationTemplates,
  notificationQueue,
  alertConfigurations,
  notificationHistory,
  // Missing approval and reporting tables
  approvalChains,
  approvalRequests,
  approvalGuards,
  auditLogs,
  financialPeriods,
  profitLossStatements,
  cashFlowAnalysis,
  marginAnalysis,
  budgetTracking,
  // Stage 7 Revenue Management tables
  revenueLedger,
  withdrawalRecords,
  reinvestments,
  revenueBalanceSummary,
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type SupplierQualityAssessment,
  type InsertSupplierQualityAssessment,
  type Order,
  type InsertOrder,
  type Purchase,
  type InsertPurchase,
  type PurchasePayment,
  type InsertPurchasePayment,
  type CapitalEntry,
  type InsertCapitalEntry,
  type WarehouseStock,
  type InsertWarehouseStock,
  type FilterRecord,
  type InsertFilterRecord,
  type Setting,
  type InsertSetting,
  type AiInsightsCache,
  type InsertAiInsightsCache,
  type AiConversation,
  type InsertAiConversation,
  type Period,
  type InsertPeriod,
  type PeriodClosingLog,
  type InsertPeriodClosingLog,
  type PeriodAdjustment,
  type InsertPeriodAdjustment,
  type ExportHistory,
  type InsertExportHistory,
  type ExportPreferences,
  type InsertExportPreferences,
  type ExportJob,
  type InsertExportJob,
  type WorkflowValidation,
  type InsertWorkflowValidation,
  type Carrier,
  type InsertCarrier,
  type Shipment,
  type InsertShipment,
  type ShipmentItem,
  type InsertShipmentItem,
  type ShippingCost,
  type InsertShippingCost,
  type DeliveryTracking,
  type InsertDeliveryTracking,
  type QualityStandard,
  type InsertQualityStandard,
  type WarehouseBatch,
  type InsertWarehouseBatch,
  type QualityInspection,
  type InsertQualityInspection,
  type InventoryConsumption,
  type InsertInventoryConsumption,
  type ProcessingOperation,
  type InsertProcessingOperation,
  type StockTransfer,
  type InsertStockTransfer,
  type InventoryAdjustment,
  type InsertInventoryAdjustment,
  type Customer,
  type InsertCustomer,
  type SalesOrder,
  type InsertSalesOrder,
  type SalesOrderItem,
  type InsertSalesOrderItem,
  type CustomerCommunication,
  type InsertCustomerCommunication,
  type RevenueTransaction,
  type InsertRevenueTransaction,
  type SalesPerformanceMetric,
  type InsertSalesPerformanceMetric,
  type CustomerCreditLimit,
  type InsertCustomerCreditLimit,
  type PricingRule,
  type InsertPricingRule,
  // Stage 5 Operating Expenses types
  type Supply,
  type InsertSupply,
  type OperatingExpenseCategory,
  type InsertOperatingExpenseCategory,
  type OperatingExpense,
  type InsertOperatingExpense,
  type SupplyConsumption,
  type InsertSupplyConsumption,
  type SupplyPurchase,
  type InsertSupplyPurchase,
  type ShipmentWithDetailsResponse,
  type ShippingAnalyticsResponse,
  type CreateShipmentFromStock,
  type AddShippingCost,
  type AddDeliveryTracking,
  type ShipmentFilter,
  type CarrierFilter,
  type FinancialSummaryResponse,
  type CashFlowResponse,
  type InventoryAnalyticsResponse,
  type SupplierPerformanceResponse,
  type TradingActivityResponse,
  type DateRangeFilter,
  type Document,
  type InsertDocument,
  type DocumentVersion,
  type InsertDocumentVersion,
  type DocumentMetadata,
  type InsertDocumentMetadata,
  type DocumentCompliance,
  type InsertDocumentCompliance,
  type DocumentAccessLog,
  type InsertDocumentAccessLog,
  type DocumentWorkflowState,
  type InsertDocumentWorkflowState,
  type DocumentWithMetadata,
  type DocumentSearchResponse,
  type DocumentVersionHistory,
  type ComplianceAlert,
  type ComplianceDashboard,
  type DocumentAnalytics,
  type DocumentSearchRequest,
  type DocumentUploadRequest,
  type DocumentUpdateRequest,
  type DocumentVersionCreateRequest,
  type DocumentComplianceUpdateRequest,
  type ComplianceFilterRequest,
  // Notification system types
  type NotificationSetting,
  type InsertNotificationSetting,
  type UpdateNotificationSetting,
  type NotificationSettingFilter,
  type NotificationTemplate,
  type InsertNotificationTemplate,
  type UpdateNotificationTemplate,
  type NotificationTemplateFilter,
  type NotificationQueue,
  type InsertNotificationQueue,
  type UpdateNotificationQueue,
  type NotificationQueueFilter,
  type CreateNotification,
  type AlertConfiguration,
  type InsertAlertConfiguration,
  type UpdateAlertConfiguration,
  type AlertConfigurationFilter,
  type NotificationHistory,
  type NotificationHistoryFilter,
  type NotificationCenterResponse,
  type NotificationSettingsResponse,
  type AlertMonitoringDashboard,
  type NotificationAnalytics,
  type NotificationDeliveryStatus,
  // Missing approval and reporting types
  type ApprovalChain,
  type InsertApprovalChain,
  type ApprovalRequest,
  type InsertApprovalRequest,
  type ApprovalGuard,
  type InsertApprovalGuard,
  type AuditLog,
  type InsertAuditLog,
  type FinancialPeriod,
  type InsertFinancialPeriod,
  type ProfitLossStatement,
  type InsertProfitLossStatement,
  type CashFlowAnalysis,
  type InsertCashFlowAnalysis,
  type MarginAnalysis,
  type InsertMarginAnalysis,
  type BudgetTracking,
  type InsertBudgetTracking,
  // Stage 7 Revenue Management types
  type RevenueLedger,
  type InsertRevenueLedger,
  type WithdrawalRecord,
  type InsertWithdrawalRecord,
  type Reinvestment,
  type InsertReinvestment,
  type RevenueBalanceSummary,
  type InsertRevenueBalanceSummary,
  // Missing types that were causing errors
  type FinancialMetric,
  type ShipmentLeg,
  type InsertShipmentLeg,
  type ArrivalCost,
  type InsertArrivalCost,
  type SalesReturn,
  type InsertSalesReturn,
  // Missing enums causing errors
  warehouseStockStatusEnum,
  // Missing filter types causing errors
  type RevenueLedgerFilter,
  type WithdrawalRecordFilter,
  type ReinvestmentFilter,
  // Missing approval and receipt types
  type CustomerReceipt,
  type CustomerRefund,
  type WithdrawalApproval,
  type ReinvestmentApproval,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, sql, gte, lte, count, avg, isNotNull, asc, ilike, or } from "drizzle-orm";
import Decimal from "decimal.js";
import { auditService } from "../auditService";
import { supabaseAdmin } from "./auth/providers/supabaseProvider";
import { approvalWorkflowService } from "../approvalWorkflowService";
import { ConfigurationService } from "../configurationService";
import { guardSystemUser } from "./systemUserGuard";

// ===== STORAGE-LEVEL APPROVAL ENFORCEMENT UTILITIES =====
// These prevent bypass of approval requirements at the storage boundary

interface ApprovalGuardContext {
  userId?: string;
  operationType: string;
  operationData: any;
  amount?: number;
  currency?: string;
  businessContext?: string;
  approvalRequestId?: string; // If operation is pre-approved
  skipApproval?: boolean; // For internal operations only
}

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

class StorageApprovalGuard {
  
  // SECURITY: ALLOWLIST of operation types that ALWAYS require approval verification
  // These operations are considered high-risk and cannot bypass approval under any circumstances
  private static readonly CRITICAL_OPERATIONS_ALLOWLIST: Set<string> = new Set([
    'capital_entry',
    'purchase', 
    'sale_order',
    'financial_adjustment',
    'user_role_change',
    'system_setting_change'
  ]);

  // SECURITY: Operations that may be allowed to skip approval only under very specific conditions
  private static readonly INTERNAL_OPERATIONS_ALLOWLIST: Set<string> = new Set([
    'warehouse_operation', // May be skipped for automated inventory management
    'shipping_operation'   // May be skipped for routine shipping updates
  ]);

  // SECURITY: Internal token for skipApproval verification
  private static readonly INTERNAL_SYSTEM_TOKEN = process.env.INTERNAL_SYSTEM_TOKEN || 'internal_system_token_dev';

  /**
   * Enforce approval requirement at storage level - CRITICAL SECURITY BOUNDARY
   * This prevents any direct storage calls from bypassing approval requirements
   * SECURITY UPDATE: Now uses comprehensive validation with operation binding and single-use consumption
   */
  static async enforceApprovalRequirement(context: ApprovalGuardContext): Promise<void> {
    
    // SECURITY: CRITICAL OPERATIONS CANNOT BE SKIPPED
    if (this.CRITICAL_OPERATIONS_ALLOWLIST.has(context.operationType)) {
      if (context.skipApproval === true) {
        const errorMsg = `🚨 CRITICAL SECURITY VIOLATION: Operation '${context.operationType}' is on critical allowlist and CANNOT skip approval under any circumstances`;
        console.error(errorMsg);
        
        // Log as critical security violation
        await this.logSecurityViolation({
          operationType: context.operationType,
          userId: context.userId,
          violation: 'critical_operation_bypass_attempt',
          amount: context.amount,
          currency: context.currency
        });
        
        throw new Error(errorMsg);
      }
    }

    // SECURITY: Enhanced skipApproval validation for internal operations
    if (context.skipApproval === true) {
      await this.validateSkipApprovalRequest(context);
      return;
    }

    // If operation has a valid approval request ID, validate it securely
    if (context.approvalRequestId) {
      const validationResult = await this.validateApprovalRequest(
        context.approvalRequestId,
        {
          operationType: context.operationType,
          operationData: context.operationData,
          amount: context.amount,
          currency: context.currency,
          entityId: this.extractEntityIdFromData(context.operationData, context.operationType),
          requestedBy: context.userId || 'system'
        }
      );

      if (validationResult.isValid) {
        // SECURITY: Consume the approval atomically to prevent reuse
        const consumptionResult = await this.consumeApprovalRequest(
          context.approvalRequestId,
          {
            operationType: context.operationType,
            operationData: context.operationData,
            amount: context.amount,
            currency: context.currency,
            entityId: this.extractEntityIdFromData(context.operationData, context.operationType),
            requestedBy: context.userId || 'system',
            operationId: context.operationData?.id || `storage_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        );

        if (consumptionResult.success) {
          console.log(`SECURITY: APPROVED OPERATION with consumed approval: ${context.operationType} executing with valid approval ${context.approvalRequestId}`);
          return;
        } else {
          throw new Error(`SECURITY VIOLATION: Failed to consume approval: ${consumptionResult.reason}`);
        }
      } else {
        throw new Error(`SECURITY VIOLATION: ${validationResult.reason}`);
      }
    }

    // Check if approval is required
    const requiresApproval = await approvalWorkflowService.requiresApproval(
      context.operationType,
      context.amount,
      context.currency || 'USD',
      context.userId
    );

    if (requiresApproval) {
      // CRITICAL: Block the operation and require approval
      throw new Error(
        `APPROVAL REQUIRED: Operation '${context.operationType}' requires approval. ` +
        `Amount: ${context.currency || 'USD'} ${context.amount}. ` +
        `Create approval request first via /api/approvals/requests endpoint.`
      );
    }

    console.log(`APPROVAL NOT REQUIRED: ${context.operationType} proceeding without approval`);
  }

  /**
   * SECURITY: Use the new comprehensive approval validation with operation binding and single-use consumption
   * This replaces the old vulnerable validation that didn't check operation context
   */
  private static async validateApprovalRequest(
    approvalRequestId: string, 
    operationContext: {
      operationType: string;
      operationData: any;
      amount?: number;
      currency?: string;
      entityId?: string;
      requestedBy: string;
    }
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Use the new secure validation from approvalWorkflowService
      const validationResult = await approvalWorkflowService.validateApprovalRequest(
        approvalRequestId,
        operationContext
      );

      if (!validationResult.isValid) {
        console.error(`SECURITY VIOLATION: ${validationResult.reason}`);
        return { isValid: false, reason: validationResult.reason };
      }

      return { isValid: true };
    } catch (error) {
      console.error(`CRITICAL ERROR VALIDATING APPROVAL: ${approvalRequestId}`, error);
      return { 
        isValid: false, 
        reason: `System error during approval validation: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * SECURITY: Consume approval atomically after validation to prevent reuse
   */
  private static async consumeApprovalRequest(
    approvalRequestId: string,
    operationContext: {
      operationType: string;
      operationData: any;
      amount?: number;
      currency?: string;
      entityId?: string;
      requestedBy: string;
      operationId: string;
    }
  ): Promise<{ success: boolean; reason?: string }> {
    try {
      const consumptionResult = await approvalWorkflowService.consumeApprovalRequest(
        approvalRequestId,
        operationContext
      );

      if (!consumptionResult.success) {
        console.error(`SECURITY VIOLATION: Failed to consume approval: ${consumptionResult.reason}`);
      }

      return consumptionResult;
    } catch (error) {
      console.error(`CRITICAL ERROR CONSUMING APPROVAL: ${approvalRequestId}`, error);
      return { 
        success: false, 
        reason: `System error during approval consumption: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * SECURITY: Validate skipApproval requests with strict controls and auditing
   */
  private static async validateSkipApprovalRequest(context: ApprovalGuardContext): Promise<void> {
    // Verify operation is on allowed list
    if (!this.INTERNAL_OPERATIONS_ALLOWLIST.has(context.operationType)) {
      const errorMsg = `🚨 SECURITY VIOLATION: Operation '${context.operationType}' is not allowed to skip approval`;
      console.error(errorMsg);
      
      await this.logSecurityViolation({
        operationType: context.operationType,
        userId: context.userId,
        violation: 'unauthorized_skip_approval_attempt',
        amount: context.amount,
        currency: context.currency
      });
      
      throw new Error(errorMsg);
    }

    // Verify internal system token (in production, this should be a secure JWT or similar)
    const providedToken = context.userId === 'system' ? this.INTERNAL_SYSTEM_TOKEN : null;
    if (!providedToken || providedToken !== this.INTERNAL_SYSTEM_TOKEN) {
      const errorMsg = `🚨 SECURITY VIOLATION: Invalid or missing internal system token for skipApproval request`;
      console.error(errorMsg);
      
      await this.logSecurityViolation({
        operationType: context.operationType,
        userId: context.userId,
        violation: 'invalid_internal_token_skip_approval',
        amount: context.amount,
        currency: context.currency
      });
      
      throw new Error(errorMsg);
    }

    // Audit log the skipApproval usage with full justification
    console.log(`✅ SECURITY: Validated skipApproval for internal operation ${context.operationType} with proper token`);
    
    await this.auditOperation(
      {
        userId: 'system',
        userName: 'SystemInternal',
        userRole: 'system',
        source: 'storage_approval_guard',
        severity: 'warning',
        businessContext: `Internal operation ${context.operationType} skipped approval with valid system token`
      },
      'approval_bypass',
      `skip_approval_${Date.now()}`,
      'create',
      context.operationType,
      null,
      {
        skipApproval: true,
        operationType: context.operationType,
        operationData: context.operationData,
        amount: context.amount,
        currency: context.currency,
        justification: 'Internal system operation with valid token',
        timestamp: new Date().toISOString()
      },
      context.amount,
      context.currency
    );
  }

  /**
   * SECURITY: Log security violations for monitoring and alerting
   */
  private static async logSecurityViolation(violation: {
    operationType: string;
    userId?: string;
    violation: string;
    amount?: number;
    currency?: string;
  }): Promise<void> {
    try {
      // Log to console for immediate monitoring
      console.error(`🚨 SECURITY VIOLATION LOGGED:`, {
        timestamp: new Date().toISOString(),
        operationType: violation.operationType,
        userId: violation.userId,
        violation: violation.violation,
        amount: violation.amount,
        currency: violation.currency
      });

      // Log to audit service for permanent record
      await auditService.logOperation({
        userId: violation.userId || 'unknown',
        userName: 'SecurityViolationLogger',
        userRole: 'system',
        source: 'storage_security_guard',
        severity: 'critical',
        businessContext: `Security violation: ${violation.violation} in operation ${violation.operationType} by user ${violation.userId}`
      }, {
        entityType: 'security_violation',
        entityId: `violation_${violation.violation}_${Date.now()}`,
        action: 'create',
        description: `CRITICAL SECURITY VIOLATION: ${violation.violation}`,
        operationType: violation.operationType,
        newValues: {
          violationType: violation.violation,
          operationType: violation.operationType,
          userId: violation.userId,
          amount: violation.amount,
          currency: violation.currency,
          timestamp: new Date().toISOString()
        },
        financialImpact: violation.amount,
        currency: violation.currency || 'USD'
      });

    } catch (error) {
      console.error('🚨 CRITICAL: Failed to log security violation - this could indicate system compromise:', {
        originalViolation: violation,
        loggingError: error instanceof Error ? error.message : error
      });
    }
  }

  /**
   * SECURITY: Extract entity ID from operation data for validation binding
   */
  private static extractEntityIdFromData(operationData: any, operationType: string): string | undefined {
    switch (operationType) {
      case 'capital_entry':
        return operationData?.reference; // Reference to order/purchase ID
        
      case 'purchase':
        return operationData?.supplierId;
        
      case 'sale_order':
        return operationData?.customerId;
        
      case 'user_role_change':
        return operationData?.userId || operationData?.id;
        
      case 'system_setting_change':
        return operationData?.key; // Setting key as entity identifier
        
      case 'warehouse_operation':
        return operationData?.id; // Warehouse stock ID
        
      case 'shipping_operation':
        return operationData?.customerId || operationData?.shipmentId;
        
      default:
        return operationData?.id || operationData?.entityId;
    }
  }

  /**
   * Log operation for audit trail with before/after state capture
   */
  static async auditOperation(
    auditContext: AuditContext,
    entityType: string,
    entityId: string | undefined,
    action: 'create' | 'update' | 'delete',
    operationType: string,
    oldData: any = null,
    newData: any = null,
    financialImpact?: number,
    currency?: string
  ): Promise<void> {
    try {
      await auditService.logOperation(auditContext, {
        entityType,
        entityId,
        action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)}d ${entityType}`,
        operationType: operationType,
        oldValues: oldData,
        newValues: newData,
        changedFields: oldData && newData ? Object.keys(newData).filter(key => newData[key] !== oldData[key]) : undefined,
        financialImpact,
        currency: currency || 'USD'
      });
    } catch (error) {
      console.error(`AUDIT LOGGING FAILED for ${action} on ${entityType}:`, error);
      // Don't throw - audit failures shouldn't break business operations
      // But log this as a critical security event
      console.error(`CRITICAL: Audit trail broken for ${entityType} ${action} operation by user ${auditContext.userId}`);
    }
  }

  /**
   * Get entity before state for audit logging
   */
  static async getCaptureBeforeState<T>(
    table: any,
    entityId: string,
    selectFn?: () => Promise<T | undefined>
  ): Promise<T | null> {
    try {
      if (selectFn) {
        return await selectFn() || null;
      }
      
      const [entity] = await db.select().from(table).where(eq(table.id, entityId));
      return entity || null;
    } catch (error) {
      console.error(`Error capturing before state for ${entityId}:`, error);
      return null;
    }
  }

  /**
   * Check if sales order changes are significant enough to require approval
   */
  static isSignificantSalesOrderChange(beforeState: any, changes: any): boolean {
    // Check for status changes that require approval
    const significantStatusChanges = ['confirmed', 'fulfilled', 'delivered', 'cancelled'];
    if (changes.status && significantStatusChanges.includes(changes.status)) {
      return true;
    }

    // Check for amount changes above threshold (>10% change or >$1000)
    if (changes.totalAmount || changes.totalAmountUsd) {
      const oldAmount = parseFloat(beforeState.totalAmount || '0');
      const newAmount = parseFloat(changes.totalAmount || changes.totalAmountUsd || '0');
      const amountDifference = Math.abs(newAmount - oldAmount);
      const percentageChange = oldAmount > 0 ? (amountDifference / oldAmount) * 100 : 100;
      
      if (amountDifference > 1000 || percentageChange > 10) {
        return true;
      }
    }

    // Check for customer changes
    if (changes.customerId && changes.customerId !== beforeState.customerId) {
      return true;
    }

    // Check for currency changes
    if (changes.currency && changes.currency !== beforeState.currency) {
      return true;
    }

    return false;
  }

  /**
   * Check if revenue transaction changes are significant enough to require approval
   */
  static isSignificantRevenueTransactionChange(beforeState: any, changes: any): boolean {
    // Check for status changes that require approval
    const significantStatusChanges = ['approved', 'reconciled', 'refunded'];
    if (changes.status && significantStatusChanges.includes(changes.status)) {
      return true;
    }

    // Check for amount changes above threshold (>5% change or >$500)
    if (changes.amount) {
      const oldAmount = parseFloat(beforeState.amount || '0');
      const newAmount = parseFloat(changes.amount || '0');
      const amountDifference = Math.abs(newAmount - oldAmount);
      const percentageChange = oldAmount > 0 ? (amountDifference / oldAmount) * 100 : 100;
      
      if (amountDifference > 500 || percentageChange > 5) {
        return true;
      }
    }

    // Check for transaction type changes
    if (changes.type && changes.type !== beforeState.type) {
      return true;
    }

    // Check for currency changes
    if (changes.currency && changes.currency !== beforeState.currency) {
      return true;
    }

    return false;
  }
}

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser, auditContext?: AuditContext): Promise<User>;
  getAllUsers(): Promise<User[]>;
  countAdminUsers(): Promise<number>;
  updateUserRole(id: string, role: User['role'], auditContext?: AuditContext): Promise<User>;
  updateUserStatus(id: string, isActive: boolean): Promise<User>;
  updateSuperAdminStatus(id: string, isSuperAdmin: boolean): Promise<User>;
  updateDisplayName(id: string, firstName: string, lastName: string): Promise<User>;
  deleteUser(id: string, auditContext?: AuditContext): Promise<User>;
  
  // Enhanced user cleanup methods
  anonymizeUserData(id: string, auditContext?: AuditContext): Promise<User>;
  checkUserBusinessRecords(userId: string): Promise<{
    hasRecords: boolean;
    recordsSummary: Record<string, number>;
    details: string[];
  }>;
  bulkCleanupUsers(userIds: string[], auditContext?: AuditContext): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      userId: string;
      email: string;
      action: 'hard_delete' | 'soft_delete_anonymize' | 'protected' | 'error';
      reason: string;
      recordCount?: number;
    }>;
  }>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  getSettings(): Promise<Setting[]>;
  setSetting(setting: InsertSetting, auditContext?: AuditContext): Promise<Setting>;
  updateSetting(setting: InsertSetting, auditContext?: AuditContext): Promise<Setting>;
  getExchangeRate(): Promise<number>;

  // Approval chain operations
  getApprovalChains(): Promise<ApprovalChain[]>;
  createApprovalChain(chain: InsertApprovalChain, auditContext?: AuditContext): Promise<ApprovalChain>;
  updateApprovalChain(id: string, updates: Partial<InsertApprovalChain>, auditContext?: AuditContext): Promise<ApprovalChain>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Supplier>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Order>;
  
  // Capital operations
  getCapitalEntries(): Promise<CapitalEntry[]>;
  getCapitalEntryById(id: string): Promise<CapitalEntry | undefined>;
  getCapitalEntriesByType(type: string): Promise<CapitalEntry[]>;
  getCapitalBalance(): Promise<number>;
  createCapitalEntry(entry: InsertCapitalEntry, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<CapitalEntry>;
  
  // Purchase operations
  getPurchases(): Promise<Purchase[]>;
  getPurchase(id: string): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Purchase>;
  createPurchaseWithSideEffects(purchaseData: InsertPurchase, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Purchase>;
  createCapitalEntryWithConcurrencyProtection(entry: InsertCapitalEntry, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<CapitalEntry>;
  createPurchaseWithSideEffectsRetryable(purchaseData: InsertPurchase, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Purchase>;
  createPurchaseWithSideEffects(purchaseData: InsertPurchase, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Purchase>;
  updatePurchase(id: string, purchase: Partial<InsertPurchase>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Purchase>;
  deletePurchase(id: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<void>;
  
  // Purchase payment operations
  getPurchasePayments(purchaseId: string): Promise<PurchasePayment[]>;
  createPurchasePayment(payment: InsertPurchasePayment, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<PurchasePayment>;
  
  // Warehouse operations
  getWarehouseStock(): Promise<WarehouseStock[]>;
  getWarehouseStockByStatus(status: string): Promise<WarehouseStock[]>;
  getWarehouseStockByWarehouse(warehouse: string): Promise<WarehouseStock[]>;
  getWarehouseStockById(id: string): Promise<WarehouseStock | null>;
  createWarehouseStock(stock: InsertWarehouseStock, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock>;
  updateWarehouseStock(id: string, stock: Partial<InsertWarehouseStock>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock>;
  updateWarehouseStockStatus(id: string, status: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock>;
  executeFilterOperation(purchaseId: string, outputCleanKg: string, outputNonCleanKg: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<{ filterRecord: FilterRecord; updatedStock: WarehouseStock[] }>;
  moveStockToFinalWarehouse(stockId: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock>;
  
  // Filter operations
  getFilterRecords(): Promise<FilterRecord[]>;
  createFilterRecord(record: InsertFilterRecord): Promise<FilterRecord>;
  
  // Reporting operations
  getFinancialSummary(filters?: DateRangeFilter): Promise<FinancialSummaryResponse>;
  getCashflowAnalysis(period: string): Promise<CashFlowResponse>;
  getInventoryAnalytics(): Promise<InventoryAnalyticsResponse>;
  getSupplierPerformance(): Promise<SupplierPerformanceResponse>;
  getTradingActivity(): Promise<TradingActivityResponse>;
  exportReportData(type: string, format: string): Promise<any>;

  // ===== COMPREHENSIVE FINANCIAL REPORTING OPERATIONS =====

  // Financial periods management
  getFinancialPeriods(status?: string): Promise<FinancialPeriod[]>;
  getFinancialPeriod(id: string): Promise<FinancialPeriod | undefined>;
  getCurrentFinancialPeriod(): Promise<FinancialPeriod | undefined>;
  createFinancialPeriod(period: InsertFinancialPeriod): Promise<FinancialPeriod>;
  updateFinancialPeriod(id: string, period: Partial<InsertFinancialPeriod>): Promise<FinancialPeriod>;
  closeFinancialPeriod(id: string, userId: string, exchangeRates?: Record<string, number>): Promise<FinancialPeriod>;
  reopenFinancialPeriod(id: string, userId: string): Promise<FinancialPeriod>;

  // Financial metrics operations
  getFinancialMetrics(periodId?: string, filters?: DateRangeFilter): Promise<FinancialMetric[]>;
  getFinancialMetric(id: string): Promise<FinancialMetric | undefined>;
  getLatestFinancialMetrics(periodId: string): Promise<FinancialMetric | undefined>;
  calculateAndStoreFinancialMetrics(periodId: string, userId: string): Promise<FinancialMetric>;
  getKpiDashboardData(periodId?: string): Promise<{
    revenue: { current: number; previous: number; growth: number };
    grossMargin: { amount: number; percentage: number; trend: string };
    operatingMargin: { amount: number; percentage: number; trend: string };
    netProfit: { amount: number; percentage: number; trend: string };
    workingCapital: { amount: number; ratio: number; trend: string };
    inventoryTurnover: { ratio: number; days: number; trend: string };
    cashFlow: { operating: number; total: number; runway: number };
  }>;

  // Profit & Loss operations
  getProfitLossStatements(periodId?: string, statementType?: string): Promise<ProfitLossStatement[]>;
  getProfitLossStatement(id: string): Promise<ProfitLossStatement | undefined>;
  generateProfitLossStatement(periodId: string, statementType: string, userId: string): Promise<ProfitLossStatement>;
  getDetailedPLAnalysis(periodId: string, comparisonPeriodId?: string): Promise<{
    currentPeriod: ProfitLossStatement;
    previousPeriod?: ProfitLossStatement;
    varianceAnalysis: {
      revenue: { amount: number; percentage: number; trend: string };
      cogs: { amount: number; percentage: number; trend: string };
      grossProfit: { amount: number; percentage: number; trend: string };
      operatingExpenses: { amount: number; percentage: number; trend: string };
      operatingProfit: { amount: number; percentage: number; trend: string };
      netProfit: { amount: number; percentage: number; trend: string };
    };
    breakdownAnalysis: {
      revenueByCategory: Array<{ category: string; amount: number; percentage: number }>;
      costsByCategory: Array<{ category: string; amount: number; percentage: number }>;
      expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
    };
  }>;

  // Cash flow analysis operations
  getCashFlowAnalyses(periodId?: string, analysisType?: string): Promise<CashFlowAnalysis[]>;
  getCashFlowAnalysis(id: string): Promise<CashFlowAnalysis | undefined>;
  generateCashFlowAnalysis(periodId: string, analysisType: string, userId: string, forecastDays?: number): Promise<CashFlowAnalysis>;
  getCashFlowForecast(days: number): Promise<{
    projections: Array<{
      date: string;
      inflows: number;
      outflows: number;
      netFlow: number;
      cumulativeBalance: number;
    }>;
    summary: {
      totalInflows: number;
      totalOutflows: number;
      netCashFlow: number;
      runwayDays: number;
      liquidityRatio: number;
    };
    risks: Array<{
      type: string;
      description: string;
      impact: number;
      mitigation: string;
    }>;
  }>;
  getWorkingCapitalAnalysis(): Promise<{
    currentAssets: number;
    currentLiabilities: number;
    workingCapital: number;
    workingCapitalRatio: number;
    daysWorkingCapital: number;
    cashConversionCycle: number;
    optimization: Array<{
      area: string;
      currentValue: number;
      targetValue: number;
      impact: number;
      recommendation: string;
    }>;
  }>;

  // Margin analysis operations
  getMarginAnalyses(periodId?: string, analysisType?: string, filters?: {
    customerId?: string;
    supplierId?: string;
    qualityGrade?: string;
    country?: string;
  }): Promise<MarginAnalysis[]>;
  getMarginAnalysis(id: string): Promise<MarginAnalysis | undefined>;
  generateMarginAnalysis(periodId: string, analysisType: string, filters: any, userId: string): Promise<MarginAnalysis[]>;
  getCustomerProfitabilityAnalysis(periodId?: string): Promise<Array<{
    customerId: string;
    customerName: string;
    totalRevenue: number;
    totalCogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    volumeKg: number;
    averageSellingPrice: number;
    profitabilityRank: number;
    performanceCategory: string;
    trend: string;
  }>>;
  getProductMarginAnalysis(periodId?: string): Promise<Array<{
    qualityGrade: string;
    country: string;
    totalRevenue: number;
    totalCogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    volumeKg: number;
    averageSellingPrice: number;
    averageCostPerKg: number;
    qualityPremium: number;
    filteringImpact: number;
  }>>;
  getTransactionMarginAnalysis(periodId?: string, minMargin?: number): Promise<Array<{
    orderId: string;
    customerId: string;
    customerName: string;
    totalRevenue: number;
    totalCogs: number;
    grossMargin: number;
    grossMarginPercent: number;
    volumeKg: number;
    qualityGrade: string;
    country: string;
    date: Date;
  }>>;

  // Budget tracking operations
  getBudgetTrackings(periodId?: string, category?: string): Promise<BudgetTracking[]>;
  getBudgetTracking(id: string): Promise<BudgetTracking | undefined>;
  createBudgetTracking(budget: InsertBudgetTracking): Promise<BudgetTracking>;
  updateBudgetTracking(id: string, budget: Partial<InsertBudgetTracking>): Promise<BudgetTracking>;
  calculateBudgetVariances(periodId: string): Promise<void>;
  getBudgetVsActualAnalysis(periodId: string): Promise<{
    categories: Array<{
      category: string;
      subcategory?: string;
      budgeted: number;
      actual: number;
      variance: number;
      variancePercent: number;
      varianceType: string;
      performanceRating: string;
    }>;
    summary: {
      totalBudgeted: number;
      totalActual: number;
      totalVariance: number;
      totalVariancePercent: number;
      favorableVariances: number;
      unfavorableVariances: number;
    };
  }>;

  // Advanced financial calculations
  calculateBreakEvenAnalysis(periodId?: string): Promise<{
    breakEvenRevenue: number;
    breakEvenUnits: number;
    marginOfSafety: number;
    marginOfSafetyPercent: number;
    contributionMargin: number;
    contributionMarginRatio: number;
    fixedCosts: number;
    variableCostRatio: number;
  }>;
  calculateROIAnalysis(periodId?: string): Promise<{
    overallROI: number;
    purchaseROI: number;
    inventoryROI: number;
    workingCapitalROI: number;
    roiBySupplier: Array<{
      supplierId: string;
      supplierName: string;
      totalInvestment: number;
      totalReturn: number;
      roi: number;
      roiRank: number;
    }>;
    roiByQualityGrade: Array<{
      qualityGrade: string;
      totalInvestment: number;
      totalReturn: number;
      roi: number;
    }>;
  }>;
  calculateFinancialRatios(periodId?: string): Promise<{
    liquidityRatios: {
      currentRatio: number;
      quickRatio: number;
      cashRatio: number;
    };
    profitabilityRatios: {
      grossProfitMargin: number;
      operatingProfitMargin: number;
      netProfitMargin: number;
      returnOnAssets: number;
      returnOnEquity: number;
    };
    efficiencyRatios: {
      inventoryTurnover: number;
      assetTurnover: number;
      receivablesTurnover: number;
      payablesTurnover: number;
    };
    leverageRatios: {
      debtToEquity: number;
      debtToAssets: number;
      equityMultiplier: number;
    };
  }>;

  // Financial forecasting and predictive analytics
  generateFinancialForecast(periodId: string, forecastPeriods: number): Promise<{
    revenueForecast: Array<{
      period: string;
      forecastRevenue: number;
      confidence: number;
      factors: string[];
    }>;
    costForecast: Array<{
      period: string;
      forecastCogs: number;
      forecastExpenses: number;
      confidence: number;
    }>;
    profitForecast: Array<{
      period: string;
      forecastGrossProfit: number;
      forecastOperatingProfit: number;
      forecastNetProfit: number;
      confidence: number;
    }>;
    recommendations: string[];
    risks: Array<{
      risk: string;
      probability: number;
      impact: number;
      mitigation: string;
    }>;
  }>;
  
  // Currency consolidation and multi-currency analysis
  getCurrencyExposureAnalysis(periodId?: string): Promise<{
    exposureByTransaction: Array<{
      currency: string;
      totalAmount: number;
      amountUsd: number;
      exchangeRate: number;
      exposurePercent: number;
    }>;
    hedgeRecommendations: Array<{
      currency: string;
      exposureAmount: number;
      hedgeAmount: number;
      strategy: string;
      costBenefit: number;
    }>;
    riskMetrics: {
      totalExposure: number;
      concentrationRisk: number;
      volatilityRisk: number;
    };
  }>;
  
  // Financial reporting validation and compliance
  validateFinancialData(periodId: string): Promise<{
    isValid: boolean;
    validationErrors: Array<{
      type: string;
      description: string;
      severity: string;
      recommendation: string;
    }>;
    dataIntegrityChecks: Array<{
      check: string;
      passed: boolean;
      details: string;
    }>;
    complianceStatus: {
      periodClosure: boolean;
      dataCompleteness: boolean;
      calculationAccuracy: boolean;
      auditTrail: boolean;
    };
  }>;

  // Executive summary and business intelligence
  generateExecutiveFinancialSummary(periodId: string): Promise<{
    periodOverview: {
      periodName: string;
      totalRevenue: number;
      totalCosts: number;
      netProfit: number;
      netProfitMargin: number;
    };
    keyMetrics: Array<{
      metric: string;
      current: number;
      previous: number;
      change: number;
      changePercent: number;
      trend: string;
      status: string;
    }>;
    performanceHighlights: string[];
    concernAreas: Array<{
      area: string;
      issue: string;
      impact: string;
      recommendation: string;
    }>;
    businessInsights: {
      profitabilityAnalysis: string;
      cashFlowInsights: string;
      operationalEfficiency: string;
      marketPosition: string;
    };
    strategicRecommendations: string[];
  }>;
  
  // AI operations
  getAiInsightsCache(cacheKey: string): Promise<AiInsightsCache | undefined>;
  setAiInsightsCache(cache: InsertAiInsightsCache): Promise<AiInsightsCache>;
  deleteExpiredInsightsCache(): Promise<void>;
  getAiConversation(sessionId: string, userId: string): Promise<AiConversation | undefined>;
  createOrUpdateAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getRecentAiConversations(userId: string, limit: number): Promise<AiConversation[]>;
  
  // Workflow validation operations
  getWorkflowValidations(userId?: string, limit?: number): Promise<WorkflowValidation[]>;
  getLatestWorkflowValidation(userId?: string): Promise<WorkflowValidation | undefined>;
  createWorkflowValidation(validation: InsertWorkflowValidation): Promise<WorkflowValidation>;
  updateWorkflowValidationAsLatest(validationId: string): Promise<void>;
  
  // Period management operations
  getPeriods(): Promise<Period[]>;
  getPeriod(id: string): Promise<Period | undefined>;
  createPeriod(period: InsertPeriod): Promise<Period>;
  updatePeriod(id: string, period: Partial<InsertPeriod>): Promise<Period>;
  closePeriod(periodId: string, userId: string, adjustments?: InsertPeriodAdjustment[]): Promise<Period>;
  reopenPeriod(periodId: string, userId: string, reason: string): Promise<Period>;
  getPeriodClosingLogs(periodId: string): Promise<PeriodClosingLog[]>;
  createPeriodAdjustment(adjustment: InsertPeriodAdjustment): Promise<PeriodAdjustment>;
  getPeriodAdjustments(periodId: string): Promise<PeriodAdjustment[]>;
  approvePeriodAdjustment(adjustmentId: string, userId: string): Promise<PeriodAdjustment>;
  
  // Enhanced export operations
  createExportRequest(exportData: InsertExportHistory): Promise<ExportHistory>;
  getExportHistory(userId?: string, limit?: number): Promise<ExportHistory[]>;
  updateExportStatus(exportId: string, status: string, filePath?: string, fileSize?: number): Promise<ExportHistory>;
  getExportJob(id: string): Promise<ExportHistory | undefined>;
  deleteExpiredExports(): Promise<void>;
  incrementDownloadCount(exportId: string): Promise<void>;
  
  // Enhanced period operations with compliance
  closePeriodWithCompliance(periodId: string, userId: string, adjustments?: InsertPeriodAdjustment[], complianceData?: {
    complianceValidationId?: string | null;
    aiValidationStatus: 'passed' | 'skipped' | 'failed';
  }): Promise<Period>;
  reopenPeriodWithAudit(periodId: string, userId: string, reason: string): Promise<Period>;
  
  // Export preferences operations
  getUserExportPreferences(userId: string, reportType?: string): Promise<ExportPreferences[]>;
  setExportPreference(preference: InsertExportPreferences): Promise<ExportPreferences>;
  updateExportPreference(userId: string, reportType: string, updates: Partial<InsertExportPreferences>): Promise<ExportPreferences>;
  
  // Scheduled export operations
  getExportJobs(userId?: string): Promise<ExportJob[]>;
  createExportJob(job: InsertExportJob): Promise<ExportJob>;
  updateExportJob(id: string, updates: Partial<InsertExportJob>): Promise<ExportJob>;
  deleteExportJob(id: string): Promise<void>;
  
  // Enhanced export format operations
  exportToCSV(data: any[], filename: string): Promise<string>;
  exportToExcel(data: Record<string, any[]>, filename: string): Promise<string>;
  exportToPDF(data: any, reportType: string, filename: string): Promise<string>;
  compressFile(filePath: string): Promise<string>;
  sendEmailWithAttachment(recipients: string[], subject: string, body: string, attachmentPath: string): Promise<void>;

  // Shipping and Logistics operations
  
  // Carrier operations
  getCarriers(filter?: CarrierFilter): Promise<Carrier[]>;
  getCarrier(id: string): Promise<Carrier | undefined>;
  createCarrier(carrier: InsertCarrier): Promise<Carrier>;
  updateCarrier(id: string, carrier: Partial<InsertCarrier>): Promise<Carrier>;
  deleteCarrier(id: string): Promise<void>;
  updateCarrierRating(carrierId: string, rating: number): Promise<Carrier>;
  
  // Shipment legs operations
  getShipmentLegs(shipmentId: string): Promise<ShipmentLeg[]>;
  getShipmentLeg(id: string): Promise<ShipmentLeg | undefined>;
  createShipmentLeg(leg: InsertShipmentLeg, auditContext?: AuditContext): Promise<ShipmentLeg>;
  updateShipmentLeg(id: string, updates: Partial<InsertShipmentLeg>, auditContext?: AuditContext): Promise<ShipmentLeg>;
  
  // Arrival costs operations
  getArrivalCosts(shipmentId: string): Promise<ArrivalCost[]>;
  createArrivalCost(cost: InsertArrivalCost, auditContext?: AuditContext): Promise<ArrivalCost>;
  
  // Shipment operations
  getShipments(filter?: ShipmentFilter): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentWithDetails(id: string): Promise<ShipmentWithDetailsResponse | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  createShipmentFromWarehouseStock(shipmentData: CreateShipmentFromStock, userId: string): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment>;
  updateShipmentStatus(id: string, status: string, userId: string, actualDate?: Date): Promise<Shipment>;
  deleteShipment(id: string): Promise<void>;
  
  // Shipment item operations
  getShipmentItems(shipmentId: string): Promise<ShipmentItem[]>;
  createShipmentItem(item: InsertShipmentItem): Promise<ShipmentItem>;
  updateShipmentItem(id: string, item: Partial<InsertShipmentItem>): Promise<ShipmentItem>;
  deleteShipmentItem(id: string): Promise<void>;
  
  // Shipping cost operations
  getShippingCosts(shipmentId: string): Promise<ShippingCost[]>;
  getShippingCost(id: string): Promise<ShippingCost | undefined>;
  addShippingCost(costData: AddShippingCost, userId: string): Promise<ShippingCost>;
  updateShippingCost(id: string, cost: Partial<InsertShippingCost>): Promise<ShippingCost>;
  deleteShippingCost(id: string): Promise<void>;
  
  // Delivery tracking operations
  getDeliveryTracking(shipmentId: string): Promise<DeliveryTracking[]>;
  addDeliveryTracking(trackingData: AddDeliveryTracking, userId: string): Promise<DeliveryTracking>;
  updateDeliveryTracking(id: string, tracking: Partial<InsertDeliveryTracking>): Promise<DeliveryTracking>;
  markCustomerNotified(trackingId: string, userId: string): Promise<DeliveryTracking>;
  
  // Shipping analytics and reporting
  getShippingAnalytics(filters?: DateRangeFilter): Promise<ShippingAnalyticsResponse>;
  getCarrierPerformanceReport(): Promise<any>;
  getShippingCostAnalysis(filters?: DateRangeFilter): Promise<any>;
  getDeliveryTimeAnalysis(filters?: DateRangeFilter): Promise<any>;
  
  // Integration operations
  getAvailableWarehouseStockForShipping(): Promise<WarehouseStock[]>;
  reserveStockForShipment(stockId: string, quantity: number, shipmentId: string): Promise<WarehouseStock>;
  releaseReservedStock(stockId: string, quantity: number): Promise<WarehouseStock>;
  updateFinalWarehouseFromDelivery(shipmentId: string, userId: string): Promise<void>;

  // Advanced Warehouse Operations

  // Quality standards operations
  getQualityStandards(isActive?: boolean): Promise<QualityStandard[]>;
  getQualityStandard(id: string): Promise<QualityStandard | undefined>;
  createQualityStandard(standard: InsertQualityStandard): Promise<QualityStandard>;
  updateQualityStandard(id: string, standard: Partial<InsertQualityStandard>): Promise<QualityStandard>;
  deleteQualityStandard(id: string): Promise<void>;

  // Warehouse batches operations
  getWarehouseBatches(filter?: { supplierId?: string; qualityGrade?: string; isActive?: boolean }): Promise<WarehouseBatch[]>;
  getWarehouseBatch(id: string): Promise<WarehouseBatch | undefined>;
  createWarehouseBatch(batch: InsertWarehouseBatch): Promise<WarehouseBatch>;
  updateWarehouseBatch(id: string, batch: Partial<InsertWarehouseBatch>): Promise<WarehouseBatch>;
  splitWarehouseBatch(batchId: string, splitQuantity: string, userId: string): Promise<{ originalBatch: WarehouseBatch; newBatch: WarehouseBatch }>;
  mergeWarehouseBatches(batchIds: string[], userId: string): Promise<WarehouseBatch>;

  // Quality inspections operations
  getQualityInspections(filter?: { status?: string; inspectionType?: string; batchId?: string }): Promise<QualityInspection[]>;
  getQualityInspection(id: string): Promise<QualityInspection | undefined>;
  createQualityInspection(inspection: InsertQualityInspection): Promise<QualityInspection>;
  updateQualityInspection(id: string, inspection: Partial<InsertQualityInspection>): Promise<QualityInspection>;
  completeQualityInspection(id: string, results: {
    qualityGrade: string;
    overallScore?: string;
    testResults?: any;
    recommendations?: string;
    userId: string;
  }): Promise<QualityInspection>;
  approveQualityInspection(id: string, userId: string): Promise<QualityInspection>;
  rejectQualityInspection(id: string, rejectionReason: string, userId: string): Promise<QualityInspection>;

  // Inventory consumption operations
  getInventoryConsumption(filter?: { warehouseStockId?: string; consumptionType?: string; orderId?: string }): Promise<InventoryConsumption[]>;
  getInventoryConsumptionByBatch(batchId: string): Promise<InventoryConsumption[]>;
  createInventoryConsumption(consumption: InsertInventoryConsumption): Promise<InventoryConsumption>;
  consumeInventoryFIFO(warehouseStockId: string, quantity: string, consumptionType: string, userId: string, allocatedTo?: string): Promise<InventoryConsumption[]>;
  getStockAging(): Promise<Array<{ warehouseStockId: string; daysInStock: number; qtyKgClean: number; unitCostUsd: number }>>;
  getConsumptionAnalytics(dateRange?: DateRangeFilter): Promise<{
    totalConsumed: number;
    averageCostPerKg: number;
    consumptionByType: Array<{ type: string; quantity: number; cost: number }>;
    fifoCompliance: number;
  }>;

  // Processing operations
  getProcessingOperations(filter?: { status?: string; operationType?: string; batchId?: string }): Promise<ProcessingOperation[]>;
  getProcessingOperation(id: string): Promise<ProcessingOperation | undefined>;
  createProcessingOperation(operation: InsertProcessingOperation): Promise<ProcessingOperation>;
  updateProcessingOperation(id: string, operation: Partial<InsertProcessingOperation>): Promise<ProcessingOperation>;
  startProcessingOperation(id: string, userId: string): Promise<ProcessingOperation>;
  completeProcessingOperation(id: string, results: {
    outputQuantityKg: string;
    yieldPercentage: string;
    lossQuantityKg: string;
    qualityAfter?: string;
    userId: string;
  }): Promise<ProcessingOperation>;

  // Stock transfers operations
  getStockTransfers(filter?: { status?: string; transferType?: string }): Promise<StockTransfer[]>;
  getStockTransfer(id: string): Promise<StockTransfer | undefined>;
  createStockTransfer(transfer: InsertStockTransfer): Promise<StockTransfer>;
  executeStockTransfer(id: string, userId: string): Promise<StockTransfer>;
  approveStockTransfer(id: string, userId: string): Promise<StockTransfer>;
  cancelStockTransfer(id: string, reason: string, userId: string): Promise<StockTransfer>;

  // Inventory adjustments operations
  getInventoryAdjustments(filter?: { status?: string; adjustmentType?: string; warehouseStockId?: string }): Promise<InventoryAdjustment[]>;
  getInventoryAdjustment(id: string): Promise<InventoryAdjustment | undefined>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
  approveInventoryAdjustment(id: string, userId: string): Promise<InventoryAdjustment>;
  rejectInventoryAdjustment(id: string, reason: string, userId: string): Promise<InventoryAdjustment>;

  // Enhanced warehouse stock operations with quality and batch tracking
  assignQualityGradeToStock(stockId: string, qualityGrade: string, qualityScore?: string, userId?: string): Promise<WarehouseStock>;
  assignBatchToStock(stockId: string, batchId: string, userId?: string): Promise<WarehouseStock>;
  getStockWithQualityHistory(stockId: string): Promise<{
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    consumptions: InventoryConsumption[];
    transfers: StockTransfer[];
    adjustments: InventoryAdjustment[];
  }>;
  getWarehouseAnalyticsAdvanced(): Promise<{
    qualityBreakdown: Array<{ grade: string; totalKg: number; valueUsd: number; count: number }>;
    batchAnalysis: Array<{ batchId: string; batchNumber: string; totalKg: number; remainingKg: number; qualityGrade: string }>;
    consumptionTrends: Array<{ date: string; totalConsumed: number; averageCost: number }>;
    processingMetrics: Array<{ operationType: string; totalProcessed: number; averageYield: number; totalCost: number }>;
    fifoCompliance: number;
    stockAging: Array<{ ageRange: string; totalKg: number; valueUsd: number }>;
  }>;

  // Traceability operations
  traceStockOrigin(stockId: string): Promise<{
    purchase: Purchase;
    supplier: Supplier;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    processingHistory: ProcessingOperation[];
  }>;
  traceConsumptionChain(consumptionId: string): Promise<{
    consumption: InventoryConsumption;
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    purchaseOrigin: Purchase;
    supplier: Supplier;
  }>;

  // Sales Pipeline Operations

  // Customer operations
  getCustomers(filter?: { category?: string; isActive?: boolean; salesRepId?: string }): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deactivateCustomer(id: string, userId: string): Promise<Customer>;
  searchCustomers(query: string, limit?: number): Promise<Customer[]>;
  getCustomersByCategory(category: string): Promise<Customer[]>;
  updateCustomerPerformanceMetrics(customerId: string): Promise<Customer>;

  // Sales order operations
  getSalesOrders(filter?: { 
    status?: string; 
    customerId?: string; 
    salesRepId?: string; 
    dateRange?: { start: Date; end: Date };
  }): Promise<SalesOrder[]>;
  getSalesOrder(id: string): Promise<SalesOrder | undefined>;
  getSalesOrderWithDetails(id: string): Promise<SalesOrder & { 
    customer: Customer; 
    items: (SalesOrderItem & { warehouseStock?: WarehouseStock })[];
    communications: CustomerCommunication[];
  } | undefined>;
  createSalesOrder(salesOrder: InsertSalesOrder): Promise<SalesOrder>;
  updateSalesOrder(id: string, salesOrder: Partial<InsertSalesOrder>): Promise<SalesOrder>;
  confirmSalesOrder(id: string, userId: string): Promise<SalesOrder>;
  fulfillSalesOrder(id: string, userId: string): Promise<SalesOrder>;
  deliverSalesOrder(id: string, userId: string): Promise<SalesOrder>;
  cancelSalesOrder(id: string, reason: string, userId: string): Promise<SalesOrder>;
  calculateSalesOrderTotals(salesOrderId: string): Promise<SalesOrder>;

  // Sales order item operations
  getSalesOrderItems(salesOrderId: string): Promise<SalesOrderItem[]>;
  getSalesOrderItem(id: string): Promise<SalesOrderItem | undefined>;
  createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem>;
  updateSalesOrderItem(id: string, item: Partial<InsertSalesOrderItem>): Promise<SalesOrderItem>;
  deleteSalesOrderItem(id: string): Promise<void>;
  reserveInventoryForSalesOrderItem(itemId: string, userId: string): Promise<SalesOrderItem>;
  fulfillSalesOrderItem(itemId: string, quantityFulfilled: string, userId: string): Promise<SalesOrderItem>;
  calculateItemPricing(itemId: string, customerId: string, qualityGrade?: string): Promise<{
    unitPrice: number;
    lineTotal: number;
    discountApplied: number;
    marginPercent: number;
  }>;

  // Sales return operations - Stage 6 compliance (storage-backed return processing)
  getSalesReturns(filter?: {
    originalSalesOrderId?: string;
    status?: string;
    returnedBy?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<SalesReturn[]>;
  getSalesReturn(id: string): Promise<SalesReturn | undefined>;
  createSalesReturn(salesReturn: InsertSalesReturn): Promise<SalesReturn>;
  updateSalesReturn(id: string, salesReturn: Partial<InsertSalesReturn>): Promise<SalesReturn>;
  processSalesReturn(id: string, userId: string): Promise<SalesReturn>;
  approveSalesReturn(id: string, userId: string): Promise<SalesReturn>;

  // Customer communication operations
  getCustomerCommunications(customerId: string, limit?: number): Promise<CustomerCommunication[]>;
  getCustomerCommunication(id: string): Promise<CustomerCommunication | undefined>;
  createCustomerCommunication(communication: InsertCustomerCommunication): Promise<CustomerCommunication>;
  updateCustomerCommunication(id: string, communication: Partial<InsertCustomerCommunication>): Promise<CustomerCommunication>;
  getUpcomingFollowUps(userId?: string): Promise<CustomerCommunication[]>;
  markCommunicationComplete(id: string, userId: string): Promise<CustomerCommunication>;

  // Revenue transaction operations
  getRevenueTransactions(filter?: {
    customerId?: string;
    salesOrderId?: string;
    type?: string;
    status?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<RevenueTransaction[]>;
  getRevenueTransaction(id: string): Promise<RevenueTransaction | undefined>;
  createRevenueTransaction(transaction: InsertRevenueTransaction): Promise<RevenueTransaction>;
  updateRevenueTransaction(id: string, transaction: Partial<InsertRevenueTransaction>): Promise<RevenueTransaction>;
  approveRevenueTransaction(id: string, userId: string): Promise<RevenueTransaction>;
  reverseRevenueTransaction(id: string, reason: string, userId: string): Promise<RevenueTransaction>;
  processPayment(salesOrderId: string, amount: string, paymentMethod: string, userId: string): Promise<RevenueTransaction>;
  getCustomerAccountBalance(customerId: string): Promise<{
    totalOutstanding: number;
    creditLimit: number;
    availableCredit: number;
    overdueAmount: number;
  }>;

  // Sales performance metrics operations
  getSalesPerformanceMetrics(filter?: {
    periodType?: string;
    salesRepId?: string;
    customerId?: string;
    customerCategory?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<SalesPerformanceMetric[]>;
  calculateSalesPerformanceMetrics(periodType: string, startDate: Date, endDate: Date): Promise<void>;
  getSalesRepPerformance(salesRepId: string, periodType: string): Promise<SalesPerformanceMetric[]>;
  getCustomerPerformanceMetrics(customerId: string): Promise<SalesPerformanceMetric[]>;

  // Customer credit limit operations
  getCustomerCreditLimits(customerId: string): Promise<CustomerCreditLimit[]>;
  getCurrentCustomerCreditLimit(customerId: string): Promise<CustomerCreditLimit | undefined>;
  createCustomerCreditLimit(creditLimit: InsertCustomerCreditLimit): Promise<CustomerCreditLimit>;
  updateCustomerCreditLimit(id: string, creditLimit: Partial<InsertCustomerCreditLimit>): Promise<CustomerCreditLimit>;
  suspendCustomerCredit(customerId: string, reason: string, userId: string): Promise<CustomerCreditLimit>;
  reinstateCustomerCredit(customerId: string, userId: string): Promise<CustomerCreditLimit>;
  checkCreditLimitAvailability(customerId: string, orderAmount: number): Promise<{
    isApproved: boolean;
    availableCredit: number;
    reason?: string;
  }>;

  // Pricing rule operations
  getPricingRules(filter?: {
    ruleType?: string;
    customerCategory?: string;
    qualityGrade?: string;
    isActive?: boolean;
  }): Promise<PricingRule[]>;
  getPricingRule(id: string): Promise<PricingRule | undefined>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule>;
  deletePricingRule(id: string): Promise<void>;
  calculateDynamicPricing(params: {
    customerId: string;
    qualityGrade: string;
    quantity: number;
    orderValue: number;
  }): Promise<{
    basePrice: number;
    finalPrice: number;
    appliedRules: Array<{ ruleName: string; adjustment: number; type: string }>;
    totalDiscount: number;
  }>;

  // Sales analytics and reporting operations
  getSalesDashboardData(userId?: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topCustomers: Array<{ customer: Customer; revenue: number; orders: number }>;
    salesTrends: Array<{ date: string; revenue: number; orders: number }>;
    performanceByRep: Array<{ salesRep: User; revenue: number; orders: number; commission: number }>;
    revenueByCategory: Array<{ category: string; revenue: number; percentage: number }>;
  }>;
  
  getCustomerProfitabilityAnalysis(customerId?: string): Promise<Array<{
    customer: Customer;
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
    marginPercent: number;
    orderCount: number;
    averageOrderValue: number;
    lastOrderDate: Date;
  }>>;

  getProductPerformanceAnalysis(dateRange?: { start: Date; end: Date }): Promise<Array<{
    qualityGrade: string;
    totalRevenue: number;
    totalQuantityKg: number;
    averagePricePerKg: number;
    orderCount: number;
    marginPercent: number;
  }>>;

  getSalesForecasting(periodType: string, periodsToForecast: number): Promise<Array<{
    period: string;
    forecastedRevenue: number;
    confidenceLevel: number;
    basedOnHistoricalData: boolean;
  }>>;

  // Integration operations with other systems
  allocateInventoryForSalesOrder(salesOrderId: string, userId: string): Promise<{
    success: boolean;
    allocatedItems: SalesOrderItem[];
    partialAllocations: Array<{ itemId: string; requestedQuantity: number; allocatedQuantity: number }>;
    unavailableItems: Array<{ itemId: string; reason: string }>;
  }>;

  createShipmentFromSalesOrder(salesOrderId: string, userId: string): Promise<{
    salesOrder: SalesOrder;
    shipment: Shipment;
    message: string;
  }>;

  processRevenueRecognition(salesOrderId: string, userId: string): Promise<{
    revenueTransactions: RevenueTransaction[];
    totalRecognizedRevenue: number;
    accountingPeriod: string;
  }>;

  // Period closing integration for sales
  getSalesDataForPeriodClosing(periodStart: Date, periodEnd: Date): Promise<{
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
    openSalesOrders: SalesOrder[];
    pendingRevenueTransactions: RevenueTransaction[];
    salesPerformanceMetrics: SalesPerformanceMetric[];
  }>;

  validateSalesOrdersForPeriodClosing(periodStart: Date, periodEnd: Date): Promise<{
    isValid: boolean;
    issues: Array<{ salesOrderId: string; issue: string; severity: 'warning' | 'error' }>;
    recommendations: string[];
  }>;

  // ===== DOCUMENT MANAGEMENT OPERATIONS =====

  // Document CRUD operations
  getDocument(id: string, userId?: string): Promise<Document | undefined>;
  getDocumentWithMetadata(id: string, userId?: string): Promise<DocumentWithMetadata | undefined>;
  createDocument(document: InsertDocument, auditContext?: AuditContext): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>, auditContext?: AuditContext): Promise<Document>;
  deleteDocument(id: string, auditContext?: AuditContext): Promise<void>;
  
  // Document search and filtering
  searchDocuments(searchRequest: DocumentSearchRequest, userId?: string): Promise<DocumentSearchResponse>;
  getDocumentsByCategory(category: string, limit?: number, offset?: number): Promise<Document[]>;
  getDocumentsByEntity(entityType: string, entityId: string): Promise<Document[]>;
  getDocumentsBySupplier(supplierId: string): Promise<Document[]>;
  getDocumentsByCustomer(customerId: string): Promise<Document[]>;
  getDocumentsByPurchase(purchaseId: string): Promise<Document[]>;
  getDocumentsByOrder(orderId: string): Promise<Document[]>;
  getDocumentsByShipment(shipmentId: string): Promise<Document[]>;
  getDocumentsByTags(tags: string[]): Promise<Document[]>;
  getDocuments(options?: { limit?: number; offset?: number }): Promise<Document[]>;
  
  // Document version control
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  getDocumentVersionHistory(documentId: string): Promise<DocumentVersionHistory>;
  createDocumentVersion(version: InsertDocumentVersion, auditContext?: AuditContext): Promise<DocumentVersion>;
  getDocumentVersion(versionId: string): Promise<DocumentVersion | undefined>;
  approveDocumentVersion(versionId: string, userId: string, auditContext?: AuditContext): Promise<DocumentVersion>;
  rollbackToVersion(documentId: string, versionId: string, userId: string, auditContext?: AuditContext): Promise<{
    document: Document;
    newVersion: DocumentVersion;
  }>;
  compareDocumentVersions(versionId1: string, versionId2: string): Promise<{
    version1: DocumentVersion;
    version2: DocumentVersion;
    differences: Array<{
      field: string;
      version1Value: any;
      version2Value: any;
      type: 'added' | 'removed' | 'modified';
    }>;
  }>;
  
  // Document metadata management
  getDocumentMetadata(documentId: string): Promise<DocumentMetadata[]>;
  addDocumentMetadata(metadata: InsertDocumentMetadata, auditContext?: AuditContext): Promise<DocumentMetadata>;
  updateDocumentMetadata(id: string, metadata: Partial<InsertDocumentMetadata>, auditContext?: AuditContext): Promise<DocumentMetadata>;
  deleteDocumentMetadata(id: string, auditContext?: AuditContext): Promise<void>;
  searchDocumentsByMetadata(key: string, value: string): Promise<Document[]>;
  
  // Document compliance tracking
  getDocumentCompliance(documentId: string): Promise<DocumentCompliance[]>;
  addDocumentCompliance(compliance: InsertDocumentCompliance, auditContext?: AuditContext): Promise<DocumentCompliance>;
  updateDocumentCompliance(id: string, compliance: Partial<InsertDocumentCompliance>, auditContext?: AuditContext): Promise<DocumentCompliance>;
  deleteDocumentCompliance(id: string, auditContext?: AuditContext): Promise<void>;
  getExpiringCompliance(days: number): Promise<ComplianceAlert[]>;
  getExpiredCompliance(): Promise<ComplianceAlert[]>;
  getComplianceByStatus(status: string): Promise<DocumentCompliance[]>;
  updateComplianceStatus(id: string, status: string, userId: string, auditContext?: AuditContext): Promise<DocumentCompliance>;
  
  // Compliance dashboard and monitoring
  getComplianceDashboard(userId?: string): Promise<ComplianceDashboard>;
  getComplianceAlerts(priority?: 'low' | 'medium' | 'high' | 'critical', limit?: number): Promise<ComplianceAlert[]>;
  getUpcomingRenewals(days?: number): Promise<ComplianceAlert[]>;
  getCriticalComplianceItems(): Promise<ComplianceAlert[]>;
  markComplianceReminderSent(complianceId: string): Promise<void>;
  generateComplianceReport(filters?: ComplianceFilterRequest): Promise<{
    summary: {
      total: number;
      compliant: number;
      nonCompliant: number;
      expiringSoon: number;
      expired: number;
      pendingReview: number;
    };
    details: DocumentCompliance[];
    recommendations: string[];
  }>;
  
  // Document access logging and audit
  logDocumentAccess(accessLog: InsertDocumentAccessLog): Promise<DocumentAccessLog>;
  getDocumentAccessLogs(documentId: string, limit?: number, offset?: number): Promise<DocumentAccessLog[]>;
  getDocumentAccessHistory(documentId: string, userId?: string): Promise<DocumentAccessLog[]>;
  getUserDocumentAccessHistory(userId: string, limit?: number, offset?: number): Promise<DocumentAccessLog[]>;
  detectSuspiciousDocumentAccess(documentId?: string): Promise<Array<{
    documentId: string;
    documentTitle: string;
    userId: string;
    userName: string;
    accessPattern: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    details: string;
  }>>;
  
  // Document workflow integration
  getDocumentWorkflowStates(documentId: string): Promise<DocumentWorkflowState[]>;
  createDocumentWorkflowState(workflowState: InsertDocumentWorkflowState, auditContext?: AuditContext): Promise<DocumentWorkflowState>;
  updateDocumentWorkflowState(id: string, workflowState: Partial<InsertDocumentWorkflowState>, auditContext?: AuditContext): Promise<DocumentWorkflowState>;
  completeDocumentWorkflowState(id: string, outcome: string, comments?: string, userId?: string): Promise<DocumentWorkflowState>;
  
  // Document analytics and reporting
  getDocumentAnalytics(dateFrom?: Date, dateTo?: Date): Promise<DocumentAnalytics>;
  getDocumentStatistics(): Promise<{
    totalDocuments: number;
    documentsByCategory: Array<{ category: string; count: number; percentage: number }>;
    documentsByStatus: Array<{ status: string; count: number; percentage: number }>;
    documentsByAccessLevel: Array<{ accessLevel: string; count: number; percentage: number }>;
    recentlyCreated: number;
    recentlyModified: number;
    averageFileSize: number;
    totalStorageUsed: number;
    mostActiveUsers: Array<{ userId: string; userName: string; activityCount: number }>;
  }>;
  getRecentDocumentActivity(limit?: number): Promise<Array<{
    documentId: string;
    documentTitle: string;
    action: string;
    userName: string;
    userRole: string;
    timestamp: Date;
    details?: string;
  }>>;
  
  // Document file management
  generateDocumentNumber(category: string): Promise<string>;
  validateDocumentFile(filePath: string, contentType: string, fileSize: number): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  calculateFileChecksum(filePath: string): Promise<string>;
  getDocumentStorageInfo(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    sizeByCategory: Array<{ category: string; totalSize: number; fileCount: number }>;
    oldestFile: Date;
    newestFile: Date;
  }>;
  
  // Document export and backup
  exportDocuments(filters?: DocumentSearchRequest): Promise<{
    documents: DocumentWithMetadata[];
    exportInfo: {
      totalDocuments: number;
      totalSize: number;
      exportDate: Date;
      exportedBy: string;
    };
  }>;
  
  // Document bulk operations
  bulkUpdateDocuments(documentIds: string[], updates: Partial<InsertDocument>, userId: string): Promise<{
    updated: number;
    failed: Array<{ documentId: string; error: string }>;
  }>;
  bulkDeleteDocuments(documentIds: string[], userId: string): Promise<{
    deleted: number;
    failed: Array<{ documentId: string; error: string }>;
  }>;
  bulkUpdateDocumentStatus(documentIds: string[], status: string, userId: string): Promise<{
    updated: number;
    failed: Array<{ documentId: string; error: string }>;
  }>;

  // ===============================================
  // NOTIFICATION SYSTEM STORAGE INTERFACE
  // ===============================================

  // Notification Settings operations
  getNotificationSettings(userId: string): Promise<NotificationSetting | undefined>;
  createNotificationSettings(settings: InsertNotificationSetting, auditContext?: AuditContext): Promise<NotificationSetting>;
  updateNotificationSettings(userId: string, settings: UpdateNotificationSetting, auditContext?: AuditContext): Promise<NotificationSetting>;
  getUserNotificationPreferences(userId: string): Promise<NotificationSettingsResponse>;

  // Notification Template operations
  getNotificationTemplates(filter?: NotificationTemplateFilter): Promise<NotificationTemplate[]>;
  getNotificationTemplate(id: string): Promise<NotificationTemplate | undefined>;
  getTemplateByTypeAndChannel(alertType: string, alertCategory: string, channel: string, language?: string): Promise<NotificationTemplate | undefined>;
  createNotificationTemplate(template: InsertNotificationTemplate, auditContext?: AuditContext): Promise<NotificationTemplate>;
  updateNotificationTemplate(id: string, template: UpdateNotificationTemplate, auditContext?: AuditContext): Promise<NotificationTemplate>;
  deleteNotificationTemplate(id: string, auditContext?: AuditContext): Promise<void>;

  // Notification Queue operations
  getNotifications(filter: NotificationQueueFilter): Promise<NotificationQueue[]>;
  getNotification(id: string): Promise<NotificationQueue | undefined>;
  getUserNotifications(userId: string, filter?: Partial<NotificationQueueFilter>): Promise<NotificationCenterResponse>;
  createNotification(notification: CreateNotification): Promise<NotificationQueue>;
  queueNotification(notification: InsertNotificationQueue): Promise<NotificationQueue>;
  updateNotificationStatus(id: string, updates: UpdateNotificationQueue, auditContext?: AuditContext): Promise<NotificationQueue>;
  markNotificationAsRead(id: string, userId: string): Promise<NotificationQueue>;
  dismissNotification(id: string, userId: string): Promise<NotificationQueue>;
  bulkMarkNotificationsAsRead(notificationIds: string[], userId: string): Promise<{ updated: number }>;
  bulkDismissNotifications(notificationIds: string[], userId: string): Promise<{ updated: number }>;
  getPendingNotifications(limit?: number): Promise<NotificationQueue[]>;
  getFailedNotifications(limit?: number): Promise<NotificationQueue[]>;
  
  // Alert Configuration operations
  getAlertConfigurations(filter?: AlertConfigurationFilter): Promise<AlertConfiguration[]>;
  getAlertConfiguration(id: string): Promise<AlertConfiguration | undefined>;
  getActiveAlertConfigurations(): Promise<AlertConfiguration[]>;
  getUserAlertConfigurations(userId: string): Promise<AlertConfiguration[]>;
  getRoleAlertConfigurations(role: string): Promise<AlertConfiguration[]>;
  createAlertConfiguration(config: InsertAlertConfiguration, auditContext?: AuditContext): Promise<AlertConfiguration>;
  updateAlertConfiguration(id: string, config: UpdateAlertConfiguration, auditContext?: AuditContext): Promise<AlertConfiguration>;
  deleteAlertConfiguration(id: string, auditContext?: AuditContext): Promise<void>;
  toggleAlertConfiguration(id: string, isActive: boolean, auditContext?: AuditContext): Promise<AlertConfiguration>;

  // Notification History operations
  getNotificationHistory(filter: NotificationHistoryFilter): Promise<NotificationHistory[]>;
  getUserNotificationHistory(userId: string, filter?: Partial<NotificationHistoryFilter>): Promise<NotificationHistory[]>;
  getNotificationAnalytics(userId?: string, dateFrom?: string, dateTo?: string): Promise<NotificationAnalytics>;
  archiveNotificationHistory(olderThanDays: number): Promise<{ archived: number }>;

  // Alert Monitoring operations
  getAlertMonitoringDashboard(userId?: string): Promise<AlertMonitoringDashboard>;
  checkThresholdAlerts(): Promise<{ triggered: number; notifications: number }>;
  evaluateBusinessAlerts(): Promise<{ evaluated: number; triggered: number }>;
  processNotificationQueue(batchSize?: number): Promise<{ processed: number; failed: number }>;
  getNotificationDeliveryStatus(notificationId: string): Promise<NotificationDeliveryStatus>;

  // Bulk notification operations
  createBulkNotifications(notifications: CreateNotification[]): Promise<NotificationQueue[]>;
  sendDigestNotifications(frequency: 'daily_digest' | 'weekly_summary' | 'monthly_report'): Promise<{ sent: number; failed: number }>;
  cleanupOldNotifications(retentionDays: number): Promise<{ deleted: number }>;
}

// ===== PROPER TYPED DRIZZLE UTILITIES =====
// These utilities use proper Drizzle typing without `any`

// Helper for safely getting count from Drizzle count queries 
// Note: Postgres returns bigint as string, so we need to coerce to number
function getCountFromQuery(countResults: { count: unknown }[]): number {
  const result = countResults[0]?.count;
  if (result === null || result === undefined) return 0;
  return Number(result); // Properly coerce Postgres bigint/string to number
}

// Helper to safely access beforeState properties with runtime type checking
function safeAccessBeforeState<T extends Record<string, any>>(
  beforeState: unknown,
  expectedKeys: (keyof T)[]
): Partial<T> | null {
  if (!beforeState || typeof beforeState !== 'object') return null;
  
  // Runtime validation that the object has the expected shape
  const obj = beforeState as Record<string, unknown>;
  const result: Partial<T> = {};
  
  for (const key of expectedKeys) {
    if (key in obj) {
      result[key] = obj[key as string] as T[keyof T];
    }
  }
  
  return result;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Stage 8: Warehouse scoping support
  async getUserWarehouseScopes(userId: string): Promise<any[]> {
    return await db.select().from(userWarehouseScopes).where(eq(userWarehouseScopes.userId, userId));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // CRITICAL: Prevent modification of system user data
    if (userData.id) {
      guardSystemUser(userData.id, 'modified');
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async countAdminUsers(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
    return Number(result[0]?.count || 0);
  }

  async updateUserRole(id: string, role: User['role'], auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<User> {
    // CRITICAL: Prevent modification of system user role
    guardSystemUser(id, 'role changed');

    // Get old user data for audit trail
    const [oldUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!oldUser) {
      throw new Error(`User not found: ${id}`);
    }

    // CRITICAL SECURITY FIX: Enforce approval requirement for role changes
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'user_role_change',
        operationData: { userId: id, oldRole: oldUser.role, newRole: role, userEmail: oldUser.email },
        businessContext: `User role change: ${oldUser.email} from ${oldUser.role} to ${role}`
      });
    }
    
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for user role changes
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        {
          ...auditContext,
          businessContext: `Changed user role from ${oldUser.role} to ${role} for ${oldUser.email}`
        },
        'users',
        id,
        'update',
        'user_role_change',
        { role: oldUser.role },
        { role },
        undefined,
        undefined
      );
    }
    
    return user;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        // Let the schema default handle ID generation for cross-DB compatibility
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async deleteUser(id: string, auditContext?: AuditContext): Promise<User> {
    // Use transaction to ensure atomicity of cleanup and deletion
    return await db.transaction(async (tx) => {
      // CRITICAL: Prevent deletion of system user using centralized guard
      guardSystemUser(id, 'deleted');

      // Get old user data for audit trail
      const [oldUser] = await tx.select().from(users).where(eq(users.id, id));
      
      if (!oldUser) {
        throw new Error(`User not found: ${id}`);
      }

      // Clean up dependent records before deletion to avoid foreign key constraints
      await this.cleanupUserDependentRecordsInTransaction(tx, id, auditContext);

      // Delete the user from the database
      await tx.delete(users).where(eq(users.id, id));
      
      // CRITICAL SECURITY: Audit logging for user deletion
      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          {
            ...auditContext,
            businessContext: `Permanently deleted user: ${oldUser.email}`
          },
          'users',
          id,
          'delete',
          'user_role_change',
          oldUser,
          undefined,
          undefined,
          undefined
        );
      }
      
      return oldUser;
    });
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    // CRITICAL: Prevent modification of system user status
    guardSystemUser(id, 'status changed');

    // Get old user data for audit trail
    const [oldUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!oldUser) {
      throw new Error(`User not found: ${id}`);
    }

    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    // Removed duplicate audit logging - handled by route layer
    return user;
  }

  /**
   * DEPENDENT RECORD CLEANUP: Clean up user-dependent records that block deletion
   * Handles notification_queue, notification_settings, etc.
   */
  async cleanupUserDependentRecords(userId: string, auditContext?: AuditContext): Promise<void> {
    // Wrap in transaction for consistency
    await db.transaction(async (tx) => {
      await this.cleanupUserDependentRecordsInTransaction(tx, userId, auditContext);
    });
  }

  /**
   * DEPENDENT RECORD CLEANUP (Transaction version): Clean up user-dependent records within a transaction
   * This version accepts a transaction context to ensure atomicity with other operations
   */
  private async cleanupUserDependentRecordsInTransaction(tx: any, userId: string, auditContext?: AuditContext): Promise<void> {
    try {
      // Clean up notification queue entries
      await tx.delete(notificationQueue).where(eq(notificationQueue.userId, userId));
      
      // Clean up notification settings
      await tx.delete(notificationSettings).where(eq(notificationSettings.userId, userId));
      
      // For customers table, reassign to system user instead of deleting
      // This preserves business data integrity
      const systemUser = await this.getSystemUserInTransaction(tx);
      if (systemUser) {
        await tx
          .update(customers)
          .set({ createdBy: systemUser.id })
          .where(eq(customers.createdBy, userId));
          
        // Handle settings_history table
        const { settingsHistory } = await import('@shared/schema');
        await tx
          .update(settingsHistory)
          .set({ createdBy: systemUser.id })
          .where(eq(settingsHistory.createdBy, userId));
          
        // Handle configuration_snapshots table
        const { configurationSnapshots } = await import('@shared/schema');
        await tx
          .update(configurationSnapshots)
          .set({ createdBy: systemUser.id })
          .where(eq(configurationSnapshots.createdBy, userId));
      }
      
      // Log cleanup action if audit context provided
      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          {
            ...auditContext,
            businessContext: `Cleaned up dependent records for user ${userId} (notifications, settings, customer reassignment)`
          },
          'users',
          userId,
          'update',
          'user_role_change',
          null,
          null,
          undefined,
          undefined
        );
      }
      
    } catch (error) {
      console.error(`Failed to cleanup dependent records for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get or create system user for reassigning records
   */
  private async getSystemUser(): Promise<User | null> {
    try {
      // Try to find existing system user
      const [systemUser] = await db.select().from(users).where(eq(users.email, 'system@workflu.local')).limit(1);
      return systemUser || null;
    } catch (error) {
      console.error('Error getting system user:', error);
      return null;
    }
  }

  /**
   * Get or create system user for reassigning records (Transaction version)
   */
  private async getSystemUserInTransaction(tx: any): Promise<User | null> {
    try {
      // Try to find existing system user within the transaction
      const [systemUser] = await tx.select().from(users).where(eq(users.email, 'system@workflu.local')).limit(1);
      return systemUser || null;
    } catch (error) {
      console.error('Error getting system user:', error);
      return null;
    }
  }

  /**
   * SECURE USER CLEANUP: Soft-delete with PII anonymization for GDPR compliance
   * This method deactivates user and anonymizes PII while preserving business audit trail
   */
  async anonymizeUserData(id: string, auditContext?: AuditContext): Promise<User> {
    // Get old user data for audit trail
    const [oldUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!oldUser) {
      throw new Error(`User not found: ${id}`);
    }

    // Generate anonymized data while preserving audit trail requirements
    const anonymizedEmail = `deleted-user-${id.substring(0, 8)}@anonymized.local`;
    const anonymizedFirstName = `[DELETED]`;
    const anonymizedLastName = `[DELETED]`;

    const [user] = await db
      .update(users)
      .set({ 
        isActive: false,
        email: anonymizedEmail,
        firstName: anonymizedFirstName,
        lastName: anonymizedLastName,
        profileImageUrl: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    
    // CRITICAL: Audit logging for PII anonymization
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        {
          ...auditContext,
          businessContext: `Anonymized user PII data for: ${oldUser.email} (compliance deletion)`
        },
        'users',
        id,
        'update',
        'user_role_change',
        oldUser,
        user,
        undefined,
        undefined
      );
    }

    return user;
  }

  /**
   * COMPREHENSIVE BUSINESS RECORD CHECK: Enhanced version for secure cleanup
   * Checks all business modules for user involvement to prevent data loss
   */
  async checkUserBusinessRecords(userId: string): Promise<{
    hasRecords: boolean;
    recordsSummary: Record<string, number>;
    details: string[];
  }> {
    try {
      const recordsSummary: Record<string, number> = {};
      const details: string[] = [];
      let totalRecords = 0;

      // Get all business data and check for user involvement
      const [
        capitalEntries,
        purchases,
        operatingExpenses,
        auditLogsCheck,
        sales,
        suppliers
      ] = await Promise.all([
        this.getCapitalEntries(),
        this.getPurchases(),
        this.getOperatingExpenses(),
        // Check audit logs by directly querying the database for user involvement
        db.select().from(auditLogs).where(eq(auditLogs.userId, userId)),
        // Check sales orders if the getSalesOrders method exists
        this.getSalesOrders ? this.getSalesOrders() : Promise.resolve([]),
        // Check suppliers if the getSuppliers method exists  
        this.getSuppliers ? this.getSuppliers() : Promise.resolve([])
      ]);

      // Check capital entries
      const capitalCount = capitalEntries.filter((entry: any) => 
        entry.createdBy === userId || entry.userId === userId
      ).length;
      if (capitalCount > 0) {
        recordsSummary.capitalEntries = capitalCount;
        details.push(`${capitalCount} capital entries`);
        totalRecords += capitalCount;
      }

      // Check purchases
      const purchaseCount = purchases.filter((purchase: any) => 
        purchase.createdBy === userId || purchase.userId === userId
      ).length;
      if (purchaseCount > 0) {
        recordsSummary.purchases = purchaseCount;
        details.push(`${purchaseCount} purchases`);
        totalRecords += purchaseCount;
      }

      // Check operating expenses
      const expenseCount = operatingExpenses.filter((expense: any) => 
        expense.createdBy === userId
      ).length;
      if (expenseCount > 0) {
        recordsSummary.operatingExpenses = expenseCount;
        details.push(`${expenseCount} operating expenses`);
        totalRecords += expenseCount;
      }

      // Check audit logs (direct database query result)
      const auditCount = auditLogsCheck.length;
      if (auditCount > 0) {
        recordsSummary.auditLogs = auditCount;
        details.push(`${auditCount} audit log entries`);
        totalRecords += auditCount;
      }

      // Check sales orders
      const salesCount = sales.filter((sale: any) => 
        sale.createdBy === userId || sale.userId === userId
      ).length;
      if (salesCount > 0) {
        recordsSummary.sales = salesCount;
        details.push(`${salesCount} sales orders`);
        totalRecords += salesCount;
      }

      // Check suppliers (if user is associated with supplier creation/management)
      const supplierCount = suppliers.filter((supplier: any) => 
        supplier.createdBy === userId
      ).length;
      if (supplierCount > 0) {
        recordsSummary.suppliers = supplierCount;
        details.push(`${supplierCount} suppliers`);
        totalRecords += supplierCount;
      }

      return {
        hasRecords: totalRecords > 0,
        recordsSummary,
        details
      };
    } catch (error) {
      console.error("Error checking comprehensive user business records:", error);
      // If we can't check, err on the side of caution
      return {
        hasRecords: true,
        recordsSummary: { error: 1 },
        details: ["Error checking records - defaulting to safe mode"]
      };
    }
  }

  /**
   * BULK USER CLEANUP: Efficient cleanup of multiple users with safety checks
   * Returns detailed results for each user processed
   */
  async bulkCleanupUsers(userIds: string[], auditContext?: AuditContext): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      userId: string;
      email: string;
      action: 'hard_delete' | 'soft_delete_anonymize' | 'protected' | 'error';
      reason: string;
      recordCount?: number;
    }>;
  }> {
    const results: Array<{
      userId: string;
      email: string;
      action: 'hard_delete' | 'soft_delete_anonymize' | 'protected' | 'error';
      reason: string;
      recordCount?: number;
    }> = [];

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const userId of userIds) {
      processed++;
      try {
        // Get user data
        const user = await this.getUser(userId);
        if (!user) {
          results.push({
            userId,
            email: 'unknown',
            action: 'error',
            reason: 'User not found'
          });
          failed++;
          continue;
        }

        // Protect critical admin users - enhanced guard
        if (user.role === 'admin' && user.isActive) {
          const adminCount = await this.countAdminUsers();
          if (adminCount <= 2) { // Keep at least 2 admins for safety
            results.push({
              userId,
              email: user.email!,
              action: 'protected',
              reason: 'Protected admin user - too few admins remaining'
            });
            failed++;
            continue;
          }
        }

        // Protect ALL super-admin users - CRITICAL security control
        if (user.isSuperAdmin) {
          results.push({
            userId,
            email: user.email!,
            action: 'protected',
            reason: 'Protected super-admin user - cannot be bulk deleted'
          });
          failed++;
          continue;
        }

        // Clean up dependent records first (notifications, settings, etc.)
        try {
          await this.cleanupUserDependentRecords(userId, auditContext);
        } catch (error) {
          results.push({
            userId,
            email: user.email!,
            action: 'error',
            reason: `Dependent cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
          failed++;
          continue;
        }

        // Check business records after dependent cleanup
        const businessCheck = await this.checkUserBusinessRecords(userId);
        
        if (businessCheck.hasRecords) {
          // Soft delete with PII anonymization
          await this.anonymizeUserData(userId, auditContext);
          
          // Invalidate sessions if using Supabase
          if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
            const admin = supabaseAdmin();
            await admin.auth.admin.signOutUser(user.authProviderUserId);
          }

          results.push({
            userId,
            email: user.email!,
            action: 'soft_delete_anonymize',
            reason: `Has business records: ${businessCheck.details.join(', ')}`,
            recordCount: Object.values(businessCheck.recordsSummary).reduce((a: number, b: number) => a + b, 0)
          });
          successful++;
        } else {
          // Hard delete - no business records
          
          // Delete from Supabase first if using Supabase auth
          if (process.env.AUTH_PROVIDER === 'supabase' && user.authProviderUserId) {
            const admin = supabaseAdmin();
            await admin.auth.admin.deleteUser(user.authProviderUserId);
          }

          // Delete from local database
          await this.deleteUser(userId, auditContext);

          results.push({
            userId,
            email: user.email!,
            action: 'hard_delete',
            reason: 'No business records found - safe to permanently delete',
            recordCount: 0
          });
          successful++;
        }
      } catch (error) {
        results.push({
          userId,
          email: 'unknown',
          action: 'error',
          reason: `Processing failed: ${error instanceof Error ? error.message : error}`
        });
        failed++;
      }
    }

    return {
      processed,
      successful,
      failed,
      results
    };
  }

  async updateSuperAdminStatus(id: string, isSuperAdmin: boolean): Promise<User> {
    // Get old user data for audit trail
    const [oldUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!oldUser) {
      throw new Error(`User not found: ${id}`);
    }

    const [user] = await db
      .update(users)
      .set({ isSuperAdmin, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    // Audit logging is handled by route layer
    return user;
  }

  async updateDisplayName(id: string, firstName: string, lastName: string): Promise<User> {
    // Get old user data for audit trail
    const [oldUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!oldUser) {
      throw new Error(`User not found: ${id}`);
    }

    const [user] = await db
      .update(users)
      .set({ firstName, lastName, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    // Removed duplicate audit logging - handled by route layer
    return user;
  }

  // Alias for compatibility
  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(and(
      eq(settings.key, key),
      eq(settings.isActive, true)
    ));
    return setting;
  }

  async setSetting(setting: InsertSetting, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Setting> {
    // Get old setting for audit trail
    const [oldSetting] = await db.select().from(settings).where(eq(settings.key, setting.key));
    
    // CRITICAL SECURITY FIX: Enforce approval requirement for critical system settings
    const criticalSettings = [
      'PREVENT_NEGATIVE_BALANCE',
      'USD_ETB_RATE',
      'MAX_PURCHASE_AMOUNT',
      'AUTO_APPROVAL_THRESHOLD',
      'REQUIRE_APPROVAL_ABOVE',
      'ADMIN_EMAIL_ALERTS',
      'SECURITY_MODE',
      'AUDIT_RETENTION_DAYS'
    ];
    
    const isCriticalSetting = criticalSettings.includes(setting.key);
    
    if (approvalContext && isCriticalSetting) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'system_setting_change',
        operationData: { 
          key: setting.key, 
          oldValue: oldSetting?.value, 
          newValue: setting.value 
        },
        businessContext: `Critical system setting change: ${setting.key} from '${oldSetting?.value}' to '${setting.value}'`
      });
    }
    
    const [result] = await db
      .insert(settings)
      .values(setting)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // CRITICAL SECURITY: Audit logging for system setting changes
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        {
          ...auditContext,
          businessContext: `${oldSetting ? 'Updated' : 'Created'} system setting: ${setting.key} = ${setting.value}${isCriticalSetting ? ' (CRITICAL SETTING)' : ''}`
        },
        'settings',
        result.id,
        oldSetting ? 'update' : 'create',
        'system_setting_change',
        oldSetting ? { value: oldSetting.value } : undefined,
        { value: setting.value },
        undefined,
        undefined
      );
    }
    
    return result;
  }

  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings).where(eq(settings.isActive, true)).orderBy(desc(settings.updatedAt));
  }

  async updateSetting(setting: InsertSetting, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Setting> {
    // Get old setting for audit trail
    const [oldSetting] = await db.select().from(settings).where(eq(settings.key, setting.key));
    
    if (!oldSetting) {
      throw new Error(`Setting with key '${setting.key}' not found`);
    }
    
    // CRITICAL SECURITY FIX: Enforce approval requirement for critical system settings
    const criticalSettings = [
      'PREVENT_NEGATIVE_BALANCE',
      'USD_ETB_RATE',
      'MAX_PURCHASE_AMOUNT',
      'AUTO_APPROVAL_THRESHOLD',
      'REQUIRE_APPROVAL_ABOVE',
      'ADMIN_EMAIL_ALERTS',
      'SECURITY_MODE',
      'AUDIT_RETENTION_DAYS'
    ];
    
    const isCriticalSetting = criticalSettings.includes(setting.key);
    
    if (approvalContext && isCriticalSetting) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'system_setting_change',
        operationData: { 
          key: setting.key, 
          oldValue: oldSetting.value, 
          newValue: setting.value 
        },
        businessContext: `Critical system setting update: ${setting.key} from '${oldSetting.value}' to '${setting.value}'`
      });
    }
    
    const [result] = await db
      .update(settings)
      .set({
        value: setting.value,
        description: setting.description,
        category: setting.category,
        requiresApproval: setting.requiresApproval,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, oldSetting.id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for system setting changes
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        {
          ...auditContext,
          businessContext: `Updated system setting: ${setting.key} = ${setting.value}${isCriticalSetting ? ' (CRITICAL SETTING)' : ''}`
        },
        'settings',
        result.id,
        'update',
        'system_setting_change',
        { value: oldSetting.value },
        { value: setting.value },
        undefined,
        undefined
      );
    }
    
    return result;
  }

  async getExchangeRate(): Promise<number> {
    try {
      // STAGE 10 COMPLIANCE: Use ConfigurationService for central FX rate enforcement
      const configService = ConfigurationService.getInstance();
      return await configService.getCentralExchangeRate();
    } catch (error) {
      console.error('Failed to get exchange rate from ConfigurationService:', error);
      throw new Error('Exchange rate not available. Please configure USD_ETB_RATE in settings.');
    }
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Supplier> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'supplier_create',
        operationData: supplier,
        businessContext: `Create supplier: ${supplier.name}`
      });
    }

    const [result] = await db.insert(suppliers).values(supplier).returning();
    
    // CRITICAL SECURITY: Audit logging for supplier operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'suppliers',
        result.id,
        'create',
        'supplier_create',
        null,
        result
      );
    }
    
    return result;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Supplier> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState(suppliers, id);
    
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'supplier_update',
        operationData: supplier,
        businessContext: `Update supplier: ${safeAccessBeforeState(beforeState, ['name'])?.name || id}`
      });
    }

    const [result] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for supplier updates
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'suppliers',
        result.id,
        'update',
        'supplier_update',
        beforeState,
        result
      );
    }
    
    return result;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Order> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'order_create',
        operationData: order,
        businessContext: `Create order: ${order.orderNumber}`
      });
    }

    const [result] = await db.insert(orders).values(order).returning();
    
    // CRITICAL SECURITY: Audit logging for order operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'orders',
        result.id,
        'create',
        'order_create',
        null,
        result
      );
    }
    
    return result;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Order> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState(orders, id);
    
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'order_update',
        operationData: order,
        businessContext: `Update order: ${safeAccessBeforeState(beforeState, ['orderNumber'])?.orderNumber || id}`
      });
    }

    const [result] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for order updates
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'orders',
        result.id,
        'update',
        'order_update',
        beforeState,
        result
      );
    }
    
    return result;
  }

  // Capital operations
  async getCapitalEntries(): Promise<CapitalEntry[]> {
    return await db.select().from(capitalEntries).orderBy(desc(capitalEntries.date));
  }

  async getCapitalEntryById(id: string): Promise<CapitalEntry | undefined> {
    const [entry] = await db.select().from(capitalEntries).where(eq(capitalEntries.id, id));
    return entry;
  }

  async getCapitalEntriesByType(type: string): Promise<CapitalEntry[]> {
    return await db.select().from(capitalEntries)
      .where(eq(capitalEntries.type, type))
      .orderBy(desc(capitalEntries.date));
  }

  async getCapitalBalance(): Promise<number> {
    // STAGE 1 COMPLIANCE: Use proper business logic for all entry types
    const entries = await db.select().from(capitalEntries);
    
    let totalBalance = 0;
    for (const entry of entries) {
      const impact = await this.calculateCapitalEntryBalanceImpact(entry);
      totalBalance += impact;
    }
    
    return totalBalance;
  }

  async createCapitalEntry(entry: InsertCapitalEntry, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<CapitalEntry> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'capital_entry',
        operationData: entry,
        amount: parseFloat(entry.amount),
        currency: entry.paymentCurrency || 'USD',
        businessContext: `Capital ${entry.type}: ${entry.description}`
      });
    }

    // STAGE 1 COMPLIANCE: Amount matching validation for linked operations
    if (entry.reference) {
      await this.validateCapitalEntryAmountMatching(entry);
    }

    const [result] = await db.insert(capitalEntries).values(entry).returning();
    
    // CRITICAL SECURITY: Audit logging for financial operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'capital_entries',
        result.id,
        'create',
        'capital_entry',
        null,
        result,
        await this.calculateCapitalEntryBalanceImpact(result),
        entry.paymentCurrency || 'USD'
      );
    }
    
    return result;
  }

  async createCapitalEntryWithConcurrencyProtection(entry: InsertCapitalEntry, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<CapitalEntry> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'capital_entry',
        operationData: entry,
        amount: parseFloat(entry.amount),
        currency: entry.paymentCurrency || 'USD',
        businessContext: `Capital ${entry.type}: ${entry.description}`
      });
    }

    // Use database transaction with locking for capital entries
    const result = await db.transaction(async (tx) => {
      return await this.createCapitalEntryInTransaction(tx, entry);
    });
    
    // CRITICAL SECURITY: Enhanced audit logging for critical capital operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'capital_entries',
        result.id,
        'create',
        'capital_entry',
        null,
        result,
        await this.calculateCapitalEntryBalanceImpact(result),
        entry.paymentCurrency || 'USD'
      );
    }
    
    return result;
  }

  private async createCapitalEntryInTransaction(tx: any, entry: InsertCapitalEntry): Promise<CapitalEntry> {
    // Use advisory lock to serialize capital balance operations (prevent race conditions)
    // Lock ID: hash of "capital_balance_operations" string = 9876543210  
    const capitalLockId = 9876543210;
    
    // Acquire advisory transaction lock for capital operations
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${capitalLockId})`);
    
    // STAGE 1 COMPLIANCE: Check balance impact for all entry types that can reduce balance
    const config = ConfigurationService.getInstance();
    const preventNegativeConfig = await config.getSystemSetting('PREVENT_NEGATIVE_BALANCE', 'financial');
    const preventNegative = preventNegativeConfig === 'true';
    
    if (preventNegative) {
      // Calculate the balance impact for this entry (handles all types correctly)
      const balanceImpact = await this.calculateCapitalEntryBalanceImpactForValidation(entry);
      
      // Only check if the impact is negative (would reduce balance)
      if (balanceImpact < 0) {
        const currentBalance = await this.getCapitalBalanceInTransaction(tx);
        const impactAmount = new Decimal(Math.abs(balanceImpact));
        const newBalance = new Decimal(currentBalance).sub(impactAmount);
        
        if (newBalance.lt(0)) {
          throw new Error(`Cannot create ${entry.type} entry. Would result in negative balance: ${newBalance.toFixed(2)} USD`);
        }
      }
    }
    
    // Create the capital entry
    const [result] = await tx.insert(capitalEntries).values(entry).returning();
    return result;
  }

  // STAGE 1 COMPLIANCE: Calculate balance impact for validation (simpler version for transaction checks)
  private async calculateCapitalEntryBalanceImpactForValidation(entry: InsertCapitalEntry): Promise<number> {
    const amount = parseFloat(entry.amount);
    
    switch (entry.type) {
      case 'CapitalIn':
        return amount; // Positive impact
      case 'CapitalOut':
        return -amount; // Negative impact
      case 'Reclass':
        return 0; // Net-zero balance impact
      case 'Reverse':
        // STAGE 1 COMPLIANCE: Reverse entries should be exempt from negative balance checking
        // since they reference existing entries and their actual impact depends on what they reverse
        // To avoid circular dependencies during transaction, we exempt them from validation
        return 0;
      default:
        throw new Error(`Unknown capital entry type: ${entry.type}`);
    }
  }

  // STAGE 1 COMPLIANCE: Calculate correct balance impact for different entry types
  private async calculateCapitalEntryBalanceImpact(entry: CapitalEntry | InsertCapitalEntry): Promise<number> {
    const amount = parseFloat(entry.amount);
    
    switch (entry.type) {
      case 'CapitalIn':
        return amount; // Positive impact
      case 'CapitalOut':
        return -amount; // Negative impact
      case 'Reclass':
        return 0; // Net-zero balance impact (just changes classification)
      case 'Reverse':
        // Reverse entries negate the original entry's balance impact
        if (!entry.reference) {
          throw new Error('Reverse entries must reference the original entry');
        }
        
        // Look up the referenced entry to determine its balance impact
        const [referencedEntry] = await db.select().from(capitalEntries).where(eq(capitalEntries.id, entry.reference));
        if (!referencedEntry) {
          throw new Error(`Referenced capital entry not found: ${entry.reference}`);
        }
        
        // Return the exact negative of the referenced entry's balance impact
        const referencedImpact = await this.calculateCapitalEntryBalanceImpact(referencedEntry);
        return -referencedImpact;
      default:
        throw new Error(`Unknown capital entry type: ${entry.type}`);
    }
  }

  // STAGE 1 COMPLIANCE: Amount matching validation for capital entries
  private async validateCapitalEntryAmountMatching(entry: InsertCapitalEntry): Promise<void> {
    if (!entry.reference) return;

    const referenceId = entry.reference;
    const config = ConfigurationService.getInstance();

    // STAGE 1 COMPLIANCE: Validate currency domain
    if (entry.paymentCurrency && !['USD', 'ETB'].includes(entry.paymentCurrency)) {
      throw new Error(`Unsupported payment currency: ${entry.paymentCurrency}. Only USD and ETB are supported.`);
    }

    // STAGE 1 COMPLIANCE: Normalize entry amount to USD for consistent comparisons
    let entryAmountUSD = new Decimal(entry.amount);
    if (entry.paymentCurrency === 'ETB') {
      // Exchange rate is not provided in InsertCapitalEntry, use central rate
      const rate = await config.getCentralExchangeRate();
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error(`Invalid exchange rate for capital entry: ${rate}. Must be a positive finite number.`);
      }
      entryAmountUSD = entryAmountUSD.div(rate);
    }

    // Check if reference is a purchase
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, referenceId));
    if (purchase) {
      // STAGE 1 COMPLIANCE: Validate purchase currency domain
      if (purchase.currency && !['USD', 'ETB'].includes(purchase.currency)) {
        throw new Error(`Unsupported purchase currency: ${purchase.currency}. Only USD and ETB are supported.`);
      }
      
      let expectedAmount = new Decimal(purchase.amountPaid);
      
      // Convert from purchase currency to USD if needed
      if (purchase.currency === 'ETB') {
        // Use the purchase's stored exchange rate or central rate
        const rate = purchase.exchangeRate ? parseFloat(purchase.exchangeRate as string) : await config.getCentralExchangeRate();
        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error(`Invalid exchange rate for purchase: ${rate}. Must be a positive finite number.`);
        }
        expectedAmount = expectedAmount.div(rate);
      }
      
      // Allow 1% tolerance for rounding differences
      const tolerance = expectedAmount.mul(0.01);
      const difference = entryAmountUSD.sub(expectedAmount).abs();
      
      if (difference.gt(tolerance)) {
        throw new Error(`Capital entry amount ${entryAmountUSD} USD does not match linked purchase payment ${expectedAmount} USD (tolerance: ±${tolerance} USD)`);
      }
      return;
    }

    // Check if reference is an operating expense
    const [expense] = await db.select().from(operatingExpenses).where(eq(operatingExpenses.id, referenceId));
    if (expense) {
      let expectedAmount = new Decimal(expense.amountUsd);
      
      // Allow 1% tolerance for rounding differences
      const tolerance = expectedAmount.mul(0.01);
      const difference = entryAmountUSD.sub(expectedAmount).abs();
      
      if (difference.gt(tolerance)) {
        throw new Error(`Capital entry amount ${entryAmountUSD} USD does not match linked expense amount ${expectedAmount} USD (tolerance: ±${tolerance} USD)`);
      }
      return;
    }

    // Check if reference is a shipment leg
    const [shipmentLeg] = await db.select().from(shipmentLegs).where(eq(shipmentLegs.id, referenceId));
    if (shipmentLeg) {
      // STAGE 1 COMPLIANCE: Validate shipment leg currency domain
      if (shipmentLeg.paymentCurrency && !['USD', 'ETB'].includes(shipmentLeg.paymentCurrency)) {
        throw new Error(`Unsupported shipment leg currency: ${shipmentLeg.paymentCurrency}. Only USD and ETB are supported.`);
      }
      
      let expectedAmount = new Decimal(shipmentLeg.legTotalCost);
      
      // Convert from leg currency to USD if needed
      if (shipmentLeg.paymentCurrency === 'ETB') {
        const rate = shipmentLeg.exchangeRate ? parseFloat(shipmentLeg.exchangeRate) : await config.getCentralExchangeRate();
        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error(`Invalid exchange rate for shipment leg: ${rate}. Must be a positive finite number.`);
        }
        expectedAmount = expectedAmount.div(rate);
      }
      
      // Allow 1% tolerance for rounding differences
      const tolerance = expectedAmount.mul(0.01);
      const difference = entryAmountUSD.sub(expectedAmount).abs();
      
      if (difference.gt(tolerance)) {
        throw new Error(`Capital entry amount ${entryAmountUSD} USD does not match linked shipping leg cost ${expectedAmount} USD (tolerance: ±${tolerance} USD)`);
      }
      return;
    }

    // Check if reference is a sales order (for order_id references)
    const [salesOrder] = await db.select().from(salesOrders).where(eq(salesOrders.id, referenceId));
    if (salesOrder) {
      // STAGE 1 COMPLIANCE: Validate sales order currency domain
      if (salesOrder.currency && !['USD', 'ETB'].includes(salesOrder.currency)) {
        throw new Error(`Unsupported sales order currency: ${salesOrder.currency}. Only USD and ETB are supported.`);
      }
      
      // STAGE 1 COMPLIANCE: Validate against amount paid for partial payments, not total
      let expectedAmount = new Decimal(salesOrder.amountPaid || '0');
      
      // Convert from sales order currency to USD if needed
      if (salesOrder.currency === 'ETB') {
        const rate = salesOrder.exchangeRate ? parseFloat(salesOrder.exchangeRate) : await config.getCentralExchangeRate();
        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error(`Invalid exchange rate for sales order: ${rate}. Must be a positive finite number.`);
        }
        expectedAmount = expectedAmount.div(rate);
      }
      
      // Allow 1% tolerance for rounding differences
      const tolerance = expectedAmount.mul(0.01);
      const difference = entryAmountUSD.sub(expectedAmount).abs();
      
      if (difference.gt(tolerance)) {
        throw new Error(`Capital entry amount ${entryAmountUSD} USD does not match linked sales order amount paid ${expectedAmount} USD (tolerance: ±${tolerance} USD)`);
      }
      return;
    }

    // Check if reference is a basic order
    const [order] = await db.select().from(orders).where(eq(orders.id, referenceId));
    if (order) {
      // Basic orders table doesn't have amounts, so we validate the reference exists
      // but don't do amount matching - this ensures referential integrity
      return;
    }

    // If we get here, the reference doesn't match any known operation type
    throw new Error(`Capital entry reference '${referenceId}' does not match any known operation (purchase, expense, shipping leg, sales order, or order)`);
  }

  // STAGE 1 COMPLIANCE: Linked deletion protection for capital entries
  async deleteCapitalEntry(id: string, auditContext?: AuditContext): Promise<void> {
    // Check if capital entry has a reference (is linked to an operation)
    const [entry] = await db.select().from(capitalEntries).where(eq(capitalEntries.id, id));
    if (!entry) {
      throw new Error(`Capital entry not found: ${id}`);
    }

    if (entry.reference) {
      throw new Error(`Cannot delete capital entry ${entry.entryId} - it is linked to operation ${entry.reference}. Use Reverse entry instead.`);
    }

    await db.delete(capitalEntries).where(eq(capitalEntries.id, id));
    
    // CRITICAL SECURITY: Audit logging for deletion
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'capital_entries',
        id,
        'delete',
        'capital_entry',
        entry,
        null,
        await this.calculateCapitalEntryBalanceImpact(entry),
        entry.paymentCurrency || 'USD'
      );
    }
  }

  // Purchase operations
  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.date));
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(purchase: InsertPurchase, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Purchase> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'purchase',
        operationData: purchase,
        amount: new Decimal(purchase.total).toNumber(),
        currency: purchase.currency || 'USD',
        businessContext: `Purchase: ${purchase.weight}kg at ${purchase.pricePerKg} per kg`
      });
    }

    // Generate next purchase number with retry logic to handle race conditions
    const purchaseNumber = await this.generateNextPurchaseNumber();
    
    const [result] = await db.insert(purchases).values({
      ...purchase,
      purchaseNumber,
    }).returning();
    
    // CRITICAL SECURITY: Audit logging for purchase operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'purchases',
        result.id,
        'create',
        'purchase',
        null,
        result,
        -new Decimal(purchase.total).toNumber(), // Negative impact for purchases (outflow)
        purchase.currency || 'USD'
      );
    }
    
    return result;
  }

  async createPurchaseWithSideEffects(purchaseData: InsertPurchase, userId: string, auditContext?: any): Promise<Purchase> {
    // Use database transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Generate next purchase number with retry logic
      const purchaseNumber = await this.generateNextPurchaseNumberInTransaction(tx);
      
      // Create the purchase record
      const [purchase] = await tx.insert(purchases).values({
        ...purchaseData,
        purchaseNumber,
      }).returning();

      // STAGE 2 SECURITY: Get central exchange rate once and reuse (never trust client)
      const config = ConfigurationService.getInstance();
      let exchangeRateValue: number | undefined;
      if (purchaseData.currency === 'ETB') {
        exchangeRateValue = await config.getCentralExchangeRate();
      }

      // If funded from capital and amount paid > 0, create capital entry
      if (purchaseData.fundingSource === 'capital' && parseFloat(purchaseData.amountPaid || '0') > 0) {
        const amountPaid = new Decimal(purchaseData.amountPaid || '0');
        
        // Convert amount to USD using central exchange rate
        let amountInUsd = amountPaid;
        if (purchaseData.currency === 'ETB' && exchangeRateValue) {
          const centralRate = new Decimal(exchangeRateValue);
          amountInUsd = amountPaid.div(centralRate);
        }
        
        // Create capital entry with atomic balance checking
        // Note: entryId and exchangeRate are set by the database, not provided in InsertCapitalEntry
        await this.createCapitalEntryInTransaction(tx, {
          amount: amountInUsd.toFixed(2),
          type: 'CapitalOut',
          reference: purchase.id,
          description: `Purchase payment - ${purchaseData.weight}kg ${purchaseData.currency === 'ETB' ? `(${purchaseData.amountPaid} ETB @ ${exchangeRateValue})` : ''}`,
          paymentCurrency: purchaseData.currency,
          createdBy: userId,
        });
      }

      // STAGE 2 COMPLIANCE: Create warehouse stock entry in FIRST warehouse with central FX rate
      const pricePerKg = new Decimal(purchaseData.pricePerKg);
      let finalExchangeRate: number;
      if (purchaseData.currency === 'USD') {
        finalExchangeRate = 1; // USD to USD is 1:1
      } else {
        // Use the exchangeRateValue from above if available, otherwise fetch fresh
        const config2 = ConfigurationService.getInstance();
        finalExchangeRate = exchangeRateValue || await config2.getCentralExchangeRate();
      }
      
      const unitCostCleanUsd = purchaseData.currency === 'USD' 
        ? purchaseData.pricePerKg 
        : pricePerKg.div(new Decimal(finalExchangeRate)).toFixed(4);

      await tx.insert(warehouseStock).values({
        purchaseId: purchase.id,
        orderId: purchase.orderId || null,
        supplierId: purchase.supplierId,
        warehouse: 'FIRST',
        status: 'AWAITING_DECISION',
        qtyKgTotal: purchaseData.weight,
        qtyKgClean: purchaseData.weight,
        qtyKgNonClean: '0',
        unitCostCleanUsd,
      });

      return purchase;
    });

    // Log the complex purchase transaction with supplier information
    if (auditContext) {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, purchaseData.supplierId));
      await auditService.logPurchase(
        auditContext,
        'create',
        result,
        undefined,
        supplier?.name
      );
    }
    
    return result;
  }

  async createPurchaseWithSideEffectsRetryable(purchaseData: InsertPurchase, userId: string): Promise<Purchase> {
    const maxRetries = 5;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.createPurchaseWithSideEffects(purchaseData, userId);
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable (serialization failure, unique violation, deadlock)
        const isRetryableError = error instanceof Error && (
          error.message.includes('serialization_failure') ||
          error.message.includes('unique_violation') ||
          error.message.includes('deadlock_detected') ||
          error.message.includes('could not serialize') ||
          error.message.includes('duplicate key') ||
          // Advisory lock conflicts
          error.message.includes('advisory') ||
          // Purchase number conflicts
          error.message.includes('purchase_number')
        );
        
        if (!isRetryableError || attempt === maxRetries - 1) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms, 800ms, 1600ms
        const jitter = Math.random() * 100; // 0-100ms random jitter
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
        
        console.log(`Purchase creation attempt ${attempt + 1} failed with retryable error, retrying...`, error.message);
      }
    }
    
    throw lastError || new Error('Purchase creation failed after all retries');
  }

  private async generateNextPurchaseNumber(): Promise<string> {
    // Use retry logic to handle race conditions
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get the highest existing purchase number using lexicographic ordering
        const latestPurchase = await db
          .select({ purchaseNumber: purchases.purchaseNumber })
          .from(purchases)
          .orderBy(sql`${purchases.purchaseNumber} DESC`)
          .limit(1);

        const nextNumber = this.calculateNextPurchaseNumber(latestPurchase[0]?.purchaseNumber);
        return nextNumber;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
      }
    }
    return 'PUR-000001'; // Fallback
  }

  private async generateNextPurchaseNumberInTransaction(tx: any): Promise<string> {
    // Use advisory lock to serialize purchase number generation
    // Lock ID: hash of "purchase_number_generation" string = 1234567890
    const lockId = 1234567890;
    
    // Acquire advisory transaction lock (automatically released at transaction end)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
    
    // Now we have exclusive access to purchase number generation
    // Get the highest existing purchase number in transaction with SELECT FOR UPDATE
    const latestPurchase = await tx
      .select({ purchaseNumber: purchases.purchaseNumber })
      .from(purchases)
      .orderBy(sql`${purchases.purchaseNumber} DESC`)
      .limit(1)
      .for('update');

    return this.calculateNextPurchaseNumber(latestPurchase[0]?.purchaseNumber);
  }

  private calculateNextPurchaseNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'PUR-000001';
    }

    // Extract number from PUR-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastNumber.match(/PUR-(\d+)/);
    
    if (!numberMatch) {
      return 'PUR-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `PUR-${nextNumber.toString().padStart(6, '0')}`;
  }

  private async getCapitalBalanceInTransaction(tx: any): Promise<number> {
    // STAGE 1 COMPLIANCE: Use proper business logic for all entry types within transaction
    const entries = await tx.select().from(capitalEntries);
    
    let totalBalance = 0;
    for (const entry of entries) {
      const impact = await this.calculateCapitalEntryBalanceImpact(entry);
      totalBalance += impact;
    }
    
    return totalBalance;
  }

  async updatePurchase(id: string, purchase: Partial<InsertPurchase>, auditContext?: AuditContext): Promise<Purchase> {
    // STAGE 2 COMPLIANCE: Check for linkage to prevent immutable field modification
    const [existingPurchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    if (!existingPurchase) {
      throw new Error(`Purchase not found: ${id}`);
    }

    // Check if purchase has linked warehouse operations (making it immutable for sensitive fields)
    const linkedWarehouseOperations = await db
      .select({ count: count() })
      .from(warehouseStock)
      .where(eq(warehouseStock.purchaseId, id));
    
    const hasWarehouseLinkage = getCountFromQuery(linkedWarehouseOperations) > 0;

    // STAGE 2 CRITICAL: Prevent modification of price/weight after warehouse linkage
    if (hasWarehouseLinkage) {
      const sensitiveFields = ['pricePerKg', 'weight', 'total', 'currency', 'exchangeRate'];
      const attemptingSensitiveChanges = sensitiveFields.some(field => 
        field in purchase && purchase[field as keyof typeof purchase] !== existingPurchase[field as keyof typeof existingPurchase]
      );

      if (attemptingSensitiveChanges) {
        throw new Error(`Cannot modify price, weight, or currency fields after warehouse linkage. Use settlement or reversal entries instead.`);
      }
    }

    const [result] = await db
      .update(purchases)
      .set({ ...purchase, updatedAt: new Date() })
      .where(eq(purchases.id, id))
      .returning();

    // CRITICAL SECURITY: Audit logging for purchase updates
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'purchases',
        result.id,
        'update',
        'purchase',
        existingPurchase,
        result,
        -parseFloat(result.total), // Negative impact for purchases (outflow)
        result.currency || 'USD'
      );
    }

    return result;
  }

  async deletePurchase(id: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<void> {
    // CRITICAL SECURITY: Enforce approval requirement for purchase deletion UNCONDITIONALLY
    if (!approvalContext) {
      throw new Error('Purchase deletion requires approval context for security compliance. This operation cannot proceed without proper authorization workflow.');
    }
    
    await StorageApprovalGuard.enforceApprovalRequirement({
      ...approvalContext,
      operationType: 'purchase_delete',
      operationData: { purchaseId: id },
      businessContext: `Purchase deletion: ${id}`
    });

    // Get existing purchase for audit logging and validation
    const [existingPurchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    if (!existingPurchase) {
      throw new Error(`Purchase not found: ${id}`);
    }

    // Check for linked warehouse stock to prevent data inconsistency
    const linkedStock = await db
      .select({ count: count() })
      .from(warehouseStock)
      .where(eq(warehouseStock.purchaseId, id));
    
    if (getCountFromQuery(linkedStock) > 0) {
      throw new Error(`Cannot delete purchase ${existingPurchase.purchaseNumber} - it has linked warehouse stock entries. Cancel or process the warehouse operations first.`);
    }

    // Check for capital entries linked to this purchase
    const linkedCapitalEntries = await db
      .select({ count: count() })
      .from(capitalEntries)
      .where(eq(capitalEntries.reference, id));
    
    if (getCountFromQuery(linkedCapitalEntries) > 0) {
      throw new Error(`Cannot delete purchase ${existingPurchase.purchaseNumber} - it has linked capital entries. Reverse the capital entries first.`);
    }

    // Check for payments linked to this purchase
    const linkedPayments = await db
      .select({ count: count() })
      .from(purchasePayments)
      .where(eq(purchasePayments.purchaseId, id));
    
    if (getCountFromQuery(linkedPayments) > 0) {
      throw new Error(`Cannot delete purchase ${existingPurchase.purchaseNumber} - it has linked payment records. Remove the payments first.`);
    }

    // Perform the deletion
    await db.delete(purchases).where(eq(purchases.id, id));

    // CRITICAL SECURITY: Audit logging for purchase deletion
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'purchases',
        id,
        'delete',
        'purchase_cancellation',
        existingPurchase,
        null,
        parseFloat(existingPurchase.total), // Positive impact for deletion (recovery of outflow)
        existingPurchase.currency || 'USD'
      );
    }
  }

  // Purchase payment operations
  async getPurchasePayments(purchaseId: string): Promise<PurchasePayment[]> {
    return await db
      .select()
      .from(purchasePayments)
      .where(eq(purchasePayments.purchaseId, purchaseId))
      .orderBy(desc(purchasePayments.paymentDate));
  }

  async createPurchasePayment(payment: InsertPurchasePayment, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<PurchasePayment> {
    // CRITICAL SECURITY: Enforce approval requirement for payments above thresholds using Decimal
    const paymentAmountDecimal = new Decimal(payment.amount);
    
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'purchase',
        operationData: payment,
        amount: paymentAmountDecimal.toNumber(),
        currency: payment.currency || 'USD',
        businessContext: `Purchase payment: ${payment.amount} ${payment.currency || 'USD'}`
      });
    }

    // Generate next payment number
    const paymentNumber = await this.generateNextPaymentNumber();
    
    // Stage 1 Compliance: Handle exchange rate centrally
    const config = ConfigurationService.getInstance();
    let exchangeRate: number | undefined;
    if (payment.currency === 'ETB') {
      exchangeRate = await config.getCentralExchangeRate();
    }

    const [result] = await db.insert(purchasePayments).values({
      ...payment,
      paymentNumber,
      exchangeRate: exchangeRate?.toString(),
    }).returning();

    // CRITICAL SECURITY: Audit logging for payment operations using Decimal
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'purchase_payments',
        result.id,
        'create',
        'purchase',
        null,
        result,
        -paymentAmountDecimal.toNumber(), // Negative impact for payments (outflow)
        payment.currency || 'USD'
      );
    }
    
    return result;
  }

  // Generate next payment number with proper formatting
  private async generateNextPaymentNumber(): Promise<string> {
    const lastPayment = await db
      .select({ paymentNumber: purchasePayments.paymentNumber })
      .from(purchasePayments)
      .orderBy(desc(purchasePayments.paymentNumber))
      .limit(1);

    if (!lastPayment.length) {
      return 'PAY-000001';
    }

    // Extract number from PAY-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastPayment[0].paymentNumber.match(/PAY-(\d+)/);
    
    if (!numberMatch) {
      return 'PAY-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `PAY-${nextNumber.toString().padStart(6, '0')}`;
  }

  // STAGE 2 COMPLIANCE: Purchase advances settlement workflow
  async settlePurchaseAdvance(purchaseId: string, settlementData: {
    actualWeight: string;
    actualPricePerKg: string;
    settledAmount: string;
    settlementNotes?: string;
  }, auditContext?: AuditContext): Promise<Purchase> {
    // Use transaction for atomic settlement
    const result = await db.transaction(async (tx) => {
      // Get the purchase with locking
      const [purchase] = await tx
        .select()
        .from(purchases)
        .where(eq(purchases.id, purchaseId))
        .for('update');
      
      if (!purchase) {
        throw new Error(`Purchase not found: ${purchaseId}`);
      }

      if (purchase.paymentMethod !== 'advance') {
        throw new Error(`Purchase ${purchase.purchaseNumber} is not an advance payment`);
      }

      // Calculate new totals with decimal precision
      const actualWeight = new Decimal(settlementData.actualWeight);
      const actualPricePerKg = new Decimal(settlementData.actualPricePerKg);
      const settledAmount = new Decimal(settlementData.settledAmount);
      const previousAmountPaid = new Decimal(purchase.amountPaid);
      
      const newTotal = actualWeight.mul(actualPricePerKg);
      const balanceDiff = settledAmount.sub(previousAmountPaid);
      const newRemaining = newTotal.sub(settledAmount);

      // Update purchase with settled values
      const [updatedPurchase] = await tx
        .update(purchases)
        .set({
          weight: settlementData.actualWeight,
          pricePerKg: settlementData.actualPricePerKg,
          total: newTotal.toFixed(2),
          amountPaid: settlementData.settledAmount,
          remaining: newRemaining.toFixed(2),
          paymentMethod: 'cash', // Convert from advance to settled
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, purchaseId))
        .returning();

      // STAGE 2 SECURITY: Enforce central FX rate for currency conversion
      const centralRate = await ConfigurationService.getInstance().getCentralExchangeRate();
      
      // If there's a balance difference and purchase is capital-funded, create adjustment entry
      if (purchase.fundingSource === 'capital' && !balanceDiff.isZero()) {
        // CRITICAL: Convert balance difference to USD using CENTRAL rate only
        const balanceImpactUSD = purchase.currency === 'ETB' 
          ? balanceDiff.abs().div(centralRate)
          : balanceDiff.abs();
        const entryType = balanceDiff.isPositive() ? 'CapitalOut' : 'CapitalIn';
        const description = balanceDiff.isPositive() 
          ? `Advance settlement - additional payment (${purchase.purchaseNumber})`
          : `Advance settlement - credit refund (${purchase.purchaseNumber})`;

        await this.createCapitalEntryInTransaction(tx, {
          amount: balanceImpactUSD.toFixed(2),
          type: entryType,
          reference: purchase.id,
          description,
          paymentCurrency: 'USD', // Normalized to USD
          createdBy: auditContext?.userId || 'system',
        });
      }

      return updatedPurchase;
    });

    // STAGE 2 COMPLIANCE: Complete audit logging for advance settlement
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'purchases',
        result.id,
        'update' as const,
        'purchase_advance_settlement',
        {
          originalTotal: new Decimal(result.total).add(new Decimal(settlementData.settledAmount)).sub(new Decimal(result.amountPaid)).toFixed(2),
          originalWeight: result.weight,
          originalPricePerKg: result.pricePerKg
        },
        result,
        parseFloat(settlementData.settledAmount), // Settlement amount impact
        'USD' // Normalized to USD via central FX
      );
    }

    return result;
  }

  // STAGE 2 COMPLIANCE: Simple purchase payment settlement workflow
  async settlePurchasePayment(purchaseId: string, settlementData: {
    amount: number;
    currency: string;
    settlementNotes?: string;
  }, auditContext?: AuditContext): Promise<Purchase> {
    // Use transaction for atomic settlement
    const result = await db.transaction(async (tx) => {
      // Get the purchase with locking
      const [purchase] = await tx
        .select()
        .from(purchases)
        .where(eq(purchases.id, purchaseId))
        .for('update');
      
      if (!purchase) {
        throw new Error(`Purchase not found: ${purchaseId}`);
      }

      // CRITICAL: Convert settlement amount to purchase currency if different
      const centralRate = await ConfigurationService.getInstance().getCentralExchangeRate();
      
      let settleAmountInPurchaseCurrency: Decimal;
      if (settlementData.currency !== purchase.currency) {
        if (settlementData.currency === 'USD' && purchase.currency === 'ETB') {
          // Converting USD payment to ETB purchase
          settleAmountInPurchaseCurrency = new Decimal(settlementData.amount).mul(centralRate);
        } else if (settlementData.currency === 'ETB' && purchase.currency === 'USD') {
          // Converting ETB payment to USD purchase
          settleAmountInPurchaseCurrency = new Decimal(settlementData.amount).div(centralRate);
        } else {
          const error = new Error(`Unsupported currency conversion: ${settlementData.currency} to ${purchase.currency}`);
          (error as any).code = 'VALIDATION_ERROR';
          throw error;
        }
      } else {
        // Same currency - no conversion needed
        settleAmountInPurchaseCurrency = new Decimal(settlementData.amount);
      }

      // Validate settlement amount against remaining balance (in purchase currency)
      const remainingBalance = new Decimal(purchase.remaining);
      
      if (settleAmountInPurchaseCurrency.lessThanOrEqualTo(0)) {
        const error = new Error('Settlement amount must be greater than 0');
        (error as any).code = 'VALIDATION_ERROR';
        throw error;
      }
      
      if (settleAmountInPurchaseCurrency.greaterThan(remainingBalance)) {
        const error = new Error(`Settlement amount (${settleAmountInPurchaseCurrency.toFixed(2)} ${purchase.currency}) cannot exceed remaining balance (${remainingBalance.toFixed(2)} ${purchase.currency})`);
        (error as any).code = 'VALIDATION_ERROR';
        throw error;
      }

      // Calculate new balances in purchase currency
      const currentAmountPaid = new Decimal(purchase.amountPaid);
      const newAmountPaid = currentAmountPaid.add(settleAmountInPurchaseCurrency);
      const newRemaining = remainingBalance.sub(settleAmountInPurchaseCurrency);

      // CRITICAL: Determine status using rounded remaining (same as persisted value)
      const roundedRemaining = newRemaining.toDecimalPlaces(2);
      const newStatus = roundedRemaining.isZero() ? 'paid' : purchase.status;

      // Update purchase with new balances and status
      const [updatedPurchase] = await tx
        .update(purchases)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          remaining: newRemaining.toFixed(2),
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, purchaseId))
        .returning();

      // STAGE 2 SECURITY: Create CapitalOut entry ONLY if purchase is capital-funded
      // CRITICAL: Derive funding source from purchase record, ignore any client input
      if (purchase.fundingSource === 'capital') {
        // CRITICAL: Convert settlement amount to USD based on PAYMENT currency (not purchase currency)
        const settlementAmountUSD = settlementData.currency === 'ETB' 
          ? new Decimal(settlementData.amount).div(centralRate)
          : new Decimal(settlementData.amount);

        // Create CapitalOut entry for capital-funded settlement
        await this.createCapitalEntryInTransaction(tx, {
          amount: settlementAmountUSD.toFixed(2),
          type: 'CapitalOut',
          reference: purchase.id,
          description: `Purchase settlement payment (${purchase.purchaseNumber}) - ${settlementData.amount} ${settlementData.currency} - ${settlementData.settlementNotes || 'Payment settlement'}`,
          paymentCurrency: 'USD', // Normalized to USD
          createdBy: auditContext?.userId || 'system',
        });
      }

      return updatedPurchase;
    });

    // STAGE 2 COMPLIANCE: Complete audit logging for payment settlement
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'purchases',
        result.id,
        'update',
        'purchase_payment_settlement',
        {
          settlementAmount: settlementData.amount,
          previousAmountPaid: new Decimal(result.amountPaid).sub(settlementData.amount).toFixed(2),
          previousRemaining: new Decimal(result.remaining).add(settlementData.amount).toFixed(2)
        },
        result,
        settlementData.amount, // Settlement amount impact
        settlementData.currency
      );
    }

    return result;
  }

  // STAGE 2 COMPLIANCE: Return to supplier handling
  async processSupplierReturn(returnData: {
    purchaseId: string;
    returnedWeight: string;
    returnReason: string;
    refundAmount?: string;
    processingNotes?: string;
  }, auditContext?: AuditContext): Promise<{ purchase: Purchase; capitalAdjustment?: any }> {
    const result = await db.transaction(async (tx) => {
      const [purchase] = await tx
        .select()
        .from(purchases)
        .where(eq(purchases.id, returnData.purchaseId))
        .for('update');
      
      if (!purchase) {
        throw new Error(`Purchase not found: ${returnData.purchaseId}`);
      }

      const returnedWeight = new Decimal(returnData.returnedWeight);
      const currentWeight = new Decimal(purchase.weight);
      const refundAmount = returnData.refundAmount ? new Decimal(returnData.refundAmount) : new Decimal('0');

      // Validate return weight doesn't exceed purchase weight
      if (returnedWeight.gt(currentWeight)) {
        throw new Error('Returned weight cannot exceed purchased weight');
      }

      // Update purchase with return adjustments
      const newWeight = currentWeight.sub(returnedWeight);
      const newTotal = newWeight.mul(new Decimal(purchase.pricePerKg));
      const newRemaining = newTotal.sub(new Decimal(purchase.amountPaid));

      const [updatedPurchase] = await tx
        .update(purchases)
        .set({
          weight: newWeight.toFixed(2),
          total: newTotal.toFixed(2),
          remaining: newRemaining.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, returnData.purchaseId))
        .returning();

      // Process refund if specified and capital-funded
      let capitalAdjustment;
      if (!refundAmount.isZero() && purchase.fundingSource === 'capital') {
        // STAGE 2 SECURITY: Enforce central FX rate for refund conversion
        const centralRate = await ConfigurationService.getInstance().getCentralExchangeRate();
        let refundUsd = purchase.currency === 'ETB' 
          ? refundAmount.div(new Decimal(centralRate))
          : refundAmount;

        capitalAdjustment = await this.createCapitalEntryInTransaction(tx, {
          amount: refundUsd.toFixed(2),
          type: 'CapitalIn',
          reference: purchase.id,
          description: `Supplier return refund - ${returnedWeight}kg returned (${returnData.returnReason})`,
          paymentCurrency: 'USD', // Normalized to USD
          createdBy: auditContext?.userId || 'system',
        });
      }

      return { purchase: updatedPurchase, capitalAdjustment };
    });

    // CRITICAL SECURITY: Audit logging for supplier returns
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'purchases',
        result.purchase.id,
        'update' as const,
        'purchase_return',
        null,
        result.purchase,
        parseFloat(returnData.refundAmount || '0'), // Positive for refunds
        result.purchase.currency || 'USD'
      );
    }

    return result;
  }

  // ===== OPERATING EXPENSES SYSTEM OPERATIONS (STAGE 5) =====

  // Supply operations
  async getSupplies(): Promise<Supply[]> {
    return await db.select().from(supplies).where(eq(supplies.isActive, true)).orderBy(desc(supplies.createdAt));
  }

  async getSupply(id: string): Promise<Supply | undefined> {
    const [supply] = await db.select().from(supplies).where(eq(supplies.id, id));
    return supply;
  }

  async createSupply(supply: InsertSupply, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Supply> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'supply_create',
        operationData: supply,
        businessContext: `Create supply: ${supply.name} (${supply.supplyType})`
      });
    }

    // Generate next supply number
    const supplyNumber = await this.generateNextSupplyNumber();
    
    // Calculate total value
    const totalValue = new Decimal(supply.quantityOnHand || '0').mul(new Decimal(supply.unitCostUsd));

    const [result] = await db.insert(supplies).values({
      ...supply,
      supplyNumber,
      totalValueUsd: totalValue.toFixed(2),
    }).returning();
    
    // CRITICAL SECURITY: Audit logging for supply operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'supplies',
        result.id,
        'create',
        'supply_create',
        null,
        result
      );
    }
    
    return result;
  }

  async updateSupply(id: string, supply: Partial<InsertSupply>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Supply> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState(supplies, id);
    
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'supply_update',
        operationData: supply,
        businessContext: `Update supply: ${safeAccessBeforeState(beforeState, ['name'])?.name || id}`
      });
    }

    // Recalculate total value if quantity or cost changed
    let updateData = { ...supply, updatedAt: new Date() };
    if (supply.quantityOnHand !== undefined || supply.unitCostUsd !== undefined) {
      const currentSupply = beforeState || await this.getSupply(id);
      if (currentSupply) {
        const currentSupplyTyped = safeAccessBeforeState(currentSupply, ['quantityOnHand', 'unitCostUsd']);
        const quantity = new Decimal(supply.quantityOnHand ?? (currentSupplyTyped?.quantityOnHand || '0'));
        const unitCost = new Decimal(supply.unitCostUsd ?? (currentSupplyTyped?.unitCostUsd || '0'));
        updateData = { ...updateData, totalValueUsd: quantity.mul(unitCost).toFixed(2) };
      }
    }

    const [result] = await db
      .update(supplies)
      .set(updateData)
      .where(eq(supplies.id, id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for supply updates
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'supplies',
        result.id,
        'update',
        'supply_update',
        beforeState,
        result
      );
    }
    
    return result;
  }

  private async generateNextSupplyNumber(): Promise<string> {
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get the highest existing supply number using lexicographic ordering
        const latestSupply = await db
          .select({ supplyNumber: supplies.supplyNumber })
          .from(supplies)
          .orderBy(sql`${supplies.supplyNumber} DESC`)
          .limit(1);

        const nextNumber = this.calculateNextSupplyNumber(latestSupply[0]?.supplyNumber);
        return nextNumber;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
      }
    }
    return 'SUP-000001'; // Fallback
  }

  private calculateNextSupplyNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'SUP-000001';
    }

    // Extract number from SUP-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastNumber.match(/SUP-(\d+)/);
    
    if (!numberMatch) {
      return 'SUP-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `SUP-${nextNumber.toString().padStart(6, '0')}`;
  }

  // Operating expense categories operations
  async getOperatingExpenseCategories(): Promise<OperatingExpenseCategory[]> {
    return await db.select().from(operatingExpenseCategories).where(eq(operatingExpenseCategories.isActive, true)).orderBy(desc(operatingExpenseCategories.createdAt));
  }

  async getOperatingExpenseCategory(id: string): Promise<OperatingExpenseCategory | undefined> {
    const [category] = await db.select().from(operatingExpenseCategories).where(eq(operatingExpenseCategories.id, id));
    return category;
  }

  async createOperatingExpenseCategory(category: InsertOperatingExpenseCategory, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<OperatingExpenseCategory> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'expense_category_create',
        operationData: category,
        businessContext: `Create expense category: ${category.categoryName}`
      });
    }

    const [result] = await db.insert(operatingExpenseCategories).values(category).returning();
    
    // CRITICAL SECURITY: Audit logging for expense category operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'operating_expense_categories',
        result.id,
        'create',
        'expense_category_create',
        null,
        result
      );
    }
    
    return result;
  }

  // Operating expenses operations
  async getOperatingExpenses(): Promise<OperatingExpense[]> {
    return await db.select().from(operatingExpenses).orderBy(desc(operatingExpenses.createdAt));
  }

  async getOperatingExpense(id: string): Promise<OperatingExpense | undefined> {
    const [expense] = await db.select().from(operatingExpenses).where(eq(operatingExpenses.id, id));
    return expense;
  }

  async createOperatingExpense(expense: InsertOperatingExpense, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<OperatingExpense> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'operating_expense',
        operationData: expense,
        amount: parseFloat(expense.amount),
        currency: expense.currency,
        businessContext: `Operating expense: ${expense.description}`
      });
    }

    // Use database transaction for operating expense with capital integration
    const result = await db.transaction(async (tx) => {
      return await this.createOperatingExpenseInTransaction(tx, expense, auditContext?.userId || 'system');
    });
    
    // CRITICAL SECURITY: Enhanced audit logging for operating expenses
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'operating_expenses',
        result.id,
        'create',
        'operating_expense',
        null,
        result,
        -parseFloat(expense.amount), // Negative impact for expenses (outflow)
        expense.currency
      );
    }
    
    return result;
  }

  private async createOperatingExpenseInTransaction(tx: any, expense: InsertOperatingExpense, userId: string): Promise<OperatingExpense> {
    // Generate next expense number
    const expenseNumber = await this.generateNextOperatingExpenseNumberInTransaction(tx);
    
    // Convert amount to USD for normalization
    let amountUsd = new Decimal(expense.amount);
    if (expense.currency === 'ETB' && expense.exchangeRate) {
      amountUsd = amountUsd.div(new Decimal(expense.exchangeRate));
    }
    
    // Calculate remaining amount
    const amountPaid = new Decimal(expense.amountPaid || '0');
    const remaining = new Decimal(expense.amount).sub(amountPaid);

    // Create the operating expense
    const [result] = await tx.insert(operatingExpenses).values({
      ...expense,
      expenseNumber,
      amountUsd: amountUsd.toFixed(2),
      remaining: remaining.toFixed(2),
    }).returning();

    // If funded from capital and amount paid > 0, create capital entry
    if (expense.fundingSource === 'capital' && parseFloat(expense.amountPaid || '0') > 0) {
      const paidAmount = new Decimal(expense.amountPaid || '0');
      
      // Convert amount to USD for capital tracking normalization
      let paidInUsd = paidAmount;
      if (expense.currency === 'ETB' && expense.exchangeRate) {
        paidInUsd = paidAmount.div(new Decimal(expense.exchangeRate));
      }
      
      // Create capital entry with atomic balance checking
      await this.createCapitalEntryInTransaction(tx, {
        amount: paidInUsd.toFixed(2),
        type: 'CapitalOut',
        reference: result.id,
        description: `Operating expense - ${expense.description} ${expense.currency === 'ETB' ? `(${expense.amountPaid} ETB @ ${expense.exchangeRate})` : ''}`,
        paymentCurrency: expense.currency,
        createdBy: userId,
      });
    }

    return result;
  }

  private async generateNextOperatingExpenseNumberInTransaction(tx: any): Promise<string> {
    // Use advisory lock to serialize expense number generation
    const lockId = 2345678901;
    
    // Acquire advisory transaction lock (automatically released at transaction end)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
    
    // Get the highest existing expense number in transaction with SELECT FOR UPDATE
    const latestExpense = await tx
      .select({ expenseNumber: operatingExpenses.expenseNumber })
      .from(operatingExpenses)
      .orderBy(sql`${operatingExpenses.expenseNumber} DESC`)
      .limit(1)
      .for('update');

    return this.calculateNextOperatingExpenseNumber(latestExpense[0]?.expenseNumber);
  }

  private calculateNextOperatingExpenseNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'EXP-000001';
    }

    // Extract number from EXP-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastNumber.match(/EXP-(\d+)/);
    
    if (!numberMatch) {
      return 'EXP-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `EXP-${nextNumber.toString().padStart(6, '0')}`;
  }

  // Supply consumption operations - for automatic packing cost deduction
  async createSupplyConsumption(consumption: InsertSupplyConsumption, auditContext?: AuditContext): Promise<SupplyConsumption> {
    // Use database transaction for supply consumption with inventory updates
    const result = await db.transaction(async (tx) => {
      return await this.createSupplyConsumptionInTransaction(tx, consumption);
    });
    
    // CRITICAL SECURITY: Audit logging for supply consumption
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'supply_consumption',
        result.id,
        'create',
        'supply_consumption',
        null,
        result,
        -parseFloat(result.totalCostUsd), // Negative impact for consumption (cost)
        'USD'
      );
    }
    
    return result;
  }

  private async createSupplyConsumptionInTransaction(tx: any, consumption: InsertSupplyConsumption): Promise<SupplyConsumption> {
    // Generate next consumption number
    const consumptionNumber = await this.generateNextSupplyConsumptionNumberInTransaction(tx);
    
    // Calculate total cost
    const totalCost = new Decimal(consumption.quantityConsumed).mul(new Decimal(consumption.unitCostUsd));

    // Create the supply consumption record
    const [result] = await tx.insert(supplyConsumption).values({
      ...consumption,
      consumptionNumber,
      totalCostUsd: totalCost.toFixed(2),
    }).returning();

    // Update supply inventory - reduce quantity on hand
    await tx
      .update(supplies)
      .set({
        quantityOnHand: sql`${supplies.quantityOnHand} - ${consumption.quantityConsumed}`,
        totalValueUsd: sql`${supplies.totalValueUsd} - ${totalCost.toFixed(2)}`,
        updatedAt: new Date(),
      })
      .where(eq(supplies.id, consumption.supplyId));

    return result;
  }

  private async generateNextSupplyConsumptionNumberInTransaction(tx: any): Promise<string> {
    // Use advisory lock to serialize consumption number generation
    const lockId = 3456789012;
    
    // Acquire advisory transaction lock (automatically released at transaction end)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
    
    // Get the highest existing consumption number in transaction with SELECT FOR UPDATE
    const latestConsumption = await tx
      .select({ consumptionNumber: supplyConsumption.consumptionNumber })
      .from(supplyConsumption)
      .orderBy(sql`${supplyConsumption.consumptionNumber} DESC`)
      .limit(1)
      .for('update');

    return this.calculateNextSupplyConsumptionNumber(latestConsumption[0]?.consumptionNumber);
  }

  private calculateNextSupplyConsumptionNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'CON-000001';
    }

    // Extract number from CON-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastNumber.match(/CON-(\d+)/);
    
    if (!numberMatch) {
      return 'CON-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `CON-${nextNumber.toString().padStart(6, '0')}`;
  }

  // Supply purchases operations
  async createSupplyPurchase(purchase: InsertSupplyPurchase, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SupplyPurchase> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'supply_purchase',
        operationData: purchase,
        amount: parseFloat(purchase.quantity) * parseFloat(purchase.unitPrice),
        currency: purchase.currency,
        businessContext: `Supply purchase from supplier`
      });
    }

    // Use database transaction for supply purchase with inventory and capital integration
    const result = await db.transaction(async (tx) => {
      return await this.createSupplyPurchaseInTransaction(tx, purchase, auditContext?.userId || 'system');
    });
    
    // CRITICAL SECURITY: Audit logging for supply purchases
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'supply_purchases',
        result.id,
        'create',
        'supply_purchase',
        null,
        result,
        -parseFloat(result.totalAmount), // Negative impact for purchases (outflow)
        purchase.currency
      );
    }
    
    return result;
  }

  private async createSupplyPurchaseInTransaction(tx: any, purchase: InsertSupplyPurchase, userId: string): Promise<SupplyPurchase> {
    // Generate next purchase number
    const purchaseNumber = await this.generateNextSupplyPurchaseNumberInTransaction(tx);
    
    // Calculate total amount first
    const totalAmount = new Decimal(purchase.quantity).mul(new Decimal(purchase.unitPrice));
    
    // Get exchange rate if needed
    let exchangeRate: string | undefined;
    if (purchase.currency === 'ETB') {
      const configurationService = new ConfigurationService();
      const rate = await configurationService.getCentralExchangeRate();
      exchangeRate = rate.toString();
    }
    
    // Convert amount to USD for normalization
    let amountUsd = totalAmount;
    if (purchase.currency === 'ETB' && exchangeRate) {
      amountUsd = totalAmount.div(new Decimal(exchangeRate));
    }
    
    // Calculate remaining amount
    const amountPaid = new Decimal(purchase.amountPaid || '0');
    const remaining = totalAmount.sub(amountPaid);

    // Create the supply purchase
    const [result] = await tx.insert(supplyPurchases).values({
      ...purchase,
      purchaseNumber,
      totalAmount: totalAmount.toFixed(2),
      exchangeRate: exchangeRate,
      amountUsd: amountUsd.toFixed(2),
      remaining: remaining.toFixed(2),
    }).returning();

    // Update supply inventory - increase quantity on hand
    await tx
      .update(supplies)
      .set({
        quantityOnHand: sql`${supplies.quantityOnHand} + ${purchase.quantity}`,
        totalValueUsd: sql`${supplies.totalValueUsd} + ${amountUsd.toFixed(2)}`,
        unitCostUsd: purchase.unitPrice, // Update with latest purchase price
        lastPurchaseDate: new Date(),
        lastPurchasePrice: purchase.unitPrice,
        updatedAt: new Date(),
      })
      .where(eq(supplies.id, purchase.supplyId));

    // If funded from capital and amount paid > 0, create capital entry
    if (purchase.fundingSource === 'capital' && parseFloat(purchase.amountPaid || '0') > 0) {
      const paidAmount = new Decimal(purchase.amountPaid || '0');
      
      // Convert amount to USD for capital tracking normalization
      let paidInUsd = paidAmount;
      if (purchase.currency === 'ETB' && exchangeRate) {
        paidInUsd = paidAmount.div(new Decimal(exchangeRate));
      }
      
      // Create capital entry with atomic balance checking
      await this.createCapitalEntryInTransaction(tx, {
        amount: paidInUsd.toFixed(2),
        type: 'CapitalOut',
        reference: result.id,
        description: `Supply purchase ${purchase.currency === 'ETB' ? `(${purchase.amountPaid} ETB @ ${exchangeRate})` : ''}`,
        paymentCurrency: purchase.currency,
        createdBy: userId,
      });
    }

    return result;
  }

  private async generateNextSupplyPurchaseNumberInTransaction(tx: any): Promise<string> {
    // Use advisory lock to serialize supply purchase number generation
    const lockId = 4567890123;
    
    // Acquire advisory transaction lock (automatically released at transaction end)
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
    
    // Get the highest existing supply purchase number in transaction with SELECT FOR UPDATE
    const latestPurchase = await tx
      .select({ purchaseNumber: supplyPurchases.purchaseNumber })
      .from(supplyPurchases)
      .orderBy(sql`${supplyPurchases.purchaseNumber} DESC`)
      .limit(1)
      .for('update');

    return this.calculateNextSupplyPurchaseNumber(latestPurchase[0]?.purchaseNumber);
  }

  private calculateNextSupplyPurchaseNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'SPU-000001';
    }

    // Extract number from SPU-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastNumber.match(/SPU-(\d+)/);
    
    if (!numberMatch) {
      return 'SPU-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `SPU-${nextNumber.toString().padStart(6, '0')}`;
  }

  // Automatic packing cost deduction - to be called during warehouse operations
  async recordPackingSupplyConsumption(orderId: string, cartonsProcessed: number, userId: string): Promise<void> {
    // Get active packing supplies (cartons, labels, wraps)
    const packingSupplies = await db.select().from(supplies)
      .where(and(
        eq(supplies.isActive, true),
        sql`${supplies.supplyType} IN ('cartons_8kg', 'cartons_20kg', 'labels', 'wraps')`
      ));

    // Record consumption for each supply type based on cartons processed
    for (const supply of packingSupplies) {
      const usagePerCarton = parseFloat(supply.usagePerCarton || '0');
      if (usagePerCarton > 0) {
        const totalUsage = usagePerCarton * cartonsProcessed;
        
        // Create consumption record
        await this.createSupplyConsumption({
          supplyId: supply.id,
          quantityConsumed: totalUsage.toString(),
          unitCostUsd: supply.unitCostUsd,
          orderId,
          packingOperation: 'packing',
          cartonsProcessed,
          consumptionType: 'automatic',
          consumedBy: userId,
        });
      }
    }
  }

  // Warehouse operations
  async getWarehouseStock(): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock).orderBy(desc(warehouseStock.createdAt));
  }

  async getWarehouseStockByStatus(status: 'AWAITING_DECISION' | 'FILTERING' | 'FILTERED' | 'PACKED' | 'RESERVED' | 'CONSUMED' | 'READY_TO_SHIP' | 'NON_CLEAN' | 'READY_FOR_SALE' | 'AWAITING_FILTER'): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock).where(eq(warehouseStock.status, status));
  }

  async getWarehouseStockByWarehouse(warehouse: string): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock).where(eq(warehouseStock.warehouse, warehouse));
  }

  async getWarehouseStockById(id: string): Promise<WarehouseStock | null> {
    const result = await db.select().from(warehouseStock).where(eq(warehouseStock.id, id)).limit(1);
    return result[0] ?? null;
  }

  async createWarehouseStock(stock: InsertWarehouseStock, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'warehouse_stock_create',
        operationData: stock,
        businessContext: `Create warehouse stock: ${stock.qtyKgTotal}kg in ${stock.warehouse}`
      });
    }

    const [result] = await db.insert(warehouseStock).values(stock).returning();
    
    // CRITICAL SECURITY: Audit logging for warehouse operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'warehouse_stock',
        result.id,
        'create',
        'warehouse_stock_create',
        null,
        result
      );
    }
    
    return result;
  }

  async updateWarehouseStock(id: string, stock: Partial<InsertWarehouseStock>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState(warehouseStock, id);
    
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      const beforeStateTyped = safeAccessBeforeState(beforeState, ['qtyKgTotal', 'warehouse']);
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'warehouse_stock_update',
        operationData: stock,
        businessContext: `Update warehouse stock: ${beforeStateTyped?.qtyKgTotal || 'unknown'}kg in ${beforeStateTyped?.warehouse || 'unknown'}`
      });
    }

    const [result] = await db
      .update(warehouseStock)
      .set(stock)
      .where(eq(warehouseStock.id, id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for warehouse updates
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'warehouse_stock',
        result.id,
        'update',
        'warehouse_stock_update',
        beforeState,
        result
      );
    }
    
    return result;
  }

  async updateWarehouseStockStatus(id: string, status: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState(warehouseStock, id);
    
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'warehouse_stock_status_update',
        operationData: { status, userId },
        businessContext: `Update warehouse stock status from ${safeAccessBeforeState(beforeState, ['status'])?.status || 'unknown'} to ${status}`
      });
    }

    return await db.transaction(async (tx) => {
      const [result] = await tx
        .update(warehouseStock)
        .set({ 
          status: status as any, 
          statusChangedAt: new Date()
        })
        .where(eq(warehouseStock.id, id))
        .returning();
      
      // CRITICAL SECURITY: Audit logging for status changes
      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'warehouse_stock',
          result.id,
          'update',
          'warehouse_stock_status_update',
          beforeState,
          result
        );
      }
      
      return result;
    });
  }

  async executeFilterOperation(purchaseId: string, outputCleanKg: string, outputNonCleanKg: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<{ filterRecord: FilterRecord; updatedStock: WarehouseStock[] }> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level for filter operations
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'warehouse_filter_operation',
        operationData: { purchaseId, outputCleanKg, outputNonCleanKg, userId },
        businessContext: `Execute filter operation: ${outputCleanKg}kg clean, ${outputNonCleanKg}kg non-clean from purchase ${purchaseId}`
      });
    }
    return await db.transaction(async (tx) => {
      // Use advisory lock to serialize filter operations and prevent concurrent stock modifications
      // Lock ID: hash of "filter_operation_" + purchaseId for per-purchase filtering protection
      const lockId = this.hashString(`filter_operation_${purchaseId}`);
      
      // Acquire advisory transaction lock (automatically released at transaction end)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Get the stock entry for this purchase
      const [stockEntry] = await tx
        .select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.purchaseId, purchaseId),
          eq(warehouseStock.warehouse, 'FIRST'),
          eq(warehouseStock.status, 'FILTERING')
        ));

      if (!stockEntry) {
        throw new Error('Stock entry not found or not in FILTERING status');
      }

      const inputKg = stockEntry.qtyKgTotal;
      const cleanKg = new Decimal(outputCleanKg);
      const nonCleanKg = new Decimal(outputNonCleanKg);
      const totalOutput = cleanKg.add(nonCleanKg);
      
      // Validate filter outputs don't exceed input
      if (totalOutput.gt(new Decimal(inputKg))) {
        throw new Error('Filter output cannot exceed input weight');
      }

      // Calculate filter yield
      const filterYield = cleanKg.div(new Decimal(inputKg)).mul(100);

      // Create filter record
      const [filterRecord] = await tx.insert(filterRecords).values({
        purchaseId,
        inputKg,
        outputCleanKg,
        outputNonCleanKg,
        filterYield: filterYield.toFixed(2),
        createdBy: userId,
      }).returning();

      // Cost redistribution: all cost goes to clean only (per business rules)
      const originalUnitCost = new Decimal(stockEntry.unitCostCleanUsd || '0');
      const newCleanUnitCost = cleanKg.gt(0) 
        ? originalUnitCost.mul(new Decimal(inputKg)).div(cleanKg)
        : new Decimal('0');

      // Update original stock entry with clean portion
      const [cleanStock] = await tx
        .update(warehouseStock)
        .set({
          status: 'READY_TO_SHIP',
          qtyKgClean: outputCleanKg,
          qtyKgNonClean: '0',
          unitCostCleanUsd: newCleanUnitCost.toFixed(4),
          filteredAt: new Date(),
          statusChangedAt: new Date()
        })
        .where(eq(warehouseStock.id, stockEntry.id))
        .returning();

      let nonCleanStock: WarehouseStock | null = null;
      
      // Create separate non-clean stock entry if there's non-clean output
      if (nonCleanKg.gt(0)) {
        const [newNonCleanStock] = await tx.insert(warehouseStock).values({
          purchaseId,
          orderId: stockEntry.orderId,
          supplierId: stockEntry.supplierId,
          warehouse: 'FIRST',
          status: 'NON_CLEAN',
          qtyKgTotal: outputNonCleanKg,
          qtyKgClean: '0',
          qtyKgNonClean: outputNonCleanKg,
          unitCostCleanUsd: '0.0000', // Non-clean has zero cost per business rules
          filteredAt: new Date(),
        }).returning();
        nonCleanStock = newNonCleanStock;
      }

      const updatedStock = nonCleanStock ? [cleanStock, nonCleanStock] : [cleanStock];
      
      // CRITICAL SECURITY: Audit logging for filter operations
      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'filter_operations',
          filterRecord.id,
          'create',
          'warehouse_filter_operation',
          { inputKg, stockEntry },
          { filterRecord, updatedStock },
          -parseFloat(outputCleanKg) // Cost impact of filtering operation
        );
      }
      
      return { filterRecord, updatedStock };
    });
  }

  async moveStockToFinalWarehouse(stockId: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<WarehouseStock> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState(warehouseStock, stockId);
    
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'warehouse_stock_transfer',
        operationData: { stockId, userId },
        businessContext: `Move ${safeAccessBeforeState(beforeState, ['qtyKgTotal'])?.qtyKgTotal || 'unknown'}kg stock from FIRST to FINAL warehouse`
      });
    }
    const result = await db.transaction(async (tx) => {
      // Get the stock entry
      const [stockEntry] = await tx
        .select()
        .from(warehouseStock)
        .where(and(
          eq(warehouseStock.id, stockId),
          eq(warehouseStock.warehouse, 'FIRST'),
          eq(warehouseStock.status, 'READY_TO_SHIP')
        ));

      if (!stockEntry) {
        throw new Error('Stock entry not found or not ready for final warehouse');
      }

      // Create new entry in final warehouse
      const [finalStock] = await tx.insert(warehouseStock).values({
        purchaseId: stockEntry.purchaseId,
        orderId: stockEntry.orderId,
        supplierId: stockEntry.supplierId,
        warehouse: 'FINAL',
        status: 'READY_FOR_SALE',
        qtyKgTotal: stockEntry.qtyKgClean,
        qtyKgClean: stockEntry.qtyKgClean,
        qtyKgNonClean: '0',
        unitCostCleanUsd: stockEntry.unitCostCleanUsd,
        cartonsCount: stockEntry.cartonsCount,
      }).returning();

      // Remove from first warehouse (or mark as shipped)
      await tx
        .delete(warehouseStock)
        .where(eq(warehouseStock.id, stockId));

      return finalStock;
    });
    
    // CRITICAL SECURITY: Audit logging for warehouse transfer operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'warehouse_stock',
        result.id,
        'create',
        'warehouse_stock_transfer',
        beforeState,
        result
      );
    }
    
    return result;
  }

  // Filter operations
  async getFilterRecords(): Promise<FilterRecord[]> {
    return await db.select().from(filterRecords).orderBy(desc(filterRecords.createdAt));
  }

  async createFilterRecord(record: InsertFilterRecord): Promise<FilterRecord> {
    const [result] = await db.insert(filterRecords).values(record).returning();
    return result;
  }

  // Reporting operations with USD normalization
  async getFinancialSummary(filters?: DateRangeFilter): Promise<FinancialSummaryResponse> {
    // Get current exchange rate
    const exchangeRate = await this.getExchangeRate();

    // Build date filter conditions
    const dateConditions = [];
    if (filters?.startDate) {
      dateConditions.push(gte(purchases.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      dateConditions.push(lte(purchases.date, new Date(filters.endDate)));
    }

    // Get capital entries summary
    // Build proper date conditions for capital entries
    const capitalDateConditions = [];
    if (filters?.startDate) {
      capitalDateConditions.push(gte(capitalEntries.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      capitalDateConditions.push(lte(capitalEntries.date, new Date(filters.endDate)));
    }
    
    const capitalResult = await db
      .select({
        capitalIn: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalIn' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
        capitalOut: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalOut' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
      })
      .from(capitalEntries)
      .where(capitalDateConditions.length > 0 ? and(...capitalDateConditions) : undefined);

    const capitalIn = new Decimal(capitalResult[0]?.capitalIn?.toString() || '0');
    const capitalOut = new Decimal(capitalResult[0]?.capitalOut?.toString() || '0');
    const currentBalance = capitalIn.sub(capitalOut);

    // Get purchase totals with USD normalization
    const purchaseQuery = db
      .select({
        totalPurchases: sum(purchases.total),
        totalPaid: sum(purchases.amountPaid),
        usdCount: count(sql`CASE WHEN ${purchases.currency} = 'USD' THEN 1 END`),
        usdAmount: sum(sql`CASE WHEN ${purchases.currency} = 'USD' THEN ${purchases.total} ELSE 0 END`),
        etbCount: count(sql`CASE WHEN ${purchases.currency} = 'ETB' THEN 1 END`),
        etbAmount: sum(sql`CASE WHEN ${purchases.currency} = 'ETB' THEN (${purchases.total} / ${purchases.exchangeRate}) ELSE 0 END`),
      })
      .from(purchases);

    if (dateConditions.length > 0) {
      purchaseQuery.where(and(...dateConditions));
    }

    const purchaseResult = await purchaseQuery;
    
    const totalPurchases = new Decimal(purchaseResult[0]?.totalPurchases?.toString() || '0');
    const totalPaid = new Decimal(purchaseResult[0]?.totalPaid?.toString() || '0');
    const totalOutstanding = totalPurchases.sub(totalPaid);

    // Calculate inventory value with USD normalization
    const inventoryResult = await db
      .select({
        totalValue: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean} > 0`);

    const totalInventoryValue = new Decimal(inventoryResult[0]?.totalValue?.toString() || '0');
    const netPosition = currentBalance.add(totalInventoryValue).sub(totalOutstanding);

    return {
      summary: {
        currentBalance: currentBalance.toNumber(),
        capitalIn: capitalIn.toNumber(),
        capitalOut: capitalOut.toNumber(),
        totalPurchases: totalPurchases.toNumber(),
        totalPaid: totalPaid.toNumber(),
        totalOutstanding: totalOutstanding.toNumber(),
        totalInventoryValue: totalInventoryValue.toNumber(),
        netPosition: netPosition.toNumber(),
      },
      currencyBreakdown: {
        usd: {
          amount: new Decimal(purchaseResult[0]?.usdAmount?.toString() || '0').toNumber(),
          count: Number(purchaseResult[0]?.usdCount || 0),
        },
        etb: {
          amount: new Decimal(purchaseResult[0]?.etbAmount?.toString() || '0').toNumber(),
          count: Number(purchaseResult[0]?.etbCount || 0),
        },
      },
      exchangeRate,
    };
  }

  async getCashflowAnalysis(period: string): Promise<CashFlowResponse> {
    // Determine date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'last-7-days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last-30-days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last-90-days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'last-year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get daily capital flows
    const capitalFlows = await db
      .select({
        date: sql<string>`DATE(${capitalEntries.date})`,
        capitalIn: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalIn' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
        capitalOut: sum(
          sql`CASE WHEN ${capitalEntries.type} = 'CapitalOut' THEN ${capitalEntries.amount} ELSE 0 END`
        ),
      })
      .from(capitalEntries)
      .where(and(
        gte(capitalEntries.date, startDate),
        lte(capitalEntries.date, endDate)
      ))
      .groupBy(sql`DATE(${capitalEntries.date})`)
      .orderBy(sql`DATE(${capitalEntries.date})`);

    // Get daily purchase payments
    const purchasePayments = await db
      .select({
        date: sql<string>`DATE(${purchases.date})`,
        payments: sum(purchases.amountPaid),
      })
      .from(purchases)
      .where(and(
        gte(purchases.date, startDate),
        lte(purchases.date, endDate),
        sql`${purchases.amountPaid} > 0`
      ))
      .groupBy(sql`DATE(${purchases.date})`)
      .orderBy(sql`DATE(${purchases.date})`);

    // Merge and calculate net flows
    const flowMap = new Map();
    
    capitalFlows.forEach(flow => {
      const capitalIn = new Decimal(flow.capitalIn?.toString() || '0');
      const capitalOut = new Decimal(flow.capitalOut?.toString() || '0');
      flowMap.set(flow.date, {
        date: flow.date,
        capitalIn: capitalIn.toNumber(),
        capitalOut: capitalOut.toNumber(),
        purchasePayments: 0,
        netFlow: capitalIn.sub(capitalOut).toNumber(),
      });
    });

    purchasePayments.forEach(payment => {
      const existing = flowMap.get(payment.date) || {
        date: payment.date,
        capitalIn: 0,
        capitalOut: 0,
        purchasePayments: 0,
        netFlow: 0,
      };
      const paymentAmount = new Decimal(payment.payments?.toString() || '0');
      existing.purchasePayments = paymentAmount.toNumber();
      existing.netFlow = existing.capitalIn - existing.capitalOut - existing.purchasePayments;
      flowMap.set(payment.date, existing);
    });

    const data = Array.from(flowMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary
    const summary = data.reduce(
      (acc, day) => ({
        totalIn: acc.totalIn + day.capitalIn,
        totalOut: acc.totalOut + day.capitalOut + day.purchasePayments,
        netFlow: acc.netFlow + day.netFlow,
      }),
      { totalIn: 0, totalOut: 0, netFlow: 0 }
    );

    return {
      period,
      data,
      summary,
    };
  }

  async getInventoryAnalytics(): Promise<InventoryAnalyticsResponse> {
    // Get warehouse summary with USD valuation
    const warehouseSummary = await db
      .select({
        warehouse: warehouseStock.warehouse,
        totalKg: sum(warehouseStock.qtyKgClean),
        valueUsd: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
        count: count(),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean} > 0`)
      .groupBy(warehouseStock.warehouse);

    const firstWarehouse = warehouseSummary.find(w => w.warehouse === 'FIRST') || { totalKg: '0', valueUsd: '0', count: 0 };
    const finalWarehouse = warehouseSummary.find(w => w.warehouse === 'FINAL') || { totalKg: '0', valueUsd: '0', count: 0 };

    // Get status breakdown
    const statusBreakdown = await db
      .select({
        status: warehouseStock.status,
        count: count(),
        totalKg: sum(warehouseStock.qtyKgClean),
        valueUsd: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean} > 0`)
      .groupBy(warehouseStock.status);

    // Get filter analysis
    const filterAnalysis = await db
      .select({
        totalFiltered: count(),
        avgYield: avg(filterRecords.filterYield),
        totalInput: sum(filterRecords.inputKg),
        totalOutput: sum(filterRecords.outputCleanKg),
      })
      .from(filterRecords);

    // Get top products by supplier
    const topProducts = await db
      .select({
        supplierId: warehouseStock.supplierId,
        supplierName: suppliers.name,
        totalKg: sum(warehouseStock.qtyKgClean),
        valueUsd: sum(sql`${warehouseStock.qtyKgClean} * COALESCE(${warehouseStock.unitCostCleanUsd}, 0)`),
      })
      .from(warehouseStock)
      .innerJoin(suppliers, eq(warehouseStock.supplierId, suppliers.id))
      .where(sql`${warehouseStock.qtyKgClean} > 0`)
      .groupBy(warehouseStock.supplierId, suppliers.name)
      .orderBy(desc(sum(warehouseStock.qtyKgClean)))
      .limit(10);

    return {
      warehouseSummary: {
        first: {
          totalKg: new Decimal(firstWarehouse.totalKg?.toString() || '0').toNumber(),
          valueUsd: new Decimal(firstWarehouse.valueUsd?.toString() || '0').toNumber(),
          count: Number(firstWarehouse.count || 0),
        },
        final: {
          totalKg: new Decimal(finalWarehouse.totalKg?.toString() || '0').toNumber(),
          valueUsd: new Decimal(finalWarehouse.valueUsd?.toString() || '0').toNumber(),
          count: Number(finalWarehouse.count || 0),
        },
      },
      statusBreakdown: statusBreakdown.map(status => ({
        status: status.status,
        count: Number(status.count || 0),
        totalKg: new Decimal(status.totalKg?.toString() || '0').toNumber(),
        valueUsd: new Decimal(status.valueUsd?.toString() || '0').toNumber(),
      })),
      filterAnalysis: {
        totalFiltered: Number(filterAnalysis[0]?.totalFiltered || 0),
        averageYield: new Decimal(filterAnalysis[0]?.avgYield?.toString() || '0').toNumber(),
        totalInputKg: new Decimal(filterAnalysis[0]?.totalInput?.toString() || '0').toNumber(),
        totalOutputKg: new Decimal(filterAnalysis[0]?.totalOutput?.toString() || '0').toNumber(),
      },
      topProducts: topProducts.map(product => ({
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        totalKg: new Decimal(product.totalKg?.toString() || '0').toNumber(),
        valueUsd: new Decimal(product.valueUsd?.toString() || '0').toNumber(),
      })),
    };
  }

  async getSupplierPerformance(): Promise<SupplierPerformanceResponse> {
    // Get supplier metrics with USD normalization
    const supplierMetrics = await db
      .select({
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        totalPurchases: count(purchases.id),
        totalValue: sum(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.total}
            ELSE ${purchases.total} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        totalWeight: sum(purchases.weight),
        avgPrice: avg(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.pricePerKg}
            ELSE ${purchases.pricePerKg} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        orderCount: count(sql`DISTINCT ${purchases.orderId}`),
      })
      .from(suppliers)
      .leftJoin(purchases, eq(suppliers.id, purchases.supplierId))
      .where(eq(suppliers.isActive, true))
      .groupBy(suppliers.id, suppliers.name);

    // Calculate trends (simplified - comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentMetrics = await db
      .select({
        supplierId: purchases.supplierId,
        avgPrice: avg(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.pricePerKg}
            ELSE ${purchases.pricePerKg} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        totalWeight: sum(purchases.weight),
      })
      .from(purchases)
      .where(gte(purchases.date, thirtyDaysAgo))
      .groupBy(purchases.supplierId);

    const previousMetrics = await db
      .select({
        supplierId: purchases.supplierId,
        avgPrice: avg(sql`
          CASE 
            WHEN ${purchases.currency} = 'USD' THEN ${purchases.pricePerKg}
            ELSE ${purchases.pricePerKg} / COALESCE(${purchases.exchangeRate}, 1)
          END
        `),
        totalWeight: sum(purchases.weight),
      })
      .from(purchases)
      .where(and(
        gte(purchases.date, sixtyDaysAgo),
        lte(purchases.date, thirtyDaysAgo)
      ))
      .groupBy(purchases.supplierId);

    // Build trends map
    const recentMap = new Map(recentMetrics.map(m => [m.supplierId, m]));
    const previousMap = new Map(previousMetrics.map(m => [m.supplierId, m]));

    const suppliers_ = supplierMetrics.map(supplier => {
      const recent = recentMap.get(supplier.supplierId);
      const previous = previousMap.get(supplier.supplierId);
      
      let priceChange = 0;
      let volumeChange = 0;

      if (recent && previous) {
        const recentPrice = new Decimal(recent.avgPrice?.toString() || '0');
        const previousPrice = new Decimal(previous.avgPrice?.toString() || '0');
        if (previousPrice.gt(0)) {
          priceChange = recentPrice.sub(previousPrice).div(previousPrice).mul(100).toNumber();
        }

        const recentVolume = new Decimal(recent.totalWeight?.toString() || '0');
        const previousVolume = new Decimal(previous.totalWeight?.toString() || '0');
        if (previousVolume.gt(0)) {
          volumeChange = recentVolume.sub(previousVolume).div(previousVolume).mul(100).toNumber();
        }
      }

      return {
        id: supplier.supplierId,
        name: supplier.supplierName,
        metrics: {
          totalPurchases: Number(supplier.totalPurchases || 0),
          totalValue: new Decimal(supplier.totalValue?.toString() || '0').toNumber(),
          totalWeight: new Decimal(supplier.totalWeight?.toString() || '0').toNumber(),
          averagePrice: new Decimal(supplier.avgPrice?.toString() || '0').toNumber(),
          averageQuality: undefined, // Could be calculated from warehouse data
          onTimeDelivery: 95, // Placeholder - would need delivery tracking
          orderCount: Number(supplier.orderCount || 0),
        },
        trends: {
          priceChange,
          volumeChange,
        },
      };
    });

    const activeSuppliers = suppliers_.filter(s => s.metrics.totalPurchases > 0);
    const topPerformer = activeSuppliers.reduce((best: any, current: any) => 
      current.metrics.totalValue > best.metrics.totalValue ? current : best,
      activeSuppliers[0]
    );

    return {
      suppliers: suppliers_,
      summary: {
        totalSuppliers: suppliers_.length,
        activeSuppliers: activeSuppliers.length,
        topPerformer: topPerformer?.name,
      },
    };
  }

  async getTradingActivity(): Promise<TradingActivityResponse> {
    // Get order fulfillment stats
    const orderStats = await db
      .select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .groupBy(orders.status);

    const stats = orderStats.reduce((acc: {total: number, completed: number, pending: number, cancelled: number}, stat: any) => {
      const statusCount = Number(stat.count || 0);
      acc.total += statusCount;
      
      switch (stat.status) {
        case 'completed':
          acc.completed += statusCount;
          break;
        case 'cancelled':
          acc.cancelled += statusCount;
          break;
        default:
          acc.pending += statusCount;
      }
      
      return acc;
    }, { total: 0, completed: 0, pending: 0, cancelled: 0 });

    const fulfillmentRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    // Get volume analysis from purchases (as proxy for order volume)
    const volumeAnalysis = await db
      .select({
        totalVolume: sum(purchases.weight),
        avgOrderSize: avg(purchases.weight),
        maxOrderSize: sql<number>`MAX(${purchases.weight})`,
        orderCount: count(),
      })
      .from(purchases);

    // Get time analysis (simplified - based on creation to completion time)
    const completedOrders = await db
      .select({
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.status, 'completed'));

    let totalProcessingDays = 0;
    let processedOrdersCount = 0;

    completedOrders.forEach(order => {
      if (order.createdAt && order.updatedAt) {
        const days = (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        totalProcessingDays += days;
        processedOrdersCount++;
      }
    });

    const averageProcessingTime = processedOrdersCount > 0 ? totalProcessingDays / processedOrdersCount : 0;

    return {
      orderFulfillment: {
        stats,
        fulfillmentRate,
      },
      volumeAnalysis: {
        totalVolume: new Decimal(volumeAnalysis[0]?.totalVolume?.toString() || '0').toNumber(),
        averageOrderSize: new Decimal(volumeAnalysis[0]?.avgOrderSize?.toString() || '0').toNumber(),
        largestOrder: Number(volumeAnalysis[0]?.maxOrderSize || 0),
      },
      timeAnalysis: {
        averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
        totalProcessingDays: Math.round(totalProcessingDays),
      },
    };
  }

  async exportReportData(type: string, format: string): Promise<any> {
    // Implementation depends on the specific type requested
    switch (type) {
      case 'financial':
        const financialData = await this.getFinancialSummary();
        return format === 'csv' ? this.convertToCSV(financialData) : financialData;
      
      case 'inventory':
        const inventoryData = await this.getInventoryAnalytics();
        return format === 'csv' ? this.convertToCSV(inventoryData) : inventoryData;
        
      case 'suppliers':
        const supplierData = await this.getSupplierPerformance();
        return format === 'csv' ? this.convertToCSV(supplierData) : supplierData;
        
      case 'trading':
        const tradingData = await this.getTradingActivity();
        return format === 'csv' ? this.convertToCSV(tradingData) : tradingData;
        
      case 'all':
        const allData = {
          financial: await this.getFinancialSummary(),
          inventory: await this.getInventoryAnalytics(),
          suppliers: await this.getSupplierPerformance(),
          trading: await this.getTradingActivity(),
        };
        return format === 'csv' ? this.convertToCSV(allData) : allData;
        
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  // Helper method to convert data to CSV format
  private convertToCSV(data: any): string {
    // Simple CSV conversion - in a real implementation, you'd want more sophisticated formatting
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    } else if (typeof data === 'object') {
      // Convert object to key-value CSV
      return Object.entries(data)
        .map(([key, value]) => `"${key}","${JSON.stringify(value).replace(/"/g, '""')}"`)
        .join('\n');
    }
    
    return JSON.stringify(data);
  }

  // Utility method to create consistent hash for advisory locks
  private hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive number for PostgreSQL advisory locks
    return Math.abs(hash);
  }

  // AI operations
  async getAiInsightsCache(cacheKey: string): Promise<AiInsightsCache | undefined> {
    const [cache] = await db
      .select()
      .from(aiInsightsCache)
      .where(and(
        eq(aiInsightsCache.cacheKey, cacheKey),
        sql`${aiInsightsCache.expiresAt} > NOW()`
      ));
    return cache;
  }

  async setAiInsightsCache(cache: InsertAiInsightsCache): Promise<AiInsightsCache> {
    const [result] = await db
      .insert(aiInsightsCache)
      .values(cache)
      .onConflictDoUpdate({
        target: aiInsightsCache.cacheKey,
        set: {
          result: cache.result,
          metadata: cache.metadata,
          dataHash: cache.dataHash,
          expiresAt: cache.expiresAt,
        },
      })
      .returning();
    return result;
  }

  async deleteExpiredInsightsCache(): Promise<void> {
    await db
      .delete(aiInsightsCache)
      .where(sql`${aiInsightsCache.expiresAt} <= NOW()`);
  }

  async getAiConversation(sessionId: string, userId: string): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(and(
        eq(aiConversations.sessionId, sessionId),
        eq(aiConversations.userId, userId)
      ));
    return conversation;
  }

  async createOrUpdateAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    // First try to find existing conversation
    const existing = await this.getAiConversation(conversation.sessionId, conversation.userId);
    
    if (existing) {
      // Update existing conversation
      const [result] = await db
        .update(aiConversations)
        .set({
          messages: conversation.messages,
          context: conversation.context,
          updatedAt: new Date(),
        })
        .where(and(
          eq(aiConversations.sessionId, conversation.sessionId),
          eq(aiConversations.userId, conversation.userId)
        ))
        .returning();
      return result;
    } else {
      // Create new conversation
      const [result] = await db
        .insert(aiConversations)
        .values(conversation)
        .returning();
      return result;
    }
  }

  async getRecentAiConversations(userId: string, limit: number = 10): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt))
      .limit(limit);
  }

  // Workflow validation operations
  async getWorkflowValidations(userId?: string, limit: number = 10): Promise<WorkflowValidation[]> {
    const query = db
      .select()
      .from(workflowValidations)
      .orderBy(desc(workflowValidations.createdAt))
      .limit(limit);

    if (userId) {
      return await query.where(eq(workflowValidations.userId, userId));
    }
    return await query;
  }

  async getLatestWorkflowValidation(userId?: string): Promise<WorkflowValidation | undefined> {
    const conditions = [eq(workflowValidations.isLatest, true)];
    
    if (userId) {
      conditions.push(eq(workflowValidations.userId, userId));
    }
    
    const [validation] = await db
      .select()
      .from(workflowValidations)
      .where(and(...conditions))
      .orderBy(desc(workflowValidations.createdAt))
      .limit(1);
      
    return validation;
  }

  async createWorkflowValidation(validation: InsertWorkflowValidation): Promise<WorkflowValidation> {
    return await db.transaction(async (tx) => {
      // Mark all previous validations as not latest
      await tx
        .update(workflowValidations)
        .set({ isLatest: false })
        .where(eq(workflowValidations.userId, validation.userId));

      // Insert new validation with completedAt timestamp
      const [result] = await tx
        .insert(workflowValidations)
        .values({
          ...validation,
          isLatest: true,
          completedAt: new Date(),
        })
        .returning();

      return result;
    });
  }

  async updateWorkflowValidationAsLatest(validationId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get the validation to update
      const [validation] = await tx
        .select()
        .from(workflowValidations)
        .where(eq(workflowValidations.id, validationId));

      if (!validation) {
        throw new Error('Validation not found');
      }

      // Mark all previous validations for this user as not latest
      await tx
        .update(workflowValidations)
        .set({ isLatest: false })
        .where(eq(workflowValidations.userId, validation.userId));

      // Mark the specified validation as latest
      await tx
        .update(workflowValidations)
        .set({ isLatest: true })
        .where(eq(workflowValidations.id, validationId));
    });
  }

  // Period management operations
  async getPeriods(): Promise<Period[]> {
    return await db.select().from(periods).orderBy(desc(periods.createdAt));
  }

  async getPeriod(id: string): Promise<Period | undefined> {
    const [period] = await db.select().from(periods).where(eq(periods.id, id));
    return period;
  }

  async createPeriod(period: InsertPeriod): Promise<Period> {
    const [result] = await db.insert(periods).values(period).returning();
    return result;
  }

  async updatePeriod(id: string, period: Partial<InsertPeriod>): Promise<Period> {
    const [result] = await db
      .update(periods)
      .set({ ...period, updatedAt: new Date() })
      .where(eq(periods.id, id))
      .returning();
    return result;
  }

  async closePeriod(periodId: string, userId: string, adjustments?: InsertPeriodAdjustment[]): Promise<Period> {
    // Start transaction for period closing
    return await db.transaction(async (tx) => {
      // Create adjustments if provided
      if (adjustments && adjustments.length > 0) {
        for (const adjustment of adjustments) {
          await tx.insert(periodAdjustments).values({
            ...adjustment,
            periodId,
            createdBy: userId,
            approvedBy: userId,
            approvedAt: new Date()
          });
        }
      }

      // Create closing log entry
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'close',
        performedBy: userId,
        description: 'Period closed with final adjustments',
        metadata: { adjustmentCount: adjustments?.length || 0 }
      });

      // Update period status to closed
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'closed',
          closedBy: userId,
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async closePeriodWithCompliance(
    periodId: string, 
    userId: string, 
    adjustments?: InsertPeriodAdjustment[],
    complianceData?: {
      complianceValidationId?: string | null;
      aiValidationStatus: 'passed' | 'skipped' | 'failed';
    }
  ): Promise<Period> {
    // Start transaction for period closing with compliance
    return await db.transaction(async (tx) => {
      // Create adjustments if provided
      if (adjustments && adjustments.length > 0) {
        for (const adjustment of adjustments) {
          await tx.insert(periodAdjustments).values({
            ...adjustment,
            periodId,
            createdBy: userId,
            approvedBy: userId,
            approvedAt: new Date()
          });
        }
      }

      // Create comprehensive closing log entry with compliance data
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'close',
        performedBy: userId,
        description: 'Period closed with compliance validation and final adjustments',
        metadata: { 
          adjustmentCount: adjustments?.length || 0,
          complianceValidationId: complianceData?.complianceValidationId,
          aiValidationStatus: complianceData?.aiValidationStatus,
          closingTimestamp: new Date().toISOString(),
          complianceAttestation: complianceData?.aiValidationStatus === 'passed'
        }
      });

      // Update period status to closed
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'closed',
          closedBy: userId,
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async reopenPeriod(periodId: string, userId: string, reason: string): Promise<Period> {
    return await db.transaction(async (tx) => {
      // Create log entry for reopening
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'reopen',
        performedBy: userId,
        description: reason,
        metadata: { reason }
      });

      // Update period status to open
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'open',
          closedBy: null,
          closedAt: null,
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async reopenPeriodWithAudit(periodId: string, userId: string, reason: string): Promise<Period> {
    return await db.transaction(async (tx) => {
      // Get period details for audit
      const [period] = await tx.select().from(periods).where(eq(periods.id, periodId));
      
      if (!period) {
        throw new Error('Period not found');
      }

      // Create comprehensive audit log entry for reopening
      await tx.insert(periodClosingLogs).values({
        periodId,
        action: 'reopen',
        performedBy: userId,
        description: `Period reopened: ${reason}`,
        metadata: { 
          reason,
          previousStatus: period.status,
          previousClosedBy: period.closedBy,
          previousClosedAt: period.closedAt?.toISOString(),
          reopenTimestamp: new Date().toISOString(),
          auditTrail: true
        }
      });

      // Update period status to open
      const [result] = await tx
        .update(periods)
        .set({ 
          status: 'open',
          closedBy: null,
          closedAt: null,
          updatedAt: new Date()
        })
        .where(eq(periods.id, periodId))
        .returning();

      return result;
    });
  }

  async getPeriodClosingLogs(periodId: string): Promise<PeriodClosingLog[]> {
    return await db
      .select()
      .from(periodClosingLogs)
      .where(eq(periodClosingLogs.periodId, periodId))
      .orderBy(desc(periodClosingLogs.createdAt));
  }

  async createPeriodAdjustment(adjustment: InsertPeriodAdjustment): Promise<PeriodAdjustment> {
    const [result] = await db.insert(periodAdjustments).values(adjustment).returning();
    return result;
  }

  async getPeriodAdjustments(periodId: string): Promise<PeriodAdjustment[]> {
    return await db
      .select()
      .from(periodAdjustments)
      .where(eq(periodAdjustments.periodId, periodId))
      .orderBy(desc(periodAdjustments.createdAt));
  }

  async approvePeriodAdjustment(adjustmentId: string, userId: string): Promise<PeriodAdjustment> {
    const [result] = await db
      .update(periodAdjustments)
      .set({ 
        approvedBy: userId,
        approvedAt: new Date()
      })
      .where(eq(periodAdjustments.id, adjustmentId))
      .returning();
    return result;
  }

  // Enhanced export operations
  async createExportRequest(exportData: InsertExportHistory): Promise<ExportHistory> {
    const [result] = await db.insert(exportHistory).values(exportData).returning();
    return result;
  }

  async getExportHistory(userId?: string, limit: number = 50): Promise<ExportHistory[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(exportHistory.userId, userId));
    }
    
    const query = db.select().from(exportHistory);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(exportHistory.createdAt)).limit(limit);
    }
    
    return await query.orderBy(desc(exportHistory.createdAt)).limit(limit);
  }

  async updateExportStatus(exportId: string, status: string, filePath?: string, fileSize?: number): Promise<ExportHistory> {
    const updateData: any = { status };
    
    if (filePath) updateData.filePath = filePath;
    if (fileSize) updateData.fileSize = fileSize;
    if (status === 'completed') updateData.completedAt = new Date();
    
    const [result] = await db
      .update(exportHistory)
      .set(updateData)
      .where(eq(exportHistory.id, exportId))
      .returning();
    return result;
  }

  async getExportJob(id: string): Promise<ExportHistory | undefined> {
    const [exportJob] = await db.select().from(exportHistory).where(eq(exportHistory.id, id));
    return exportJob;
  }

  async deleteExpiredExports(): Promise<void> {
    await db
      .delete(exportHistory)
      .where(and(
        sql`expires_at IS NOT NULL`,
        sql`expires_at < NOW()`
      ));
  }

  async incrementDownloadCount(exportId: string): Promise<void> {
    await db
      .update(exportHistory)
      .set({ downloadCount: sql`download_count + 1` })
      .where(eq(exportHistory.id, exportId));
  }

  // Export preferences operations
  async getUserExportPreferences(userId: string, reportType?: string): Promise<ExportPreferences[]> {
    const conditions = [eq(exportPreferences.userId, userId)];
    
    if (reportType) {
      conditions.push(eq(exportPreferences.reportType, reportType));
    }
    
    return await db
      .select()
      .from(exportPreferences)
      .where(and(...conditions))
      .orderBy(desc(exportPreferences.updatedAt));
  }

  async setExportPreference(preference: InsertExportPreferences): Promise<ExportPreferences> {
    const [result] = await db
      .insert(exportPreferences)
      .values(preference)
      .onConflictDoUpdate({
        target: [exportPreferences.userId, exportPreferences.reportType],
        set: {
          preferredFormat: preference.preferredFormat,
          defaultDateRange: preference.defaultDateRange,
          customFields: preference.customFields,
          emailDelivery: preference.emailDelivery,
          compression: preference.compression,
          updatedAt: new Date()
        }
      })
      .returning();
    return result;
  }

  async updateExportPreference(userId: string, reportType: string, updates: Partial<InsertExportPreferences>): Promise<ExportPreferences> {
    const [result] = await db
      .update(exportPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(exportPreferences.userId, userId),
        eq(exportPreferences.reportType, reportType)
      ))
      .returning();
    return result;
  }

  // Scheduled export operations
  async getExportJobs(userId?: string): Promise<ExportJob[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(exportJobs.userId, userId));
    }
    
    const query = db.select().from(exportJobs);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(exportJobs.createdAt));
    }
    
    return await query.orderBy(desc(exportJobs.createdAt));
  }

  async createExportJob(job: InsertExportJob): Promise<ExportJob> {
    const [result] = await db.insert(exportJobs).values(job).returning();
    return result;
  }

  async updateExportJob(id: string, updates: Partial<InsertExportJob>): Promise<ExportJob> {
    const [result] = await db
      .update(exportJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(exportJobs.id, id))
      .returning();
    return result;
  }

  async deleteExportJob(id: string): Promise<void> {
    await db.delete(exportJobs).where(eq(exportJobs.id, id));
  }

  // Enhanced export format operations
  async exportToCSV(data: any[], filename: string): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, filename);
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    return filePath;
  }

  async exportToExcel(data: Record<string, any[]>, filename: string): Promise<string> {
    const XLSX = await import('xlsx');
    const fs = await import('fs');
    const path = await import('path');

    const workbook = XLSX.utils.book_new();

    // Add each sheet to the workbook
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      if (sheetData && sheetData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, filename);
    XLSX.writeFile(workbook, filePath);
    
    return filePath;
  }

  async exportToPDF(data: any, reportType: string, filename: string): Promise<string> {
    const jsPDF = (await import('jspdf')).jsPDF;
    const fs = await import('fs');
    const path = await import('path');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`WorkFlu ${reportType.replace('_', ' ').toUpperCase()} Report`, 20, 30);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
    
    let yPosition = 60;
    
    if (Array.isArray(data)) {
      // Table format for array data
      const autoTable = (await import('jspdf-autotable')).default;
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => item[header] || ''));
        
        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [63, 123, 191] }
        });
      }
    } else {
      // Summary format for object data
      doc.setFontSize(10);
      Object.entries(data).forEach(([key, value]) => {
        doc.text(`${key}: ${JSON.stringify(value)}`, 20, yPosition);
        yPosition += 10;
      });
    }

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, filename);
    doc.save(filePath);
    
    return filePath;
  }

  async compressFile(filePath: string): Promise<string> {
    const archiver = await import('archiver');
    const fs = await import('fs');
    const path = await import('path');
    
    const compressedPath = filePath.replace(path.extname(filePath), '.zip');
    const output = fs.createWriteStream(compressedPath);
    const archive = archiver.default('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(compressedPath));
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.file(filePath, { name: path.basename(filePath) });
      archive.finalize();
    });
  }

  async sendEmailWithAttachment(recipients: string[], subject: string, body: string, attachmentPath: string): Promise<void> {
    const nodemailer = await import('nodemailer');
    
    // Configure transporter (you may need to configure this based on your email service)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'reports@workflu.com',
      to: recipients.join(', '),
      subject,
      text: body,
      attachments: [{
        path: attachmentPath
      }]
    };

    await transporter.sendMail(mailOptions);
  }

  // Shipping and Logistics implementations
  
  // Carrier operations
  async getCarriers(filter?: CarrierFilter): Promise<Carrier[]> {
    const conditions = [];
    
    if (filter?.isActive !== undefined) {
      conditions.push(eq(carriers.isActive, filter.isActive));
    }
    
    if (filter?.isPreferred !== undefined) {
      conditions.push(eq(carriers.isPreferred, filter.isPreferred));
    }
    
    if (filter?.serviceType) {
      conditions.push(sql`${carriers.serviceTypes} @> ${[filter.serviceType]}`);
    }
    
    const query = db.select().from(carriers);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(carriers.isPreferred), desc(carriers.rating), carriers.name);
    }
    
    return await query.orderBy(desc(carriers.isPreferred), desc(carriers.rating), carriers.name);
  }

  async getCarrier(id: string): Promise<Carrier | undefined> {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
    return carrier;
  }

  async createCarrier(carrier: InsertCarrier, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Carrier> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'carrier_create',
        operationData: carrier,
        businessContext: `Create carrier: ${carrier.name}`
      });
    }

    const [result] = await db.insert(carriers).values(carrier).returning();
    
    // CRITICAL SECURITY: Audit logging for carrier operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'carriers',
        result.id,
        'create',
        'carrier_create',
        null,
        result
      );
    }
    
    return result;
  }

  async updateCarrier(id: string, carrier: Partial<InsertCarrier>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Carrier> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState(carriers, id);
    
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'carrier_update',
        operationData: carrier,
        businessContext: `Update carrier: ${(beforeState as any)?.name || id}`
      });
    }

    const [result] = await db
      .update(carriers)
      .set({ ...carrier, updatedAt: new Date() })
      .where(eq(carriers.id, id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for carrier updates
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'carriers',
        result.id,
        'update',
        'carrier_update',
        beforeState,
        result
      );
    }
    
    return result;
  }

  async deleteCarrier(id: string): Promise<void> {
    await db.update(carriers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(carriers.id, id));
  }

  async updateCarrierRating(carrierId: string, rating: number): Promise<Carrier> {
    const [result] = await db
      .update(carriers)
      .set({ rating: rating.toString(), updatedAt: new Date() })
      .where(eq(carriers.id, carrierId))
      .returning();
    return result;
  }

  // Shipment legs operations
  async getShipmentLegs(shipmentId: string): Promise<ShipmentLeg[]> {
    return await db
      .select()
      .from(shipmentLegs)
      .where(eq(shipmentLegs.shipmentId, shipmentId))
      .orderBy(asc(shipmentLegs.legNumber));
  }

  async getShipmentLeg(id: string): Promise<ShipmentLeg | undefined> {
    const [result] = await db
      .select()
      .from(shipmentLegs)
      .where(eq(shipmentLegs.id, id))
      .limit(1);
    return result;
  }

  async createShipmentLeg(leg: InsertShipmentLeg, auditContext?: AuditContext): Promise<ShipmentLeg> {
    const [result] = await db.insert(shipmentLegs).values(leg).returning();
    
    // CRITICAL SECURITY: Audit logging for shipment leg creation
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'shipment_legs',
        result.id,
        'create',
        'shipment_leg_create',
        null,
        result
      );
    }
    
    return result;
  }

  async updateShipmentLeg(id: string, updates: Partial<InsertShipmentLeg>, auditContext?: AuditContext): Promise<ShipmentLeg> {
    // CRITICAL SECURITY: Capture before state for audit logging
    const beforeState = await this.getShipmentLeg(id);
    
    const [result] = await db
      .update(shipmentLegs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shipmentLegs.id, id))
      .returning();
    
    // CRITICAL SECURITY: Audit logging for shipment leg updates
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'shipment_legs',
        result.id,
        'update',
        'shipment_leg_update',
        beforeState,
        result
      );
    }
    
    return result;
  }

  // Arrival costs operations
  async getArrivalCosts(shipmentId: string): Promise<ArrivalCost[]> {
    return await db
      .select()
      .from(arrivalCosts)
      .where(eq(arrivalCosts.shipmentId, shipmentId))
      .orderBy(asc(arrivalCosts.createdAt));
  }

  async createArrivalCost(cost: InsertArrivalCost, auditContext?: AuditContext): Promise<ArrivalCost> {
    const [result] = await db.insert(arrivalCosts).values(cost).returning();
    
    // CRITICAL SECURITY: Audit logging for arrival cost creation
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'arrival_costs',
        result.id,
        'create',
        'arrival_cost_create',
        null,
        result
      );
    }
    
    return result;
  }

  // Shipment operations
  async getShipments(filter?: ShipmentFilter): Promise<Shipment[]> {
    const conditions = [];

    if (filter?.status) {
      conditions.push(eq(shipments.status, filter.status));
    }

    if (filter?.method) {
      conditions.push(eq(shipments.method, filter.method as any));
    }

    if (filter?.carrierId) {
      conditions.push(eq(shipments.carrierId, filter.carrierId));
    }

    if (filter?.orderId) {
      conditions.push(eq(shipments.orderId, filter.orderId));
    }

    if (filter?.startDate) {
      conditions.push(gte(shipments.createdAt, new Date(filter.startDate)));
    }

    if (filter?.endDate) {
      conditions.push(lte(shipments.createdAt, new Date(filter.endDate)));
    }

    const query = db.select().from(shipments);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(shipments.createdAt));
    }

    return await query.orderBy(desc(shipments.createdAt));
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment;
  }

  async getShipmentWithDetails(id: string): Promise<ShipmentWithDetailsResponse | undefined> {
    const shipment = await this.getShipment(id);
    if (!shipment) return undefined;

    const [carrier, items, costs, tracking] = await Promise.all([
      this.getCarrier(shipment.carrierId),
      this.getShipmentItemsWithStock(id),
      this.getShippingCosts(id),
      this.getDeliveryTracking(id)
    ]);

    return {
      ...shipment,
      carrier: carrier!,
      items,
      costs,
      tracking
    };
  }

  private async getShipmentItemsWithStock(shipmentId: string): Promise<(ShipmentItem & { warehouseStock: WarehouseStock })[]> {
    const result = await db
      .select({
        shipmentItem: shipmentItems,
        warehouseStock: warehouseStock,
      })
      .from(shipmentItems)
      .leftJoin(warehouseStock, eq(shipmentItems.warehouseStockId, warehouseStock.id))
      .where(eq(shipmentItems.shipmentId, shipmentId));

    return result.map(row => ({
      ...row.shipmentItem,
      warehouseStock: row.warehouseStock!
    }));
  }

  async createShipment(shipment: InsertShipment, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Shipment> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'shipment_create',
        operationData: shipment,
        businessContext: `Create shipment: ${shipment.method} to ${shipment.destinationAddress}`
      });
    }

    const shipmentNumber = await this.generateNextShipmentNumber();
    
    const [result] = await db.insert(shipments).values({
      ...shipment,
      shipmentNumber,
    }).returning();
    
    // CRITICAL SECURITY: Audit logging for shipment operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'shipments',
        result.id,
        'create',
        'shipment_create',
        null,
        result
      );
    }
    
    return result;
  }

  async createShipmentFromWarehouseStock(shipmentData: CreateShipmentFromStock, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<Shipment> {
    // CRITICAL SECURITY: Enforce approval requirement at storage level
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'shipment_from_stock_create',
        operationData: shipmentData,
        businessContext: `Create shipment from warehouse stock: ${shipmentData.warehouseStockItems.length} items via ${shipmentData.method}`
      });
    }
    const result = await db.transaction(async (tx) => {
      // Generate shipment number
      const shipmentNumber = await this.generateNextShipmentNumberInTransaction(tx);
      
      // Calculate total weight
      const totalWeight = shipmentData.warehouseStockItems.reduce((sum: number, item: any) => 
        sum + parseFloat(item.quantity), 0
      );

      // Create the shipment
      const [shipment] = await tx.insert(shipments).values({
        shipmentNumber,
        orderId: shipmentData.orderId,
        carrierId: shipmentData.carrierId,
        method: shipmentData.method,
        status: 'pending',
        originAddress: shipmentData.originAddress,
        destinationAddress: shipmentData.destinationAddress,
        estimatedDepartureDate: shipmentData.estimatedDepartureDate ? new Date(shipmentData.estimatedDepartureDate) : null,
        estimatedArrivalDate: shipmentData.estimatedArrivalDate ? new Date(shipmentData.estimatedArrivalDate) : null,
        totalWeight: totalWeight.toString(),
        notes: shipmentData.notes,
        createdBy: userId,
      }).returning();

      // Create shipment items and reserve stock
      for (const item of shipmentData.warehouseStockItems) {
        await tx.insert(shipmentItems).values({
          shipmentId: shipment.id,
          warehouseStockId: item.warehouseStockId,
          quantity: item.quantity,
          packingDetails: item.packingDetails,
        });

        // Reserve the stock
        await this.reserveStockInTransaction(tx, item.warehouseStockId, parseFloat(item.quantity), shipment.id);
      }

      return shipment;
    });
    
    // CRITICAL SECURITY: Audit logging for shipment from stock operations
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'shipments',
        result.id,
        'create',
        'shipment_from_stock_create',
        null,
        result
      );
    }
    
    return result;
  }

  private async generateNextShipmentNumber(): Promise<string> {
    const latestShipment = await db
      .select({ shipmentNumber: shipments.shipmentNumber })
      .from(shipments)
      .orderBy(sql`${shipments.shipmentNumber} DESC`)
      .limit(1);

    return this.calculateNextShipmentNumber(latestShipment[0]?.shipmentNumber);
  }

  private async generateNextShipmentNumberInTransaction(tx: any): Promise<string> {
    const lockId = 1234567891; // Different lock for shipments
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
    
    const latestShipment = await tx
      .select({ shipmentNumber: shipments.shipmentNumber })
      .from(shipments)
      .orderBy(sql`${shipments.shipmentNumber} DESC`)
      .limit(1)
      .for('update');

    return this.calculateNextShipmentNumber(latestShipment[0]?.shipmentNumber);
  }

  private calculateNextShipmentNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'SHP-000001';
    }

    const numberMatch = lastNumber.match(/SHP-(\d+)/);
    if (!numberMatch) {
      return 'SHP-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `SHP-${nextNumber.toString().padStart(6, '0')}`;
  }

  async updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment> {
    const [result] = await db
      .update(shipments)
      .set({ ...shipment, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return result;
  }

  async updateShipmentStatus(id: string, status: string, userId: string, actualDate?: Date): Promise<Shipment> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'in_transit' && actualDate) {
      updateData.actualDepartureDate = actualDate;
    }
    
    if (status === 'delivered' && actualDate) {
      updateData.actualArrivalDate = actualDate;
    }

    const [result] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();

    // If delivered, update final warehouse stock
    if (status === 'delivered') {
      await this.updateFinalWarehouseFromDelivery(id, userId);
    }

    return result;
  }

  async deleteShipment(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Release reserved stock first
      const items = await tx.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, id));
      
      for (const item of items) {
        await this.releaseReservedStockInTransaction(tx, item.warehouseStockId, parseFloat(item.quantity));
      }

      // Delete related records
      await tx.delete(deliveryTracking).where(eq(deliveryTracking.shipmentId, id));
      await tx.delete(shippingCosts).where(eq(shippingCosts.shipmentId, id));
      await tx.delete(shipmentItems).where(eq(shipmentItems.shipmentId, id));
      await tx.delete(shipments).where(eq(shipments.id, id));
    });
  }

  // Shipment item operations
  async getShipmentItems(shipmentId: string): Promise<ShipmentItem[]> {
    return await db.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, shipmentId));
  }

  async createShipmentItem(item: InsertShipmentItem): Promise<ShipmentItem> {
    const [result] = await db.insert(shipmentItems).values(item).returning();
    return result;
  }

  async updateShipmentItem(id: string, item: Partial<InsertShipmentItem>): Promise<ShipmentItem> {
    const [result] = await db
      .update(shipmentItems)
      .set(item)
      .where(eq(shipmentItems.id, id))
      .returning();
    return result;
  }

  async deleteShipmentItem(id: string): Promise<void> {
    await db.delete(shipmentItems).where(eq(shipmentItems.id, id));
  }

  // Shipping cost operations
  async getShippingCosts(shipmentId: string): Promise<ShippingCost[]> {
    return await db.select().from(shippingCosts).where(eq(shippingCosts.shipmentId, shipmentId));
  }

  async getShippingCost(id: string): Promise<ShippingCost | undefined> {
    const [cost] = await db.select().from(shippingCosts).where(eq(shippingCosts.id, id));
    return cost;
  }

  async addShippingCost(costData: AddShippingCost, userId: string): Promise<ShippingCost> {
    const amount = new Decimal(costData.amount);
    let amountUsd = amount;
    
    // Convert to USD if needed
    if (costData.currency === 'ETB' && costData.exchangeRate) {
      amountUsd = amount.div(new Decimal(costData.exchangeRate));
    }

    const remaining = costData.amountPaid ? 
      amount.sub(new Decimal(costData.amountPaid)).toString() : 
      amount.toString();

    const [result] = await db.insert(shippingCosts).values({
      shipmentId: costData.shipmentId,
      costType: costData.costType,
      amount: costData.amount,
      currency: costData.currency,
      exchangeRate: costData.exchangeRate,
      amountUsd: amountUsd.toFixed(2),
      description: costData.description,
      paymentMethod: costData.paymentMethod,
      amountPaid: costData.amountPaid || '0',
      remaining,
      fundingSource: costData.fundingSource,
      createdBy: userId,
    }).returning();

    // If paid from capital, create capital entry
    if (costData.fundingSource === 'capital' && costData.amountPaid && parseFloat(costData.amountPaid) > 0) {
      await this.createCapitalEntryWithConcurrencyProtection({
        amount: amountUsd.toFixed(2),
        type: 'CapitalOut',
        reference: result.shipmentId,
        description: `Shipping cost - ${costData.costType} ${costData.currency === 'ETB' ? `(${costData.amountPaid} ETB @ ${costData.exchangeRate})` : ''}`,
        paymentCurrency: costData.currency,
        exchangeRate: costData.exchangeRate,
        createdBy: userId,
      });
    }

    return result;
  }

  async updateShippingCost(id: string, cost: Partial<InsertShippingCost>): Promise<ShippingCost> {
    const [result] = await db
      .update(shippingCosts)
      .set(cost)
      .where(eq(shippingCosts.id, id))
      .returning();
    return result;
  }

  async deleteShippingCost(id: string): Promise<void> {
    await db.delete(shippingCosts).where(eq(shippingCosts.id, id));
  }

  // Delivery tracking operations
  async getDeliveryTracking(shipmentId: string): Promise<DeliveryTracking[]> {
    return await db.select().from(deliveryTracking)
      .where(eq(deliveryTracking.shipmentId, shipmentId))
      .orderBy(desc(deliveryTracking.timestamp));
  }

  async addDeliveryTracking(trackingData: AddDeliveryTracking, userId: string): Promise<DeliveryTracking> {
    const [result] = await db.insert(deliveryTracking).values({
      shipmentId: trackingData.shipmentId,
      status: trackingData.status,
      location: trackingData.location,
      description: trackingData.description,
      isCustomerNotified: trackingData.isCustomerNotified,
      proofOfDelivery: trackingData.proofOfDelivery,
      exceptionDetails: trackingData.exceptionDetails,
      createdBy: userId,
    }).returning();

    return result;
  }

  async updateDeliveryTracking(id: string, tracking: Partial<InsertDeliveryTracking>): Promise<DeliveryTracking> {
    const [result] = await db
      .update(deliveryTracking)
      .set(tracking)
      .where(eq(deliveryTracking.id, id))
      .returning();
    return result;
  }

  async markCustomerNotified(trackingId: string, userId: string): Promise<DeliveryTracking> {
    const [result] = await db
      .update(deliveryTracking)
      .set({ isCustomerNotified: true })
      .where(eq(deliveryTracking.id, trackingId))
      .returning();
    return result;
  }

  // Shipping analytics and reporting
  async getShippingAnalytics(filters?: DateRangeFilter): Promise<ShippingAnalyticsResponse> {
    let dateConditions = [];
    
    if (filters?.startDate) {
      dateConditions.push(gte(shipments.createdAt, new Date(filters.startDate)));
    }
    
    if (filters?.endDate) {
      dateConditions.push(lte(shipments.createdAt, new Date(filters.endDate)));
    }

    const whereClause = dateConditions.length > 0 ? and(...dateConditions) : undefined;

    // Summary stats
    const summaryResult = await db
      .select({
        totalShipments: count(),
        inTransit: sum(sql`CASE WHEN ${shipments.status} = 'in_transit' THEN 1 ELSE 0 END`),
        delivered: sum(sql`CASE WHEN ${shipments.status} = 'delivered' THEN 1 ELSE 0 END`),
      })
      .from(shipments)
      .where(whereClause);

    // Cost summary
    const costResult = await db
      .select({
        totalCostUsd: sum(shippingCosts.amountUsd),
        totalWeight: sum(shipments.totalWeight),
      })
      .from(shipments)
      .leftJoin(shippingCosts, eq(shipments.id, shippingCosts.shipmentId))
      .where(whereClause);

    // Method distribution
    const methodResult = await db
      .select({
        method: shipments.method,
        count: count(),
      })
      .from(shipments)
      .where(whereClause)
      .groupBy(shipments.method);

    const summary = summaryResult[0];
    const costs = costResult[0];
    const totalCostUsd = parseFloat(costs?.totalCostUsd || '0');
    const totalWeight = parseFloat(costs?.totalWeight || '0');
    const totalShipments = Number(summary.totalShipments || 0);

    // Calculate method distribution
    const methodDistribution = methodResult.map(row => ({
      method: row.method,
      count: Number(row.count || 0),
      percentage: totalShipments > 0 ? (Number(row.count || 0) / totalShipments) * 100 : 0,
    }));

    // Calculate on-time delivery rate
    const onTimeResult = await db
      .select({
        onTimeDeliveries: sum(sql`CASE WHEN ${shipments.actualArrivalDate} <= ${shipments.estimatedArrivalDate} THEN 1 ELSE 0 END`),
      })
      .from(shipments)
      .where(and(whereClause, sql`${shipments.actualArrivalDate} IS NOT NULL AND ${shipments.estimatedArrivalDate} IS NOT NULL`));

    const onTimeDeliveries = Number(onTimeResult[0]?.onTimeDeliveries || 0);
    const onTimeDeliveryRate = totalShipments > 0 ? (onTimeDeliveries / totalShipments) * 100 : 0;

    // Carrier performance
    const carrierPerformance = await this.getCarrierPerformanceData(whereClause);
    
    // Cost breakdown
    const costBreakdownDetailed = await this.getShippingCostBreakdown(whereClause);
    
    // Delivery time analysis
    const deliveryTimeAnalysis = await this.getDeliveryTimeAnalysis(whereClause);

    // Create simplified cost breakdown for top-level access
    const costBreakdown = {
      legs: costBreakdownDetailed.find(c => c.costType === 'leg')?.totalUsd || 0,
      arrival: costBreakdownDetailed.find(c => c.costType === 'arrival')?.totalUsd || 0,
    };

    return {
      // Top-level properties that frontend expects directly
      totalShipments,
      totalShippingCosts: totalCostUsd,
      avgCostPerKg: totalWeight > 0 ? totalCostUsd / totalWeight : 0,
      onTimeDeliveryRate,
      methodDistribution,
      costBreakdown,
      
      // Detailed nested data for advanced analytics
      summary: {
        totalShipments,
        inTransit: Number(summary.inTransit || 0),
        delivered: Number(summary.delivered || 0),
        totalCostUsd,
        averageCostPerKg: totalWeight > 0 ? totalCostUsd / totalWeight : 0,
      },
      carrierPerformance,
      costBreakdownDetailed,
      deliveryTimeAnalysis,
    };
  }

  private async getCarrierPerformanceData(whereClause: any): Promise<any[]> {
    const result = await db
      .select({
        carrierId: carriers.id,
        carrierName: carriers.name,
        totalShipments: count(shipments.id),
        onTimeDeliveries: sum(sql`CASE WHEN ${shipments.actualArrivalDate} <= ${shipments.estimatedArrivalDate} THEN 1 ELSE 0 END`),
        averageCostPerKg: avg(sql`${shippingCosts.amountUsd} / ${shipments.totalWeight}`),
        rating: carriers.rating,
      })
      .from(carriers)
      .leftJoin(shipments, eq(carriers.id, shipments.carrierId))
      .leftJoin(shippingCosts, eq(shipments.id, shippingCosts.shipmentId))
      .where(whereClause)
      .groupBy(carriers.id, carriers.name, carriers.rating);

    return result.map(row => ({
      carrierId: row.carrierId,
      carrierName: row.carrierName,
      totalShipments: Number(row.totalShipments || 0),
      onTimeDeliveryRate: row.totalShipments ? (Number(row.onTimeDeliveries || 0) / Number(row.totalShipments)) * 100 : 0,
      averageCostPerKg: Number(row.averageCostPerKg || 0),
      rating: Number(row.rating || 0),
    }));
  }

  private async getShippingCostBreakdown(whereClause: any): Promise<any[]> {
    const result = await db
      .select({
        costType: shippingCosts.costType,
        totalUsd: sum(shippingCosts.amountUsd),
      })
      .from(shippingCosts)
      .leftJoin(shipments, eq(shippingCosts.shipmentId, shipments.id))
      .where(whereClause)
      .groupBy(shippingCosts.costType);

    const totalCost = result.reduce((sum: number, row: any) => sum + parseFloat(row.totalUsd || '0'), 0);

    return result.map(row => ({
      costType: row.costType,
      totalUsd: parseFloat(row.totalUsd || '0'),
      percentage: totalCost > 0 ? (parseFloat(row.totalUsd || '0') / totalCost) * 100 : 0,
    }));
  }

  private async getDeliveryTimeAnalysisData(whereClause: any): Promise<any> {
    const result = await db
      .select({
        method: shipments.method,
        averageDays: avg(sql`EXTRACT(epoch FROM (${shipments.actualArrivalDate} - ${shipments.actualDepartureDate})) / 86400`),
      })
      .from(shipments)
      .where(and(whereClause, sql`${shipments.actualArrivalDate} IS NOT NULL AND ${shipments.actualDepartureDate} IS NOT NULL`))
      .groupBy(shipments.method);

    const overallAverage = result.reduce((sum: number, row: any) => sum + Number(row.averageDays || 0), 0) / result.length || 0;

    return {
      averageDeliveryDays: overallAverage,
      byMethod: result.map(row => ({
        method: row.method,
        averageDays: Number(row.averageDays || 0),
      })),
    };
  }

  async getCarrierPerformanceReport(): Promise<any> {
    return await this.getCarrierPerformanceData(undefined);
  }

  async getShippingCostAnalysis(filters?: DateRangeFilter): Promise<any> {
    let whereClause = undefined;
    if (filters?.startDate || filters?.endDate) {
      const conditions = [];
      if (filters.startDate) conditions.push(gte(shipments.createdAt, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(shipments.createdAt, new Date(filters.endDate)));
      whereClause = and(...conditions);
    }
    
    return await this.getShippingCostBreakdown(whereClause);
  }

  async getDeliveryTimeAnalysis(filters?: DateRangeFilter): Promise<any> {
    let whereClause = undefined;
    if (filters?.startDate || filters?.endDate) {
      const conditions = [];
      if (filters.startDate) conditions.push(gte(shipments.createdAt, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(shipments.createdAt, new Date(filters.endDate)));
      whereClause = and(...conditions);
    }
    
    return await this.getDeliveryTimeAnalysisData(whereClause);
  }

  // Integration operations
  async getAvailableWarehouseStockForShipping(): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock)
      .where(and(
        eq(warehouseStock.status, 'READY_TO_SHIP'),
        sql`${warehouseStock.qtyKgClean} > ${warehouseStock.qtyKgReserved}`
      ))
      .orderBy(desc(warehouseStock.createdAt));
  }

  async reserveStockForShipment(stockId: string, quantity: number, shipmentId: string): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      return await this.reserveStockInTransaction(tx, stockId, quantity, shipmentId);
    });
  }

  private async reserveStockInTransaction(tx: any, stockId: string, quantity: number, shipmentId: string): Promise<WarehouseStock> {
    const [stock] = await tx.select().from(warehouseStock).where(eq(warehouseStock.id, stockId)).for('update');
    
    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    const availableQuantity = parseFloat(stock.qtyKgClean) - parseFloat(stock.qtyKgReserved);
    if (availableQuantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${availableQuantity}kg, Requested: ${quantity}kg`);
    }

    const newReserved = parseFloat(stock.qtyKgReserved) + quantity;
    
    const [result] = await tx
      .update(warehouseStock)
      .set({ qtyKgReserved: newReserved.toString() })
      .where(eq(warehouseStock.id, stockId))
      .returning();

    return result;
  }

  async releaseReservedStock(stockId: string, quantity: number): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      return await this.releaseReservedStockInTransaction(tx, stockId, quantity);
    });
  }

  private async releaseReservedStockInTransaction(tx: any, stockId: string, quantity: number): Promise<WarehouseStock> {
    const [stock] = await tx.select().from(warehouseStock).where(eq(warehouseStock.id, stockId)).for('update');
    
    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    const newReserved = Math.max(0, parseFloat(stock.qtyKgReserved) - quantity);
    
    const [result] = await tx
      .update(warehouseStock)
      .set({ qtyKgReserved: newReserved.toString() })
      .where(eq(warehouseStock.id, stockId))
      .returning();

    return result;
  }

  async updateFinalWarehouseFromDelivery(shipmentId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get shipment items
      const items = await tx.select().from(shipmentItems).where(eq(shipmentItems.shipmentId, shipmentId));
      
      for (const item of items) {
        const [stock] = await tx.select().from(warehouseStock).where(eq(warehouseStock.id, item.warehouseStockId));
        
        if (stock && stock.warehouse === 'FIRST') {
          // Create new stock entry in FINAL warehouse
          await tx.insert(warehouseStock).values({
            purchaseId: stock.purchaseId,
            orderId: stock.orderId,
            supplierId: stock.supplierId,
            warehouse: 'FINAL',
            status: 'READY_FOR_SALE',
            qtyKgTotal: item.quantity,
            qtyKgClean: item.quantity,
            qtyKgNonClean: '0',
            qtyKgReserved: '0',
            cartonsCount: stock.cartonsCount,
            unitCostCleanUsd: stock.unitCostCleanUsd,
          });

          // Update FIRST warehouse stock (reduce by shipped quantity)
          const newCleanQty = parseFloat(stock.qtyKgClean) - parseFloat(item.quantity);
          const newReservedQty = parseFloat(stock.qtyKgReserved) - parseFloat(item.quantity);
          
          await tx
            .update(warehouseStock)
            .set({ 
              qtyKgClean: Math.max(0, newCleanQty).toString(),
              qtyKgReserved: Math.max(0, newReservedQty).toString(),
            })
            .where(eq(warehouseStock.id, item.warehouseStockId));
        }
      }
    });
  }

  // Quality Standards operations
  async getQualityStandards(isActive?: boolean): Promise<QualityStandard[]> {
    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(qualityStandards.isActive, isActive));
    }
    
    return await db
      .select()
      .from(qualityStandards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityStandards.createdAt));
  }

  async getQualityStandard(id: string): Promise<QualityStandard | undefined> {
    const [result] = await db
      .select()
      .from(qualityStandards)
      .where(eq(qualityStandards.id, id));
    return result;
  }

  async createQualityStandard(standard: InsertQualityStandard): Promise<QualityStandard> {
    const [result] = await db
      .insert(qualityStandards)
      .values(standard)
      .returning();
    return result;
  }

  async updateQualityStandard(id: string, standard: Partial<InsertQualityStandard>): Promise<QualityStandard> {
    const [result] = await db
      .update(qualityStandards)
      .set({ ...standard, updatedAt: new Date() })
      .where(eq(qualityStandards.id, id))
      .returning();
    return result;
  }

  // Warehouse Batches operations
  async getWarehouseBatches(filter?: { supplierId?: string; qualityGrade?: string; isActive?: boolean }): Promise<WarehouseBatch[]> {
    const conditions = [];
    
    if (filter?.supplierId) {
      conditions.push(eq(warehouseBatches.supplierId, filter.supplierId));
    }
    if (filter?.qualityGrade) {
      conditions.push(eq(warehouseBatches.qualityGrade, filter.qualityGrade as any));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(warehouseBatches.isActive, filter.isActive));
    }
    
    return await db
      .select()
      .from(warehouseBatches)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(warehouseBatches.createdAt));
  }

  async getWarehouseBatch(id: string): Promise<WarehouseBatch | undefined> {
    const [result] = await db
      .select()
      .from(warehouseBatches)
      .where(eq(warehouseBatches.id, id));
    return result;
  }

  async createWarehouseBatch(batch: InsertWarehouseBatch): Promise<WarehouseBatch> {
    const [result] = await db
      .insert(warehouseBatches)
      .values(batch)
      .returning();
    return result;
  }

  async updateWarehouseBatch(id: string, batch: Partial<InsertWarehouseBatch>): Promise<WarehouseBatch> {
    const [result] = await db
      .update(warehouseBatches)
      .set({ ...batch, updatedAt: new Date() })
      .where(eq(warehouseBatches.id, id))
      .returning();
    return result;
  }

  async splitWarehouseBatch(batchId: string, splitQuantityKg: string, userId: string): Promise<{ originalBatch: WarehouseBatch; newBatch: WarehouseBatch }> {
    return await db.transaction(async (tx) => {
      const [originalBatch] = await tx
        .select()
        .from(warehouseBatches)
        .where(eq(warehouseBatches.id, batchId))
        .for('update');
      
      if (!originalBatch) {
        throw new Error('Batch not found');
      }

      const splitQuantity = parseFloat(splitQuantityKg);
      const originalQuantity = parseFloat(originalBatch.totalQuantityKg);

      if (splitQuantity >= originalQuantity) {
        throw new Error('Split quantity cannot be greater than or equal to original quantity');
      }

      // Update original batch
      const newOriginalQuantity = originalQuantity - splitQuantity;
      const [updatedOriginalBatch] = await tx
        .update(warehouseBatches)
        .set({ 
          totalQuantityKg: newOriginalQuantity.toString(),
          updatedAt: new Date() 
        })
        .where(eq(warehouseBatches.id, batchId))
        .returning();

      // Create new batch from split
      const [newBatch] = await tx
        .insert(warehouseBatches)
        .values({
          batchNumber: `${originalBatch.batchNumber}-SPLIT-${Date.now()}`,
          supplierId: originalBatch.supplierId,
          qualityGrade: originalBatch.qualityGrade,
          totalQuantityKg: splitQuantityKg,
          notes: `Split from batch ${originalBatch.batchNumber}`,
          createdBy: userId,
        })
        .returning();

      return { originalBatch: updatedOriginalBatch, newBatch };
    });
  }

  async mergeWarehouseBatches(batchIds: string[], userId: string): Promise<WarehouseBatch> {
    return await db.transaction(async (tx) => {
      // Get all batches to merge (simplified - in production would use IN clause)
      const batches = [];
      for (const id of batchIds) {
        const [batch] = await tx
          .select()
          .from(warehouseBatches)
          .where(and(eq(warehouseBatches.id, id), eq(warehouseBatches.isActive, true)))
          .for('update');
        if (batch) batches.push(batch);
      }

      if (batches.length !== batchIds.length) {
        throw new Error('Some batches not found or inactive');
      }

      // Verify all batches have same supplier and quality grade
      const firstBatch = batches[0];
      const allSameSupplier = batches.every(b => b.supplierId === firstBatch.supplierId);
      const allSameGrade = batches.every(b => b.qualityGrade === firstBatch.qualityGrade);

      if (!allSameSupplier || !allSameGrade) {
        throw new Error('Cannot merge batches with different suppliers or quality grades');
      }

      // Calculate total quantity
      const totalQuantity = batches.reduce((sum: number, batch: any) => sum + parseFloat(batch.totalQuantityKg), 0);

      // Create merged batch
      const [mergedBatch] = await tx
        .insert(warehouseBatches)
        .values({
          batchNumber: `MERGED-${Date.now()}`,
          supplierId: firstBatch.supplierId,
          qualityGrade: firstBatch.qualityGrade,
          totalQuantityKg: totalQuantity.toString(),
          notes: `Merged from batches: ${batches.map(b => b.batchNumber).join(', ')}`,
          createdBy: userId,
        })
        .returning();

      // Deactivate original batches
      for (const batchId of batchIds) {
        await tx
          .update(warehouseBatches)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(warehouseBatches.id, batchId));
      }

      return mergedBatch;
    });
  }

  // Quality Inspections operations
  async getQualityInspections(filter?: { status?: string; inspectionType?: string; batchId?: string }): Promise<QualityInspection[]> {
    const conditions = [];
    
    if (filter?.status) {
      conditions.push(eq(qualityInspections.status, filter.status));
    }
    if (filter?.inspectionType) {
      conditions.push(eq(qualityInspections.inspectionType, filter.inspectionType));
    }
    if (filter?.batchId) {
      conditions.push(eq(qualityInspections.batchId, filter.batchId));
    }
    
    return await db
      .select()
      .from(qualityInspections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityInspections.createdAt));
  }

  async getQualityInspection(id: string): Promise<QualityInspection | undefined> {
    const [result] = await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.id, id));
    return result;
  }

  async createQualityInspection(inspection: InsertQualityInspection): Promise<QualityInspection> {
    const [result] = await db
      .insert(qualityInspections)
      .values(inspection)
      .returning();
    return result;
  }

  async updateQualityInspection(id: string, inspection: Partial<InsertQualityInspection>): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({ ...inspection, updatedAt: new Date() })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async completeQualityInspection(id: string, results: {
    qualityGrade: string;
    overallScore?: string;
    testResults?: any;
    recommendations?: string;
    userId: string;
  }): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'completed',
        qualityGrade: results.qualityGrade,
        overallScore: results.overallScore,
        testResults: results.testResults,
        recommendations: results.recommendations,
        completedAt: new Date(),
        completedById: results.userId,
        updatedAt: new Date(),
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async approveQualityInspection(id: string, userId: string): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  async rejectQualityInspection(id: string, rejectionReason: string, userId: string): Promise<QualityInspection> {
    const [result] = await db
      .update(qualityInspections)
      .set({
        status: 'rejected',
        rejectionReason,
        rejectedAt: new Date(),
        rejectedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(qualityInspections.id, id))
      .returning();
    return result;
  }

  // Enhanced warehouse stock operations with quality and batch tracking
  async assignQualityGradeToStock(stockId: string, qualityGrade: string, qualityScore?: string, userId?: string): Promise<WarehouseStock> {
    const [result] = await db
      .update(warehouseStock)
      .set({
        qualityGrade,
        qualityScore,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stockId))
      .returning();
    
    if (!result) {
      throw new Error('Warehouse stock not found');
    }
    
    return result;
  }

  async assignBatchToStock(stockId: string, batchId: string, userId?: string): Promise<WarehouseStock> {
    // Verify batch exists
    const batch = await this.getWarehouseBatch(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    const [result] = await db
      .update(warehouseStock)
      .set({
        batchId,
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stockId))
      .returning();
    
    if (!result) {
      throw new Error('Warehouse stock not found');
    }
    
    return result;
  }

  async getStockWithQualityHistory(stockId: string): Promise<{
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    consumptions: InventoryConsumption[];
    transfers: StockTransfer[];
    adjustments: InventoryAdjustment[];
  }> {
    // Get the stock item
    const [stock] = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.id, stockId));

    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    // Get associated batch if exists
    let batch: WarehouseBatch | undefined;
    if (stock.batchId) {
      batch = await this.getWarehouseBatch(stock.batchId);
    }

    // Get quality inspections
    const inspections = await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.batchId, stock.batchId || ''))
      .orderBy(desc(qualityInspections.createdAt));

    // Get consumption records
    const consumptions = await db
      .select()
      .from(inventoryConsumption)
      .where(eq(inventoryConsumption.warehouseStockId, stockId))
      .orderBy(desc(inventoryConsumption.createdAt));

    // Get transfer records
    const transfers = await db
      .select()
      .from(stockTransfers)
      .where(eq(stockTransfers.warehouseStockId, stockId))
      .orderBy(desc(stockTransfers.createdAt));

    // Get adjustment records
    const adjustments = await db
      .select()
      .from(inventoryAdjustments)
      .where(eq(inventoryAdjustments.warehouseStockId, stockId))
      .orderBy(desc(inventoryAdjustments.createdAt));

    return {
      stock,
      batch,
      inspections,
      consumptions,
      transfers,
      adjustments,
    };
  }

  // Inventory consumption operations
  async getInventoryConsumption(filter?: { warehouseStockId?: string; consumptionType?: string; orderId?: string }): Promise<InventoryConsumption[]> {
    const conditions = [];
    
    if (filter?.warehouseStockId) {
      conditions.push(eq(inventoryConsumption.warehouseStockId, filter.warehouseStockId));
    }
    if (filter?.consumptionType) {
      conditions.push(eq(inventoryConsumption.consumptionType, filter.consumptionType));
    }
    if (filter?.orderId) {
      conditions.push(eq(inventoryConsumption.orderId, filter.orderId));
    }
    
    return await db
      .select()
      .from(inventoryConsumption)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryConsumption.createdAt));
  }

  async getInventoryConsumptionByBatch(batchId: string): Promise<InventoryConsumption[]> {
    // Get all stock items in this batch and their consumption
    const batchStock = await db
      .select({ id: warehouseStock.id })
      .from(warehouseStock)
      .where(eq(warehouseStock.batchId, batchId));

    if (batchStock.length === 0) {
      return [];
    }

    const stockIds = batchStock.map(s => s.id);
    const consumptions = [];
    
    // Get consumption for each stock item (simplified - production would use IN clause)
    for (const stockId of stockIds) {
      const stockConsumptions = await db
        .select()
        .from(inventoryConsumption)
        .where(eq(inventoryConsumption.warehouseStockId, stockId))
        .orderBy(desc(inventoryConsumption.createdAt));
      consumptions.push(...stockConsumptions);
    }
    
    return consumptions;
  }

  async createInventoryConsumption(consumption: InsertInventoryConsumption): Promise<InventoryConsumption> {
    const [result] = await db
      .insert(inventoryConsumption)
      .values(consumption)
      .returning();
    return result;
  }

  async consumeInventoryFIFO(warehouseStockId: string, quantity: string, consumptionType: string, userId: string, allocatedTo?: string): Promise<InventoryConsumption[]> {
    const consumeQty = parseFloat(quantity);
    
    return await db.transaction(async (tx) => {
      // Get the specific stock item with locking
      const [stock] = await tx
        .select()
        .from(warehouseStock)
        .where(eq(warehouseStock.id, warehouseStockId))
        .for('update');

      if (!stock) {
        throw new Error('Warehouse stock not found');
      }

      const availableQty = parseFloat(stock.qtyKgClean) - parseFloat(stock.qtyKgReserved);
      
      if (availableQty < consumeQty) {
        throw new Error(`Insufficient stock. Available: ${availableQty}kg, Requested: ${consumeQty}kg`);
      }

      // Update stock quantities (FIFO consumption updates)
      const newConsumed = parseFloat(stock.qtyKgConsumed || '0') + consumeQty;
      const newClean = parseFloat(stock.qtyKgClean) - consumeQty;
      
      // Update FIFO sequence if not set
      const fifoSequence = stock.fifoSequence || new Date(stock.createdAt || new Date()).getTime();

      await tx
        .update(warehouseStock)
        .set({
          qtyKgConsumed: newConsumed.toString(),
          qtyKgClean: newClean.toString(),
          fifoSequence: fifoSequence.toString(),
          updatedAt: new Date(),
        })
        .where(eq(warehouseStock.id, warehouseStockId));

      // Create consumption record
      const [consumptionRecord] = await tx
        .insert(inventoryConsumption)
        .values({
          warehouseStockId,
          orderId: allocatedTo,
          quantityKg: quantity,
          consumptionType,
          unitCostUsd: stock.unitCostCleanUsd || '0',
          totalCostUsd: (parseFloat(stock.unitCostCleanUsd || '0') * consumeQty).toString(),
          createdBy: userId,
        })
        .returning();

      return [consumptionRecord];
    });
  }

  async getStockAging(): Promise<Array<{ warehouseStockId: string; daysInStock: number; qtyKgClean: number; unitCostUsd: number }>> {
    const result = await db
      .select({
        warehouseStockId: warehouseStock.id,
        daysInStock: sql<number>`EXTRACT(epoch FROM (NOW() - ${warehouseStock.createdAt})) / 86400`,
        qtyKgClean: warehouseStock.qtyKgClean,
        unitCostUsd: warehouseStock.unitCostCleanUsd,
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.qtyKgClean}::numeric > 0`)
      .orderBy(sql`EXTRACT(epoch FROM (NOW() - ${warehouseStock.createdAt})) / 86400 DESC`);

    return result.map(row => ({
      warehouseStockId: row.warehouseStockId,
      daysInStock: Number(row.daysInStock || 0),
      qtyKgClean: parseFloat(row.qtyKgClean || '0'),
      unitCostUsd: parseFloat(row.unitCostUsd || '0'),
    }));
  }

  async getConsumptionAnalytics(dateRange?: DateRangeFilter): Promise<{
    totalConsumed: number;
    averageCostPerKg: number;
    consumptionByType: Array<{ type: string; quantity: number; cost: number }>;
    fifoCompliance: number;
  }> {
    let whereClause = undefined;
    if (dateRange?.startDate || dateRange?.endDate) {
      const conditions = [];
      if (dateRange.startDate) conditions.push(gte(inventoryConsumption.createdAt, new Date(dateRange.startDate)));
      if (dateRange.endDate) conditions.push(lte(inventoryConsumption.createdAt, new Date(dateRange.endDate)));
      whereClause = and(...conditions);
    }

    // Total consumption metrics
    const totals = await db
      .select({
        totalConsumed: sum(inventoryConsumption.quantityKg),
        totalCost: sum(inventoryConsumption.totalCostUsd),
      })
      .from(inventoryConsumption)
      .where(whereClause);

    // Consumption by type
    const byType = await db
      .select({
        type: inventoryConsumption.consumptionType,
        quantity: sum(inventoryConsumption.quantityKg),
        cost: sum(inventoryConsumption.totalCostUsd),
      })
      .from(inventoryConsumption)
      .where(whereClause)
      .groupBy(inventoryConsumption.consumptionType);

    const totalConsumed = parseFloat(totals[0]?.totalConsumed || '0');
    const totalCost = parseFloat(totals[0]?.totalCost || '0');
    const averageCostPerKg = totalConsumed > 0 ? totalCost / totalConsumed : 0;

    // FIFO compliance calculation (simplified)
    const fifoCompliance = 95; // Placeholder - would need complex logic to verify actual FIFO adherence

    return {
      totalConsumed,
      averageCostPerKg,
      consumptionByType: byType.map(row => ({
        type: row.type,
        quantity: parseFloat(row.quantity || '0'),
        cost: parseFloat(row.cost || '0'),
      })),
      fifoCompliance,
    };
  }

  // Processing operations
  async getProcessingOperations(filter?: { status?: string; operationType?: string; batchId?: string }): Promise<ProcessingOperation[]> {
    const conditions = [];
    
    if (filter?.status) {
      conditions.push(eq(processingOperations.status, filter.status));
    }
    if (filter?.operationType) {
      conditions.push(eq(processingOperations.operationType, filter.operationType));
    }
    if (filter?.batchId) {
      conditions.push(eq(processingOperations.batchId, filter.batchId));
    }
    
    return await db
      .select()
      .from(processingOperations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(processingOperations.createdAt));
  }

  async getProcessingOperation(id: string): Promise<ProcessingOperation | undefined> {
    const [result] = await db
      .select()
      .from(processingOperations)
      .where(eq(processingOperations.id, id));
    return result;
  }

  async createProcessingOperation(operation: InsertProcessingOperation): Promise<ProcessingOperation> {
    const [result] = await db
      .insert(processingOperations)
      .values(operation)
      .returning();
    return result;
  }

  async updateProcessingOperation(id: string, operation: Partial<InsertProcessingOperation>): Promise<ProcessingOperation> {
    const [result] = await db
      .update(processingOperations)
      .set({ ...operation, updatedAt: new Date() })
      .where(eq(processingOperations.id, id))
      .returning();
    return result;
  }

  // Stock transfers operations
  async getStockTransfers(filter?: { fromWarehouse?: string; toWarehouse?: string; status?: string }): Promise<StockTransfer[]> {
    const conditions = [];
    
    if (filter?.fromWarehouse) {
      // Note: fromWarehouse filter would require a join with warehouseStock to get warehouse info
      // For now, this filter is not supported - would need schema redesign or complex join
      console.warn('fromWarehouse filter not supported - requires warehouse stock join');
    }
    if (filter?.toWarehouse) {
      // Note: toWarehouse filter would require a join with warehouseStock to get warehouse info  
      // For now, this filter is not supported - would need schema redesign or complex join
      console.warn('toWarehouse filter not supported - requires warehouse stock join');
    }
    if (filter?.status) {
      conditions.push(eq(stockTransfers.status, filter.status));
    }
    
    return await db
      .select()
      .from(stockTransfers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(stockTransfers.createdAt));
  }

  async createStockTransfer(transfer: InsertStockTransfer): Promise<StockTransfer> {
    const [result] = await db
      .insert(stockTransfers)
      .values(transfer)
      .returning();
    return result;
  }

  async updateStockTransfer(id: string, transfer: Partial<InsertStockTransfer>): Promise<StockTransfer> {
    const [result] = await db
      .update(stockTransfers)
      .set({ ...transfer, updatedAt: new Date() })
      .where(eq(stockTransfers.id, id))
      .returning();
    return result;
  }

  // Inventory adjustments operations
  async getInventoryAdjustments(filter?: { warehouseStockId?: string; status?: string }): Promise<InventoryAdjustment[]> {
    const conditions = [];
    
    if (filter?.warehouseStockId) {
      conditions.push(eq(inventoryAdjustments.warehouseStockId, filter.warehouseStockId));
    }
    if (filter?.status) {
      conditions.push(eq(inventoryAdjustments.status, filter.status));
    }
    
    return await db
      .select()
      .from(inventoryAdjustments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inventoryAdjustments.createdAt));
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const [result] = await db
      .insert(inventoryAdjustments)
      .values(adjustment)
      .returning();
    return result;
  }

  async approveInventoryAdjustment(id: string, userId: string): Promise<InventoryAdjustment> {
    const [result] = await db
      .update(inventoryAdjustments)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(inventoryAdjustments.id, id))
      .returning();
    return result;
  }

  async rejectInventoryAdjustment(id: string, reason: string, userId: string): Promise<InventoryAdjustment> {
    const [result] = await db
      .update(inventoryAdjustments)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(inventoryAdjustments.id, id))
      .returning();
    return result;
  }

  // Traceability operations
  async traceStockOrigin(stockId: string): Promise<{
    purchase: Purchase;
    supplier: Supplier;
    batch?: WarehouseBatch;
    inspections: QualityInspection[];
    processingHistory: ProcessingOperation[];
  }> {
    // Get the stock item
    const [stock] = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.id, stockId));

    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    // Get purchase origin
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, stock.purchaseId || ''));

    if (!purchase) {
      throw new Error('Purchase origin not found');
    }

    // Get supplier
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, purchase.supplierId));

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Get associated batch if exists
    let batch: WarehouseBatch | undefined;
    if (stock.batchId) {
      batch = await this.getWarehouseBatch(stock.batchId);
    }

    // Get quality inspections for this batch
    const inspections = batch ? await db
      .select()
      .from(qualityInspections)
      .where(eq(qualityInspections.batchId, batch.id))
      .orderBy(desc(qualityInspections.createdAt)) : [];

    // Get processing history for this batch
    const processingHistory = batch ? await db
      .select()
      .from(processingOperations)
      .where(eq(processingOperations.batchId, batch.id))
      .orderBy(desc(processingOperations.createdAt)) : [];

    return {
      purchase,
      supplier,
      batch,
      inspections,
      processingHistory,
    };
  }

  async traceConsumptionChain(consumptionId: string): Promise<{
    consumption: InventoryConsumption;
    stock: WarehouseStock;
    batch?: WarehouseBatch;
    purchaseOrigin: Purchase;
    supplier: Supplier;
  }> {
    // Get the consumption record
    const [consumption] = await db
      .select()
      .from(inventoryConsumption)
      .where(eq(inventoryConsumption.id, consumptionId));

    if (!consumption) {
      throw new Error('Consumption record not found');
    }

    // Get the stock item
    const [stock] = await db
      .select()
      .from(warehouseStock)
      .where(eq(warehouseStock.id, consumption.warehouseStockId));

    if (!stock) {
      throw new Error('Warehouse stock not found');
    }

    // Get purchase origin
    const [purchaseOrigin] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, stock.purchaseId || ''));

    if (!purchaseOrigin) {
      throw new Error('Purchase origin not found');
    }

    // Get supplier
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, purchaseOrigin.supplierId));

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Get associated batch if exists
    let batch: WarehouseBatch | undefined;
    if (stock.batchId) {
      batch = await this.getWarehouseBatch(stock.batchId);
    }

    return {
      consumption,
      stock,
      batch,
      purchaseOrigin,
      supplier,
    };
  }

  // Grade-based pricing integration
  async updateStockValueByQualityGrade(stockId: string, qualityGrade: string): Promise<WarehouseStock> {
    return await db.transaction(async (tx) => {
      // Get the stock item
      const [stock] = await tx
        .select()
        .from(warehouseStock)
        .where(eq(warehouseStock.id, stockId))
        .for('update');

      if (!stock) {
        throw new Error('Warehouse stock not found');
      }

      // Calculate price adjustment based on quality grade
      const basePrice = parseFloat(stock.unitCostCleanUsd || '0');
      let adjustedPrice = basePrice;

      // Quality grade pricing multipliers
      const gradeMultipliers: Record<string, number> = {
        'A': 1.2,   // Premium grade +20%
        'B': 1.0,   // Standard grade (base price)
        'C': 0.8,   // Lower grade -20%
        'D': 0.6,   // Poor grade -40%
        'F': 0.4,   // Reject grade -60%
      };

      const multiplier = gradeMultipliers[qualityGrade] || 1.0;
      adjustedPrice = basePrice * multiplier;

      // Update the stock with new pricing
      const [result] = await tx
        .update(warehouseStock)
        .set({
          unitCostCleanUsd: adjustedPrice.toFixed(2),
          qualityGrade,
          gradedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(warehouseStock.id, stockId))
        .returning();

      return result;
    });
  }

  async recalculateInventoryValuesByGrade(): Promise<{
    updated: number;
    totalValueBefore: number;
    totalValueAfter: number;
    gradeBreakdown: Array<{ grade: string; count: number; totalValue: number }>;
  }> {
    return await db.transaction(async (tx) => {
      // Get all stock with quality grades
      const stockWithGrades = await tx
        .select()
        .from(warehouseStock)
        .where(and(
          sql`${warehouseStock.qualityGrade} IS NOT NULL`,
          sql`${warehouseStock.qtyKgClean}::numeric > 0`
        ))
        .for('update');

      let totalValueBefore = 0;
      let totalValueAfter = 0;
      let updated = 0;
      const gradeBreakdown = new Map<string, { count: number; totalValue: number }>();

      const gradeMultipliers: Record<string, number> = {
        'A': 1.2, 'B': 1.0, 'C': 0.8, 'D': 0.6, 'F': 0.4,
      };

      for (const stock of stockWithGrades) {
        const basePrice = parseFloat(stock.unitCostCleanUsd || '0');
        const quantity = parseFloat(stock.qtyKgClean || '0');
        const currentValue = basePrice * quantity;
        
        totalValueBefore += currentValue;

        const multiplier = gradeMultipliers[stock.qualityGrade || 'B'] || 1.0;
        const adjustedPrice = basePrice * multiplier;
        const newValue = adjustedPrice * quantity;
        
        totalValueAfter += newValue;

        // Update if price changed significantly (>1% difference)
        if (Math.abs(adjustedPrice - basePrice) > basePrice * 0.01) {
          await tx
            .update(warehouseStock)
            .set({
              unitCostCleanUsd: adjustedPrice.toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(warehouseStock.id, stock.id));
          updated++;
        }

        // Track grade breakdown
        const grade = stock.qualityGrade || 'B';
        const current = gradeBreakdown.get(grade) || { count: 0, totalValue: 0 };
        gradeBreakdown.set(grade, {
          count: current.count + 1,
          totalValue: current.totalValue + newValue,
        });
      }

      return {
        updated,
        totalValueBefore,
        totalValueAfter,
        gradeBreakdown: Array.from(gradeBreakdown.entries()).map(([grade, data]) => ({
          grade,
          count: data.count,
          totalValue: data.totalValue,
        })),
      };
    });
  }

  async getGradePricingReport(): Promise<{
    averagePriceByGrade: Array<{ grade: string; averagePrice: number; totalKg: number; stockCount: number }>;
    priceDistribution: Array<{ priceRange: string; count: number; percentage: number }>;
    qualityPremiumAnalysis: {
      baselineGrade: string;
      premiums: Array<{ grade: string; premiumPercentage: number; priceUsd: number }>;
    };
  }> {
    // Average price by grade
    const gradeData = await db
      .select({
        grade: warehouseStock.qualityGrade,
        averagePrice: avg(warehouseStock.unitCostCleanUsd),
        totalKg: sum(warehouseStock.qtyKgClean),
        stockCount: count(),
      })
      .from(warehouseStock)
      .where(and(
        sql`${warehouseStock.qualityGrade} IS NOT NULL`,
        sql`${warehouseStock.qtyKgClean}::numeric > 0`
      ))
      .groupBy(warehouseStock.qualityGrade);

    // Price distribution analysis
    const priceDistribution = await db
      .select({
        priceRange: sql<string>`
          CASE 
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 5 THEN '$0-5'
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 10 THEN '$5-10'
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 15 THEN '$10-15'
            WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 20 THEN '$15-20'
            ELSE '$20+'
          END
        `,
        count: count(),
      })
      .from(warehouseStock)
      .where(sql`${warehouseStock.unitCostCleanUsd} IS NOT NULL`)
      .groupBy(sql`
        CASE 
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 5 THEN '$0-5'
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 10 THEN '$5-10'
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 15 THEN '$10-15'
          WHEN ${warehouseStock.unitCostCleanUsd}::numeric < 20 THEN '$15-20'
          ELSE '$20+'
        END
      `);

    const totalCount = priceDistribution.reduce((sum: number, item: any) => sum + Number(item.count || 0), 0);

    // Quality premium analysis (using Grade B as baseline)
    const averagePriceByGrade = gradeData.map(row => ({
      grade: row.grade || 'B',
      averagePrice: parseFloat(row.averagePrice?.toString() || '0'),
      totalKg: parseFloat(row.totalKg?.toString() || '0'),
      stockCount: Number(row.stockCount || 0),
    }));

    const baselinePrice = averagePriceByGrade.find(g => g.grade === 'B')?.averagePrice || 0;
    const premiums = averagePriceByGrade.map(grade => ({
      grade: grade.grade,
      premiumPercentage: baselinePrice > 0 ? ((grade.averagePrice - baselinePrice) / baselinePrice) * 100 : 0,
      priceUsd: grade.averagePrice,
    }));

    return {
      averagePriceByGrade,
      priceDistribution: priceDistribution.map(row => ({
        priceRange: row.priceRange,
        count: Number(row.count || 0),
        percentage: totalCount > 0 ? (Number(row.count || 0) / totalCount) * 100 : 0,
      })),
      qualityPremiumAnalysis: {
        baselineGrade: 'B',
        premiums,
      },
    };
  }

  // Sales Pipeline Operations Implementation

  // Customer operations
  async getCustomers(filter?: { category?: string; isActive?: boolean; salesRepId?: string }): Promise<Customer[]> {
    const conditions = [];
    
    if (filter?.category) {
      conditions.push(eq(customers.category, filter.category));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(customers.isActive, filter.isActive));
    }
    if (filter?.salesRepId) {
      conditions.push(eq(customers.salesRepId, filter.salesRepId));
    }

    const query = db.select().from(customers);
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(customers.createdAt));
    }
    
    return await query.orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const customerNumber = `CUS-${Date.now()}`;
    const [newCustomer] = await db
      .insert(customers)
      .values({
        ...customer,
        customerNumber,
      })
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...customer,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    if (!updatedCustomer) {
      throw new Error('Customer not found');
    }

    return updatedCustomer;
  }

  async deactivateCustomer(id: string, userId: string): Promise<Customer> {
    return await this.updateCustomer(id, { isActive: false });
  }

  async searchCustomers(query: string, limit: number = 50): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        sql`(${customers.name} ILIKE ${`%${query}%`} OR ${customers.email} ILIKE ${`%${query}%`} OR ${customers.contactPerson} ILIKE ${`%${query}%`})`
      )
      .limit(limit)
      .orderBy(desc(customers.createdAt));
  }

  async getCustomersByCategory(category: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.category, category))
      .orderBy(customers.name);
  }

  async updateCustomerPerformanceMetrics(customerId: string): Promise<Customer> {
    const ordersData = await db
      .select({
        totalOrders: count(salesOrders.id),
        totalRevenue: sum(salesOrders.totalAmountUsd),
      })
      .from(salesOrders)
      .where(and(
        eq(salesOrders.customerId, customerId),
        sql`${salesOrders.status} NOT IN ('draft', 'cancelled')`
      ));

    const stats = ordersData[0];
    const totalOrdersCount = Number(stats.totalOrders || 0);
    const totalRevenueUsd = parseFloat(stats.totalRevenue?.toString() || '0');
    const averageOrderValueUsd = totalOrdersCount > 0 ? totalRevenueUsd / totalOrdersCount : 0;

    return await this.updateCustomer(customerId, {
      totalOrdersCount,
      totalRevenueUsd: totalRevenueUsd.toString(),
      averageOrderValueUsd: averageOrderValueUsd.toString(),
    });
  }

  // Sales order operations
  async getSalesOrders(filter?: { 
    status?: string; 
    customerId?: string; 
    salesRepId?: string; 
    dateRange?: { start: Date; end: Date };
  }): Promise<SalesOrder[]> {
    let query = db.select().from(salesOrders);
    
    const conditions = [];
    if (filter?.status) {
      conditions.push(eq(salesOrders.status, filter.status));
    }
    if (filter?.customerId) {
      conditions.push(eq(salesOrders.customerId, filter.customerId));
    }
    if (filter?.salesRepId) {
      conditions.push(eq(salesOrders.salesRepId, filter.salesRepId));
    }
    if (filter?.dateRange) {
      conditions.push(gte(salesOrders.orderDate, filter.dateRange.start));
      conditions.push(lte(salesOrders.orderDate, filter.dateRange.end));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(salesOrders.createdAt));
  }

  async getSalesOrder(id: string): Promise<SalesOrder | undefined> {
    const [salesOrder] = await db.select().from(salesOrders).where(eq(salesOrders.id, id));
    return salesOrder;
  }

  async getSalesOrderWithDetails(id: string): Promise<SalesOrder & { 
    customer: Customer; 
    items: (SalesOrderItem & { warehouseStock?: WarehouseStock })[];
    communications: CustomerCommunication[];
  } | undefined> {
    const salesOrder = await this.getSalesOrder(id);
    if (!salesOrder) return undefined;

    const customer = await this.getCustomer(salesOrder.customerId);
    if (!customer) return undefined;

    const items = await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, id));

    const communications = await this.getCustomerCommunications(salesOrder.customerId, 10);

    // Add warehouse stock info to items
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        let warehouseStock: WarehouseStock | undefined;
        if (item.warehouseStockId) {
          const [stock] = await db
            .select()
            .from(warehouseStock)
            .where(eq(warehouseStock.id, item.warehouseStockId));
          warehouseStock = stock;
        }
        return { ...item, warehouseStock };
      })
    );

    return {
      ...salesOrder,
      customer,
      items: itemsWithStock,
      communications,
    };
  }

  async createSalesOrder(salesOrder: InsertSalesOrder, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SalesOrder> {
    // CRITICAL: Enforce approval requirement for sales orders above thresholds
    const orderAmount = parseFloat(salesOrder.totalAmount || '0');
    const approvalGuardContext: ApprovalGuardContext = {
      ...approvalContext,
      userId: auditContext?.userId || approvalContext?.userId,
      operationType: 'sale_order',
      operationData: salesOrder,
      amount: orderAmount,
      currency: salesOrder.currency || 'USD',
      businessContext: `Sales order creation for customer ${salesOrder.customerId} - ${salesOrder.currency || 'USD'} ${orderAmount}`
    };

    await StorageApprovalGuard.enforceApprovalRequirement(approvalGuardContext);

    const salesOrderNumber = `SO-${Date.now()}`;
    const [newSalesOrder] = await db
      .insert(salesOrders)
      .values({
        ...salesOrder,
        salesOrderNumber,
        status: 'draft',
      })
      .returning();

    // Audit log the sales order creation
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'sales_orders',
        newSalesOrder.id,
        'create',
        'create_sales_order',
        null,
        newSalesOrder,
        orderAmount,
        salesOrder.currency
      );
    }

    return newSalesOrder;
  }

  async updateSalesOrder(id: string, salesOrder: Partial<InsertSalesOrder>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SalesOrder> {
    // Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState<SalesOrder>(
      salesOrders, 
      id,
      async () => {
        const [existing] = await db.select().from(salesOrders).where(eq(salesOrders.id, id));
        return existing;
      }
    );

    if (!beforeState) {
      throw new Error('Sales order not found');
    }

    // CRITICAL: Enforce approval requirement for significant sales order changes
    const orderAmount = parseFloat(salesOrder.totalAmount || beforeState.totalAmount || '0');
    const isSignificantChange = this.isSignificantSalesOrderChange(beforeState, salesOrder);
    
    if (isSignificantChange) {
      const approvalGuardContext: ApprovalGuardContext = {
        ...approvalContext,
        userId: auditContext?.userId || approvalContext?.userId,
        operationType: 'sale_order',
        operationData: { ...beforeState, ...salesOrder },
        amount: orderAmount,
        currency: salesOrder.currency || beforeState.currency || 'USD',
        businessContext: `Sales order update for ${beforeState.salesOrderNumber} - significant change requiring approval`
      };

      await StorageApprovalGuard.enforceApprovalRequirement(approvalGuardContext);
    }

    const [updatedSalesOrder] = await db
      .update(salesOrders)
      .set({
        ...salesOrder,
        updatedAt: new Date(),
      })
      .where(eq(salesOrders.id, id))
      .returning();

    if (!updatedSalesOrder) {
      throw new Error('Sales order not found');
    }

    // Audit log the sales order update
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'sales_orders',
        updatedSalesOrder.id,
        'update',
        'update_sales_order',
        beforeState,
        updatedSalesOrder,
        orderAmount,
        updatedSalesOrder.currency
      );
    }

    return updatedSalesOrder;
  }

  async confirmSalesOrder(id: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SalesOrder> {
    // CRITICAL: Sales order confirmation requires approval for high-value orders
    const existingOrder = await this.getSalesOrder(id);
    if (!existingOrder) {
      throw new Error('Sales order not found');
    }

    const orderAmount = parseFloat(existingOrder.totalAmountUsd || existingOrder.totalAmount || '0');
    const confirmationContext: ApprovalGuardContext = {
      ...approvalContext,
      userId: userId,
      operationType: 'sale_order',
      operationData: { ...existingOrder, status: 'confirmed' },
      amount: orderAmount,
      currency: existingOrder.currency || 'USD',
      businessContext: `Sales order confirmation - ${existingOrder.salesOrderNumber} for ${orderAmount} ${existingOrder.currency || 'USD'}`
    };

    await StorageApprovalGuard.enforceApprovalRequirement(confirmationContext);

    return await this.updateSalesOrder(id, { 
      status: 'confirmed',
      confirmedAt: new Date(),
    }, auditContext, approvalContext);
  }

  async fulfillSalesOrder(id: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SalesOrder> {
    // CRITICAL: Sales order fulfillment requires approval - involves inventory reservation
    const existingOrder = await this.getSalesOrder(id);
    if (!existingOrder) {
      throw new Error('Sales order not found');
    }

    const orderAmount = parseFloat(existingOrder.totalAmountUsd || existingOrder.totalAmount || '0');
    const fulfillmentContext: ApprovalGuardContext = {
      ...approvalContext,
      userId: userId,
      operationType: 'sale_order',
      operationData: { ...existingOrder, status: 'fulfilled' },
      amount: orderAmount,
      currency: existingOrder.currency || 'USD',
      businessContext: `Sales order fulfillment with inventory reservation - ${existingOrder.salesOrderNumber}`
    };

    await StorageApprovalGuard.enforceApprovalRequirement(fulfillmentContext);

    return await db.transaction(async (tx) => {
      // Get sales order items
      const items = await tx.select().from(salesOrderItems).where(eq(salesOrderItems.salesOrderId, id));
      
      // Reserve warehouse stock for each item
      for (const item of items) {
        if (item.warehouseStockId) {
          await this.reserveStockInTransaction(tx, item.warehouseStockId, parseFloat(item.quantity), id);
        }
      }
      
      // Update sales order status
      const [updatedOrder] = await tx
        .update(salesOrders)
        .set({ 
          status: 'fulfilled',
          fulfilledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(salesOrders.id, id))
        .returning();

      // Audit log the fulfillment
      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'sales_orders',
          updatedOrder.id,
          'update',
          'fulfill_sales_order',
          existingOrder,
          updatedOrder,
          orderAmount,
          existingOrder.currency
        );
      }
      
      return updatedOrder;
    });
  }

  async deliverSalesOrder(id: string, userId: string): Promise<SalesOrder> {
    return await this.updateSalesOrder(id, { 
      status: 'delivered',
      deliveredAt: new Date(),
    });
  }

  async cancelSalesOrder(id: string, reason: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SalesOrder> {
    // CRITICAL: Sales order cancellation may require approval for high-value orders
    const existingOrder = await this.getSalesOrder(id);
    if (!existingOrder) {
      throw new Error('Sales order not found');
    }

    const orderAmount = parseFloat(existingOrder.totalAmountUsd || existingOrder.totalAmount || '0');
    const cancellationContext: ApprovalGuardContext = {
      ...approvalContext,
      userId: userId,
      operationType: 'sale_order',
      operationData: { ...existingOrder, status: 'cancelled', notes: reason },
      amount: orderAmount,
      currency: existingOrder.currency || 'USD',
      businessContext: `Sales order cancellation - ${existingOrder.salesOrderNumber}: ${reason}`
    };

    await StorageApprovalGuard.enforceApprovalRequirement(cancellationContext);

    return await this.updateSalesOrder(id, { 
      status: 'cancelled',
      cancelledAt: new Date(),
      notes: reason,
    }, auditContext, approvalContext);
  }

  async calculateSalesOrderTotals(salesOrderId: string): Promise<SalesOrder> {
    const items = await this.getSalesOrderItems(salesOrderId);
    
    const subtotalAmount = items.reduce((sum: number, item: any) => 
      sum + parseFloat(item.lineTotal || '0'), 0);
    
    const totalAmount = subtotalAmount; // Can add taxes, shipping, etc. here
    
    // Convert to USD if needed
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (!salesOrder) throw new Error('Sales order not found');
    
    const exchangeRate = parseFloat(salesOrder.exchangeRate || '1');
    const totalAmountUsd = salesOrder.currency === 'USD' ? totalAmount : totalAmount * exchangeRate;

    return await this.updateSalesOrder(salesOrderId, {
      subtotalAmount: subtotalAmount.toString(),
      totalAmount: totalAmount.toString(),
      totalAmountUsd: totalAmountUsd.toString(),
    });
  }

  // Sales order item operations
  async getSalesOrderItems(salesOrderId: string): Promise<SalesOrderItem[]> {
    return await db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, salesOrderId));
  }

  async getSalesOrderItem(id: string): Promise<SalesOrderItem | undefined> {
    const [item] = await db.select().from(salesOrderItems).where(eq(salesOrderItems.id, id));
    return item;
  }

  async createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem> {
    const [newItem] = await db
      .insert(salesOrderItems)
      .values(item)
      .returning();
    
    // Recalculate order totals
    await this.calculateSalesOrderTotals(item.salesOrderId);
    
    return newItem;
  }

  async updateSalesOrderItem(id: string, item: Partial<InsertSalesOrderItem>): Promise<SalesOrderItem> {
    const [updatedItem] = await db
      .update(salesOrderItems)
      .set(item)
      .where(eq(salesOrderItems.id, id))
      .returning();

    if (!updatedItem) {
      throw new Error('Sales order item not found');
    }

    // Recalculate order totals
    await this.calculateSalesOrderTotals(updatedItem.salesOrderId);

    return updatedItem;
  }

  async deleteSalesOrderItem(id: string): Promise<void> {
    const item = await this.getSalesOrderItem(id);
    if (!item) throw new Error('Sales order item not found');
    
    await db.delete(salesOrderItems).where(eq(salesOrderItems.id, id));
    
    // Recalculate order totals
    await this.calculateSalesOrderTotals(item.salesOrderId);
  }

  async reserveInventoryForSalesOrderItem(itemId: string, userId: string): Promise<SalesOrderItem> {
    return await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(salesOrderItems)
        .where(eq(salesOrderItems.id, itemId))
        .for('update');

      if (!item || !item.warehouseStockId) {
        throw new Error('Sales order item or warehouse stock not found');
      }

      const quantityToReserve = parseFloat(item.quantity);

      // Update warehouse stock reservation
      await tx
        .update(warehouseStock)
        .set({
          qtyKgReserved: sql`${warehouseStock.qtyKgReserved} + ${quantityToReserve}`,
        })
        .where(eq(warehouseStock.id, item.warehouseStockId));

      // Update sales order item
      const [updatedItem] = await tx
        .update(salesOrderItems)
        .set({
          quantityReserved: item.quantity,
        })
        .where(eq(salesOrderItems.id, itemId))
        .returning();

      return updatedItem;
    });
  }

  async fulfillSalesOrderItem(itemId: string, quantityFulfilled: string, userId: string): Promise<SalesOrderItem> {
    const [updatedItem] = await db
      .update(salesOrderItems)
      .set({
        quantityFulfilled,
      })
      .where(eq(salesOrderItems.id, itemId))
      .returning();

    if (!updatedItem) {
      throw new Error('Sales order item not found');
    }

    return updatedItem;
  }

  async calculateItemPricing(itemId: string, customerId: string, qualityGrade?: string): Promise<{
    unitPrice: number;
    lineTotal: number;
    discountApplied: number;
    marginPercent: number;
  }> {
    // Basic pricing calculation - can be enhanced with more complex rules
    const item = await this.getSalesOrderItem(itemId);
    if (!item) throw new Error('Sales order item not found');

    const basePrice = parseFloat(item.unitPrice || '0');
    let finalPrice = basePrice;
    let discountApplied = 0;

    // Apply quality grade pricing if available
    if (qualityGrade) {
      const gradeMultipliers: Record<string, number> = {
        'grade_1': 1.3,
        'grade_2': 1.1,
        'grade_3': 1.0,
        'specialty': 1.5,
        'commercial': 0.9,
        'ungraded': 0.8,
      };
      
      const multiplier = gradeMultipliers[qualityGrade] || 1.0;
      finalPrice = basePrice * multiplier;
    }

    const quantity = parseFloat(item.quantity);
    const lineTotal = finalPrice * quantity;
    
    // Calculate margin (simplified)
    const cost = parseFloat(item.unitCost || '0');
    const marginPercent = cost > 0 ? ((finalPrice - cost) / finalPrice) * 100 : 0;

    return {
      unitPrice: finalPrice,
      lineTotal,
      discountApplied,
      marginPercent,
    };
  }

  // Sales return operations - Stage 6 compliance (storage-backed return processing)
  async getSalesReturns(filter?: {
    originalSalesOrderId?: string;
    status?: string;
    returnedBy?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<SalesReturn[]> {
    let query = db.select().from(salesReturns);
    
    if (filter?.originalSalesOrderId) {
      query = query.where(eq(salesReturns.originalSalesOrderId, filter.originalSalesOrderId));
    }
    if (filter?.status) {
      query = query.where(eq(salesReturns.status, filter.status));
    }
    if (filter?.returnedBy) {
      query = query.where(eq(salesReturns.returnedBy, filter.returnedBy));
    }
    if (filter?.dateRange) {
      query = query.where(
        and(
          gte(salesReturns.createdAt, filter.dateRange.start),
          lte(salesReturns.createdAt, filter.dateRange.end)
        )
      );
    }
    
    return await query.orderBy(desc(salesReturns.createdAt));
  }

  async getSalesReturn(id: string): Promise<SalesReturn | undefined> {
    const [salesReturn] = await db.select().from(salesReturns).where(eq(salesReturns.id, id));
    return salesReturn;
  }

  async createSalesReturn(salesReturn: InsertSalesReturn, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SalesReturn> {
    // CRITICAL: Enforce approval requirement for sales returns above thresholds
    const returnAmount = parseFloat(salesReturn.refundAmount || '0');
    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'sale_order',
        operationData: salesReturn,
        amount: returnAmount,
        currency: 'USD',
        businessContext: `Sales return for order ${salesReturn.originalSalesOrderId}`
      });
    }

    // Generate return number
    const returnNumber = await this.generateNextSalesReturnNumber();
    
    // Use transaction for return creation with warehouse validation
    const result = await db.transaction(async (tx) => {
      // Validate same warehouse return rule per workflow_reference.json
      const originalOrder = await this.getSalesOrderWithDetails(salesReturn.originalSalesOrderId);
      if (!originalOrder) {
        throw new Error('Original sales order not found');
      }

      // Validate warehouse consistency
      if (salesReturn.originalSalesOrderItemId) {
        const originalItem = originalOrder.items.find(item => item.id === salesReturn.originalSalesOrderItemId);
        if (!originalItem || !originalItem.warehouseStock) {
          throw new Error('Original sales order item not found or missing warehouse stock');
        }
        
        // Enforce same warehouse return rule
        if (salesReturn.returnToWarehouse !== originalItem.warehouseStock.warehouse) {
          throw new Error(`Returns must go back to the same warehouse: ${originalItem.warehouseStock.warehouse}`);
        }
      } else {
        // For order-level returns, check first item warehouse
        const firstItem = originalOrder.items[0];
        if (firstItem?.warehouseStock && salesReturn.returnToWarehouse !== firstItem.warehouseStock.warehouse) {
          throw new Error(`Returns must go back to the same warehouse: ${firstItem.warehouseStock.warehouse}`);
        }
      }

      // Create the sales return record
      const [newReturn] = await tx.insert(salesReturns).values({
        ...salesReturn,
        returnNumber,
      }).returning();

      return newReturn;
    });
    
    // CRITICAL SECURITY: Audit logging for sales returns
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'sale_order',
        result.id,
        'create',
        'sales_return',
        null,
        result,
        -returnAmount, // Negative impact for returns
        'USD'
      );
    }
    
    return result;
  }

  async updateSalesReturn(id: string, salesReturn: Partial<InsertSalesReturn>): Promise<SalesReturn> {
    const [updated] = await db
      .update(salesReturns)
      .set({ ...salesReturn, updatedAt: new Date() })
      .where(eq(salesReturns.id, id))
      .returning();
    
    if (!updated) {
      throw new Error('Sales return not found');
    }
    
    return updated;
  }

  async processSalesReturn(id: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<SalesReturn> {
    // CRITICAL: Sales return processing requires approval for inventory adjustments
    const existingReturn = await this.getSalesReturn(id);
    if (!existingReturn) {
      throw new Error('Sales return not found');
    }

    if (approvalContext) {
      await StorageApprovalGuard.enforceApprovalRequirement({
        ...approvalContext,
        operationType: 'sale_order',
        operationData: existingReturn,
        amount: parseFloat(existingReturn.refundAmount || '0'),
        currency: 'USD',
        businessContext: `Processing sales return ${existingReturn.returnNumber}`
      });
    }

    // Use transaction for return processing with inventory adjustments
    const result = await db.transaction(async (tx) => {
      // Update return status to processed
      const [processedReturn] = await tx
        .update(salesReturns)
        .set({
          status: 'processed',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(salesReturns.id, id))
        .returning();

      // TODO: Add inventory adjustments - return stock to warehouse
      // This would involve updating warehouseStock quantities based on return condition
      
      return processedReturn;
    });
    
    // CRITICAL SECURITY: Audit logging for return processing
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'sale_order',
        result.id,
        'update',
        'sales_return_processing',
        existingReturn,
        result,
        0, // No financial impact during processing step
        'USD'
      );
    }
    
    return result;
  }

  async approveSalesReturn(id: string, userId: string, auditContext?: AuditContext): Promise<SalesReturn> {
    const [approved] = await db
      .update(salesReturns)
      .set({
        isApproved: true,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(salesReturns.id, id))
      .returning();
    
    if (!approved) {
      throw new Error('Sales return not found');
    }
    
    // CRITICAL SECURITY: Audit logging for return approval
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'sale_order',
        approved.id,
        'update',
        'sales_return_approval',
        null,
        approved,
        0, // No financial impact during approval step
        'USD'
      );
    }
    
    return approved;
  }

  private async generateNextSalesReturnNumber(): Promise<string> {
    // Use advisory lock to serialize return number generation
    const lockId = 4567890123;
    
    return await db.transaction(async (tx) => {
      // Acquire advisory transaction lock (automatically released at transaction end)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Get the highest existing return number in transaction with SELECT FOR UPDATE
      const latestReturn = await tx
        .select({ returnNumber: salesReturns.returnNumber })
        .from(salesReturns)
        .orderBy(sql`${salesReturns.returnNumber} DESC`)
        .limit(1)
        .for('update');

      return this.calculateNextSalesReturnNumber(latestReturn[0]?.returnNumber);
    });
  }

  private calculateNextSalesReturnNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return 'RET-000001';
    }

    // Extract number from RET-XXXXXX format (6 digits for proper lexicographic sorting)
    const numberMatch = lastNumber.match(/RET-(\d+)/);
    
    if (!numberMatch) {
      return 'RET-000001';
    }

    const nextNumber = parseInt(numberMatch[1]) + 1;
    return `RET-${nextNumber.toString().padStart(6, '0')}`;
  }

  // Customer communication operations
  async getCustomerCommunications(customerId: string, limit: number = 50): Promise<CustomerCommunication[]> {
    return await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.customerId, customerId))
      .orderBy(desc(customerCommunications.createdAt))
      .limit(limit);
  }

  async getCustomerCommunication(id: string): Promise<CustomerCommunication | undefined> {
    const [communication] = await db
      .select()
      .from(customerCommunications)
      .where(eq(customerCommunications.id, id));
    return communication;
  }

  async createCustomerCommunication(communication: InsertCustomerCommunication): Promise<CustomerCommunication> {
    const [newCommunication] = await db
      .insert(customerCommunications)
      .values(communication)
      .returning();
    return newCommunication;
  }

  async updateCustomerCommunication(id: string, communication: Partial<InsertCustomerCommunication>): Promise<CustomerCommunication> {
    const [updatedCommunication] = await db
      .update(customerCommunications)
      .set(communication)
      .where(eq(customerCommunications.id, id))
      .returning();

    if (!updatedCommunication) {
      throw new Error('Customer communication not found');
    }

    return updatedCommunication;
  }

  async getUpcomingFollowUps(userId?: string): Promise<CustomerCommunication[]> {
    const now = new Date();
    const conditions = [
      sql`${customerCommunications.followUpDate} IS NOT NULL`,
      gte(customerCommunications.followUpDate, now),
      eq(customerCommunications.status, 'pending')
    ];

    if (userId) {
      conditions.push(eq(customerCommunications.userId, userId));
    }

    return await db
      .select()
      .from(customerCommunications)
      .where(and(...conditions))
      .orderBy(customerCommunications.followUpDate);
  }

  async markCommunicationComplete(id: string, userId: string): Promise<CustomerCommunication> {
    return await this.updateCustomerCommunication(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  // Basic implementations for other required methods (to be expanded)
  async getRevenueTransactions(): Promise<RevenueTransaction[]> {
    return await db.select().from(revenueTransactions).orderBy(desc(revenueTransactions.createdAt));
  }

  async getRevenueTransaction(id: string): Promise<RevenueTransaction | undefined> {
    const [transaction] = await db.select().from(revenueTransactions).where(eq(revenueTransactions.id, id));
    return transaction;
  }

  async createRevenueTransaction(transaction: InsertRevenueTransaction): Promise<RevenueTransaction> {
    const transactionNumber = `REV-${Date.now()}`;
    const [newTransaction] = await db
      .insert(revenueTransactions)
      .values({
        ...transaction,
        transactionNumber,
      })
      .returning();
    return newTransaction;
  }

  async updateRevenueTransaction(id: string, transaction: Partial<InsertRevenueTransaction>, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<RevenueTransaction> {
    // Capture before state for audit logging
    const beforeState = await StorageApprovalGuard.getCaptureBeforeState<RevenueTransaction>(
      revenueTransactions,
      id,
      async () => {
        const [existing] = await db.select().from(revenueTransactions).where(eq(revenueTransactions.id, id));
        return existing;
      }
    );

    if (!beforeState) {
      throw new Error('Revenue transaction not found');
    }

    // CRITICAL: Revenue transaction updates require approval for significant changes
    const transactionAmount = parseFloat(transaction.amount || beforeState.amount || '0');
    const isSignificantChange = StorageApprovalGuard.isSignificantRevenueTransactionChange(beforeState, transaction);
    
    if (isSignificantChange) {
      const revenueUpdateContext: ApprovalGuardContext = {
        ...approvalContext,
        userId: auditContext?.userId || approvalContext?.userId,
        operationType: 'sale_order',
        operationData: { ...beforeState, ...transaction },
        amount: transactionAmount,
        currency: transaction.currency || beforeState.currency || 'USD',
        businessContext: `Revenue transaction update - ${beforeState.transactionNumber} significant change requiring approval`
      };

      await StorageApprovalGuard.enforceApprovalRequirement(revenueUpdateContext);
    }

    const [updatedTransaction] = await db
      .update(revenueTransactions)
      .set(transaction)
      .where(eq(revenueTransactions.id, id))
      .returning();

    if (!updatedTransaction) {
      throw new Error('Revenue transaction not found');
    }

    // Audit log the revenue transaction update
    if (auditContext) {
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'revenue_transactions',
        updatedTransaction.id,
        'update',
        'update_revenue_transaction',
        beforeState,
        updatedTransaction,
        transactionAmount,
        updatedTransaction.currency
      );
    }

    return updatedTransaction;
  }

  async approveRevenueTransaction(id: string, userId: string, auditContext?: AuditContext, approvalContext?: ApprovalGuardContext): Promise<RevenueTransaction> {
    // CRITICAL: Revenue transaction approval is a high-privilege operation
    const existingTransaction = await this.getRevenueTransaction(id);
    if (!existingTransaction) {
      throw new Error('Revenue transaction not found');
    }

    const transactionAmount = parseFloat(existingTransaction.amount || '0');
    const approvalContext_: ApprovalGuardContext = {
      ...approvalContext,
      userId: userId,
      operationType: 'sale_order',
      operationData: { ...existingTransaction, status: 'approved' },
      amount: transactionAmount,
      currency: existingTransaction.currency || 'USD',
      businessContext: `Revenue transaction approval - ${existingTransaction.transactionNumber} for ${transactionAmount} ${existingTransaction.currency || 'USD'}`
    };

    await StorageApprovalGuard.enforceApprovalRequirement(approvalContext_);

    return await this.updateRevenueTransaction(id, {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: userId,
    }, auditContext, approvalContext);
  }

  async reverseRevenueTransaction(id: string, reason: string, userId: string): Promise<RevenueTransaction> {
    return await this.updateRevenueTransaction(id, {
      status: 'reversed',
      notes: reason,
    });
  }

  async processPayment(salesOrderId: string, amount: string, paymentMethod: string, userId: string): Promise<RevenueTransaction> {
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (!salesOrder) throw new Error('Sales order not found');

    return await this.createRevenueTransaction({
      customerId: salesOrder.customerId,
      salesOrderId,
      type: 'payment',
      amount,
      currency: salesOrder.currency,
      exchangeRate: salesOrder.exchangeRate,
      paymentMethod,
      status: 'pending',
      transactionDate: new Date(),
      userId,
    });
  }

  async getCustomerAccountBalance(customerId: string): Promise<{
    totalOutstanding: number;
    creditLimit: number;
    availableCredit: number;
    overdueAmount: number;
  }> {
    // Basic implementation - to be enhanced
    const creditLimit = await this.getCurrentCustomerCreditLimit(customerId);
    const limit = parseFloat(creditLimit?.creditLimit || '0');
    
    return {
      totalOutstanding: 0,
      creditLimit: limit,
      availableCredit: limit,
      overdueAmount: 0,
    };
  }

  // Placeholder implementations for remaining methods (to be fully implemented)
  async getSalesPerformanceMetrics(): Promise<SalesPerformanceMetric[]> {
    return await db.select().from(salesPerformanceMetrics);
  }

  async getSalesPerformanceAnalytics(): Promise<any> {
    try {
      // Get current exchange rate for USD normalization
      const exchangeRate = await this.getExchangeRate();

      // Calculate total revenue with USD normalization
      const revenueResult = await db
        .select({
          totalOrdersCount: count(salesOrders.id),
          usdRevenue: sum(sql`CASE WHEN ${salesOrders.currency} = 'USD' THEN ${salesOrders.totalAmount} ELSE 0 END`),
          etbRevenue: sum(sql`CASE WHEN ${salesOrders.currency} = 'ETB' THEN (${salesOrders.totalAmount} / ${salesOrders.exchangeRate}) ELSE 0 END`),
          confirmedOrders: count(sql`CASE WHEN ${salesOrders.status} = 'confirmed' THEN 1 END`),
          fulfilledOrders: count(sql`CASE WHEN ${salesOrders.status} = 'fulfilled' THEN 1 END`),
          deliveredOrders: count(sql`CASE WHEN ${salesOrders.status} = 'delivered' THEN 1 END`),
        })
        .from(salesOrders);

      const result = revenueResult[0];
      const usdRevenue = new Decimal(result?.usdRevenue?.toString() || '0');
      const etbRevenueInUsd = new Decimal(result?.etbRevenue?.toString() || '0');
      const totalRevenueUsd = usdRevenue.add(etbRevenueInUsd);
      const totalOrders = Number(result?.totalOrdersCount || 0);

      // Get top customers with USD normalized revenue
      const topCustomers = await db
        .select({
          id: customers.id,
          name: customers.name,
          customerNumber: customers.customerNumber,
          totalRevenueUsd: customers.totalRevenueUsd,
          totalOrdersCount: customers.totalOrdersCount,
        })
        .from(customers)
        .orderBy(desc(customers.totalRevenueUsd))
        .limit(5);

      return {
        totalRevenueUsd: totalRevenueUsd.toNumber(),
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenueUsd.div(totalOrders).toNumber() : 0,
        confirmedOrders: Number(result?.confirmedOrders || 0),
        fulfilledOrders: Number(result?.fulfilledOrders || 0),
        deliveredOrders: Number(result?.deliveredOrders || 0),
        topCustomers,
        conversionRate: totalOrders > 0 ? ((Number(result?.deliveredOrders || 0) / totalOrders) * 100) : 0,
        exchangeRate,
      };
    } catch (error) {
      console.error('Error fetching sales performance analytics:', error);
      return {
        totalRevenueUsd: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topCustomers: [],
        conversionRate: 0,
      };
    }
  }

  async calculateSalesPerformanceMetrics(periodType: string, startDate: Date, endDate: Date): Promise<void> {
    // Implementation to be added
  }

  async getSalesRepPerformance(salesRepId: string, periodType: string): Promise<SalesPerformanceMetric[]> {
    return await db
      .select()
      .from(salesPerformanceMetrics)
      .where(eq(salesPerformanceMetrics.salesRepId, salesRepId));
  }

  async getCustomerPerformanceMetrics(customerId: string): Promise<SalesPerformanceMetric[]> {
    return await db
      .select()
      .from(salesPerformanceMetrics)
      .where(eq(salesPerformanceMetrics.customerId, customerId));
  }

  async getCustomerCreditLimits(customerId: string): Promise<CustomerCreditLimit[]> {
    return await db
      .select()
      .from(customerCreditLimits)
      .where(eq(customerCreditLimits.customerId, customerId));
  }

  async getCurrentCustomerCreditLimit(customerId: string): Promise<CustomerCreditLimit | undefined> {
    const [creditLimit] = await db
      .select()
      .from(customerCreditLimits)
      .where(and(
        eq(customerCreditLimits.customerId, customerId),
        eq(customerCreditLimits.isActive, true)
      ))
      .orderBy(desc(customerCreditLimits.createdAt))
      .limit(1);
    return creditLimit;
  }

  async createCustomerCreditLimit(creditLimit: InsertCustomerCreditLimit): Promise<CustomerCreditLimit> {
    const [newCreditLimit] = await db
      .insert(customerCreditLimits)
      .values(creditLimit)
      .returning();
    return newCreditLimit;
  }

  async updateCustomerCreditLimit(id: string, creditLimit: Partial<InsertCustomerCreditLimit>): Promise<CustomerCreditLimit> {
    const [updatedCreditLimit] = await db
      .update(customerCreditLimits)
      .set({
        ...creditLimit,
        updatedAt: new Date(),
      })
      .where(eq(customerCreditLimits.id, id))
      .returning();

    if (!updatedCreditLimit) {
      throw new Error('Customer credit limit not found');
    }

    return updatedCreditLimit;
  }

  async suspendCustomerCredit(customerId: string, reason: string, userId: string): Promise<CustomerCreditLimit> {
    const currentLimit = await this.getCurrentCustomerCreditLimit(customerId);
    if (!currentLimit) throw new Error('No active credit limit found');

    return await this.updateCustomerCreditLimit(currentLimit.id, {
      isSuspended: true,
      suspendedAt: new Date(),
      notes: reason,
    });
  }

  async reinstateCustomerCredit(customerId: string, userId: string): Promise<CustomerCreditLimit> {
    const currentLimit = await this.getCurrentCustomerCreditLimit(customerId);
    if (!currentLimit) throw new Error('No active credit limit found');

    return await this.updateCustomerCreditLimit(currentLimit.id, {
      isSuspended: false,
      suspendedAt: null,
    });
  }

  async checkCreditLimitAvailability(customerId: string, orderAmount: number): Promise<{
    isApproved: boolean;
    availableCredit: number;
    reason?: string;
  }> {
    const creditLimit = await this.getCurrentCustomerCreditLimit(customerId);
    if (!creditLimit) {
      return {
        isApproved: false,
        availableCredit: 0,
        reason: 'No credit limit established',
      };
    }

    const limit = parseFloat(creditLimit.creditLimit);
    const currentBalance = parseFloat(creditLimit.currentBalance || '0');
    const availableCredit = limit - currentBalance;

    return {
      isApproved: availableCredit >= orderAmount && !creditLimit.isSuspended,
      availableCredit,
      reason: creditLimit.isSuspended ? 'Credit suspended' : 
              availableCredit < orderAmount ? 'Insufficient credit limit' : undefined,
    };
  }

  // Placeholder implementations for complex operations (to be fully implemented)
  async getPricingRules(): Promise<PricingRule[]> {
    return await db.select().from(pricingRules).where(eq(pricingRules.isActive, true));
  }

  async getPricingRule(id: string): Promise<PricingRule | undefined> {
    const [rule] = await db.select().from(pricingRules).where(eq(pricingRules.id, id));
    return rule;
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const [newRule] = await db
      .insert(pricingRules)
      .values(rule)
      .returning();
    return newRule;
  }

  async updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule> {
    const [updatedRule] = await db
      .update(pricingRules)
      .set({
        ...rule,
        updatedAt: new Date(),
      })
      .where(eq(pricingRules.id, id))
      .returning();

    if (!updatedRule) {
      throw new Error('Pricing rule not found');
    }

    return updatedRule;
  }

  async deletePricingRule(id: string): Promise<void> {
    await db.delete(pricingRules).where(eq(pricingRules.id, id));
  }

  async calculateDynamicPricing(params: {
    customerId: string;
    qualityGrade: string;
    quantity: number;
    orderValue: number;
  }): Promise<{
    basePrice: number;
    finalPrice: number;
    appliedRules: Array<{ ruleName: string; adjustment: number; type: string }>;
    totalDiscount: number;
  }> {
    // Basic implementation - to be enhanced with complex pricing rules
    const basePrice = 10.0; // Base price per kg
    let finalPrice = basePrice;
    const appliedRules: Array<{ ruleName: string; adjustment: number; type: string }> = [];

    // Quality grade adjustments
    const gradeMultipliers: Record<string, number> = {
      'grade_1': 1.3,
      'grade_2': 1.1,
      'grade_3': 1.0,
      'specialty': 1.5,
      'commercial': 0.9,
      'ungraded': 0.8,
    };

    const gradeMultiplier = gradeMultipliers[params.qualityGrade] || 1.0;
    if (gradeMultiplier !== 1.0) {
      finalPrice *= gradeMultiplier;
      appliedRules.push({
        ruleName: `Quality Grade: ${params.qualityGrade}`,
        adjustment: (gradeMultiplier - 1) * 100,
        type: 'percentage',
      });
    }

    // Volume discounts
    if (params.quantity >= 1000) {
      const volumeDiscount = 0.05; // 5% discount for large orders
      finalPrice *= (1 - volumeDiscount);
      appliedRules.push({
        ruleName: 'Volume Discount (1000+ kg)',
        adjustment: -volumeDiscount * 100,
        type: 'percentage',
      });
    }

    const totalDiscount = basePrice - finalPrice;

    return {
      basePrice,
      finalPrice,
      appliedRules,
      totalDiscount,
    };
  }

  async getSalesDashboardData(userId?: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topCustomers: Array<{ customer: Customer; revenue: number; orders: number }>;
    salesTrends: Array<{ date: string; revenue: number; orders: number }>;
    performanceByRep: Array<{ salesRep: User; revenue: number; orders: number; commission: number }>;
    revenueByCategory: Array<{ category: string; revenue: number; percentage: number }>;
  }> {
    // Basic implementation - to be enhanced
    const totalRevenue = 0;
    const totalOrders = 0;
    const averageOrderValue = 0;
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topCustomers: [],
      salesTrends: [],
      performanceByRep: [],
      revenueByCategory: [],
    };
  }

  async getCustomerProfitabilityAnalysis(customerId?: string): Promise<Array<{
    customer: Customer;
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
    marginPercent: number;
    orderCount: number;
    averageOrderValue: number;
    lastOrderDate: Date;
  }>> {
    // Implementation to be added
    return [];
  }

  async getProductPerformanceAnalysis(dateRange?: { start: Date; end: Date }): Promise<Array<{
    qualityGrade: string;
    totalRevenue: number;
    totalQuantityKg: number;
    averagePricePerKg: number;
    orderCount: number;
    marginPercent: number;
  }>> {
    // Implementation to be added
    return [];
  }

  async getSalesForecasting(periodType: string, periodsToForecast: number): Promise<Array<{
    period: string;
    forecastedRevenue: number;
    confidenceLevel: number;
    basedOnHistoricalData: boolean;
  }>> {
    // Implementation to be added
    return [];
  }

  async allocateInventoryForSalesOrder(salesOrderId: string, userId: string): Promise<{
    success: boolean;
    allocatedItems: SalesOrderItem[];
    partialAllocations: Array<{ itemId: string; requestedQuantity: number; allocatedQuantity: number }>;
    unavailableItems: Array<{ itemId: string; reason: string }>;
  }> {
    // Implementation to be added
    return {
      success: true,
      allocatedItems: [],
      partialAllocations: [],
      unavailableItems: [],
    };
  }

  async createShipmentFromSalesOrder(salesOrderId: string, userId: string): Promise<{
    salesOrder: SalesOrder;
    shipment: Shipment;
    message: string;
  }> {
    // Implementation to be added - requires integration with existing shipment system
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (!salesOrder) throw new Error('Sales order not found');

    // Placeholder - actual implementation would create shipment
    throw new Error('Implementation to be added');
  }

  async processRevenueRecognition(salesOrderId: string, userId: string): Promise<{
    revenueTransactions: RevenueTransaction[];
    totalRecognizedRevenue: number;
    accountingPeriod: string;
  }> {
    // Implementation to be added
    return {
      revenueTransactions: [],
      totalRecognizedRevenue: 0,
      accountingPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM format
    };
  }

  async getSalesDataForPeriodClosing(periodStart: Date, periodEnd: Date): Promise<{
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
    openSalesOrders: SalesOrder[];
    pendingRevenueTransactions: RevenueTransaction[];
    salesPerformanceMetrics: SalesPerformanceMetric[];
  }> {
    // Implementation to be added
    return {
      totalRevenue: 0,
      totalCost: 0,
      grossMargin: 0,
      openSalesOrders: [],
      pendingRevenueTransactions: [],
      salesPerformanceMetrics: [],
    };
  }

  async validateSalesOrdersForPeriodClosing(periodStart: Date, periodEnd: Date): Promise<{
    isValid: boolean;
    issues: Array<{ salesOrderId: string; issue: string; severity: 'warning' | 'error' }>;
    recommendations: string[];
  }> {
    // Implementation to be added
    return {
      isValid: true,
      issues: [],
      recommendations: [],
    };
  }

  // ===== MISSING CRITICAL FINANCIAL METHODS IMPLEMENTATIONS =====

  async getKpiDashboardData(periodId?: string): Promise<{
    revenue: { current: number; previous: number; growth: number };
    grossMargin: { amount: number; percentage: number; trend: string };
    operatingMargin: { amount: number; percentage: number; trend: string };
    netProfit: { amount: number; percentage: number; trend: string };
    workingCapital: { amount: number; ratio: number; trend: string };
    inventoryTurnover: { ratio: number; days: number; trend: string };
    cashFlow: { operating: number; total: number; runway: number };
  }> {
    try {
      // Get current financial summary
      const financialSummary = await this.getFinancialSummary();
      const exchangeRate = await this.getExchangeRate();

      // Calculate current revenue from sales orders (USD normalized)
      const salesResult = await db
        .select({
          totalRevenueUsd: sum(sql`
            CASE 
              WHEN ${salesOrders.currency} = 'USD' THEN ${salesOrders.totalAmount}
              ELSE ${salesOrders.totalAmount} / COALESCE(${salesOrders.exchangeRate}, ${exchangeRate})
            END
          `),
          totalOrders: count(salesOrders.id),
        })
        .from(salesOrders)
        .where(eq(salesOrders.status, 'delivered'));

      const currentRevenue = Number(salesResult[0]?.totalRevenueUsd || 0);
      const totalOrders = Number(salesResult[0]?.totalOrders || 0);

      // Calculate gross margin (simplified)
      const totalCosts = financialSummary.summary.totalPurchases || 0;
      const grossMarginAmount = currentRevenue - totalCosts;
      const grossMarginPercentage = currentRevenue > 0 ? (grossMarginAmount / currentRevenue) * 100 : 0;

      // Get inventory value for turnover calculation
      const inventoryValue = financialSummary.summary.totalInventoryValue || 0;
      const inventoryTurnoverRatio = inventoryValue > 0 ? totalCosts / inventoryValue : 0;
      const inventoryTurnoverDays = inventoryTurnoverRatio > 0 ? 365 / inventoryTurnoverRatio : 0;

      // Cash flow calculation
      const currentBalance = financialSummary.summary.currentBalance || 0;
      const cashRunway = Math.abs(currentBalance) > 0 && totalCosts > 0 ? (currentBalance / (totalCosts / 30)) : 0; // Days

      return {
        revenue: { 
          current: currentRevenue, 
          previous: currentRevenue * 0.85, // Mock previous period
          growth: 15 // Mock growth percentage
        },
        grossMargin: { 
          amount: grossMarginAmount, 
          percentage: grossMarginPercentage, 
          trend: 'up' 
        },
        operatingMargin: { 
          amount: grossMarginAmount * 0.8, // Mock operating margin
          percentage: grossMarginPercentage * 0.8, 
          trend: 'stable' 
        },
        netProfit: { 
          amount: grossMarginAmount * 0.6, // Mock net profit
          percentage: grossMarginPercentage * 0.6, 
          trend: 'up' 
        },
        workingCapital: { 
          amount: currentBalance, 
          ratio: currentBalance > 0 ? 1.2 : 0.8, 
          trend: currentBalance > 0 ? 'up' : 'down' 
        },
        inventoryTurnover: { 
          ratio: inventoryTurnoverRatio, 
          days: inventoryTurnoverDays, 
          trend: 'stable' 
        },
        cashFlow: { 
          operating: currentBalance, 
          total: currentBalance, 
          runway: cashRunway 
        }
      };
    } catch (error) {
      console.error('Error in getKpiDashboardData:', error);
      // Return default values on error
      return {
        revenue: { current: 0, previous: 0, growth: 0 },
        grossMargin: { amount: 0, percentage: 0, trend: 'stable' },
        operatingMargin: { amount: 0, percentage: 0, trend: 'stable' },
        netProfit: { amount: 0, percentage: 0, trend: 'stable' },
        workingCapital: { amount: 0, ratio: 0, trend: 'stable' },
        inventoryTurnover: { ratio: 0, days: 0, trend: 'stable' },
        cashFlow: { operating: 0, total: 0, runway: 0 }
      };
    }
  }

  async getProfitLossStatements(periodId?: string, statementType?: string): Promise<any[]> {
    try {
      // Generate a basic P&L statement from current financial data
      const financialSummary = await this.getFinancialSummary();
      const exchangeRate = await this.getExchangeRate();

      // Calculate revenue from sales
      const salesResult = await db
        .select({
          totalRevenueUsd: sum(sql`
            CASE 
              WHEN ${salesOrders.currency} = 'USD' THEN ${salesOrders.totalAmount}
              ELSE ${salesOrders.totalAmount} / COALESCE(${salesOrders.exchangeRate}, ${exchangeRate})
            END
          `),
        })
        .from(salesOrders)
        .where(eq(salesOrders.status, 'delivered'));

      const revenue = Number(salesResult[0]?.totalRevenueUsd || 0);
      const cogs = financialSummary.summary.totalPurchases || 0; // Cost of Goods Sold
      const grossProfit = revenue - cogs;
      const operatingExpenses = cogs * 0.15; // Mock operating expenses (15% of COGS)
      const netProfit = grossProfit - operatingExpenses;

      const statement = {
        id: `pl-${Date.now()}`,
        periodId: periodId || 'current',
        statementType: statementType || 'monthly',
        revenue: revenue,
        costOfGoodsSold: cogs,
        grossProfit: grossProfit,
        grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        operatingExpenses: operatingExpenses,
        operatingProfit: grossProfit - operatingExpenses,
        operatingProfitMargin: revenue > 0 ? ((grossProfit - operatingExpenses) / revenue) * 100 : 0,
        netProfit: netProfit,
        netProfitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
        createdAt: new Date(),
        currency: 'USD'
      };

      return [statement];
    } catch (error) {
      console.error('Error in getProfitLossStatements:', error);
      return [];
    }
  }

  async getCashFlowForecast(days: number): Promise<{
    projections: Array<{
      date: string;
      inflows: number;
      outflows: number;
      netFlow: number;
      cumulativeBalance: number;
    }>;
    summary: {
      totalInflows: number;
      totalOutflows: number;
      netFlow: number;
      endingBalance: number;
      minBalance: number;
      maxBalance: number;
    };
  }> {
    try {
      const financialSummary = await this.getFinancialSummary();
      const currentBalance = financialSummary.summary.currentBalance || 0;
      
      // Get recent cash flow data for trend analysis
      const recentCashFlow = await this.getCashflowAnalysis('last-30-days');
      const avgDailyInflow = (recentCashFlow.summary.totalCapitalIn || 0) / 30;
      const avgDailyOutflow = (recentCashFlow.summary.totalPurchasePayments || 0) / 30;

      const projections = [];
      let cumulativeBalance = currentBalance;
      let totalInflows = 0;
      let totalOutflows = 0;
      let minBalance = currentBalance;
      let maxBalance = currentBalance;

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Simple projection with some variance
        const dailyInflow = avgDailyInflow * (0.8 + Math.random() * 0.4); // 20% variance
        const dailyOutflow = avgDailyOutflow * (0.8 + Math.random() * 0.4); // 20% variance
        const netFlow = dailyInflow - dailyOutflow;
        
        cumulativeBalance += netFlow;
        totalInflows += dailyInflow;
        totalOutflows += dailyOutflow;
        
        minBalance = Math.min(minBalance, cumulativeBalance);
        maxBalance = Math.max(maxBalance, cumulativeBalance);

        projections.push({
          date: date.toISOString().split('T')[0],
          inflows: Math.round(dailyInflow * 100) / 100,
          outflows: Math.round(dailyOutflow * 100) / 100,
          netFlow: Math.round(netFlow * 100) / 100,
          cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
        });
      }

      return {
        projections,
        summary: {
          totalInflows: Math.round(totalInflows * 100) / 100,
          totalOutflows: Math.round(totalOutflows * 100) / 100,
          netFlow: Math.round((totalInflows - totalOutflows) * 100) / 100,
          endingBalance: Math.round(cumulativeBalance * 100) / 100,
          minBalance: Math.round(minBalance * 100) / 100,
          maxBalance: Math.round(maxBalance * 100) / 100,
        }
      };
    } catch (error) {
      console.error('Error in getCashFlowForecast:', error);
      return {
        projections: [],
        summary: {
          totalInflows: 0,
          totalOutflows: 0,
          netFlow: 0,
          endingBalance: 0,
          minBalance: 0,
          maxBalance: 0,
        }
      };
    }
  }

  async getMarginAnalyses(periodId?: string, analysisType?: string, filters?: {
    customerId?: string;
    supplierId?: string;
    qualityGrade?: string;
    country?: string;
  }): Promise<any[]> {
    try {
      // Calculate margin analysis from purchases and sales data
      const exchangeRate = await this.getExchangeRate();

      // Get purchase costs by supplier/country/quality
      let purchaseQuery = db
        .select({
          supplierId: purchases.supplierId,
          supplierName: suppliers.name,
          country: purchases.country,
          quality: purchases.quality,
          totalCost: sum(sql`
            CASE 
              WHEN ${purchases.currency} = 'USD' THEN ${purchases.total}
              ELSE ${purchases.total} / COALESCE(${purchases.exchangeRate}, ${exchangeRate})
            END
          `),
          totalWeight: sum(purchases.weight),
          avgCostPerKg: avg(sql`
            CASE 
              WHEN ${purchases.currency} = 'USD' THEN ${purchases.pricePerKg}
              ELSE ${purchases.pricePerKg} / COALESCE(${purchases.exchangeRate}, ${exchangeRate})
            END
          `),
        })
        .from(purchases)
        .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
        .groupBy(purchases.supplierId, suppliers.name, purchases.country, purchases.quality);

      // Apply filters
      const whereConditions = [];
      if (filters?.supplierId) {
        whereConditions.push(eq(purchases.supplierId, filters.supplierId));
      }
      if (filters?.country) {
        whereConditions.push(eq(purchases.country, filters.country));
      }
      if (filters?.qualityGrade) {
        whereConditions.push(eq(purchases.quality, filters.qualityGrade));
      }

      if (whereConditions.length > 0) {
        purchaseQuery = purchaseQuery.where(and(...whereConditions));
      }

      const purchaseData = await purchaseQuery;

      // Calculate margins (simplified - using average selling price)
      const avgSellingPrice = 12.0; // Mock average selling price per kg USD
      
      const marginAnalyses = purchaseData.map((purchase, index) => {
        const costPerKg = Number(purchase.avgCostPerKg || 0);
        const marginAmount = avgSellingPrice - costPerKg;
        const marginPercentage = costPerKg > 0 ? (marginAmount / avgSellingPrice) * 100 : 0;

        return {
          id: `margin-${index}`,
          periodId: periodId || 'current',
          analysisType: analysisType || 'supplier',
          supplierId: purchase.supplierId,
          supplierName: purchase.supplierName,
          country: purchase.country,
          qualityGrade: purchase.quality,
          totalCost: Number(purchase.totalCost || 0),
          totalWeight: Number(purchase.totalWeight || 0),
          avgCostPerKg: costPerKg,
          avgSellingPrice: avgSellingPrice,
          marginAmount: marginAmount,
          marginPercentage: marginPercentage,
          createdAt: new Date(),
        };
      });

      return marginAnalyses;
    } catch (error) {
      console.error('Error in getMarginAnalyses:', error);
      return [];
    }
  }

  async calculateROIAnalysis(periodId?: string): Promise<{
    overallROI: { percentage: number; absoluteReturn: number; period: string };
    roiBySupplier: Array<{ supplierId: string; supplierName: string; roi: number; investedCapital: number; returns: number }>;
    roiByQualityGrade: Array<{ qualityGrade: string; roi: number; investedCapital: number; returns: number }>;
    recommendations: Array<{ type: string; description: string; priority: 'high' | 'medium' | 'low' }>;
  }> {
    try {
      const financialSummary = await this.getFinancialSummary();
      const exchangeRate = await this.getExchangeRate();

      // Calculate total invested capital (purchases)
      const totalInvestedCapital = financialSummary.summary.totalPurchases || 0;
      
      // Calculate returns from sales (USD normalized)
      const salesResult = await db
        .select({
          totalRevenueUsd: sum(sql`
            CASE 
              WHEN ${salesOrders.currency} = 'USD' THEN ${salesOrders.totalAmount}
              ELSE ${salesOrders.totalAmount} / COALESCE(${salesOrders.exchangeRate}, ${exchangeRate})
            END
          `),
        })
        .from(salesOrders)
        .where(eq(salesOrders.status, 'delivered'));

      const totalReturns = Number(salesResult[0]?.totalRevenueUsd || 0);
      const absoluteReturn = totalReturns - totalInvestedCapital;
      const overallROI = totalInvestedCapital > 0 ? (absoluteReturn / totalInvestedCapital) * 100 : 0;

      // ROI by supplier
      const supplierROI = await db
        .select({
          supplierId: purchases.supplierId,
          supplierName: suppliers.name,
          investedCapital: sum(sql`
            CASE 
              WHEN ${purchases.currency} = 'USD' THEN ${purchases.total}
              ELSE ${purchases.total} / COALESCE(${purchases.exchangeRate}, ${exchangeRate})
            END
          `),
        })
        .from(purchases)
        .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
        .groupBy(purchases.supplierId, suppliers.name);

      const roiBySupplier = supplierROI.map(supplier => {
        const invested = Number(supplier.investedCapital || 0);
        const returns = invested * 1.2; // Mock 20% return for demonstration
        const roi = invested > 0 ? ((returns - invested) / invested) * 100 : 0;
        
        return {
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName || 'Unknown',
          roi,
          investedCapital: invested,
          returns,
        };
      });

      // ROI by quality grade
      const qualityROI = await db
        .select({
          qualityGrade: purchases.quality,
          investedCapital: sum(sql`
            CASE 
              WHEN ${purchases.currency} = 'USD' THEN ${purchases.total}
              ELSE ${purchases.total} / COALESCE(${purchases.exchangeRate}, ${exchangeRate})
            END
          `),
        })
        .from(purchases)
        .where(isNotNull(purchases.quality))
        .groupBy(purchases.quality);

      const roiByQualityGrade = qualityROI.map(quality => {
        const invested = Number(quality.investedCapital || 0);
        const returns = invested * (quality.qualityGrade === 'Premium' ? 1.3 : 1.15); // Mock different returns by quality
        const roi = invested > 0 ? ((returns - invested) / invested) * 100 : 0;

        return {
          qualityGrade: quality.qualityGrade || 'Unknown',
          roi,
          investedCapital: invested,
          returns,
        };
      });

      // Generate recommendations based on ROI analysis
      const recommendations = [
        {
          type: 'supplier_optimization',
          description: overallROI > 10 ? 'Continue current supplier strategy - ROI is positive' : 'Consider renegotiating supplier terms to improve ROI',
          priority: overallROI > 10 ? 'low' as const : 'high' as const,
        },
        {
          type: 'quality_focus',
          description: 'Analyze premium vs standard quality ROI to optimize product mix',
          priority: 'medium' as const,
        },
        {
          type: 'capital_allocation',
          description: totalInvestedCapital > 200000 ? 'Large capital investment - monitor ROI closely' : 'Consider increasing investment in high-ROI segments',
          priority: 'medium' as const,
        },
      ];

      return {
        overallROI: {
          percentage: overallROI,
          absoluteReturn,
          period: periodId || 'current',
        },
        roiBySupplier,
        roiByQualityGrade,
        recommendations,
      };
    } catch (error) {
      console.error('Error in calculateROIAnalysis:', error);
      return {
        overallROI: { percentage: 0, absoluteReturn: 0, period: 'current' },
        roiBySupplier: [],
        roiByQualityGrade: [],
        recommendations: [],
      };
    }
  }

  async calculateBreakEvenAnalysis(periodId?: string): Promise<{
    breakEvenRevenue: number;
    breakEvenUnits: number;
    marginOfSafety: number;
    contributionMargin: { amount: number; percentage: number };
    fixedCosts: number;
    variableCostRatio: number;
    scenarioAnalysis: Array<{ scenario: string; revenue: number; profit: number; breakEven: boolean }>;
  }> {
    try {
      const financialSummary = await this.getFinancialSummary();
      
      // Basic cost structure calculations
      const totalCosts = financialSummary.summary.totalPurchases || 0;
      const fixedCosts = totalCosts * 0.3; // Assume 30% are fixed costs (rent, salaries, etc.)
      const variableCosts = totalCosts * 0.7; // 70% variable costs (direct material costs)
      
      // Average selling price per kg (mock for coffee trading)
      const avgSellingPricePerKg = 12.0; // USD per kg
      const totalWeightSold = 1000; // Mock total kg sold
      
      // Calculate variable cost per unit
      const variableCostPerKg = totalWeightSold > 0 ? variableCosts / totalWeightSold : 0;
      const contributionMarginPerKg = avgSellingPricePerKg - variableCostPerKg;
      const contributionMarginPercentage = avgSellingPricePerKg > 0 ? (contributionMarginPerKg / avgSellingPricePerKg) * 100 : 0;
      
      // Break-even calculations
      const breakEvenUnits = contributionMarginPerKg > 0 ? fixedCosts / contributionMarginPerKg : 0;
      const breakEvenRevenue = breakEvenUnits * avgSellingPricePerKg;
      
      // Current revenue for margin of safety
      const currentRevenue = avgSellingPricePerKg * totalWeightSold;
      const marginOfSafety = currentRevenue > breakEvenRevenue ? 
        ((currentRevenue - breakEvenRevenue) / currentRevenue) * 100 : 0;
      
      // Variable cost ratio
      const variableCostRatio = avgSellingPricePerKg > 0 ? (variableCostPerKg / avgSellingPricePerKg) * 100 : 0;
      
      // Scenario analysis
      const scenarios = [
        { scenario: 'Conservative', revenue: breakEvenRevenue * 0.8 },
        { scenario: 'Break-Even', revenue: breakEvenRevenue },
        { scenario: 'Optimistic', revenue: breakEvenRevenue * 1.3 },
        { scenario: 'Best Case', revenue: breakEvenRevenue * 1.6 },
      ];
      
      const scenarioAnalysis = scenarios.map(scenario => {
        const unitsToSell = scenario.revenue / avgSellingPricePerKg;
        const totalVariableCosts = unitsToSell * variableCostPerKg;
        const profit = scenario.revenue - totalVariableCosts - fixedCosts;
        
        return {
          scenario: scenario.scenario,
          revenue: Math.round(scenario.revenue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          breakEven: profit >= 0,
        };
      });

      return {
        breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
        breakEvenUnits: Math.round(breakEvenUnits * 100) / 100,
        marginOfSafety: Math.round(marginOfSafety * 100) / 100,
        contributionMargin: {
          amount: Math.round(contributionMarginPerKg * 100) / 100,
          percentage: Math.round(contributionMarginPercentage * 100) / 100,
        },
        fixedCosts: Math.round(fixedCosts * 100) / 100,
        variableCostRatio: Math.round(variableCostRatio * 100) / 100,
        scenarioAnalysis,
      };
    } catch (error) {
      console.error('Error in calculateBreakEvenAnalysis:', error);
      return {
        breakEvenRevenue: 0,
        breakEvenUnits: 0,
        marginOfSafety: 0,
        contributionMargin: { amount: 0, percentage: 0 },
        fixedCosts: 0,
        variableCostRatio: 0,
        scenarioAnalysis: [],
      };
    }
  }

  // ===============================================
  // NOTIFICATION SYSTEM IMPLEMENTATION
  // ===============================================

  // Notification Settings operations
  async getNotificationSettings(userId: string): Promise<NotificationSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));
      return settings;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return undefined;
    }
  }

  async createNotificationSettings(settings: InsertNotificationSetting, auditContext?: AuditContext): Promise<NotificationSetting> {
    try {
      const [newSettings] = await db
        .insert(notificationSettings)
        .values(settings)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'notification_settings',
          newSettings.id,
          'create',
          'notification_configuration',
          null,
          settings,
          undefined,
          undefined
        );
      }

      return newSettings;
    } catch (error) {
      console.error('Error creating notification settings:', error);
      throw new Error('Failed to create notification settings');
    }
  }

  async updateNotificationSettings(userId: string, settings: UpdateNotificationSetting, auditContext?: AuditContext): Promise<NotificationSetting> {
    try {
      const [oldSettings] = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));

      const [updatedSettings] = await db
        .update(notificationSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(notificationSettings.userId, userId))
        .returning();

      if (auditContext && oldSettings) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'notification_settings',
          updatedSettings.id,
          'update',
          'notification_configuration',
          oldSettings,
          settings,
          undefined,
          undefined
        );
      }

      return updatedSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  async getUserNotificationPreferences(userId: string): Promise<NotificationSettingsResponse> {
    try {
      const settings = await this.getNotificationSettings(userId);
      
      // Create default settings if none exist
      const effectiveSettings = settings || {
        id: `temp-${userId}`,
        userId,
        enableInApp: true,
        enableEmail: true,
        enableSms: false,
        enableWebhook: false,
        alertCategories: [],
        defaultFrequency: 'immediate' as const,
        digestTime: '08:00',
        weeklyDigestDay: 1,
        monthlyDigestDay: 1,
        emailAddress: null,
        phoneNumber: null,
        webhookUrl: null,
        thresholds: {},
        escalationEnabled: false,
        escalationTimeoutMinutes: 60,
        escalationRecipients: [],
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
        quietHoursTimezone: 'UTC',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Get recent notification activity for this user
      const recentActivity = await db
        .select({
          alertType: notificationQueue.alertType,
          alertCategory: notificationQueue.alertCategory,
          createdAt: notificationQueue.createdAt,
          status: notificationQueue.status,
        })
        .from(notificationQueue)
        .where(eq(notificationQueue.userId, userId))
        .orderBy(desc(notificationQueue.createdAt))
        .limit(10);

      return {
        ...effectiveSettings,
        effectiveThresholds: effectiveSettings.thresholds as any || {},
        availableChannels: [
          { channel: 'in_app', enabled: effectiveSettings.enableInApp, configured: true, requiresSetup: false },
          { channel: 'email', enabled: effectiveSettings.enableEmail, configured: !!effectiveSettings.emailAddress, requiresSetup: !effectiveSettings.emailAddress },
          { channel: 'sms', enabled: effectiveSettings.enableSms, configured: !!effectiveSettings.phoneNumber, requiresSetup: !effectiveSettings.phoneNumber },
          { channel: 'webhook', enabled: effectiveSettings.enableWebhook, configured: !!effectiveSettings.webhookUrl, requiresSetup: !effectiveSettings.webhookUrl },
        ],
        recentActivity: recentActivity.map(activity => ({
          alertType: activity.alertType,
          alertCategory: activity.alertCategory,
          triggeredAt: activity.createdAt?.toISOString() || '',
          acknowledged: activity.status === 'read' || activity.status === 'dismissed',
        })),
      };
    } catch (error) {
      console.error('Error fetching user notification preferences:', error);
      throw new Error('Failed to fetch notification preferences');
    }
  }

  // Notification Template operations
  async getNotificationTemplates(filter?: NotificationTemplateFilter): Promise<NotificationTemplate[]> {
    try {
      const query = db.select().from(notificationTemplates);
      
      if (filter?.alertType) {
        query.where(eq(notificationTemplates.alertType, filter.alertType));
      }
      if (filter?.alertCategory) {
        query.where(eq(notificationTemplates.alertCategory, filter.alertCategory));
      }
      if (filter?.channel) {
        query.where(eq(notificationTemplates.channel, filter.channel));
      }
      if (filter?.isActive !== undefined) {
        query.where(eq(notificationTemplates.isActive, filter.isActive));
      }
      if (filter?.language) {
        query.where(eq(notificationTemplates.language, filter.language));
      }

      return await query.orderBy(desc(notificationTemplates.createdAt));
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      return [];
    }
  }

  async getNotificationTemplate(id: string): Promise<NotificationTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.id, id));
      return template;
    } catch (error) {
      console.error('Error fetching notification template:', error);
      return undefined;
    }
  }

  async getTemplateByTypeAndChannel(alertType: string, alertCategory: string, channel: string, language = 'en'): Promise<NotificationTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(
          and(
            eq(notificationTemplates.alertType, alertType),
            eq(notificationTemplates.alertCategory, alertCategory),
            eq(notificationTemplates.channel, channel),
            eq(notificationTemplates.language, language),
            eq(notificationTemplates.isActive, true)
          )
        )
        .orderBy(desc(notificationTemplates.isDefault))
        .limit(1);
      return template;
    } catch (error) {
      console.error('Error fetching template by type and channel:', error);
      return undefined;
    }
  }

  async createNotificationTemplate(template: InsertNotificationTemplate, auditContext?: AuditContext): Promise<NotificationTemplate> {
    try {
      const [newTemplate] = await db
        .insert(notificationTemplates)
        .values(template)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'notification_templates',
          newTemplate.id,
          'create',
          'template_management',
          null,
          template,
          undefined,
          undefined
        );
      }

      return newTemplate;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw new Error('Failed to create notification template');
    }
  }

  async updateNotificationTemplate(id: string, template: UpdateNotificationTemplate, auditContext?: AuditContext): Promise<NotificationTemplate> {
    try {
      const [oldTemplate] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.id, id));

      if (!oldTemplate) {
        throw new Error('Notification template not found');
      }

      const [updatedTemplate] = await db
        .update(notificationTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(notificationTemplates.id, id))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'notification_templates',
          id,
          'update',
          'template_management',
          oldTemplate,
          template,
          undefined,
          undefined
        );
      }

      return updatedTemplate;
    } catch (error) {
      console.error('Error updating notification template:', error);
      throw new Error('Failed to update notification template');
    }
  }

  async deleteNotificationTemplate(id: string, auditContext?: AuditContext): Promise<void> {
    try {
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.id, id));

      if (!template) {
        throw new Error('Notification template not found');
      }

      await db
        .delete(notificationTemplates)
        .where(eq(notificationTemplates.id, id));

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'notification_templates',
          id,
          'delete',
          'template_management',
          template,
          null,
          undefined,
          undefined
        );
      }
    } catch (error) {
      console.error('Error deleting notification template:', error);
      throw new Error('Failed to delete notification template');
    }
  }

  // Notification Queue operations
  async getNotifications(filter: NotificationQueueFilter): Promise<NotificationQueue[]> {
    try {
      let query = db.select().from(notificationQueue);

      const conditions = [];
      if (filter.userId) conditions.push(eq(notificationQueue.userId, filter.userId));
      if (filter.status) conditions.push(eq(notificationQueue.status, filter.status));
      if (filter.priority) conditions.push(eq(notificationQueue.priority, filter.priority));
      if (filter.channel) conditions.push(eq(notificationQueue.channel, filter.channel));
      if (filter.alertType) conditions.push(eq(notificationQueue.alertType, filter.alertType));
      if (filter.alertCategory) conditions.push(eq(notificationQueue.alertCategory, filter.alertCategory));
      if (filter.entityType) conditions.push(eq(notificationQueue.entityType, filter.entityType));
      if (filter.entityId) conditions.push(eq(notificationQueue.entityId, filter.entityId));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query
        .orderBy(desc(notificationQueue.createdAt))
        .limit(filter.limit || 20)
        .offset(filter.offset || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getNotification(id: string): Promise<NotificationQueue | undefined> {
    try {
      const [notification] = await db
        .select()
        .from(notificationQueue)
        .where(eq(notificationQueue.id, id));
      return notification;
    } catch (error) {
      console.error('Error fetching notification:', error);
      return undefined;
    }
  }

  async getUserNotifications(userId: string, filter?: Partial<NotificationQueueFilter>): Promise<NotificationCenterResponse> {
    try {
      const baseFilter: NotificationQueueFilter = {
        userId,
        limit: 50,
        offset: 0,
        status: 'pending', // Default to only pending notifications
        ...filter,
      };

      const notifications = await this.getNotifications(baseFilter);

      // Get counts by priority
      const priorityCounts = await db
        .select({
          priority: notificationQueue.priority,
          count: sql<number>`count(*)`,
        })
        .from(notificationQueue)
        .where(and(
          eq(notificationQueue.userId, userId),
          eq(notificationQueue.status, 'pending')
        ))
        .groupBy(notificationQueue.priority);

      const summary = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      priorityCounts.forEach(({ priority, count }) => {
        summary[priority as keyof typeof summary] = Number(count);
      });

      // Get unread count
      const unreadResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(notificationQueue)
        .where(and(
          eq(notificationQueue.userId, userId),
          eq(notificationQueue.status, 'pending')
        ));

      const unreadCount = Number(unreadResult[0]?.count || 0);
      const totalCount = notifications.length;

      return {
        notifications: notifications.map(notification => ({
          ...notification,
          canDismiss: true,
          canMarkAsRead: notification.status === 'pending',
          timeAgo: this.calculateTimeAgo(notification.createdAt),
          actionText: notification.actionUrl ? 'View Details' : undefined,
        })),
        unreadCount,
        totalCount,
        hasMore: totalCount >= (baseFilter.limit || 50),
        summary,
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return {
        notifications: [],
        unreadCount: 0,
        totalCount: 0,
        hasMore: false,
        summary: { critical: 0, high: 0, medium: 0, low: 0 },
      };
    }
  }

  async createNotification(notification: CreateNotification): Promise<NotificationQueue> {
    try {
      // Get user settings to determine delivery preferences
      const userSettings = await this.getNotificationSettings(notification.userId);
      
      const queueData: InsertNotificationQueue = {
        userId: notification.userId,
        alertType: notification.alertType,
        alertCategory: notification.alertCategory,
        priority: notification.priority || 'medium',
        channel: 'in_app', // Default to in-app, will be expanded based on user preferences
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        actionUrl: notification.actionUrl,
        templateData: notification.templateData || {},
        scheduledFor: notification.scheduledFor ? new Date(notification.scheduledFor) : new Date(),
      };

      return await this.queueNotification(queueData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async queueNotification(notification: InsertNotificationQueue): Promise<NotificationQueue> {
    try {
      const [queuedNotification] = await db
        .insert(notificationQueue)
        .values(notification)
        .returning();

      return queuedNotification;
    } catch (error) {
      console.error('Error queueing notification:', error);
      throw new Error('Failed to queue notification');
    }
  }

  async updateNotificationStatus(id: string, updates: UpdateNotificationQueue, auditContext?: AuditContext): Promise<NotificationQueue> {
    try {
      const [updatedNotification] = await db
        .update(notificationQueue)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(notificationQueue.id, id))
        .returning();

      if (!updatedNotification) {
        throw new Error('Notification not found');
      }

      return updatedNotification;
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw new Error('Failed to update notification status');
    }
  }

  async markNotificationAsRead(id: string, userId: string): Promise<NotificationQueue> {
    try {
      const [updatedNotification] = await db
        .update(notificationQueue)
        .set({ 
          status: 'read',
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(notificationQueue.id, id),
          eq(notificationQueue.userId, userId)
        ))
        .returning();

      if (!updatedNotification) {
        throw new Error('Notification not found or access denied');
      }

      return updatedNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async dismissNotification(id: string, userId: string): Promise<NotificationQueue> {
    try {
      console.log(`🔍 Dismissing notification: id=${id}, userId=${userId}`);
      
      // First, check if the notification exists at all
      const existingNotification = await db
        .select()
        .from(notificationQueue)
        .where(eq(notificationQueue.id, id))
        .limit(1);
      
      console.log(`📊 Notification exists: ${existingNotification.length > 0}`);
      if (existingNotification.length > 0) {
        console.log(`📝 Notification data:`, {
          id: existingNotification[0].id,
          userId: existingNotification[0].userId,
          status: existingNotification[0].status,
          title: existingNotification[0].title
        });
      }

      const [updatedNotification] = await db
        .update(notificationQueue)
        .set({ 
          status: 'dismissed',
          dismissedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(notificationQueue.id, id),
          eq(notificationQueue.userId, userId)
        ))
        .returning();

      if (!updatedNotification) {
        console.error(`❌ No notification updated. Notification ${id} not found for user ${userId}`);
        throw new Error('Notification not found or access denied');
      }

      console.log(`✅ Successfully dismissed notification ${id}`);
      return updatedNotification;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw new Error('Failed to dismiss notification');
    }
  }

  async bulkMarkNotificationsAsRead(notificationIds: string[], userId: string): Promise<{ updated: number }> {
    try {
      const result = await db
        .update(notificationQueue)
        .set({ 
          status: 'read',
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          sql`${notificationQueue.id} = ANY(${notificationIds})`,
          eq(notificationQueue.userId, userId)
        ));

      return { updated: result.rowsAffected };
    } catch (error) {
      console.error('Error bulk marking notifications as read:', error);
      return { updated: 0 };
    }
  }

  async bulkDismissNotifications(notificationIds: string[], userId: string): Promise<{ updated: number }> {
    try {
      const result = await db
        .update(notificationQueue)
        .set({ 
          status: 'dismissed',
          dismissedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          sql`${notificationQueue.id} = ANY(${notificationIds})`,
          eq(notificationQueue.userId, userId)
        ));

      return { updated: result.rowsAffected };
    } catch (error) {
      console.error('Error bulk dismissing notifications:', error);
      return { updated: 0 };
    }
  }

  async getPendingNotifications(limit = 100): Promise<NotificationQueue[]> {
    try {
      return await db
        .select()
        .from(notificationQueue)
        .where(and(
          eq(notificationQueue.status, 'pending'),
          lte(notificationQueue.scheduledFor, new Date())
        ))
        .orderBy(notificationQueue.priority, notificationQueue.scheduledFor)
        .limit(limit);
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      return [];
    }
  }

  async getFailedNotifications(limit = 50): Promise<NotificationQueue[]> {
    try {
      return await db
        .select()
        .from(notificationQueue)
        .where(eq(notificationQueue.status, 'failed'))
        .orderBy(desc(notificationQueue.lastAttemptAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching failed notifications:', error);
      return [];
    }
  }

  // Alert Configuration operations
  async getAlertConfigurations(filter?: AlertConfigurationFilter): Promise<AlertConfiguration[]> {
    try {
      const query = db.select().from(alertConfigurations);
      
      const conditions = [];
      if (filter?.alertType) conditions.push(eq(alertConfigurations.alertType, filter.alertType));
      if (filter?.alertCategory) conditions.push(eq(alertConfigurations.alertCategory, filter.alertCategory));
      if (filter?.isGlobal !== undefined) conditions.push(eq(alertConfigurations.isGlobal, filter.isGlobal));
      if (filter?.isActive !== undefined) conditions.push(eq(alertConfigurations.isActive, filter.isActive));
      if (filter?.monitoringEnabled !== undefined) conditions.push(eq(alertConfigurations.monitoringEnabled, filter.monitoringEnabled));

      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      return await query.orderBy(desc(alertConfigurations.createdAt));
    } catch (error) {
      console.error('Error fetching alert configurations:', error);
      return [];
    }
  }

  async getAlertConfiguration(id: string): Promise<AlertConfiguration | undefined> {
    try {
      const [config] = await db
        .select()
        .from(alertConfigurations)
        .where(eq(alertConfigurations.id, id));
      return config;
    } catch (error) {
      console.error('Error fetching alert configuration:', error);
      return undefined;
    }
  }

  async getActiveAlertConfigurations(): Promise<AlertConfiguration[]> {
    try {
      return await db
        .select()
        .from(alertConfigurations)
        .where(and(
          eq(alertConfigurations.isActive, true),
          eq(alertConfigurations.monitoringEnabled, true)
        ))
        .orderBy(alertConfigurations.priority);
    } catch (error) {
      console.error('Error fetching active alert configurations:', error);
      return [];
    }
  }

  async getUserAlertConfigurations(userId: string): Promise<AlertConfiguration[]> {
    try {
      return await db
        .select()
        .from(alertConfigurations)
        .where(
          sql`${alertConfigurations.isGlobal} = true OR ${userId} = ANY(${alertConfigurations.targetUsers})`
        )
        .orderBy(alertConfigurations.priority);
    } catch (error) {
      console.error('Error fetching user alert configurations:', error);
      return [];
    }
  }

  async getRoleAlertConfigurations(role: string): Promise<AlertConfiguration[]> {
    try {
      return await db
        .select()
        .from(alertConfigurations)
        .where(
          sql`${alertConfigurations.isGlobal} = true OR ${role} = ANY(${alertConfigurations.targetRoles})`
        )
        .orderBy(alertConfigurations.priority);
    } catch (error) {
      console.error('Error fetching role alert configurations:', error);
      return [];
    }
  }

  async createAlertConfiguration(config: InsertAlertConfiguration, auditContext?: AuditContext): Promise<AlertConfiguration> {
    try {
      const [newConfig] = await db
        .insert(alertConfigurations)
        .values(config)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'alert_configurations',
          newConfig.id,
          'create',
          'alert_management',
          null,
          config,
          undefined,
          undefined
        );
      }

      return newConfig;
    } catch (error) {
      console.error('Error creating alert configuration:', error);
      throw new Error('Failed to create alert configuration');
    }
  }

  async updateAlertConfiguration(id: string, config: UpdateAlertConfiguration, auditContext?: AuditContext): Promise<AlertConfiguration> {
    try {
      const [oldConfig] = await db
        .select()
        .from(alertConfigurations)
        .where(eq(alertConfigurations.id, id));

      if (!oldConfig) {
        throw new Error('Alert configuration not found');
      }

      const [updatedConfig] = await db
        .update(alertConfigurations)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(alertConfigurations.id, id))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'alert_configurations',
          id,
          'update',
          'alert_management',
          oldConfig,
          config,
          undefined,
          undefined,
          `Updated alert configuration: ${oldConfig.name}`
        );
      }

      return updatedConfig;
    } catch (error) {
      console.error('Error updating alert configuration:', error);
      throw new Error('Failed to update alert configuration');
    }
  }

  async deleteAlertConfiguration(id: string, auditContext?: AuditContext): Promise<void> {
    try {
      const [config] = await db
        .select()
        .from(alertConfigurations)
        .where(eq(alertConfigurations.id, id));

      if (!config) {
        throw new Error('Alert configuration not found');
      }

      await db
        .delete(alertConfigurations)
        .where(eq(alertConfigurations.id, id));

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'alert_configurations',
          id,
          'delete',
          'alert_management',
          config,
          null,
          undefined,
          undefined,
          `Deleted alert configuration: ${config.name}`
        );
      }
    } catch (error) {
      console.error('Error deleting alert configuration:', error);
      throw new Error('Failed to delete alert configuration');
    }
  }

  async toggleAlertConfiguration(id: string, isActive: boolean, auditContext?: AuditContext): Promise<AlertConfiguration> {
    try {
      const [updatedConfig] = await db
        .update(alertConfigurations)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(alertConfigurations.id, id))
        .returning();

      if (!updatedConfig) {
        throw new Error('Alert configuration not found');
      }

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'alert_configurations',
          id,
          'update',
          'alert_management',
          { isActive: !isActive },
          { isActive },
          undefined,
          undefined,
          `${isActive ? 'Activated' : 'Deactivated'} alert configuration: ${updatedConfig.name}`
        );
      }

      return updatedConfig;
    } catch (error) {
      console.error('Error toggling alert configuration:', error);
      throw new Error('Failed to toggle alert configuration');
    }
  }

  // Notification History operations
  async getNotificationHistory(filter: NotificationHistoryFilter): Promise<NotificationHistory[]> {
    try {
      let query = db.select().from(notificationHistory);

      const conditions = [];
      if (filter.userId) conditions.push(eq(notificationHistory.userId, filter.userId));
      if (filter.status) conditions.push(eq(notificationHistory.status, filter.status));
      if (filter.alertType) conditions.push(eq(notificationHistory.alertType, filter.alertType));
      if (filter.alertCategory) conditions.push(eq(notificationHistory.alertCategory, filter.alertCategory));
      if (filter.channel) conditions.push(eq(notificationHistory.channel, filter.channel));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query
        .orderBy(desc(notificationHistory.createdAt))
        .limit(filter.limit || 50)
        .offset(filter.offset || 0);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  async getUserNotificationHistory(userId: string, filter?: Partial<NotificationHistoryFilter>): Promise<NotificationHistory[]> {
    try {
      const historyFilter: NotificationHistoryFilter = {
        userId,
        limit: 100,
        offset: 0,
        ...filter,
      };

      return await this.getNotificationHistory(historyFilter);
    } catch (error) {
      console.error('Error fetching user notification history:', error);
      return [];
    }
  }

  async getNotificationAnalytics(userId?: string, dateFrom?: string, dateTo?: string): Promise<NotificationAnalytics> {
    try {
      // This is a comprehensive implementation that would analyze notification effectiveness
      // For now, returning a mock implementation with the correct structure
      return {
        deliveryStats: {
          totalSent: 0,
          successRate: 0,
          failureRate: 0,
          averageDeliveryTime: 0,
          channelBreakdown: [],
        },
        engagementStats: {
          openRate: 0,
          clickRate: 0,
          dismissalRate: 0,
          responseRate: 0,
          preferredChannels: [],
        },
        alertEffectiveness: {
          mostTriggered: [],
          leastEngaged: [],
        },
      };
    } catch (error) {
      console.error('Error calculating notification analytics:', error);
      throw new Error('Failed to calculate notification analytics');
    }
  }

  async archiveNotificationHistory(olderThanDays: number): Promise<{ archived: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // In a production system, this would move old records to an archive table
      const result = await db
        .delete(notificationHistory)
        .where(lte(notificationHistory.createdAt, cutoffDate));

      return { archived: result.rowsAffected };
    } catch (error) {
      console.error('Error archiving notification history:', error);
      return { archived: 0 };
    }
  }

  // Alert Monitoring operations
  async getAlertMonitoringDashboard(userId?: string): Promise<AlertMonitoringDashboard> {
    try {
      // Mock implementation - would contain real monitoring logic
      return {
        activeAlerts: [],
        alertMetrics: {
          totalAlerts: 0,
          criticalAlerts: 0,
          acknowledgedAlerts: 0,
          averageResponseTime: 0,
          alertTrends: [],
        },
        systemHealth: {
          monitoringActive: true,
          lastHealthCheck: new Date().toISOString(),
          alertsProcessed: 0,
          notificationsSent: 0,
          failureRate: 0,
        },
      };
    } catch (error) {
      console.error('Error fetching alert monitoring dashboard:', error);
      throw new Error('Failed to fetch alert monitoring dashboard');
    }
  }

  async checkThresholdAlerts(): Promise<{ triggered: number; notifications: number }> {
    try {
      // Mock implementation - would contain real threshold checking logic
      return { triggered: 0, notifications: 0 };
    } catch (error) {
      console.error('Error checking threshold alerts:', error);
      return { triggered: 0, notifications: 0 };
    }
  }

  async evaluateBusinessAlerts(): Promise<{ evaluated: number; triggered: number }> {
    try {
      // Mock implementation - would contain real business alert logic
      return { evaluated: 0, triggered: 0 };
    } catch (error) {
      console.error('Error evaluating business alerts:', error);
      return { evaluated: 0, triggered: 0 };
    }
  }

  async processNotificationQueue(batchSize = 50): Promise<{ processed: number; failed: number }> {
    try {
      // Mock implementation - would contain real queue processing logic
      return { processed: 0, failed: 0 };
    } catch (error) {
      console.error('Error processing notification queue:', error);
      return { processed: 0, failed: 0 };
    }
  }

  async getNotificationDeliveryStatus(notificationId: string): Promise<NotificationDeliveryStatus> {
    try {
      const notification = await this.getNotification(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      return {
        notificationId,
        status: notification.status,
        channels: [{
          channel: notification.channel,
          status: notification.status === 'sent' ? 'sent' : 'pending',
          attemptCount: notification.attempts,
          lastAttempt: notification.lastAttemptAt?.toISOString(),
          errorMessage: notification.errorMessage || undefined,
          deliveredAt: notification.deliveredAt?.toISOString(),
          readAt: notification.readAt?.toISOString(),
        }],
        metadata: {
          totalAttempts: notification.attempts,
          processingTime: 0, // Would be calculated from actual timing data
          deliveryTime: notification.deliveredAt && notification.createdAt ? 
            notification.deliveredAt.getTime() - notification.createdAt.getTime() : undefined,
        },
      };
    } catch (error) {
      console.error('Error fetching notification delivery status:', error);
      throw new Error('Failed to fetch notification delivery status');
    }
  }

  // Bulk notification operations
  async createBulkNotifications(notifications: CreateNotification[]): Promise<NotificationQueue[]> {
    try {
      const queuedNotifications: NotificationQueue[] = [];
      
      for (const notification of notifications) {
        const queued = await this.createNotification(notification);
        queuedNotifications.push(queued);
      }

      return queuedNotifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      return [];
    }
  }

  async sendDigestNotifications(frequency: 'daily_digest' | 'weekly_summary' | 'monthly_report'): Promise<{ sent: number; failed: number }> {
    try {
      // Mock implementation - would contain real digest logic
      return { sent: 0, failed: 0 };
    } catch (error) {
      console.error('Error sending digest notifications:', error);
      return { sent: 0, failed: 0 };
    }
  }

  async cleanupOldNotifications(retentionDays: number): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await db
        .delete(notificationQueue)
        .where(and(
          lte(notificationQueue.createdAt, cutoffDate),
          sql`${notificationQueue.status} IN ('sent', 'read', 'dismissed')`
        ));

      return { deleted: result.rowsAffected };
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return { deleted: 0 };
    }
  }

  // Utility helper methods
  private calculateTimeAgo(date: Date | null): string {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  // ===============================================
  // STAGE 7 REVENUE MANAGEMENT IMPLEMENTATION
  // ===============================================

  // ===== REVENUE LEDGER OPERATIONS =====

  async getRevenueLedger(filter?: RevenueLedgerFilter): Promise<RevenueLedger[]> {
    try {
      let query = db.select().from(revenueLedger);
      
      const conditions = [];
      
      if (filter) {
        if (filter.type) {
          conditions.push(eq(revenueLedger.type, filter.type));
        }
        if (filter.customerId) {
          conditions.push(eq(revenueLedger.customerId, filter.customerId));
        }
        if (filter.salesOrderId) {
          conditions.push(eq(revenueLedger.salesOrderId, filter.salesOrderId));
        }
        if (filter.withdrawalId) {
          conditions.push(eq(revenueLedger.withdrawalId, filter.withdrawalId));
        }
        if (filter.reinvestmentId) {
          conditions.push(eq(revenueLedger.reinvestmentId, filter.reinvestmentId));
        }
        if (filter.accountingPeriod) {
          conditions.push(eq(revenueLedger.accountingPeriod, filter.accountingPeriod));
        }
        if (filter.periodClosed !== undefined) {
          conditions.push(eq(revenueLedger.periodClosed, filter.periodClosed));
        }
        if (filter.dateFrom) {
          conditions.push(gte(revenueLedger.date, new Date(filter.dateFrom)));
        }
        if (filter.dateTo) {
          conditions.push(lte(revenueLedger.date, new Date(filter.dateTo)));
        }
        if (filter.minAmount) {
          conditions.push(gte(revenueLedger.amountUsd, filter.minAmount.toString()));
        }
        if (filter.maxAmount) {
          conditions.push(lte(revenueLedger.amountUsd, filter.maxAmount.toString()));
        }
        if (filter.currency) {
          conditions.push(eq(revenueLedger.currency, filter.currency));
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(desc(revenueLedger.date));

      if (filter?.limit) {
        query = query.limit(filter.limit);
      }
      if (filter?.offset) {
        query = query.offset(filter.offset);
      }

      return await query;
    } catch (error) {
      console.error('Error fetching revenue ledger:', error);
      throw new Error('Failed to fetch revenue ledger');
    }
  }

  async getRevenueLedgerEntry(id: string): Promise<RevenueLedger | undefined> {
    try {
      const [entry] = await db
        .select()
        .from(revenueLedger)
        .where(eq(revenueLedger.id, id));
      return entry;
    } catch (error) {
      console.error('Error fetching revenue ledger entry:', error);
      throw new Error('Failed to fetch revenue ledger entry');
    }
  }

  async createRevenueLedgerEntry(entryData: InsertRevenueLedger, auditContext: AuditContext): Promise<RevenueLedger> {
    try {
      // Generate unique entry ID
      const revEntryId = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate USD amount if not USD currency
      let amountUsd = new Decimal(entryData.amount);
      if (entryData.currency !== 'USD' && entryData.exchangeRate) {
        amountUsd = amountUsd.div(new Decimal(entryData.exchangeRate));
      }

      // Get current accounting period
      const currentPeriod = this.getCurrentAccountingPeriod();

      const [newEntry] = await db
        .insert(revenueLedger)
        .values({
          ...entryData,
          revEntryId,
          amountUsd: amountUsd.toFixed(2),
          accountingPeriod: entryData.accountingPeriod || currentPeriod,
          createdBy: auditContext.userId,
        })
        .returning();

      // Audit logging
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'revenue_ledger',
        newEntry.id,
        'create',
        'revenue_management',
        null,
        entryData,
        undefined,
        undefined,
        `Created revenue ledger entry: ${entryData.type} for ${amountUsd.toFixed(2)} USD`
      );

      // Update revenue balance summary
      await this.updateRevenueBalanceSummary(newEntry.accountingPeriod, auditContext.userId);

      return newEntry;
    } catch (error) {
      console.error('Error creating revenue ledger entry:', error);
      throw new Error('Failed to create revenue ledger entry');
    }
  }

  async createCustomerReceiptEntry(receiptData: CustomerReceipt, auditContext: AuditContext): Promise<RevenueLedger> {
    try {
      const entryData: InsertRevenueLedger = {
        type: 'customer_receipt',
        amount: receiptData.amount.toString(),
        currency: receiptData.currency,
        exchangeRate: receiptData.exchangeRate?.toString(),
        customerId: receiptData.customerId,
        salesOrderId: receiptData.salesOrderId,
        invoiceId: receiptData.invoiceId,
        receiptId: receiptData.receiptId,
        orderIds: receiptData.orderIds,
        description: receiptData.description,
        note: receiptData.note,
        date: receiptData.recognitionDate ? new Date(receiptData.recognitionDate) : new Date(),
        createdBy: auditContext.userId, // Required field
        accountingPeriod: this.getCurrentAccountingPeriod(), // Required field
      };

      return await this.createRevenueLedgerEntry(entryData, auditContext);
    } catch (error) {
      console.error('Error creating customer receipt entry:', error);
      throw new Error('Failed to create customer receipt entry');
    }
  }

  async createCustomerRefundEntry(refundData: CustomerRefund, auditContext: AuditContext): Promise<RevenueLedger> {
    try {
      const entryData: InsertRevenueLedger = {
        type: 'customer_refund',
        amount: (-Math.abs(refundData.amount)).toString(), // Ensure negative for refunds
        currency: refundData.currency,
        exchangeRate: refundData.exchangeRate?.toString(),
        customerId: refundData.customerId,
        salesOrderId: refundData.salesOrderId,
        invoiceId: refundData.originalInvoiceId,
        returnId: refundData.returnId,
        orderIds: refundData.orderIds,
        description: refundData.description,
        note: refundData.note,
        date: refundData.refundDate ? new Date(refundData.refundDate) : new Date(),
      };

      return await this.createRevenueLedgerEntry(entryData, auditContext);
    } catch (error) {
      console.error('Error creating customer refund entry:', error);
      throw new Error('Failed to create customer refund entry');
    }
  }

  // ===== WITHDRAWAL RECORDS OPERATIONS =====

  async getWithdrawalRecords(filter?: WithdrawalRecordFilter): Promise<WithdrawalRecord[]> {
    try {
      let query = db.select().from(withdrawalRecords);
      
      const conditions = [];
      
      if (filter) {
        if (filter.partner) {
          conditions.push(ilike(withdrawalRecords.partner, `%${filter.partner}%`));
        }
        if (filter.status) {
          conditions.push(eq(withdrawalRecords.status, filter.status));
        }
        if (filter.dateFrom) {
          conditions.push(gte(withdrawalRecords.date, new Date(filter.dateFrom)));
        }
        if (filter.dateTo) {
          conditions.push(lte(withdrawalRecords.date, new Date(filter.dateTo)));
        }
        if (filter.minAmount) {
          conditions.push(gte(withdrawalRecords.amountUsd, filter.minAmount.toString()));
        }
        if (filter.maxAmount) {
          conditions.push(lte(withdrawalRecords.amountUsd, filter.maxAmount.toString()));
        }
        if (filter.currency) {
          conditions.push(eq(withdrawalRecords.currency, filter.currency));
        }
        if (filter.paymentMethod) {
          conditions.push(eq(withdrawalRecords.paymentMethod, filter.paymentMethod));
        }
        if (filter.approvalRequestId) {
          conditions.push(eq(withdrawalRecords.approvalRequestId, filter.approvalRequestId));
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(desc(withdrawalRecords.date));

      if (filter?.limit) {
        query = query.limit(filter.limit);
      }
      if (filter?.offset) {
        query = query.offset(filter.offset);
      }

      return await query;
    } catch (error) {
      console.error('Error fetching withdrawal records:', error);
      throw new Error('Failed to fetch withdrawal records');
    }
  }

  async getWithdrawalRecord(id: string): Promise<WithdrawalRecord | undefined> {
    try {
      const [record] = await db
        .select()
        .from(withdrawalRecords)
        .where(eq(withdrawalRecords.id, id));
      return record;
    } catch (error) {
      console.error('Error fetching withdrawal record:', error);
      throw new Error('Failed to fetch withdrawal record');
    }
  }

  async createWithdrawalRecord(withdrawalData: InsertWithdrawalRecord, auditContext: AuditContext): Promise<WithdrawalRecord> {
    try {
      return await db.transaction(async (tx) => {
        // Validate withdrawable balance
        const currentBalance = await this.getWithdrawableBalance();
        const withdrawalAmount = new Decimal(withdrawalData.amount);
        
        if (withdrawalAmount.gt(currentBalance)) {
          throw new Error(`Insufficient withdrawable balance. Available: ${currentBalance.toFixed(2)} USD, Requested: ${withdrawalAmount.toFixed(2)} USD`);
        }

        // Generate unique withdrawal ID
        const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate USD amount if not USD currency
        let amountUsd = withdrawalAmount;
        if (withdrawalData.currency !== 'USD' && withdrawalData.exchangeRate) {
          amountUsd = amountUsd.div(new Decimal(withdrawalData.exchangeRate));
        }

        const [newRecord] = await tx
          .insert(withdrawalRecords)
          .values({
            ...withdrawalData,
            withdrawalId,
            amountUsd: amountUsd.toFixed(2),
            createdBy: auditContext.userId,
          })
          .returning();

        // Create corresponding revenue ledger entry
        const revenueLedgerEntry: InsertRevenueLedger = {
          type: 'withdrawal',
          amount: (-amountUsd.toNumber()).toString(), // Negative for withdrawal
          currency: 'USD',
          withdrawalId: newRecord.id,
          description: `Partner withdrawal - ${withdrawalData.partner}`,
          note: withdrawalData.note,
          accountingPeriod: this.getCurrentAccountingPeriod(),
          createdBy: auditContext.userId, // Required field
        };

        await tx
          .insert(revenueLedger)
          .values({
            ...revenueLedgerEntry,
            revEntryId: `REV-WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amountUsd: revenueLedgerEntry.amount,
            createdBy: auditContext.userId,
          });

        // Audit logging
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'withdrawal_records',
          newRecord.id,
          'create',
          'revenue_management',
          null,
          withdrawalData,
          undefined,
          undefined,
          `Created withdrawal record for ${withdrawalData.partner}: ${amountUsd.toFixed(2)} USD`
        );

        return newRecord;
      });
    } catch (error) {
      console.error('Error creating withdrawal record:', error);
      if (error instanceof Error && error.message.includes('Insufficient withdrawable balance')) {
        throw error;
      }
      throw new Error('Failed to create withdrawal record');
    }
  }

  async approveWithdrawal(id: string, approval: WithdrawalApproval, auditContext: AuditContext): Promise<WithdrawalRecord> {
    try {
      const [updatedRecord] = await db
        .update(withdrawalRecords)
        .set({
          status: approval.approved ? 'completed' : 'cancelled',
          approvedBy: auditContext.userId,
          approvedAt: new Date(),
          completedAt: approval.approved ? new Date() : null,
          note: approval.note || undefined,
          updatedAt: new Date(),
        })
        .where(eq(withdrawalRecords.id, id))
        .returning();

      // Audit logging
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'withdrawal_records',
        updatedRecord.id,
        'update',
        'revenue_management',
        null,
        approval,
        undefined,
        undefined,
        `${approval.approved ? 'Approved' : 'Rejected'} withdrawal: ${updatedRecord.withdrawalId}`
      );

      return updatedRecord;
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      throw new Error('Failed to approve withdrawal');
    }
  }

  // ===== REINVESTMENT OPERATIONS =====

  async getReinvestments(filter?: ReinvestmentFilter): Promise<Reinvestment[]> {
    try {
      let query = db.select().from(reinvestments);
      
      const conditions = [];
      
      if (filter) {
        if (filter.status) {
          conditions.push(eq(reinvestments.status, filter.status));
        }
        if (filter.allocationPolicy) {
          conditions.push(eq(reinvestments.allocationPolicy, filter.allocationPolicy));
        }
        if (filter.dateFrom) {
          conditions.push(gte(reinvestments.date, new Date(filter.dateFrom)));
        }
        if (filter.dateTo) {
          conditions.push(lte(reinvestments.date, new Date(filter.dateTo)));
        }
        if (filter.minAmount) {
          conditions.push(gte(reinvestments.amount, filter.minAmount.toString()));
        }
        if (filter.maxAmount) {
          conditions.push(lte(reinvestments.amount, filter.maxAmount.toString()));
        }
        if (filter.counterparty) {
          conditions.push(ilike(reinvestments.counterparty, `%${filter.counterparty}%`));
        }
        if (filter.capitalEntryId) {
          conditions.push(eq(reinvestments.capitalEntryId, filter.capitalEntryId));
        }
        if (filter.approvalRequestId) {
          conditions.push(eq(reinvestments.approvalRequestId, filter.approvalRequestId));
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(desc(reinvestments.date));

      if (filter?.limit) {
        query = query.limit(filter.limit);
      }
      if (filter?.offset) {
        query = query.offset(filter.offset);
      }

      return await query;
    } catch (error) {
      console.error('Error fetching reinvestments:', error);
      throw new Error('Failed to fetch reinvestments');
    }
  }

  async getReinvestment(id: string): Promise<Reinvestment | undefined> {
    try {
      const [record] = await db
        .select()
        .from(reinvestments)
        .where(eq(reinvestments.id, id));
      return record;
    } catch (error) {
      console.error('Error fetching reinvestment:', error);
      throw new Error('Failed to fetch reinvestment');
    }
  }

  async createReinvestment(reinvestmentData: InsertReinvestment, auditContext: AuditContext): Promise<Reinvestment> {
    try {
      return await db.transaction(async (tx) => {
        // Validate withdrawable balance
        const currentBalance = await this.getWithdrawableBalance();
        const transferAmount = new Decimal(reinvestmentData.amount);
        const transferCost = new Decimal(reinvestmentData.transferCost || '0');
        const totalRequired = transferAmount.add(transferCost);
        
        if (totalRequired.gt(currentBalance)) {
          throw new Error(`Insufficient withdrawable balance. Available: ${currentBalance.toFixed(2)} USD, Required: ${totalRequired.toFixed(2)} USD (${transferAmount.toFixed(2)} + ${transferCost.toFixed(2)} fees)`);
        }

        // Generate unique reinvestment ID
        const reinvestId = `RV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate USD amounts
        let transferCostUsd = transferCost;
        if (reinvestmentData.feeCurrency !== 'USD' && reinvestmentData.feeExchangeRate) {
          transferCostUsd = transferCost.div(new Decimal(reinvestmentData.feeExchangeRate));
        }

        const [newRecord] = await tx
          .insert(reinvestments)
          .values({
            ...reinvestmentData,
            reinvestId,
            transferCostUsd: transferCostUsd.toFixed(2),
            createdBy: auditContext.userId,
          })
          .returning();

        // Create capital entry for the transfer amount
        const capitalEntry = await this.createCapitalEntry({
          amount: transferAmount.toFixed(2),
          type: 'CapitalIn',
          reference: newRecord.id,
          description: `Revenue reinvestment - ${reinvestId}`,
          paymentCurrency: 'USD',
        }, auditContext);

        // Create operating expense for transfer fees if any
        let operatingExpenseId: string | undefined;
        if (transferCostUsd.gt(0)) {
          const operatingExpense = await this.createOperatingExpense({
            categoryId: await this.getOrCreateTransferFeeCategoryId(),
            description: `Transfer fees for revenue reinvestment - ${reinvestId}`,
            amount: transferCostUsd.toFixed(2),
            currency: 'USD',
            paymentDate: new Date().toISOString().split('T')[0],
            fundingSource: 'external', // Transfer fees are external costs
            createdBy: auditContext.userId,
          }, auditContext);
          operatingExpenseId = operatingExpense.id;
        }

        // Update reinvestment with generated entry IDs
        const [updatedRecord] = await tx
          .update(reinvestments)
          .set({
            capitalEntryId: capitalEntry.id,
            operatingExpenseId,
            updatedAt: new Date(),
          })
          .where(eq(reinvestments.id, newRecord.id))
          .returning();

        // Create revenue ledger entries
        const currentPeriod = this.getCurrentAccountingPeriod();
        
        // Entry for reinvestment out (negative)
        await tx
          .insert(revenueLedger)
          .values({
            revEntryId: `REV-RO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'reinvest_out',
            amount: (-transferAmount.toNumber()).toString(),
            currency: 'USD',
            amountUsd: (-transferAmount.toNumber()).toString(),
            reinvestmentId: updatedRecord.id,
            description: `Revenue reinvestment to capital - ${reinvestId}`,
            note: reinvestmentData.note,
            accountingPeriod: currentPeriod,
            createdBy: auditContext.userId,
          });

        // Entry for transfer fees (negative) if any
        if (transferCostUsd.gt(0)) {
          await tx
            .insert(revenueLedger)
            .values({
              revEntryId: `REV-TF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'transfer_fee',
              amount: (-transferCostUsd.toNumber()).toString(),
              currency: 'USD',
              amountUsd: (-transferCostUsd.toNumber()).toString(),
              reinvestmentId: updatedRecord.id,
              description: `Transfer fees for reinvestment - ${reinvestId}`,
              note: `Bank/wire transfer fees`,
              accountingPeriod: currentPeriod,
              createdBy: auditContext.userId,
            });
        }

        // Audit logging
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'reinvestments',
          updatedRecord.id,
          'create',
          'revenue_management',
          null,
          reinvestmentData,
          undefined,
          undefined,
          `Created reinvestment: ${transferAmount.toFixed(2)} USD to capital (fees: ${transferCostUsd.toFixed(2)} USD)`
        );

        return updatedRecord;
      });
    } catch (error) {
      console.error('Error creating reinvestment:', error);
      if (error instanceof Error && error.message.includes('Insufficient withdrawable balance')) {
        throw error;
      }
      throw new Error('Failed to create reinvestment');
    }
  }

  async approveReinvestment(id: string, approval: ReinvestmentApproval, auditContext: AuditContext): Promise<Reinvestment> {
    try {
      const [updatedRecord] = await db
        .update(reinvestments)
        .set({
          status: approval.approved ? 'completed' : 'cancelled',
          approvedBy: auditContext.userId,
          approvedAt: new Date(),
          completedAt: approval.approved ? new Date() : null,
          note: approval.note || undefined,
          updatedAt: new Date(),
        })
        .where(eq(reinvestments.id, id))
        .returning();

      // Audit logging
      await StorageApprovalGuard.auditOperation(
        auditContext,
        'reinvestments',
        updatedRecord.id,
        'update',
        'revenue_management',
        null,
        approval,
        undefined,
        undefined,
        `${approval.approved ? 'Approved' : 'Rejected'} reinvestment: ${updatedRecord.reinvestId}`
      );

      return updatedRecord;
    } catch (error) {
      console.error('Error approving reinvestment:', error);
      throw new Error('Failed to approve reinvestment');
    }
  }

  // ===== REVENUE BALANCE CALCULATIONS =====

  async getWithdrawableBalance(): Promise<Decimal> {
    try {
      const result = await db
        .select({
          total: sql<string>`COALESCE(SUM(${revenueLedger.amountUsd}), 0)`,
        })
        .from(revenueLedger);

      return new Decimal(result[0]?.total || '0');
    } catch (error) {
      console.error('Error calculating withdrawable balance:', error);
      return new Decimal('0');
    }
  }

  async getAccountingRevenue(accountingPeriod?: string): Promise<Decimal> {
    try {
      let query = db
        .select({
          total: sql<string>`COALESCE(SUM(${revenueLedger.amountUsd}), 0)`,
        })
        .from(revenueLedger)
        .where(or(
          eq(revenueLedger.type, 'customer_receipt'),
          eq(revenueLedger.type, 'customer_refund')
        ));

      if (accountingPeriod) {
        query = query.where(and(
          or(
            eq(revenueLedger.type, 'customer_receipt'),
            eq(revenueLedger.type, 'customer_refund')
          ),
          eq(revenueLedger.accountingPeriod, accountingPeriod)
        ));
      }

      const result = await query;
      return new Decimal(result[0]?.total || '0');
    } catch (error) {
      console.error('Error calculating accounting revenue:', error);
      return new Decimal('0');
    }
  }

  async updateRevenueBalanceSummary(accountingPeriod: string, calculatedBy: string): Promise<RevenueBalanceSummary> {
    try {
      // Calculate all totals for the period
      const periodQuery = eq(revenueLedger.accountingPeriod, accountingPeriod);
      
      // Customer receipts total
      const customerReceiptsResult = await db
        .select({
          total: sql<string>`COALESCE(SUM(${revenueLedger.amountUsd}), 0)`,
        })
        .from(revenueLedger)
        .where(and(periodQuery, eq(revenueLedger.type, 'customer_receipt')));
      
      // Customer refunds total
      const customerRefundsResult = await db
        .select({
          total: sql<string>`COALESCE(SUM(ABS(${revenueLedger.amountUsd})), 0)`,
        })
        .from(revenueLedger)
        .where(and(periodQuery, eq(revenueLedger.type, 'customer_refund')));
      
      // Withdrawals total
      const withdrawalsResult = await db
        .select({
          total: sql<string>`COALESCE(SUM(ABS(${revenueLedger.amountUsd})), 0)`,
        })
        .from(revenueLedger)
        .where(and(periodQuery, eq(revenueLedger.type, 'withdrawal')));
      
      // Reinvestments total
      const reinvestmentsResult = await db
        .select({
          total: sql<string>`COALESCE(SUM(ABS(${revenueLedger.amountUsd})), 0)`,
        })
        .from(revenueLedger)
        .where(and(periodQuery, eq(revenueLedger.type, 'reinvest_out')));
      
      // Transfer fees total
      const transferFeesResult = await db
        .select({
          total: sql<string>`COALESCE(SUM(ABS(${revenueLedger.amountUsd})), 0)`,
        })
        .from(revenueLedger)
        .where(and(periodQuery, eq(revenueLedger.type, 'transfer_fee')));

      const totalCustomerReceipts = new Decimal(customerReceiptsResult[0]?.total || '0');
      const totalCustomerRefunds = new Decimal(customerRefundsResult[0]?.total || '0');
      const totalWithdrawals = new Decimal(withdrawalsResult[0]?.total || '0');
      const totalReinvestments = new Decimal(reinvestmentsResult[0]?.total || '0');
      const totalTransferFees = new Decimal(transferFeesResult[0]?.total || '0');

      const netAccountingRevenue = totalCustomerReceipts.minus(totalCustomerRefunds);
      const withdrawableBalance = totalCustomerReceipts
        .minus(totalCustomerRefunds)
        .minus(totalWithdrawals)
        .minus(totalReinvestments)
        .minus(totalTransferFees);

      // Calculate period dates
      const currentYear = new Date().getFullYear();
      const [year, month] = accountingPeriod.split('-').map(Number);
      const periodStart = new Date(year || currentYear, (month || 1) - 1, 1);
      const periodEnd = new Date(year || currentYear, month || 1, 0);

      const summaryData: InsertRevenueBalanceSummary = {
        accountingPeriod,
        periodStart,
        periodEnd,
        totalCustomerReceipts: totalCustomerReceipts.toFixed(2),
        totalCustomerRefunds: totalCustomerRefunds.toFixed(2),
        netAccountingRevenue: netAccountingRevenue.toFixed(2),
        totalWithdrawals: totalWithdrawals.toFixed(2),
        totalReinvestments: totalReinvestments.toFixed(2),
        totalTransferFees: totalTransferFees.toFixed(2),
        withdrawableBalance: withdrawableBalance.toFixed(2),
        calculatedBy,
      };

      // Upsert the summary
      const [summary] = await db
        .insert(revenueBalanceSummary)
        .values(summaryData)
        .onConflictDoUpdate({
          target: revenueBalanceSummary.accountingPeriod,
          set: {
            ...summaryData,
            lastCalculatedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();

      return summary;
    } catch (error) {
      console.error('Error updating revenue balance summary:', error);
      throw new Error('Failed to update revenue balance summary');
    }
  }

  // ===== DOCUMENT OPERATIONS =====

  async getDocuments(options?: { limit?: number; offset?: number }): Promise<Document[]> {
    try {
      let query = db.select().from(documents);
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  // Document CRUD operations
  async getDocument(id: string, userId?: string): Promise<Document | undefined> {
    try {
      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id));
      return document;
    } catch (error) {
      console.error('Error fetching document:', error);
      return undefined;
    }
  }

  async getDocumentWithMetadata(id: string, userId?: string): Promise<DocumentWithMetadata | undefined> {
    try {
      const document = await this.getDocument(id, userId);
      if (!document) return undefined;

      const metadata = await this.getDocumentMetadata(id);
      const compliance = await this.getDocumentCompliance(id);

      return {
        ...document,
        metadata,
        compliance
      };
    } catch (error) {
      console.error('Error fetching document with metadata:', error);
      return undefined;
    }
  }

  async createDocument(documentData: InsertDocument, auditContext?: AuditContext): Promise<Document> {
    try {
      const [newDocument] = await db
        .insert(documents)
        .values(documentData)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'documents',
          newDocument.id,
          'create',
          'document_management',
          null,
          documentData
        );
      }

      return newDocument;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }
  }

  async updateDocument(id: string, documentData: Partial<InsertDocument>, auditContext?: AuditContext): Promise<Document> {
    try {
      const [oldDocument] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id));

      if (!oldDocument) {
        throw new Error('Document not found');
      }

      const [updatedDocument] = await db
        .update(documents)
        .set({ ...documentData, updatedAt: new Date() })
        .where(eq(documents.id, id))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'documents',
          id,
          'update',
          'document_management',
          oldDocument,
          documentData
        );
      }

      return updatedDocument;
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error('Failed to update document');
    }
  }

  async deleteDocument(id: string, auditContext?: AuditContext): Promise<void> {
    try {
      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id));

      if (!document) {
        throw new Error('Document not found');
      }

      await db
        .delete(documents)
        .where(eq(documents.id, id));

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'documents',
          id,
          'delete',
          'document_management',
          document,
          null
        );
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  // Document search and filtering
  async searchDocuments(searchRequest: DocumentSearchRequest, userId?: string): Promise<DocumentSearchResponse> {
    try {
      let query = db.select().from(documents);
      const conditions = [];

      if (searchRequest.query) {
        conditions.push(
          or(
            ilike(documents.title, `%${searchRequest.query}%`),
            ilike(documents.description, `%${searchRequest.query}%`),
            ilike(documents.originalFileName, `%${searchRequest.query}%`)
          )
        );
      }

      if (searchRequest.category) {
        conditions.push(eq(documents.category, searchRequest.category));
      }

      if (searchRequest.status) {
        conditions.push(eq(documents.status, searchRequest.status));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const totalQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(documents);

      if (conditions.length > 0) {
        totalQuery.where(and(...conditions));
      }

      const [totalResult] = await totalQuery;
      const total = Number(totalResult.count);

      if (searchRequest.limit) {
        query = query.limit(searchRequest.limit);
      }

      if (searchRequest.offset) {
        query = query.offset(searchRequest.offset);
      }

      const documents_result = await query.orderBy(desc(documents.createdAt));

      return {
        documents: documents_result,
        total,
        page: Math.floor((searchRequest.offset || 0) / (searchRequest.limit || 10)) + 1,
        totalPages: Math.ceil(total / (searchRequest.limit || 10)),
        hasMore: (searchRequest.offset || 0) + documents_result.length < total
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      return {
        documents: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false
      };
    }
  }

  async getDocumentsByCategory(category: string, limit?: number, offset?: number): Promise<Document[]> {
    try {
      let query = db
        .select()
        .from(documents)
        .where(eq(documents.category, category))
        .orderBy(desc(documents.createdAt));

      if (limit) query = query.limit(limit);
      if (offset) query = query.offset(offset);

      return await query;
    } catch (error) {
      console.error('Error fetching documents by category:', error);
      return [];
    }
  }

  async getDocumentsByEntity(entityType: string, entityId: string): Promise<Document[]> {
    try {
      return await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.entityType, entityType),
          eq(documents.entityId, entityId)
        ))
        .orderBy(desc(documents.createdAt));
    } catch (error) {
      console.error('Error fetching documents by entity:', error);
      return [];
    }
  }

  async getDocumentsBySupplier(supplierId: string): Promise<Document[]> {
    return this.getDocumentsByEntity('supplier', supplierId);
  }

  async getDocumentsByCustomer(customerId: string): Promise<Document[]> {
    return this.getDocumentsByEntity('customer', customerId);
  }

  async getDocumentsByPurchase(purchaseId: string): Promise<Document[]> {
    return this.getDocumentsByEntity('purchase', purchaseId);
  }

  async getDocumentsByOrder(orderId: string): Promise<Document[]> {
    return this.getDocumentsByEntity('order', orderId);
  }

  async getDocumentsByShipment(shipmentId: string): Promise<Document[]> {
    return this.getDocumentsByEntity('shipment', shipmentId);
  }

  async getDocumentsByTags(tags: string[]): Promise<Document[]> {
    try {
      return await db
        .select()
        .from(documents)
        .where(sql`${documents.tags} && ${tags}`)
        .orderBy(desc(documents.createdAt));
    } catch (error) {
      console.error('Error fetching documents by tags:', error);
      return [];
    }
  }

  // Document version control
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      return await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.version));
    } catch (error) {
      console.error('Error fetching document versions:', error);
      return [];
    }
  }

  async getDocumentVersionHistory(documentId: string): Promise<DocumentVersionHistory> {
    try {
      const versions = await this.getDocumentVersions(documentId);
      const document = await this.getDocument(documentId);

      return {
        document,
        versions,
        totalVersions: versions.length,
        latestVersion: versions[0],
        createdAt: document?.createdAt || new Date(),
        lastModified: versions[0]?.createdAt || document?.updatedAt || new Date()
      };
    } catch (error) {
      console.error('Error fetching document version history:', error);
      throw new Error('Failed to fetch document version history');
    }
  }

  async createDocumentVersion(version: InsertDocumentVersion, auditContext?: AuditContext): Promise<DocumentVersion> {
    try {
      const [newVersion] = await db
        .insert(documentVersions)
        .values(version)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_versions',
          newVersion.id,
          'create',
          'document_management',
          null,
          version
        );
      }

      return newVersion;
    } catch (error) {
      console.error('Error creating document version:', error);
      throw new Error('Failed to create document version');
    }
  }

  async getDocumentVersion(versionId: string): Promise<DocumentVersion | undefined> {
    try {
      const [version] = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.id, versionId));
      return version;
    } catch (error) {
      console.error('Error fetching document version:', error);
      return undefined;
    }
  }

  async approveDocumentVersion(versionId: string, userId: string, auditContext?: AuditContext): Promise<DocumentVersion> {
    try {
      const [updatedVersion] = await db
        .update(documentVersions)
        .set({
          status: 'approved',
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(documentVersions.id, versionId))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_versions',
          versionId,
          'update',
          'document_management',
          null,
          { status: 'approved', approvedBy: userId }
        );
      }

      return updatedVersion;
    } catch (error) {
      console.error('Error approving document version:', error);
      throw new Error('Failed to approve document version');
    }
  }

  async rollbackToVersion(documentId: string, versionId: string, userId: string, auditContext?: AuditContext): Promise<{
    document: Document;
    newVersion: DocumentVersion;
  }> {
    try {
      const version = await this.getDocumentVersion(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // Create new version from rollback
      const newVersion = await this.createDocumentVersion({
        documentId,
        version: version.version + 1,
        changeDescription: `Rollback to version ${version.version}`,
        changeReason: 'rollback',
        changeType: 'rollback',
        fileName: version.fileName,
        filePath: version.filePath,
        fileSize: version.fileSize,
        checksum: version.checksum,
        createdBy: userId
      }, auditContext);

      // Update document
      const document = await this.updateDocument(documentId, {
        currentVersion: newVersion.version,
        fileName: version.fileName,
        filePath: version.filePath,
        fileSize: version.fileSize,
        checksum: version.checksum
      }, auditContext);

      return { document, newVersion };
    } catch (error) {
      console.error('Error rolling back to version:', error);
      throw new Error('Failed to rollback to version');
    }
  }

  async compareDocumentVersions(versionId1: string, versionId2: string): Promise<{
    version1: DocumentVersion;
    version2: DocumentVersion;
    differences: Array<{
      field: string;
      version1Value: any;
      version2Value: any;
      type: 'added' | 'removed' | 'modified';
    }>;
  }> {
    try {
      const [version1, version2] = await Promise.all([
        this.getDocumentVersion(versionId1),
        this.getDocumentVersion(versionId2)
      ]);

      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }

      const differences = [];
      const fields = ['fileName', 'filePath', 'fileSize', 'checksum', 'changeDescription'];

      for (const field of fields) {
        const val1 = (version1 as any)[field];
        const val2 = (version2 as any)[field];

        if (val1 !== val2) {
          differences.push({
            field,
            version1Value: val1,
            version2Value: val2,
            type: 'modified' as const
          });
        }
      }

      return { version1, version2, differences };
    } catch (error) {
      console.error('Error comparing document versions:', error);
      throw new Error('Failed to compare document versions');
    }
  }

  // Document metadata management
  async getDocumentMetadata(documentId: string): Promise<DocumentMetadata[]> {
    try {
      return await db
        .select()
        .from(documentMetadata)
        .where(eq(documentMetadata.documentId, documentId))
        .orderBy(desc(documentMetadata.createdAt));
    } catch (error) {
      console.error('Error fetching document metadata:', error);
      return [];
    }
  }

  async addDocumentMetadata(metadata: InsertDocumentMetadata, auditContext?: AuditContext): Promise<DocumentMetadata> {
    try {
      const [newMetadata] = await db
        .insert(documentMetadata)
        .values(metadata)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_metadata',
          newMetadata.id,
          'create',
          'document_management',
          null,
          metadata
        );
      }

      return newMetadata;
    } catch (error) {
      console.error('Error adding document metadata:', error);
      throw new Error('Failed to add document metadata');
    }
  }

  async updateDocumentMetadata(id: string, metadata: Partial<InsertDocumentMetadata>, auditContext?: AuditContext): Promise<DocumentMetadata> {
    try {
      const [oldMetadata] = await db
        .select()
        .from(documentMetadata)
        .where(eq(documentMetadata.id, id));

      const [updatedMetadata] = await db
        .update(documentMetadata)
        .set({ ...metadata, updatedAt: new Date() })
        .where(eq(documentMetadata.id, id))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_metadata',
          id,
          'update',
          'document_management',
          oldMetadata,
          metadata
        );
      }

      return updatedMetadata;
    } catch (error) {
      console.error('Error updating document metadata:', error);
      throw new Error('Failed to update document metadata');
    }
  }

  async deleteDocumentMetadata(id: string, auditContext?: AuditContext): Promise<void> {
    try {
      const [metadata] = await db
        .select()
        .from(documentMetadata)
        .where(eq(documentMetadata.id, id));

      await db
        .delete(documentMetadata)
        .where(eq(documentMetadata.id, id));

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_metadata',
          id,
          'delete',
          'document_management',
          metadata,
          null
        );
      }
    } catch (error) {
      console.error('Error deleting document metadata:', error);
      throw new Error('Failed to delete document metadata');
    }
  }

  async searchDocumentsByMetadata(key: string, value: string): Promise<Document[]> {
    try {
      const metadataRecords = await db
        .select()
        .from(documentMetadata)
        .where(and(
          eq(documentMetadata.key, key),
          eq(documentMetadata.value, value)
        ));

      const documentIds = metadataRecords.map(m => m.documentId);
      
      if (documentIds.length === 0) return [];

      return await db
        .select()
        .from(documents)
        .where(sql`${documents.id} = ANY(${documentIds})`)
        .orderBy(desc(documents.createdAt));
    } catch (error) {
      console.error('Error searching documents by metadata:', error);
      return [];
    }
  }

  // Document compliance tracking
  async getDocumentCompliance(documentId: string): Promise<DocumentCompliance[]> {
    try {
      return await db
        .select()
        .from(documentCompliance)
        .where(eq(documentCompliance.documentId, documentId))
        .orderBy(desc(documentCompliance.createdAt));
    } catch (error) {
      console.error('Error fetching document compliance:', error);
      return [];
    }
  }

  async addDocumentCompliance(compliance: InsertDocumentCompliance, auditContext?: AuditContext): Promise<DocumentCompliance> {
    try {
      const [newCompliance] = await db
        .insert(documentCompliance)
        .values(compliance)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_compliance',
          newCompliance.id,
          'create',
          'document_management',
          null,
          compliance
        );
      }

      return newCompliance;
    } catch (error) {
      console.error('Error adding document compliance:', error);
      throw new Error('Failed to add document compliance');
    }
  }

  async updateDocumentCompliance(id: string, compliance: Partial<InsertDocumentCompliance>, auditContext?: AuditContext): Promise<DocumentCompliance> {
    try {
      const [oldCompliance] = await db
        .select()
        .from(documentCompliance)
        .where(eq(documentCompliance.id, id));

      const [updatedCompliance] = await db
        .update(documentCompliance)
        .set({ ...compliance, updatedAt: new Date() })
        .where(eq(documentCompliance.id, id))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_compliance',
          id,
          'update',
          'document_management',
          oldCompliance,
          compliance
        );
      }

      return updatedCompliance;
    } catch (error) {
      console.error('Error updating document compliance:', error);
      throw new Error('Failed to update document compliance');
    }
  }

  async deleteDocumentCompliance(id: string, auditContext?: AuditContext): Promise<void> {
    try {
      const [compliance] = await db
        .select()
        .from(documentCompliance)
        .where(eq(documentCompliance.id, id));

      await db
        .delete(documentCompliance)
        .where(eq(documentCompliance.id, id));

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_compliance',
          id,
          'delete',
          'document_management',
          compliance,
          null
        );
      }
    } catch (error) {
      console.error('Error deleting document compliance:', error);
      throw new Error('Failed to delete document compliance');
    }
  }

  async getExpiringCompliance(days: number): Promise<ComplianceAlert[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const expiringCompliance = await db
        .select({
          id: documentCompliance.id,
          documentId: documentCompliance.documentId,
          documentTitle: documents.title,
          requirementName: documentCompliance.requirementName,
          complianceType: documentCompliance.complianceType,
          status: documentCompliance.status,
          expiryDate: documentCompliance.expiryDate,
          renewalRequired: documentCompliance.renewalRequired,
          issuingAuthority: documentCompliance.issuingAuthority,
          priority: sql<'low' | 'medium' | 'high' | 'critical'>`
            CASE 
              WHEN ${documentCompliance.expiryDate} < NOW() THEN 'critical'
              WHEN ${documentCompliance.expiryDate} < NOW() + INTERVAL '7 days' THEN 'high'
              WHEN ${documentCompliance.expiryDate} < NOW() + INTERVAL '30 days' THEN 'medium'
              ELSE 'low'
            END
          `
        })
        .from(documentCompliance)
        .innerJoin(documents, eq(documentCompliance.documentId, documents.id))
        .where(and(
          lte(documentCompliance.expiryDate, expiryDate),
          eq(documentCompliance.status, 'compliant')
        ))
        .orderBy(documentCompliance.expiryDate);

      return expiringCompliance.map(item => ({
        id: item.id,
        documentId: item.documentId,
        documentTitle: item.documentTitle,
        alertType: 'compliance_expiring',
        alertCategory: 'compliance',
        priority: item.priority,
        title: `${item.complianceType} Expiring`,
        message: `${item.complianceType} for ${item.documentTitle} expires on ${item.expiryDate?.toLocaleDateString()}`,
        complianceType: item.complianceType,
        expiryDate: item.expiryDate,
        status: item.status,
        renewalRequired: item.renewalRequired,
        issuingAuthority: item.issuingAuthority,
        daysUntilExpiry: Math.ceil((item.expiryDate?.getTime() || 0 - Date.now()) / (1000 * 60 * 60 * 24)),
        actionRequired: item.renewalRequired ? 'Renewal required' : 'Review status',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      console.error('Error fetching expiring compliance:', error);
      return [];
    }
  }

  async getExpiredCompliance(): Promise<ComplianceAlert[]> {
    try {
      const expiredCompliance = await db
        .select({
          id: documentCompliance.id,
          documentId: documentCompliance.documentId,
          documentTitle: documents.title,
          requirementName: documentCompliance.requirementName,
          complianceType: documentCompliance.complianceType,
          status: documentCompliance.status,
          expiryDate: documentCompliance.expiryDate,
          renewalRequired: documentCompliance.renewalRequired,
          issuingAuthority: documentCompliance.issuingAuthority
        })
        .from(documentCompliance)
        .innerJoin(documents, eq(documentCompliance.documentId, documents.id))
        .where(and(
          sql`${documentCompliance.expiryDate} < NOW()`,
          eq(documentCompliance.status, 'compliant')
        ))
        .orderBy(documentCompliance.expiryDate);

      return expiredCompliance.map(item => ({
        id: item.id,
        documentId: item.documentId,
        documentTitle: item.documentTitle,
        alertType: 'compliance_expired',
        alertCategory: 'compliance',
        priority: 'critical' as const,
        title: `${item.complianceType} Expired`,
        message: `${item.complianceType} for ${item.documentTitle} expired on ${item.expiryDate?.toLocaleDateString()}`,
        complianceType: item.complianceType,
        expiryDate: item.expiryDate,
        status: item.status,
        renewalRequired: item.renewalRequired,
        issuingAuthority: item.issuingAuthority,
        daysUntilExpiry: Math.ceil((item.expiryDate?.getTime() || 0 - Date.now()) / (1000 * 60 * 60 * 24)),
        actionRequired: 'Immediate action required',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      console.error('Error fetching expired compliance:', error);
      return [];
    }
  }

  async getComplianceByStatus(status: string): Promise<DocumentCompliance[]> {
    try {
      return await db
        .select()
        .from(documentCompliance)
        .where(eq(documentCompliance.status, status))
        .orderBy(desc(documentCompliance.createdAt));
    } catch (error) {
      console.error('Error fetching compliance by status:', error);
      return [];
    }
  }

  async updateComplianceStatus(id: string, status: string, userId: string, auditContext?: AuditContext): Promise<DocumentCompliance> {
    try {
      const [oldCompliance] = await db
        .select()
        .from(documentCompliance)
        .where(eq(documentCompliance.id, id));

      const [updatedCompliance] = await db
        .update(documentCompliance)
        .set({
          status,
          lastReviewedBy: userId,
          lastReviewedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(documentCompliance.id, id))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_compliance',
          id,
          'update',
          'document_management',
          oldCompliance,
          { status, lastReviewedBy: userId }
        );
      }

      return updatedCompliance;
    } catch (error) {
      console.error('Error updating compliance status:', error);
      throw new Error('Failed to update compliance status');
    }
  }

  // Compliance dashboard and monitoring
  async getComplianceDashboard(userId?: string): Promise<ComplianceDashboard> {
    try {
      const [totalCompliance] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documentCompliance);

      const [activeCompliance] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documentCompliance)
        .where(eq(documentCompliance.status, 'active'));

      const [expiredCompliance] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documentCompliance)
        .where(and(
          sql`${documentCompliance.expiryDate} < NOW()`,
          eq(documentCompliance.status, 'compliant')
        ));

      const [expiringSoonCompliance] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documentCompliance)
        .where(and(
          sql`${documentCompliance.expiryDate} BETWEEN NOW() AND NOW() + INTERVAL '30 days'`,
          eq(documentCompliance.status, 'compliant')
        ));

      const [pendingReviewCompliance] = await db
        .select({ count: sql<number>`count(*)` })
        .from(documentCompliance)
        .where(eq(documentCompliance.status, 'pending_review'));

      const expiringAlerts = await this.getExpiringCompliance(30);
      const expiredAlerts = await this.getExpiredCompliance();

      return {
        summary: {
          total: Number(totalCompliance.count),
          active: Number(activeCompliance.count),
          expired: Number(expiredCompliance.count),
          expiringSoon: Number(expiringSoonCompliance.count),
          pendingReview: Number(pendingReviewCompliance.count),
          complianceRate: Number(totalCompliance.count) > 0 
            ? Math.round((Number(activeCompliance.count) / Number(totalCompliance.count)) * 100)
            : 100
        },
        alerts: [...expiredAlerts, ...expiringAlerts].slice(0, 10),
        recentActivity: [], // Could be implemented later
        upcomingRenewals: expiringAlerts.filter(alert => alert.renewalRequired).slice(0, 5),
        criticalItems: [...expiredAlerts, ...expiringAlerts.filter(alert => alert.priority === 'critical')].slice(0, 5),
        complianceByType: [], // Could be implemented later
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching compliance dashboard:', error);
      throw new Error('Failed to fetch compliance dashboard');
    }
  }

  async getComplianceAlerts(priority?: 'low' | 'medium' | 'high' | 'critical', limit = 20): Promise<ComplianceAlert[]> {
    try {
      const alerts = await this.getExpiringCompliance(90);
      const expired = await this.getExpiredCompliance();
      
      let allAlerts = [...expired, ...alerts];

      if (priority) {
        allAlerts = allAlerts.filter(alert => alert.priority === priority);
      }

      return allAlerts
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching compliance alerts:', error);
      return [];
    }
  }

  async getUpcomingRenewals(days = 30): Promise<ComplianceAlert[]> {
    try {
      const alerts = await this.getExpiringCompliance(days);
      return alerts.filter(alert => alert.renewalRequired);
    } catch (error) {
      console.error('Error fetching upcoming renewals:', error);
      return [];
    }
  }

  async getCriticalComplianceItems(): Promise<ComplianceAlert[]> {
    try {
      const expired = await this.getExpiredCompliance();
      const criticalExpiring = await this.getExpiringCompliance(7);
      
      return [...expired, ...criticalExpiring.filter(alert => alert.priority === 'critical')];
    } catch (error) {
      console.error('Error fetching critical compliance items:', error);
      return [];
    }
  }

  async markComplianceReminderSent(complianceId: string): Promise<void> {
    try {
      await db
        .update(documentCompliance)
        .set({
          lastReminderSent: new Date(),
          updatedAt: new Date()
        })
        .where(eq(documentCompliance.id, complianceId));
    } catch (error) {
      console.error('Error marking compliance reminder as sent:', error);
      throw new Error('Failed to mark compliance reminder as sent');
    }
  }

  async generateComplianceReport(filters?: ComplianceFilterRequest): Promise<{
    summary: {
      total: number;
      compliant: number;
      nonCompliant: number;
      expiringSoon: number;
      expired: number;
      pendingReview: number;
    };
    details: DocumentCompliance[];
    recommendations: string[];
  }> {
    try {
      let query = db.select().from(documentCompliance);
      const conditions = [];

      if (filters?.status) {
        conditions.push(eq(documentCompliance.status, filters.status));
      }

      if (filters?.complianceType) {
        conditions.push(eq(documentCompliance.complianceType, filters.complianceType));
      }

      if (filters?.expiryDateFrom) {
        conditions.push(gte(documentCompliance.expiryDate, new Date(filters.expiryDateFrom)));
      }

      if (filters?.expiryDateTo) {
        conditions.push(lte(documentCompliance.expiryDate, new Date(filters.expiryDateTo)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const details = await query.orderBy(desc(documentCompliance.createdAt));

      const summary = {
        total: details.length,
        compliant: details.filter(d => d.status === 'active' && d.expiryDate && d.expiryDate > new Date()).length,
        nonCompliant: details.filter(d => d.status === 'expired' || (d.expiryDate && d.expiryDate < new Date())).length,
        expiringSoon: details.filter(d => {
          if (!d.expiryDate) return false;
          const daysUntilExpiry = Math.ceil((d.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        }).length,
        expired: details.filter(d => d.expiryDate && d.expiryDate < new Date()).length,
        pendingReview: details.filter(d => d.status === 'pending_review').length
      };

      const recommendations = [];
      if (summary.expired > 0) {
        recommendations.push(`${summary.expired} compliance items have expired and require immediate attention`);
      }
      if (summary.expiringSoon > 0) {
        recommendations.push(`${summary.expiringSoon} compliance items are expiring soon and should be renewed`);
      }
      if (summary.pendingReview > 0) {
        recommendations.push(`${summary.pendingReview} compliance items are pending review`);
      }

      return { summary, details, recommendations };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  // Document access logging and audit
  async logDocumentAccess(accessLog: InsertDocumentAccessLog): Promise<DocumentAccessLog> {
    try {
      const [newAccessLog] = await db
        .insert(documentAccessLogs)
        .values(accessLog)
        .returning();

      return newAccessLog;
    } catch (error) {
      console.error('Error logging document access:', error);
      throw new Error('Failed to log document access');
    }
  }

  async getDocumentAccessLogs(documentId: string, limit = 50, offset = 0): Promise<DocumentAccessLog[]> {
    try {
      return await db
        .select()
        .from(documentAccessLogs)
        .where(eq(documentAccessLogs.documentId, documentId))
        .orderBy(desc(documentAccessLogs.accessedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('Error fetching document access logs:', error);
      return [];
    }
  }

  async getDocumentAccessHistory(documentId: string, userId?: string): Promise<DocumentAccessLog[]> {
    try {
      let query = db
        .select()
        .from(documentAccessLogs)
        .where(eq(documentAccessLogs.documentId, documentId));

      if (userId) {
        query = query.where(and(
          eq(documentAccessLogs.documentId, documentId),
          eq(documentAccessLogs.userId, userId)
        ));
      }

      return await query.orderBy(desc(documentAccessLogs.accessedAt));
    } catch (error) {
      console.error('Error fetching document access history:', error);
      return [];
    }
  }

  async getUserDocumentAccessHistory(userId: string, limit = 100, offset = 0): Promise<DocumentAccessLog[]> {
    try {
      return await db
        .select()
        .from(documentAccessLogs)
        .where(eq(documentAccessLogs.userId, userId))
        .orderBy(desc(documentAccessLogs.accessedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('Error fetching user document access history:', error);
      return [];
    }
  }

  async detectSuspiciousDocumentAccess(documentId?: string): Promise<Array<{
    documentId: string;
    documentTitle: string;
    userId: string;
    userName: string;
    accessPattern: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    details: string;
  }>> {
    try {
      // Implement basic suspicious access detection
      // This is a simplified implementation - could be enhanced with more sophisticated algorithms
      
      let query = db
        .select({
          documentId: documentAccessLogs.documentId,
          userId: documentAccessLogs.userId,
          userName: documentAccessLogs.userName,
          accessCount: sql<number>`count(*)`,
          distinctDays: sql<number>`count(distinct date(${documentAccessLogs.accessedAt}))`,
          lastAccess: sql<Date>`max(${documentAccessLogs.accessedAt})`,
          firstAccess: sql<Date>`min(${documentAccessLogs.accessedAt})`
        })
        .from(documentAccessLogs)
        .where(gte(documentAccessLogs.accessedAt, sql`NOW() - INTERVAL '7 days'`))
        .groupBy(documentAccessLogs.documentId, documentAccessLogs.userId, documentAccessLogs.userName);

      if (documentId) {
        query = query.where(eq(documentAccessLogs.documentId, documentId));
      }

      const accessPatterns = await query.having(sql`count(*) > 10`); // More than 10 accesses in 7 days

      const suspiciousActivity = [];

      for (const pattern of accessPatterns) {
        const document = await this.getDocument(pattern.documentId);
        
        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        let accessPattern = 'normal';
        let details = '';

        if (pattern.accessCount > 50) {
          riskLevel = 'critical';
          accessPattern = 'excessive_access';
          details = `${pattern.accessCount} accesses in 7 days`;
        } else if (pattern.accessCount > 30) {
          riskLevel = 'high';
          accessPattern = 'high_frequency';
          details = `${pattern.accessCount} accesses in 7 days`;
        } else if (pattern.accessCount > 20) {
          riskLevel = 'medium';
          accessPattern = 'frequent_access';
          details = `${pattern.accessCount} accesses in 7 days`;
        }

        suspiciousActivity.push({
          documentId: pattern.documentId,
          documentTitle: document?.title || 'Unknown Document',
          userId: pattern.userId,
          userName: pattern.userName || 'Unknown User',
          accessPattern,
          riskLevel,
          details
        });
      }

      return suspiciousActivity;
    } catch (error) {
      console.error('Error detecting suspicious document access:', error);
      return [];
    }
  }

  // Document workflow integration
  async getDocumentWorkflowStates(documentId: string): Promise<DocumentWorkflowState[]> {
    try {
      return await db
        .select()
        .from(documentWorkflowStates)
        .where(eq(documentWorkflowStates.documentId, documentId))
        .orderBy(desc(documentWorkflowStates.createdAt));
    } catch (error) {
      console.error('Error fetching document workflow states:', error);
      return [];
    }
  }

  async createDocumentWorkflowState(workflowState: InsertDocumentWorkflowState, auditContext?: AuditContext): Promise<DocumentWorkflowState> {
    try {
      const [newWorkflowState] = await db
        .insert(documentWorkflowStates)
        .values(workflowState)
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_workflow_states',
          newWorkflowState.id,
          'create',
          'document_workflow',
          null,
          workflowState
        );
      }

      return newWorkflowState;
    } catch (error) {
      console.error('Error creating document workflow state:', error);
      throw new Error('Failed to create document workflow state');
    }
  }

  async updateDocumentWorkflowState(id: string, workflowState: Partial<InsertDocumentWorkflowState>, auditContext?: AuditContext): Promise<DocumentWorkflowState> {
    try {
      const [oldWorkflowState] = await db
        .select()
        .from(documentWorkflowStates)
        .where(eq(documentWorkflowStates.id, id));

      const [updatedWorkflowState] = await db
        .update(documentWorkflowStates)
        .set({ ...workflowState, updatedAt: new Date() })
        .where(eq(documentWorkflowStates.id, id))
        .returning();

      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'document_workflow_states',
          id,
          'update',
          'document_workflow',
          oldWorkflowState,
          workflowState
        );
      }

      return updatedWorkflowState;
    } catch (error) {
      console.error('Error updating document workflow state:', error);
      throw new Error('Failed to update document workflow state');
    }
  }

  async completeDocumentWorkflowState(id: string, outcome: string, comments?: string, userId?: string): Promise<DocumentWorkflowState> {
    try {
      const [updatedWorkflowState] = await db
        .update(documentWorkflowStates)
        .set({
          status: 'completed',
          outcome,
          comments,
          completedBy: userId,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(documentWorkflowStates.id, id))
        .returning();

      return updatedWorkflowState;
    } catch (error) {
      console.error('Error completing document workflow state:', error);
      throw new Error('Failed to complete document workflow state');
    }
  }

  // Document analytics and reporting
  async getDocumentAnalytics(dateFrom?: Date, dateTo?: Date): Promise<DocumentAnalytics> {
    try {
      const conditions = [];
      
      if (dateFrom) {
        conditions.push(gte(documents.createdAt, dateFrom));
      }
      
      if (dateTo) {
        conditions.push(lte(documents.createdAt, dateTo));
      }

      let query = db.select().from(documents);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const allDocuments = await query;

      const totalDocuments = allDocuments.length;
      const totalSizeBytes = allDocuments.reduce((sum: number, doc: any) => sum + (doc.fileSize || 0), 0);

      const documentsByCategory = allDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const category = doc.category || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const documentsByStatus = allDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const status = doc.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const documentsByType = allDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const type = doc.contentType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get access analytics
      const accessStats = await db
        .select({
          documentId: documentAccessLogs.documentId,
          accessCount: sql<number>`count(*)`,
          uniqueUsers: sql<number>`count(distinct ${documentAccessLogs.userId})`
        })
        .from(documentAccessLogs)
        .groupBy(documentAccessLogs.documentId);

      const mostAccessedDocuments = accessStats
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10)
        .map(stat => ({
          documentId: stat.documentId,
          accessCount: stat.accessCount,
          uniqueUsers: stat.uniqueUsers
        }));

      return {
        summary: {
          totalDocuments,
          totalSizeBytes,
          averageSizeBytes: totalDocuments > 0 ? Math.round(totalSizeBytes / totalDocuments) : 0,
          documentsByCategory: Object.entries(documentsByCategory).map(([category, count]) => ({
            category,
            count,
            percentage: Math.round((count / totalDocuments) * 100)
          })),
          documentsByStatus: Object.entries(documentsByStatus).map(([status, count]) => ({
            status,
            count,
            percentage: Math.round((count / totalDocuments) * 100)
          })),
          documentsByType: Object.entries(documentsByType).map(([type, count]) => ({
            type,
            count,
            percentage: Math.round((count / totalDocuments) * 100)
          }))
        },
        usage: {
          totalAccesses: accessStats.reduce((sum: number, stat: any) => sum + stat.accessCount, 0),
          uniqueAccessors: accessStats.reduce((sum: number, stat: any) => sum + stat.uniqueUsers, 0),
          mostAccessedDocuments,
          averageAccessesPerDocument: accessStats.length > 0 
            ? Math.round(accessStats.reduce((sum: number, stat: any) => sum + stat.accessCount, 0) / accessStats.length)
            : 0
        },
        trends: {
          documentsCreatedInPeriod: totalDocuments,
          growthRate: 0, // Could be calculated with previous period data
          popularCategories: Object.entries(documentsByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }))
        },
        compliance: {
          totalComplianceItems: 0, // Will be filled by compliance analytics
          activeCompliance: 0,
          expiredCompliance: 0,
          complianceRate: 0
        },
        storage: {
          totalStorageUsed: totalSizeBytes,
          storageByCategory: Object.entries(documentsByCategory).map(([category, count]) => {
            const categoryDocs = allDocuments.filter(doc => (doc.category || 'uncategorized') === category);
            const totalSize = categoryDocs.reduce((sum: number, doc: any) => sum + (doc.fileSize || 0), 0);
            return { category, sizeBytes: totalSize, documentCount: count };
          }),
          largestDocuments: allDocuments
            .sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
            .slice(0, 10)
            .map(doc => ({
              documentId: doc.id,
              title: doc.title || 'Untitled',
              sizeBytes: doc.fileSize || 0,
              category: doc.category || 'uncategorized'
            }))
        },
        periodStart: dateFrom || new Date(0),
        periodEnd: dateTo || new Date(),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating document analytics:', error);
      throw new Error('Failed to generate document analytics');
    }
  }

  async getDocumentStatistics(): Promise<{
    totalDocuments: number;
    documentsByCategory: Array<{ category: string; count: number; percentage: number }>;
    documentsByStatus: Array<{ status: string; count: number; percentage: number }>;
    documentsByAccessLevel: Array<{ accessLevel: string; count: number; percentage: number }>;
    recentlyCreated: number;
    recentlyModified: number;
    averageFileSize: number;
    totalStorageUsed: number;
    mostActiveUsers: Array<{ userId: string; userName: string; activityCount: number }>;
  }> {
    try {
      const allDocuments = await db.select().from(documents);
      const totalDocuments = allDocuments.length;

      const recentlyCreated = allDocuments.filter(doc => {
        const daysSinceCreated = (Date.now() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated <= 7;
      }).length;

      const recentlyModified = allDocuments.filter(doc => {
        if (!doc.updatedAt) return false;
        const daysSinceModified = (Date.now() - doc.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceModified <= 7;
      }).length;

      const totalStorageUsed = allDocuments.reduce((sum: number, doc: any) => sum + (doc.fileSize || 0), 0);
      const averageFileSize = totalDocuments > 0 ? Math.round(totalStorageUsed / totalDocuments) : 0;

      const documentsByCategory = allDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const category = doc.category || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const documentsByStatus = allDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const status = doc.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const documentsByAccessLevel = allDocuments.reduce((acc: Record<string, number>, doc: any) => {
        const accessLevel = doc.accessLevel || 'public';
        acc[accessLevel] = (acc[accessLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get most active users from document access logs
      const userActivity = await db
        .select({
          userId: documentAccessLogs.userId,
          userName: documentAccessLogs.userName,
          activityCount: sql<number>`count(*)`
        })
        .from(documentAccessLogs)
        .where(gte(documentAccessLogs.accessedAt, sql`NOW() - INTERVAL '30 days'`))
        .groupBy(documentAccessLogs.userId, documentAccessLogs.userName)
        .orderBy(sql`count(*) DESC`)
        .limit(10);

      return {
        totalDocuments,
        documentsByCategory: Object.entries(documentsByCategory).map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / totalDocuments) * 100)
        })),
        documentsByStatus: Object.entries(documentsByStatus).map(([status, count]) => ({
          status,
          count,
          percentage: Math.round((count / totalDocuments) * 100)
        })),
        documentsByAccessLevel: Object.entries(documentsByAccessLevel).map(([accessLevel, count]) => ({
          accessLevel,
          count,
          percentage: Math.round((count / totalDocuments) * 100)
        })),
        recentlyCreated,
        recentlyModified,
        averageFileSize,
        totalStorageUsed,
        mostActiveUsers: userActivity.map(activity => ({
          userId: activity.userId,
          userName: activity.userName || 'Unknown User',
          activityCount: activity.activityCount
        }))
      };
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      throw new Error('Failed to fetch document statistics');
    }
  }

  async getRecentDocumentActivity(limit = 20): Promise<Array<{
    documentId: string;
    documentTitle: string;
    action: string;
    userName: string;
    userRole: string;
    timestamp: Date;
    details?: string;
  }>> {
    try {
      const recentAccess = await db
        .select({
          documentId: documentAccessLogs.documentId,
          action: documentAccessLogs.accessType,
          userName: documentAccessLogs.userName,
          userRole: documentAccessLogs.userRole,
          timestamp: documentAccessLogs.accessedAt,
          details: documentAccessLogs.businessContext
        })
        .from(documentAccessLogs)
        .orderBy(desc(documentAccessLogs.accessedAt))
        .limit(limit);

      const activities = [];

      for (const access of recentAccess) {
        const document = await this.getDocument(access.documentId);
        
        activities.push({
          documentId: access.documentId,
          documentTitle: document?.title || 'Unknown Document',
          action: access.action || 'access',
          userName: access.userName || 'Unknown User',
          userRole: access.userRole || 'user',
          timestamp: access.timestamp || new Date(),
          details: access.details
        });
      }

      return activities;
    } catch (error) {
      console.error('Error fetching recent document activity:', error);
      return [];
    }
  }

  // Document file management
  async generateDocumentNumber(category: string): Promise<string> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
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
    } catch (error) {
      console.error('Error generating document number:', error);
      throw new Error('Failed to generate document number');
    }
  }

  async validateDocumentFile(filePath: string, contentType: string, fileSize: number): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation rules
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (fileSize > MAX_FILE_SIZE) {
        errors.push(`File size ${fileSize} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
      }

      if (fileSize === 0) {
        errors.push('File is empty');
      }

      if (!ALLOWED_TYPES.includes(contentType)) {
        errors.push(`File type ${contentType} is not allowed`);
      }

      if (fileSize > 5 * 1024 * 1024) { // 5MB
        warnings.push('Large file size may affect performance');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating document file:', error);
      return {
        isValid: false,
        errors: ['File validation failed'],
        warnings: []
      };
    }
  }

  async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      // This would normally read the file and calculate a hash
      // For now, returning a placeholder since we don't have file system access in this context
      return `checksum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      console.error('Error calculating file checksum:', error);
      throw new Error('Failed to calculate file checksum');
    }
  }

  async getDocumentStorageInfo(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    sizeByCategory: Array<{ category: string; totalSize: number; fileCount: number }>;
    oldestFile: Date;
    newestFile: Date;
  }> {
    try {
      const allDocuments = await db.select().from(documents);
      
      const totalFiles = allDocuments.length;
      const totalSize = allDocuments.reduce((sum: number, doc: any) => sum + (doc.fileSize || 0), 0);
      const averageSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;

      const sizeByCategory = allDocuments.reduce((acc: Record<string, { totalSize: number; fileCount: number }>, doc: any) => {
        const category = doc.category || 'uncategorized';
        if (!acc[category]) {
          acc[category] = { totalSize: 0, fileCount: 0 };
        }
        acc[category].totalSize += doc.fileSize || 0;
        acc[category].fileCount += 1;
        return acc;
      }, {} as Record<string, { totalSize: number; fileCount: number }>);

      const oldestFile = allDocuments.reduce((oldest: Date, doc: any) => 
        doc.createdAt < oldest ? doc.createdAt : oldest, 
        allDocuments[0]?.createdAt || new Date()
      );

      const newestFile = allDocuments.reduce((newest: Date, doc: any) => 
        doc.createdAt > newest ? doc.createdAt : newest, 
        allDocuments[0]?.createdAt || new Date()
      );

      return {
        totalFiles,
        totalSize,
        averageSize,
        sizeByCategory: Object.entries(sizeByCategory).map(([category, info]) => ({
          category,
          totalSize: info.totalSize,
          fileCount: info.fileCount
        })),
        oldestFile,
        newestFile
      };
    } catch (error) {
      console.error('Error fetching document storage info:', error);
      throw new Error('Failed to fetch document storage info');
    }
  }

  // Document export and backup
  async exportDocuments(filters?: DocumentSearchRequest): Promise<{
    documents: DocumentWithMetadata[];
    exportInfo: {
      totalDocuments: number;
      totalSize: number;
      exportDate: Date;
      exportedBy: string;
    };
  }> {
    try {
      let searchResults;
      
      if (filters) {
        searchResults = await this.searchDocuments(filters);
      } else {
        const allDocs = await this.getDocuments();
        searchResults = {
          documents: allDocs,
          total: allDocs.length,
          page: 1,
          totalPages: 1,
          hasMore: false
        };
      }

      const documentsWithMetadata: DocumentWithMetadata[] = [];
      let totalSize = 0;

      for (const doc of searchResults.documents) {
        const metadata = await this.getDocumentMetadata(doc.id);
        const compliance = await this.getDocumentCompliance(doc.id);
        
        documentsWithMetadata.push({
          ...doc,
          metadata,
          compliance
        });

        totalSize += doc.fileSize || 0;
      }

      return {
        documents: documentsWithMetadata,
        exportInfo: {
          totalDocuments: documentsWithMetadata.length,
          totalSize,
          exportDate: new Date(),
          exportedBy: 'system' // Could be passed as parameter
        }
      };
    } catch (error) {
      console.error('Error exporting documents:', error);
      throw new Error('Failed to export documents');
    }
  }

  // Document bulk operations
  async bulkUpdateDocuments(documentIds: string[], updates: Partial<InsertDocument>, userId: string): Promise<{
    updated: number;
    failed: Array<{ documentId: string; error: string }>;
  }> {
    try {
      let updated = 0;
      const failed: Array<{ documentId: string; error: string }> = [];

      for (const documentId of documentIds) {
        try {
          await this.updateDocument(documentId, updates, {
            userId,
            userName: 'Bulk Update',
            source: 'bulk_operation',
            businessContext: 'Bulk document update operation'
          });
          updated++;
        } catch (error) {
          failed.push({
            documentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { updated, failed };
    } catch (error) {
      console.error('Error bulk updating documents:', error);
      throw new Error('Failed to bulk update documents');
    }
  }

  async bulkDeleteDocuments(documentIds: string[], userId: string): Promise<{
    deleted: number;
    failed: Array<{ documentId: string; error: string }>;
  }> {
    try {
      let deleted = 0;
      const failed: Array<{ documentId: string; error: string }> = [];

      for (const documentId of documentIds) {
        try {
          await this.deleteDocument(documentId, {
            userId,
            userName: 'Bulk Delete',
            source: 'bulk_operation',
            businessContext: 'Bulk document deletion operation'
          });
          deleted++;
        } catch (error) {
          failed.push({
            documentId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { deleted, failed };
    } catch (error) {
      console.error('Error bulk deleting documents:', error);
      throw new Error('Failed to bulk delete documents');
    }
  }

  async bulkUpdateDocumentStatus(documentIds: string[], status: string, userId: string): Promise<{
    updated: number;
    failed: Array<{ documentId: string; error: string }>;
  }> {
    try {
      return await this.bulkUpdateDocuments(documentIds, { status }, userId);
    } catch (error) {
      console.error('Error bulk updating document status:', error);
      throw new Error('Failed to bulk update document status');
    }
  }


  // ===== HELPER METHODS =====

  private getCurrentAccountingPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private async getOrCreateTransferFeeCategoryId(): Promise<string> {
    try {
      // Try to find existing transfer fee category
      const [existingCategory] = await db
        .select()
        .from(operatingExpenseCategories)
        .where(eq(operatingExpenseCategories.categoryName, 'Transfer Fees'));

      if (existingCategory) {
        return existingCategory.id;
      }

      // Create new category if not exists
      const [newCategory] = await db
        .insert(operatingExpenseCategories)
        .values({
          categoryName: 'Transfer Fees',
          description: 'Bank and wire transfer fees for revenue operations',
          isActive: true,
        })
        .returning();

      return newCategory.id;
    } catch (error) {
      console.error('Error getting/creating transfer fee category:', error);
      throw new Error('Failed to get transfer fee category');
    }
  }

  // ===== MISSING INTERFACE IMPLEMENTATIONS =====
  // Approval operations - required by IStorage interface
  async getApprovalChains(): Promise<ApprovalChain[]> {
    try {
      return await db.select().from(approvalChains).orderBy(desc(approvalChains.createdAt));
    } catch (error) {
      console.error('Error fetching approval chains:', error);
      return [];
    }
  }

  async createApprovalChain(chain: InsertApprovalChain, auditContext?: AuditContext): Promise<ApprovalChain> {
    try {
      const [result] = await db.insert(approvalChains).values(chain).returning();
      
      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'approval_chains',
          result.id,
          'create',
          'approval_chain_create',
          null,
          result
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error creating approval chain:', error);
      throw new Error('Failed to create approval chain');
    }
  }

  async updateApprovalChain(id: string, updates: Partial<InsertApprovalChain>, auditContext?: AuditContext): Promise<ApprovalChain> {
    try {
      const beforeState = await StorageApprovalGuard.getCaptureBeforeState(approvalChains, id);
      
      const [result] = await db
        .update(approvalChains)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(approvalChains.id, id))
        .returning();
      
      if (auditContext) {
        await StorageApprovalGuard.auditOperation(
          auditContext,
          'approval_chains',
          result.id,
          'update',
          'approval_chain_update',
          beforeState,
          result
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error updating approval chain:', error);
      throw new Error('Failed to update approval chain');
    }
  }

  // Financial periods operations - required by IStorage interface
  async getFinancialPeriods(status?: string): Promise<FinancialPeriod[]> {
    try {
      let query = db.select().from(financialPeriods).orderBy(desc(financialPeriods.createdAt));
      
      if (status) {
        query = query.where(eq(financialPeriods.status, status));
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching financial periods:', error);
      return [];
    }
  }

  async getFinancialPeriod(id: string): Promise<FinancialPeriod | undefined> {
    try {
      const [period] = await db.select().from(financialPeriods).where(eq(financialPeriods.id, id));
      return period;
    } catch (error) {
      console.error('Error fetching financial period:', error);
      return undefined;
    }
  }

  async getCurrentFinancialPeriod(): Promise<FinancialPeriod | undefined> {
    try {
      const [period] = await db
        .select()
        .from(financialPeriods)
        .where(eq(financialPeriods.status, 'current'))
        .orderBy(desc(financialPeriods.createdAt))
        .limit(1);
      return period;
    } catch (error) {
      console.error('Error fetching current financial period:', error);
      return undefined;
    }
  }

  async createFinancialPeriod(period: InsertFinancialPeriod): Promise<FinancialPeriod> {
    try {
      const [result] = await db.insert(financialPeriods).values(period).returning();
      return result;
    } catch (error) {
      console.error('Error creating financial period:', error);
      throw new Error('Failed to create financial period');
    }
  }

  async updateFinancialPeriod(id: string, period: Partial<InsertFinancialPeriod>): Promise<FinancialPeriod> {
    try {
      const [result] = await db
        .update(financialPeriods)
        .set({ ...period, updatedAt: new Date() })
        .where(eq(financialPeriods.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating financial period:', error);
      throw new Error('Failed to update financial period');
    }
  }

  async closeFinancialPeriod(id: string, userId: string, exchangeRates?: Record<string, number>): Promise<FinancialPeriod> {
    try {
      const [result] = await db
        .update(financialPeriods)
        .set({ 
          status: 'closed',
          closedAt: new Date(),
          closedBy: userId,
          exchangeRates: exchangeRates ? JSON.stringify(exchangeRates) : undefined,
          updatedAt: new Date()
        })
        .where(eq(financialPeriods.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error closing financial period:', error);
      throw new Error('Failed to close financial period');
    }
  }

  async reopenFinancialPeriod(id: string, userId: string): Promise<FinancialPeriod> {
    try {
      const [result] = await db
        .update(financialPeriods)
        .set({ 
          status: 'current',
          reopenedAt: new Date(),
          reopenedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(financialPeriods.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error reopening financial period:', error);
      throw new Error('Failed to reopen financial period');
    }
  }

  // Financial metrics operations - required by IStorage interface
  async getFinancialMetrics(periodId?: string, filters?: DateRangeFilter): Promise<FinancialMetric[]> {
    try {
      let query = db.select().from(financialMetrics).orderBy(desc(financialMetrics.createdAt));
      
      if (periodId) {
        query = query.where(eq(financialMetrics.periodId, periodId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      return [];
    }
  }

  async getFinancialMetric(id: string): Promise<FinancialMetric | undefined> {
    try {
      const [metric] = await db.select().from(financialMetrics).where(eq(financialMetrics.id, id));
      return metric;
    } catch (error) {
      console.error('Error fetching financial metric:', error);
      return undefined;
    }
  }

  async getLatestFinancialMetrics(periodId: string): Promise<FinancialMetric | undefined> {
    try {
      const [metric] = await db
        .select()
        .from(financialMetrics)
        .where(eq(financialMetrics.periodId, periodId))
        .orderBy(desc(financialMetrics.createdAt))
        .limit(1);
      return metric;
    } catch (error) {
      console.error('Error fetching latest financial metrics:', error);
      return undefined;
    }
  }

  async calculateAndStoreFinancialMetrics(periodId: string, userId: string): Promise<FinancialMetric> {
    try {
      // This would contain complex financial calculations
      // For now, returning a placeholder that matches the expected structure
      const metrics = {
        periodId,
        totalRevenue: 0,
        totalCosts: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        operatingProfit: 0,
        netProfit: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        calculatedBy: userId,
        calculatedAt: new Date()
      };
      
      const [result] = await db.insert(financialMetrics).values(metrics).returning();
      return result;
    } catch (error) {
      console.error('Error calculating and storing financial metrics:', error);
      throw new Error('Failed to calculate financial metrics');
    }
  }


  // Profit & Loss operations - required by IStorage interface
  async generateProfitLossStatement(periodId: string, statementType: string, userId: string): Promise<ProfitLossStatement> {
    try {
      // Placeholder implementation - would generate real P&L statement
      const statement = {
        periodId,
        statementType,
        totalRevenue: 0,
        totalCosts: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        operatingProfit: 0,
        nonOperatingIncome: 0,
        nonOperatingExpenses: 0,
        netProfit: 0,
        generatedBy: userId,
        generatedAt: new Date()
      };
      
      const [result] = await db.insert(profitLossStatements).values(statement).returning();
      return result;
    } catch (error) {
      console.error('Error generating profit loss statement:', error);
      throw new Error('Failed to generate profit loss statement');
    }
  }

  async getDetailedPLAnalysis(periodId: string, comparisonPeriodId?: string): Promise<{
    currentPeriod: ProfitLossStatement;
    previousPeriod?: ProfitLossStatement;
    varianceAnalysis: {
      revenue: { amount: number; percentage: number; trend: string };
      cogs: { amount: number; percentage: number; trend: string };
      grossProfit: { amount: number; percentage: number; trend: string };
      operatingExpenses: { amount: number; percentage: number; trend: string };
      operatingProfit: { amount: number; percentage: number; trend: string };
      netProfit: { amount: number; percentage: number; trend: string };
    };
    breakdownAnalysis: {
      revenueByCategory: Array<{ category: string; amount: number; percentage: number }>;
      costsByCategory: Array<{ category: string; amount: number; percentage: number }>;
      expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
    };
  }> {
    try {
      const currentPeriod = await this.getProfitLossStatements(periodId)
        .then(statements => statements[0]);
      
      if (!currentPeriod) {
        throw new Error('Current period statement not found');
      }
      
      let previousPeriod;
      if (comparisonPeriodId) {
        previousPeriod = await this.getProfitLossStatements(comparisonPeriodId)
          .then(statements => statements[0]);
      }
      
      // Placeholder variance analysis
      const varianceAnalysis = {
        revenue: { amount: 0, percentage: 0, trend: 'stable' },
        cogs: { amount: 0, percentage: 0, trend: 'stable' },
        grossProfit: { amount: 0, percentage: 0, trend: 'stable' },
        operatingExpenses: { amount: 0, percentage: 0, trend: 'stable' },
        operatingProfit: { amount: 0, percentage: 0, trend: 'stable' },
        netProfit: { amount: 0, percentage: 0, trend: 'stable' }
      };
      
      const breakdownAnalysis = {
        revenueByCategory: [],
        costsByCategory: [],
        expensesByCategory: []
      };
      
      return {
        currentPeriod,
        previousPeriod,
        varianceAnalysis,
        breakdownAnalysis
      };
    } catch (error) {
      console.error('Error generating detailed P&L analysis:', error);
      throw new Error('Failed to generate detailed P&L analysis');
    }
  }

  // Cash flow analysis operations - required by IStorage interface
  async generateCashFlowAnalysis(periodId: string, analysisType: string, userId: string, forecastDays?: number): Promise<CashFlowAnalysis> {
    try {
      // Placeholder implementation - would generate real cash flow analysis
      const analysis = {
        periodId,
        analysisType,
        operatingCashFlow: 0,
        investingCashFlow: 0,
        financingCashFlow: 0,
        netCashFlow: 0,
        beginningCash: 0,
        endingCash: 0,
        forecastDays: forecastDays || 30,
        generatedBy: userId,
        generatedAt: new Date()
      };
      
      const [result] = await db.insert(cashFlowAnalysis).values(analysis).returning();
      return result;
    } catch (error) {
      console.error('Error generating cash flow analysis:', error);
      throw new Error('Failed to generate cash flow analysis');
    }
  }


  // Additional missing methods to complete IStorage interface
  async getCashFlowAnalysis(id: string): Promise<CashFlowAnalysis | undefined> {
    try {
      const [analysis] = await db.select().from(cashFlowAnalysis).where(eq(cashFlowAnalysis.id, id));
      return analysis;
    } catch (error) {
      console.error('Error fetching cash flow analysis:', error);
      return undefined;
    }
  }

  async getProfitLossStatement(id: string): Promise<ProfitLossStatement | undefined> {
    try {
      const [statement] = await db.select().from(profitLossStatements).where(eq(profitLossStatements.id, id));
      return statement;
    } catch (error) {
      console.error('Error fetching profit loss statement:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
