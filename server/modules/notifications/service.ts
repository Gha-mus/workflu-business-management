import { storage } from "../../core/storage";
import { auditService } from "../../auditService";
import nodemailer from "nodemailer";
import crypto from "crypto";
import type {
  NotificationQueue,
  InsertNotificationQueue,
  CreateNotification,
  NotificationTemplate,
  NotificationSetting,
} from "@shared/schema";

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

// SMS configuration interface (for future real integration)
interface SMSConfig {
  apiKey: string;
  apiSecret: string;
  sender: string;
}

// Webhook delivery result
interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  responseTime: number;
}

// Notification delivery result
interface DeliveryResult {
  success: boolean;
  channel: string;
  deliveryId?: string;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Template variable substitution interface
interface TemplateVariables {
  [key: string]: string | number | boolean | null;
}

class NotificationService {
  private static instance: NotificationService;
  private emailTransporter: nodemailer.Transporter | null = null;
  private isInitialized = false;

  private constructor() {
    console.log("NotificationService initialized for comprehensive business alerts");
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service with email configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔔 Initializing notification service...');

    try {
      // Initialize email transporter
      await this.initializeEmailTransporter();
      
      // Create default notification templates if they don't exist
      await this.initializeDefaultTemplates();

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Initialize email transporter with configuration
   */
  private async initializeEmailTransporter(): Promise<void> {
    try {
      // For development, use a test account or environment variables
      const emailConfig: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        emailConfig.auth = {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        };
      }

      // Create transporter
      this.emailTransporter = nodemailer.createTransport(emailConfig);

      // For development without SMTP credentials, create a test account
      if (!emailConfig.auth) {
        console.log('📧 Creating test email account for development...');
        const testAccount = await nodemailer.createTestAccount();
        
        this.emailTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        console.log('📧 Test email account created:', testAccount.user);
      }

      // Verify connection
      await this.emailTransporter.verify();
      console.log('✅ Email transporter initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
      // Don't fail initialization - continue without email
      this.emailTransporter = null;
    }
  }

  /**
   * Initialize default notification templates
   */
  private async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      // Capital threshold alert
      {
        name: 'Capital Low Balance Alert',
        alertType: 'threshold_alert',
        alertCategory: 'capital_threshold',
        channel: 'email',
        language: 'en',
        subject: '⚠️ WorkFlu: Low Capital Balance Alert',
        bodyTemplate: `
          <h2>Capital Balance Alert</h2>
          <p>Dear {{userName}},</p>
          <p>Your capital balance has dropped below the configured threshold.</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>Current Balance:</strong> {{currency}} {{currentBalance}}<br>
            <strong>Threshold:</strong> {{currency}} {{threshold}}<br>
            <strong>Deficit:</strong> {{currency}} {{deficit}}
          </div>
          <p>Please take appropriate action to maintain adequate capital levels.</p>
          <p><a href="{{actionUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Capital Dashboard</a></p>
          <hr>
          <p><small>WorkFlu Business Management System</small></p>
        `,
        smsTemplate: 'WorkFlu Alert: Capital balance {{currentBalance}} below threshold {{threshold}}. Action required.',
        isDefault: true,
        isActive: true,
      },
      // Inventory level alert
      {
        name: 'Inventory Low Stock Alert',
        alertType: 'threshold_alert',
        alertCategory: 'inventory_level',
        channel: 'email',
        language: 'en',
        subject: '📦 WorkFlu: Low Inventory Alert',
        bodyTemplate: `
          <h2>Low Inventory Alert</h2>
          <p>Dear {{userName}},</p>
          <p>The following products have fallen below minimum stock levels:</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>Product:</strong> {{productName}}<br>
            <strong>Current Stock:</strong> {{currentStock}} {{unit}}<br>
            <strong>Minimum Level:</strong> {{minimumLevel}} {{unit}}<br>
            <strong>Recommended Order:</strong> {{recommendedOrder}} {{unit}}
          </div>
          <p>Consider placing a new order to maintain adequate inventory levels.</p>
          <p><a href="{{actionUrl}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Inventory</a></p>
          <hr>
          <p><small>WorkFlu Business Management System</small></p>
        `,
        smsTemplate: 'WorkFlu Alert: {{productName}} low stock ({{currentStock}}/{{minimumLevel}}). Order {{recommendedOrder}} {{unit}}.',
        isDefault: true,
        isActive: true,
      },
      // Approval workflow alert
      {
        name: 'Approval Required Alert',
        alertType: 'workflow_alert',
        alertCategory: 'approval_workflow',
        channel: 'email',
        language: 'en',
        subject: '⏳ WorkFlu: Approval Required',
        bodyTemplate: `
          <h2>Approval Request</h2>
          <p>Dear {{approverName}},</p>
          <p>A new approval request requires your attention:</p>
          <div style="background: #e7f3ff; border: 1px solid #b8daff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>Request Type:</strong> {{operationType}}<br>
            <strong>Amount:</strong> {{currency}} {{amount}}<br>
            <strong>Requested By:</strong> {{requesterName}}<br>
            <strong>Request Date:</strong> {{requestDate}}<br>
            <strong>Priority:</strong> {{priority}}
          </div>
          <p><strong>Description:</strong> {{description}}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{approveUrl}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a>
            <a href="{{rejectUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reject</a>
          </div>
          <hr>
          <p><small>WorkFlu Business Management System</small></p>
        `,
        smsTemplate: 'WorkFlu: Approval required for {{operationType}} ({{currency}} {{amount}}) by {{requesterName}}.',
        isDefault: true,
        isActive: true,
      },
      // Document expiry alert
      {
        name: 'Document Expiry Alert',
        alertType: 'compliance_alert',
        alertCategory: 'document_expiry',
        channel: 'email',
        language: 'en',
        subject: '📄 WorkFlu: Document Expiry Notice',
        bodyTemplate: `
          <h2>Document Expiry Notice</h2>
          <p>Dear {{userName}},</p>
          <p>The following document is approaching its expiry date:</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <strong>Document:</strong> {{documentName}}<br>
            <strong>Type:</strong> {{documentType}}<br>
            <strong>Expiry Date:</strong> {{expiryDate}}<br>
            <strong>Days Until Expiry:</strong> {{daysRemaining}}
          </div>
          <p>Please renew this document to maintain compliance.</p>
          <p><a href="{{actionUrl}}" style="background: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Document</a></p>
          <hr>
          <p><small>WorkFlu Business Management System</small></p>
        `,
        smsTemplate: 'WorkFlu Alert: {{documentName}} expires in {{daysRemaining}} days ({{expiryDate}}). Renewal required.',
        isDefault: true,
        isActive: true,
      }
    ];

    for (const template of defaultTemplates) {
      try {
        // Check if template already exists
        const existing = await storage.getTemplateByTypeAndChannel(
          template.alertType,
          template.alertCategory,
          template.channel
        );

        if (!existing) {
          await storage.createNotificationTemplate(template as any);
          console.log(`✅ Created default template: ${template.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create template ${template.name}:`, error);
      }
    }
  }

  /**
   * Send a single notification
   */
  async sendNotification(notification: CreateNotification): Promise<DeliveryResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Queue the notification first
      const queuedNotification = await storage.createNotification(notification);

      // Get user notification settings
      const userSettings = await storage.getNotificationSettings(notification.userId);
      
      // Determine delivery channels based on user preferences and notification priority
      const deliveryChannels = this.determineDeliveryChannels(notification, userSettings);

      let finalResult: DeliveryResult = {
        success: false,
        channel: 'none',
        timestamp: new Date(),
      };

      // Attempt delivery on each channel
      for (const channel of deliveryChannels) {
        try {
          const result = await this.deliverNotification(queuedNotification, channel, userSettings);
          
          // Update notification status based on delivery result
          await storage.updateNotificationStatus(queuedNotification.id, {
            status: result.success ? 'sent' : 'failed',
            lastAttemptAt: new Date(),
            attempts: queuedNotification.attempts + 1,
            errorMessage: result.error || null,
            deliveredAt: result.success ? new Date() : null,
          });

          // Keep the first successful result or the last failed result
          if (result.success || deliveryChannels.indexOf(channel) === deliveryChannels.length - 1) {
            finalResult = result;
          }

          if (result.success) break; // Stop trying other channels on success
        } catch (channelError) {
          console.error(`Failed to deliver notification on channel ${channel}:`, channelError);
        }
      }

      // Log the notification delivery attempt
      await this.logNotificationDelivery(notification, finalResult);

      return finalResult;

    } catch (error) {
      console.error('Failed to send notification:', error);
      return {
        success: false,
        channel: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send bulk notifications efficiently
   */
  async sendBulkNotifications(notifications: CreateNotification[]): Promise<{
    sent: number;
    failed: number;
    results: DeliveryResult[];
  }> {
    const results: DeliveryResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification);
        results.push(result);
        
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        results.push({
          success: false,
          channel: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    return { sent, failed, results };
  }

  /**
   * Process notification queue (for scheduled processing)
   */
  async processNotificationQueue(batchSize = 50): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    try {
      const pendingNotifications = await storage.getPendingNotifications(batchSize);
      
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const queuedNotification of pendingNotifications) {
        try {
          // Convert queued notification to CreateNotification format
          const notification: CreateNotification = {
            userId: queuedNotification.userId,
            alertType: queuedNotification.alertType,
            alertCategory: queuedNotification.alertCategory,
            priority: queuedNotification.priority,
            channels: ['in_app', 'email'],
            title: queuedNotification.title,
            message: queuedNotification.message,
            entityType: queuedNotification.entityType || undefined,
            entityId: queuedNotification.entityId || undefined,
            actionUrl: queuedNotification.actionUrl || undefined,
            templateData: queuedNotification.templateData || undefined,
          };

          const result = await this.sendNotification(notification);
          processed++;
          
          if (result.success) {
            successful++;
          } else {
            failed++;
          }

        } catch (error) {
          console.error(`Failed to process queued notification ${queuedNotification.id}:`, error);
          processed++;
          failed++;

          // Update notification as failed
          await storage.updateNotificationStatus(queuedNotification.id, {
            status: 'failed',
            lastAttemptAt: new Date(),
            attempts: queuedNotification.attempts + 1,
            errorMessage: error instanceof Error ? error.message : 'Processing failed',
          });
        }
      }

      console.log(`📊 Processed ${processed} notifications: ${successful} successful, ${failed} failed`);
      return { processed, successful, failed };

    } catch (error) {
      console.error('Failed to process notification queue:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  }

  /**
   * Determine which delivery channels to use for a notification
   */
  private determineDeliveryChannels(
    notification: CreateNotification,
    userSettings: NotificationSetting | undefined
  ): string[] {
    const channels: string[] = [];

    // Always include in-app notifications
    if (!userSettings || userSettings.enableInApp) {
      channels.push('in_app');
    }

    // Add email for medium and high priority notifications
    if ((notification.priority === 'medium' || notification.priority === 'high' || notification.priority === 'critical') &&
        (!userSettings || userSettings.enableEmail) && userSettings?.emailAddress) {
      channels.push('email');
    }

    // Add SMS for critical notifications only
    if (notification.priority === 'critical' && 
        userSettings?.enableSms && userSettings?.phoneNumber) {
      channels.push('sms');
    }

    // Add webhook if configured
    if (userSettings?.enableWebhook && userSettings?.webhookUrl) {
      channels.push('webhook');
    }

    return channels.length > 0 ? channels : ['in_app']; // Fallback to in-app
  }

  /**
   * Deliver notification on a specific channel
   */
  private async deliverNotification(
    notification: NotificationQueue,
    channel: string,
    userSettings: NotificationSetting | undefined
  ): Promise<DeliveryResult> {
    switch (channel) {
      case 'email':
        return await this.deliverEmailNotification(notification, userSettings);
      case 'sms':
        return await this.deliverSMSNotification(notification, userSettings);
      case 'webhook':
        return await this.deliverWebhookNotification(notification, userSettings);
      case 'in_app':
        return {
          success: true,
          channel: 'in_app',
          deliveryId: notification.id,
          timestamp: new Date(),
        };
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmailNotification(
    notification: NotificationQueue,
    userSettings: NotificationSetting | undefined
  ): Promise<DeliveryResult> {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email transporter not initialized');
      }

      if (!userSettings?.emailAddress) {
        throw new Error('No email address configured for user');
      }

      // Get email template
      const template = await storage.getTemplateByTypeAndChannel(
        notification.alertType,
        notification.alertCategory,
        'email'
      );

      if (!template) {
        throw new Error(`No email template found for ${notification.alertType}/${notification.alertCategory}`);
      }

      // Process template with variables
      const processedSubject = this.processTemplate(template.subject || notification.title, notification.templateData || {});
      const processedBody = this.processTemplate(template.bodyTemplate || notification.message, notification.templateData || {});

      // Send email
      const info = await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'WorkFlu Notifications <notifications@workflu.com>',
        to: userSettings.emailAddress,
        subject: processedSubject,
        html: processedBody,
        text: this.stripHtml(processedBody), // Plain text fallback
      });

      // For development with Ethereal, log preview URL
      if (process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`📧 Preview email: ${previewUrl}`);
        }
      }

      return {
        success: true,
        channel: 'email',
        deliveryId: info.messageId,
        timestamp: new Date(),
        metadata: {
          to: userSettings.emailAddress,
          subject: processedSubject,
          messageId: info.messageId,
        },
      };

    } catch (error) {
      return {
        success: false,
        channel: 'email',
        error: error instanceof Error ? error.message : 'Email delivery failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Deliver SMS notification (simulated for development)
   */
  private async deliverSMSNotification(
    notification: NotificationQueue,
    userSettings: NotificationSetting | undefined
  ): Promise<DeliveryResult> {
    try {
      if (!userSettings?.phoneNumber) {
        throw new Error('No phone number configured for user');
      }

      // Get SMS template
      const template = await storage.getTemplateByTypeAndChannel(
        notification.alertType,
        notification.alertCategory,
        'email' // Fallback to email template for SMS content
      );

      let message = notification.message;
      if (template?.smsTemplate) {
        message = this.processTemplate(template.smsTemplate, notification.templateData || {});
      }

      // For development, simulate SMS delivery
      console.log(`📱 SMS to ${userSettings.phoneNumber}: ${message}`);

      // In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
      // const result = await smsProvider.send({
      //   to: userSettings.phoneNumber,
      //   message: message,
      // });

      return {
        success: true,
        channel: 'sms',
        deliveryId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        metadata: {
          to: userSettings.phoneNumber,
          message: message.substring(0, 160), // SMS character limit
        },
      };

    } catch (error) {
      return {
        success: false,
        channel: 'sms',
        error: error instanceof Error ? error.message : 'SMS delivery failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Deliver webhook notification
   */
  private async deliverWebhookNotification(
    notification: NotificationQueue,
    userSettings: NotificationSetting | undefined
  ): Promise<DeliveryResult> {
    try {
      if (!userSettings?.webhookUrl) {
        throw new Error('No webhook URL configured for user');
      }

      const startTime = Date.now();

      // Prepare webhook payload
      const payload = {
        id: notification.id,
        userId: notification.userId,
        alertType: notification.alertType,
        alertCategory: notification.alertCategory,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        actionUrl: notification.actionUrl,
        templateData: notification.templateData,
        timestamp: notification.createdAt,
      };

      // Sign the payload for security
      const signature = this.signWebhookPayload(payload);

      // Send webhook request
      const response = await fetch(userSettings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WorkFlu-Notifications/1.0',
          'X-WorkFlu-Signature': signature,
          'X-WorkFlu-Timestamp': Date.now().toString(),
        },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          channel: 'webhook',
          deliveryId: `webhook_${notification.id}`,
          timestamp: new Date(),
          metadata: {
            url: userSettings.webhookUrl,
            statusCode: response.status,
            responseTime,
          },
        };
      } else {
        throw new Error(`Webhook returned status ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      return {
        success: false,
        channel: 'webhook',
        error: error instanceof Error ? error.message : 'Webhook delivery failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Process template with variable substitution
   */
  private processTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      if (value !== undefined && value !== null) {
        return String(value);
      }
      return match; // Keep placeholder if variable not found
    });
  }

  /**
   * Strip HTML tags from text (for email plain text fallback)
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Sign webhook payload for security
   */
  private signWebhookPayload(payload: any): string {
    const secret = process.env.WEBHOOK_SECRET || 'workflu-webhook-secret';
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Log notification delivery for audit purposes
   */
  private async logNotificationDelivery(
    notification: CreateNotification,
    result: DeliveryResult
  ): Promise<void> {
    try {
      await auditService.logOperation(
        {
          userId: 'system',
          userName: 'NotificationService',
          source: 'notification_service',
          severity: result.success ? 'info' : 'warning',
        },
        {
          entityType: 'notifications',
          entityId: notification.entityId,
          action: 'create',
          operationType: 'notification_delivery',
          description: `Notification delivery ${result.success ? 'succeeded' : 'failed'} on channel ${result.channel}`,
          newValues: {
            alertType: notification.alertType,
            alertCategory: notification.alertCategory,
            priority: notification.priority,
            channel: result.channel,
            success: result.success,
            error: result.error,
          },
        }
      );
    } catch (error) {
      console.error('Failed to log notification delivery:', error);
    }
  }

  /**
   * Create notification for business event
   */
  async createBusinessAlert(params: {
    userId: string;
    alertType: string;
    alertCategory: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    templateData?: Record<string, any>;
  }): Promise<DeliveryResult> {
    const notification: CreateNotification = {
      userId: params.userId,
      alertType: params.alertType as any,
      alertCategory: params.alertCategory as any,
      priority: params.priority,
      title: params.title,
      message: params.message,
      channels: ['in_app', 'email'] as any[], // Default notification channels
      entityType: params.entityType,
      entityId: params.entityId,
      actionUrl: params.actionUrl,
      templateData: params.templateData,
    };

    return await this.sendNotification(notification);
  }

  /**
   * Send digest notifications (daily, weekly, monthly)
   */
  async sendDigestNotifications(frequency: 'daily_digest' | 'weekly_summary' | 'monthly_report'): Promise<{
    sent: number;
    failed: number;
  }> {
    try {
      console.log(`📊 Starting ${frequency} digest notifications...`);

      // Get users with digest frequency settings
      const users = await storage.getAllUsers();
      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const settings = await storage.getNotificationSettings(user.id);
          
          if (settings?.defaultFrequency === frequency) {
            // Create digest notification
            const result = await this.createBusinessAlert({
              userId: user.id,
              alertType: 'system_alert',
              alertCategory: 'operational_delay', // Use as digest category
              priority: 'medium',
              title: `WorkFlu ${frequency.replace('_', ' ').toUpperCase()}`,
              message: `Your ${frequency.replace('_', ' ')} summary is ready.`,
              actionUrl: '/dashboard',
              templateData: {
                userName: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
                frequency: frequency.replace('_', ' '),
                period: new Date().toLocaleDateString(),
              },
            });

            if (result.success) {
              sent++;
            } else {
              failed++;
            }
          }
        } catch (userError) {
          console.error(`Failed to send digest to user ${user.id}:`, userError);
          failed++;
        }
      }

      console.log(`📊 Digest notifications complete: ${sent} sent, ${failed} failed`);
      return { sent, failed };

    } catch (error) {
      console.error('Failed to send digest notifications:', error);
      return { sent: 0, failed: 0 };
    }
  }
}

export const notificationService = NotificationService.getInstance();