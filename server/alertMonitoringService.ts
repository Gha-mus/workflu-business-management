import { storage } from "./storage";
import { notificationService } from "./notificationService";
import { auditService } from "./auditService";
import type {
  AlertConfiguration,
  CreateNotification,
  User,
} from "@shared/schema";

// Alert trigger result interface
interface AlertTriggerResult {
  alertId: string;
  triggered: boolean;
  currentValue: number | string;
  threshold: number | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionUrl?: string;
  notificationsSent: number;
}

// Business metric interface
interface BusinessMetric {
  type: string;
  category: string;
  currentValue: number | string;
  previousValue?: number | string;
  threshold?: number | string;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  entityId?: string;
  entityType?: string;
}

// Monitoring context for audit trails
interface MonitoringContext {
  sessionId: string;
  correlationId: string;
  monitoringRun: string;
  triggeredAt: Date;
}

class AlertMonitoringService {
  private static instance: AlertMonitoringService;
  private isInitialized = false;
  private lastMonitoringRun: Date = new Date();

  private constructor() {
    console.log("AlertMonitoringService initialized for proactive business monitoring");
  }

  public static getInstance(): AlertMonitoringService {
    if (!AlertMonitoringService.instance) {
      AlertMonitoringService.instance = new AlertMonitoringService();
    }
    return AlertMonitoringService.instance;
  }

  /**
   * Initialize the alert monitoring service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚨 Initializing alert monitoring service...');

    try {
      // Ensure notification service is initialized
      await notificationService.initialize();
      
      // Create default alert configurations if they don't exist
      await this.initializeDefaultAlertConfigurations();

      this.isInitialized = true;
      console.log('✅ Alert monitoring service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize alert monitoring service:', error);
      throw error;
    }
  }

  /**
   * Initialize default alert configurations
   */
  private async initializeDefaultAlertConfigurations(): Promise<void> {
    const defaultConfigurations = [
      // Capital threshold alerts
      {
        name: 'Low Capital Balance Alert',
        alertType: 'threshold_alert',
        alertCategory: 'capital_threshold',
        priority: 'high',
        isGlobal: true,
        targetRoles: ['admin', 'finance'],
        thresholds: {
          critical: 10000, // USD
          high: 25000,
          medium: 50000,
        },
        conditions: {
          operator: 'less_than',
          field: 'available_balance',
          checkFrequency: 'hourly',
        },
        isActive: true,
        monitoringEnabled: true,
      },
      // Inventory level alerts
      {
        name: 'Low Inventory Stock Alert',
        alertType: 'threshold_alert',
        alertCategory: 'inventory_level',
        priority: 'medium',
        isGlobal: true,
        targetRoles: ['admin', 'warehouse'],
        thresholds: {
          critical: 0, // Out of stock
          high: 50, // kg
          medium: 100,
        },
        conditions: {
          operator: 'less_than',
          field: 'current_stock',
          checkFrequency: 'daily',
        },
        isActive: true,
        monitoringEnabled: true,
      },
      // High-value purchase alerts
      {
        name: 'High-Value Purchase Alert',
        alertType: 'threshold_alert',
        alertCategory: 'purchase_order',
        priority: 'high',
        isGlobal: true,
        targetRoles: ['admin', 'finance'],
        thresholds: {
          critical: 100000, // USD
          high: 50000,
          medium: 25000,
        },
        conditions: {
          operator: 'greater_than',
          field: 'purchase_amount',
          checkFrequency: 'immediate',
        },
        isActive: true,
        monitoringEnabled: true,
      },
      // Document expiry alerts
      {
        name: 'Document Expiry Alert',
        alertType: 'compliance_alert',
        alertCategory: 'document_expiry',
        priority: 'high',
        isGlobal: true,
        targetRoles: ['admin'],
        thresholds: {
          critical: 7, // days
          high: 30,
          medium: 90,
        },
        conditions: {
          operator: 'less_than',
          field: 'days_until_expiry',
          checkFrequency: 'daily',
        },
        isActive: true,
        monitoringEnabled: true,
      },
      // Approval workflow escalation
      {
        name: 'Pending Approval Escalation',
        alertType: 'workflow_alert',
        alertCategory: 'approval_workflow',
        priority: 'high',
        isGlobal: true,
        targetRoles: ['admin'],
        thresholds: {
          critical: 24, // hours
          high: 12,
          medium: 6,
        },
        conditions: {
          operator: 'greater_than',
          field: 'hours_pending',
          checkFrequency: 'hourly',
        },
        isActive: true,
        monitoringEnabled: true,
      },
      // Financial health monitoring
      {
        name: 'Cash Flow Alert',
        alertType: 'financial_alert',
        alertCategory: 'financial_health',
        priority: 'critical',
        isGlobal: true,
        targetRoles: ['admin', 'finance'],
        thresholds: {
          critical: -50000, // USD (negative cash flow)
          high: 0,
          medium: 25000,
        },
        conditions: {
          operator: 'less_than',
          field: 'monthly_cash_flow',
          checkFrequency: 'daily',
        },
        isActive: true,
        monitoringEnabled: true,
      },
    ];

    for (const config of defaultConfigurations) {
      try {
        // Check if configuration already exists
        const existing = await storage.getAlertConfigurations({
          alertType: config.alertType,
          alertCategory: config.alertCategory,
        });

        const alreadyExists = existing.some(c => c.name === config.name);
        
        if (!alreadyExists) {
          await storage.createAlertConfiguration(config);
          console.log(`✅ Created default alert configuration: ${config.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create alert configuration ${config.name}:`, error);
      }
    }
  }

  /**
   * Run comprehensive monitoring check for all enabled alerts
   */
  async runMonitoringCheck(): Promise<{
    totalChecked: number;
    alertsTriggered: number;
    notificationsSent: number;
    errors: number;
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const monitoringContext: MonitoringContext = {
        sessionId: auditService.generateCorrelationId(),
        correlationId: auditService.generateCorrelationId(),
        monitoringRun: `monitoring_${Date.now()}`,
        triggeredAt: new Date(),
      };

      console.log(`🔍 Starting monitoring check: ${monitoringContext.monitoringRun}`);

      // Get all active alert configurations
      const activeConfigurations = await storage.getActiveAlertConfigurations();

      let totalChecked = 0;
      let alertsTriggered = 0;
      let notificationsSent = 0;
      let errors = 0;

      // Process each alert configuration
      for (const config of activeConfigurations) {
        try {
          totalChecked++;
          const results = await this.evaluateAlertConfiguration(config, monitoringContext);
          
          for (const result of results) {
            if (result.triggered) {
              alertsTriggered++;
              notificationsSent += result.notificationsSent;
            }
          }

        } catch (error) {
          console.error(`Failed to evaluate alert configuration ${config.id}:`, error);
          errors++;
        }
      }

      // Update last monitoring run timestamp
      this.lastMonitoringRun = new Date();

      console.log(`📊 Monitoring check complete: ${totalChecked} checked, ${alertsTriggered} triggered, ${notificationsSent} notifications sent`);

      // Log monitoring summary
      await auditService.logOperation(
        {
          userId: 'system',
          userName: 'AlertMonitoringService',
          source: 'alert_monitoring',
          severity: alertsTriggered > 0 ? 'warning' : 'info',
          correlationId: monitoringContext.correlationId,
        },
        {
          entityType: 'alert_monitoring',
          action: 'create',
          operationType: 'monitoring_check',
          description: `Monitoring check completed: ${alertsTriggered} alerts triggered`,
          newValues: {
            totalChecked,
            alertsTriggered,
            notificationsSent,
            errors,
            monitoringRun: monitoringContext.monitoringRun,
          },
        }
      );

      return { totalChecked, alertsTriggered, notificationsSent, errors };

    } catch (error) {
      console.error('Failed to run monitoring check:', error);
      return { totalChecked: 0, alertsTriggered: 0, notificationsSent: 0, errors: 1 };
    }
  }

  /**
   * Evaluate a specific alert configuration
   */
  private async evaluateAlertConfiguration(
    config: AlertConfiguration,
    context: MonitoringContext
  ): Promise<AlertTriggerResult[]> {
    const results: AlertTriggerResult[] = [];

    try {
      // Get business metrics based on alert category
      const metrics = await this.getBusinessMetrics(config.alertCategory, config.conditions);

      for (const metric of metrics) {
        const triggerResult = await this.evaluateMetricThreshold(metric, config, context);
        if (triggerResult) {
          results.push(triggerResult);
        }
      }

    } catch (error) {
      console.error(`Failed to evaluate alert configuration ${config.name}:`, error);
    }

    return results;
  }

  /**
   * Get business metrics for a specific alert category
   */
  private async getBusinessMetrics(
    alertCategory: string,
    conditions: any
  ): Promise<BusinessMetric[]> {
    const metrics: BusinessMetric[] = [];

    try {
      switch (alertCategory) {
        case 'capital_threshold':
          metrics.push(...await this.getCapitalMetrics());
          break;
        case 'inventory_level':
          metrics.push(...await this.getInventoryMetrics());
          break;
        case 'purchase_order':
          metrics.push(...await this.getPurchaseMetrics());
          break;
        case 'sales_order':
          metrics.push(...await this.getSalesMetrics());
          break;
        case 'document_expiry':
          metrics.push(...await this.getDocumentExpiryMetrics());
          break;
        case 'approval_workflow':
          metrics.push(...await this.getApprovalWorkflowMetrics());
          break;
        case 'financial_health':
          metrics.push(...await this.getFinancialHealthMetrics());
          break;
        case 'operational_delay':
          metrics.push(...await this.getOperationalMetrics());
          break;
        case 'compliance_issue':
          metrics.push(...await this.getComplianceMetrics());
          break;
      }
    } catch (error) {
      console.error(`Failed to get business metrics for ${alertCategory}:`, error);
    }

    return metrics;
  }

  /**
   * Get capital balance metrics
   */
  private async getCapitalMetrics(): Promise<BusinessMetric[]> {
    try {
      const balance = await storage.getCapitalBalance();
      const financialSummary = await storage.getFinancialSummary();
      
      return [{
        type: 'capital',
        category: 'balance',
        currentValue: balance,
        previousValue: balance, // Could get historical data
        threshold: 50000, // Default threshold
        unit: 'USD',
        trend: balance > 50000 ? 'stable' : 'down',
        lastUpdated: new Date(),
        entityType: 'capital',
        entityId: 'system_balance',
      }];
    } catch (error) {
      console.error('Failed to get capital metrics:', error);
      return [];
    }
  }

  /**
   * Get inventory level metrics
   */
  private async getInventoryMetrics(): Promise<BusinessMetric[]> {
    try {
      const inventory = await storage.getInventoryAnalytics();
      const metrics: BusinessMetric[] = [];

      // Check each product's stock level
      for (const item of inventory.lowStockItems || []) {
        metrics.push({
          type: 'inventory',
          category: 'stock_level',
          currentValue: item.currentStock,
          threshold: item.minimumStock,
          unit: item.unit,
          trend: item.currentStock < item.minimumStock ? 'down' : 'stable',
          lastUpdated: new Date(),
          entityType: 'warehouse_stock',
          entityId: item.id,
        });
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get inventory metrics:', error);
      return [];
    }
  }

  /**
   * Get purchase order metrics
   */
  private async getPurchaseMetrics(): Promise<BusinessMetric[]> {
    try {
      const purchases = await storage.getPurchases();
      const metrics: BusinessMetric[] = [];

      // Check for high-value purchases in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      for (const purchase of purchases) {
        if (purchase.createdAt && purchase.createdAt > yesterday) {
          const totalValue = purchase.total || 0;
          
          metrics.push({
            type: 'purchase',
            category: 'high_value',
            currentValue: totalValue,
            threshold: 25000, // Default high-value threshold
            unit: purchase.currency || 'USD',
            trend: 'up',
            lastUpdated: purchase.createdAt,
            entityType: 'purchase',
            entityId: purchase.id,
          });
        }
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get purchase metrics:', error);
      return [];
    }
  }

  /**
   * Get sales order metrics
   */
  private async getSalesMetrics(): Promise<BusinessMetric[]> {
    try {
      const salesOrders = await storage.getSalesOrders();
      const metrics: BusinessMetric[] = [];

      for (const order of salesOrders) {
        // Check for large orders or overdue payments
        const totalValue = order.totalAmount || 0;
        
        if (totalValue > 50000) { // Large order threshold
          metrics.push({
            type: 'sales',
            category: 'large_order',
            currentValue: totalValue,
            threshold: 50000,
            unit: order.currency || 'USD',
            trend: 'up',
            lastUpdated: order.createdAt || new Date(),
            entityType: 'sales_order',
            entityId: order.id,
          });
        }
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get sales metrics:', error);
      return [];
    }
  }

  /**
   * Get document expiry metrics
   */
  private async getDocumentExpiryMetrics(): Promise<BusinessMetric[]> {
    try {
      const documents = await storage.getDocuments({});
      const metrics: BusinessMetric[] = [];

      const now = new Date();

      for (const doc of documents) {
        if (doc.expiryDate) {
          const expiryDate = new Date(doc.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry <= 90) { // Check documents expiring within 90 days
            metrics.push({
              type: 'document',
              category: 'expiry',
              currentValue: daysUntilExpiry,
              threshold: 30, // Default warning threshold
              unit: 'days',
              trend: daysUntilExpiry > 30 ? 'stable' : 'down',
              lastUpdated: new Date(),
              entityType: 'document',
              entityId: doc.id,
            });
          }
        }
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get document expiry metrics:', error);
      return [];
    }
  }

  /**
   * Get approval workflow metrics
   */
  private async getApprovalWorkflowMetrics(): Promise<BusinessMetric[]> {
    try {
      // This would integrate with approval workflow service
      // For now, return empty array - would need approval request data
      return [];
    } catch (error) {
      console.error('Failed to get approval workflow metrics:', error);
      return [];
    }
  }

  /**
   * Get financial health metrics
   */
  private async getFinancialHealthMetrics(): Promise<BusinessMetric[]> {
    try {
      const financialSummary = await storage.getFinancialSummary();
      const metrics: BusinessMetric[] = [];

      // Cash flow metric
      const netCashFlow = (financialSummary.summary.totalRevenue || 0) - (financialSummary.summary.totalPurchases || 0);
      
      metrics.push({
        type: 'financial',
        category: 'cash_flow',
        currentValue: netCashFlow,
        threshold: 0, // Alert if negative cash flow
        unit: 'USD',
        trend: netCashFlow > 0 ? 'up' : 'down',
        lastUpdated: new Date(),
        entityType: 'financial_summary',
        entityId: 'monthly_cash_flow',
      });

      return metrics;
    } catch (error) {
      console.error('Failed to get financial health metrics:', error);
      return [];
    }
  }

  /**
   * Get operational metrics (shipping delays, quality issues)
   */
  private async getOperationalMetrics(): Promise<BusinessMetric[]> {
    try {
      // Check for delayed shipments
      const shipments = await storage.getShipments({});
      const metrics: BusinessMetric[] = [];

      const now = new Date();

      for (const shipment of shipments) {
        if (shipment.estimatedArrivalDate && shipment.status !== 'delivered') {
          const expectedDate = new Date(shipment.estimatedArrivalDate);
          const daysDelayed = Math.ceil((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDelayed > 0) {
            metrics.push({
              type: 'operational',
              category: 'shipping_delay',
              currentValue: daysDelayed,
              threshold: 1, // Alert after 1 day delay
              unit: 'days',
              trend: 'down',
              lastUpdated: new Date(),
              entityType: 'shipment',
              entityId: shipment.id,
            });
          }
        }
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get operational metrics:', error);
      return [];
    }
  }

  /**
   * Get compliance metrics
   */
  private async getComplianceMetrics(): Promise<BusinessMetric[]> {
    try {
      // This could check for compliance violations, audit findings, etc.
      // For now, return empty array - would integrate with compliance systems
      return [];
    } catch (error) {
      console.error('Failed to get compliance metrics:', error);
      return [];
    }
  }

  /**
   * Evaluate if a metric triggers an alert threshold
   */
  private async evaluateMetricThreshold(
    metric: BusinessMetric,
    config: AlertConfiguration,
    context: MonitoringContext
  ): Promise<AlertTriggerResult | null> {
    try {
      const thresholds = config.thresholds || {};
      const conditions = config.conditions || {};
      
      // Determine if threshold is crossed
      let triggered = false;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      
      const currentValue = typeof metric.currentValue === 'string' ? parseFloat(metric.currentValue) : metric.currentValue;
      
      // Check thresholds in order of severity
      if (this.checkThreshold(currentValue, thresholds.critical, conditions.operator)) {
        triggered = true;
        severity = 'critical';
      } else if (this.checkThreshold(currentValue, thresholds.high, conditions.operator)) {
        triggered = true;
        severity = 'high';
      } else if (this.checkThreshold(currentValue, thresholds.medium, conditions.operator)) {
        triggered = true;
        severity = 'medium';
      }

      if (!triggered) {
        return null;
      }

      // Create alert message
      const message = this.generateAlertMessage(metric, config, severity);
      const actionUrl = this.generateActionUrl(metric, config);

      // Send notifications to target users/roles
      const notificationsSent = await this.sendAlertNotifications(
        config,
        metric,
        severity,
        message,
        actionUrl,
        context
      );

      return {
        alertId: `${config.id}_${metric.entityId}_${Date.now()}`,
        triggered: true,
        currentValue: metric.currentValue,
        threshold: metric.threshold || thresholds[severity],
        severity,
        message,
        actionUrl,
        notificationsSent,
      };

    } catch (error) {
      console.error('Failed to evaluate metric threshold:', error);
      return null;
    }
  }

  /**
   * Check if a threshold condition is met
   */
  private checkThreshold(currentValue: number, threshold: number, operator: string): boolean {
    if (threshold === undefined || threshold === null) return false;

    switch (operator) {
      case 'less_than':
        return currentValue < threshold;
      case 'greater_than':
        return currentValue > threshold;
      case 'equals':
        return currentValue === threshold;
      case 'not_equals':
        return currentValue !== threshold;
      default:
        return false;
    }
  }

  /**
   * Generate appropriate alert message
   */
  private generateAlertMessage(
    metric: BusinessMetric,
    config: AlertConfiguration,
    severity: string
  ): string {
    const baseMessages = {
      capital_threshold: `Capital balance (${metric.currentValue} ${metric.unit}) has dropped below the ${severity} threshold`,
      inventory_level: `Inventory stock (${metric.currentValue} ${metric.unit}) is below minimum levels`,
      purchase_order: `High-value purchase order (${metric.currentValue} ${metric.unit}) requires attention`,
      sales_order: `Large sales order (${metric.currentValue} ${metric.unit}) has been created`,
      document_expiry: `Document expires in ${metric.currentValue} ${metric.unit}`,
      approval_workflow: `Approval request has been pending for ${metric.currentValue} ${metric.unit}`,
      financial_health: `Cash flow (${metric.currentValue} ${metric.unit}) indicates financial concern`,
      shipping_delay: `Shipment delayed by ${metric.currentValue} ${metric.unit}`,
      operational_delay: `Operational issue detected: ${metric.currentValue} ${metric.unit}`,
      compliance_issue: `Compliance issue requires immediate attention`,
    };

    return baseMessages[config.alertCategory as keyof typeof baseMessages] || 
           `${config.alertCategory}: ${metric.currentValue} ${metric.unit}`;
  }

  /**
   * Generate action URL for alert
   */
  private generateActionUrl(metric: BusinessMetric, config: AlertConfiguration): string {
    const baseUrls = {
      capital_threshold: '/finance/capital',
      inventory_level: '/warehouse/inventory',
      purchase_order: '/procurement/purchases',
      sales_order: '/sales/orders',
      document_expiry: '/documents',
      approval_workflow: '/approvals',
      financial_health: '/finance/reports',
      operational_delay: '/operations/shipments',
      compliance_issue: '/compliance',
    };

    let baseUrl = baseUrls[config.alertCategory as keyof typeof baseUrls] || '/dashboard';
    
    if (metric.entityId && metric.entityId !== 'system_balance') {
      baseUrl += `/${metric.entityId}`;
    }

    return baseUrl;
  }

  /**
   * Send alert notifications to target users/roles
   */
  private async sendAlertNotifications(
    config: AlertConfiguration,
    metric: BusinessMetric,
    severity: string,
    message: string,
    actionUrl: string,
    context: MonitoringContext
  ): Promise<number> {
    try {
      const targetUsers = await this.getTargetUsers(config);
      let notificationsSent = 0;

      for (const user of targetUsers) {
        try {
          const notification: CreateNotification = {
            userId: user.id,
            alertType: config.alertType,
            alertCategory: config.alertCategory,
            priority: severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium',
            channels: severity === 'critical' ? ['in_app', 'email', 'sms'] : ['in_app', 'email'],
            title: `${config.name} - ${severity.toUpperCase()}`,
            message: message,
            entityType: metric.entityType,
            entityId: metric.entityId,
            actionUrl: actionUrl,
            templateData: {
              userName: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
              alertName: config.name,
              severity: severity.toUpperCase(),
              currentValue: metric.currentValue,
              threshold: metric.threshold,
              unit: metric.unit,
              currency: metric.unit === 'USD' ? 'USD' : metric.unit,
              entityType: metric.entityType,
              trend: metric.trend,
              timestamp: new Date().toLocaleString(),
            },
          };

          const result = await notificationService.sendNotification(notification);
          if (result.success) {
            notificationsSent++;
          }

        } catch (error) {
          console.error(`Failed to send notification to user ${user.id}:`, error);
        }
      }

      return notificationsSent;

    } catch (error) {
      console.error('Failed to send alert notifications:', error);
      return 0;
    }
  }

  /**
   * Get target users for an alert configuration
   */
  private async getTargetUsers(config: AlertConfiguration): Promise<User[]> {
    try {
      const allUsers = await storage.getAllUsers();
      const targetUsers: User[] = [];

      if (config.isGlobal) {
        // Global alerts go to all users with target roles
        for (const user of allUsers) {
          if (config.targetRoles?.includes(user.role)) {
            targetUsers.push(user);
          }
        }
      } else if (config.targetUsers) {
        // Specific user targeting
        for (const userId of config.targetUsers) {
          const user = allUsers.find(u => u.id === userId);
          if (user) {
            targetUsers.push(user);
          }
        }
      }

      return targetUsers;

    } catch (error) {
      console.error('Failed to get target users:', error);
      return [];
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getMonitoringDashboard(): Promise<{
    alertConfigurations: AlertConfiguration[];
    recentAlerts: any[];
    systemHealth: {
      lastMonitoringRun: Date;
      activeConfigurations: number;
      totalAlertsLast24h: number;
      criticalAlertsActive: number;
    };
  }> {
    try {
      const alertConfigurations = await storage.getActiveAlertConfigurations();
      
      // Get recent alerts from notification history
      const recentAlerts = await storage.getNotificationHistory({
        limit: 10,
        offset: 0,
      });

      // Calculate system health metrics
      const totalAlertsLast24h = recentAlerts.filter(alert => {
        const alertTime = new Date(alert.createdAt || 0);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return alertTime > yesterday;
      }).length;

      const criticalAlertsActive = recentAlerts.filter(alert => 
        alert.priority === 'critical' && alert.status === 'pending'
      ).length;

      return {
        alertConfigurations,
        recentAlerts: recentAlerts.slice(0, 5), // Limit for dashboard
        systemHealth: {
          lastMonitoringRun: this.lastMonitoringRun,
          activeConfigurations: alertConfigurations.length,
          totalAlertsLast24h,
          criticalAlertsActive,
        },
      };

    } catch (error) {
      console.error('Failed to get monitoring dashboard:', error);
      return {
        alertConfigurations: [],
        recentAlerts: [],
        systemHealth: {
          lastMonitoringRun: this.lastMonitoringRun,
          activeConfigurations: 0,
          totalAlertsLast24h: 0,
          criticalAlertsActive: 0,
        },
      };
    }
  }
}

export const alertMonitoringService = AlertMonitoringService.getInstance();