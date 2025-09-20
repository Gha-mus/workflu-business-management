import cron from "node-cron";
import { storage } from "../../core/storage";
import { notificationService } from "../../notificationService";
import { alertMonitoringService } from "../../alertMonitoringService";
import { auditService } from "../../auditService";

// Scheduled task interface
interface ScheduledTask {
  name: string;
  schedule: string;
  description: string;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
  task: cron.ScheduledTask | null;
}

// Scheduler statistics interface
interface SchedulerStats {
  totalTasks: number;
  activeTasks: number;
  lastMonitoringRun: Date | null;
  totalNotificationsSentToday: number;
  totalAlertsTriggeredToday: number;
  queueProcessingStats: {
    lastProcessed: Date | null;
    totalProcessed: number;
    successRate: number;
  };
}

class NotificationSchedulerService {
  private static instance: NotificationSchedulerService;
  private isInitialized = false;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private stats: SchedulerStats = {
    totalTasks: 0,
    activeTasks: 0,
    lastMonitoringRun: null,
    totalNotificationsSentToday: 0,
    totalAlertsTriggeredToday: 0,
    queueProcessingStats: {
      lastProcessed: null,
      totalProcessed: 0,
      successRate: 0,
    },
  };

  private constructor() {
    console.log("NotificationSchedulerService initialized for automated business monitoring");
  }

  public static getInstance(): NotificationSchedulerService {
    if (!NotificationSchedulerService.instance) {
      NotificationSchedulerService.instance = new NotificationSchedulerService();
    }
    return NotificationSchedulerService.instance;
  }

  /**
   * Initialize the notification scheduler service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('⏰ Initializing notification scheduler service...');

    try {
      // Ensure dependent services are initialized
      await notificationService.initialize();
      await alertMonitoringService.initialize();

      // Schedule all monitoring tasks
      this.scheduleMonitoringTasks();

      // Schedule notification processing tasks
      this.scheduleNotificationProcessingTasks();

      // Schedule digest and cleanup tasks
      this.scheduleMaintenanceTasks();

      this.isInitialized = true;
      console.log('✅ Notification scheduler service initialized successfully');
      console.log(`📊 Scheduled ${this.scheduledTasks.size} monitoring and notification tasks`);

    } catch (error) {
      console.error('❌ Failed to initialize notification scheduler service:', error);
      throw error;
    }
  }

  /**
   * Schedule monitoring tasks for business metrics
   */
  private scheduleMonitoringTasks(): void {
    // Critical monitoring - every 15 minutes
    this.scheduleTask({
      name: 'critical-monitoring',
      schedule: '*/15 * * * *', // Every 15 minutes
      description: 'Monitor critical business metrics (capital, inventory, high-value transactions)',
      enabled: true,
      task: null,
    }, async () => {
      console.log('🚨 Running critical monitoring check...');
      try {
        const result = await alertMonitoringService.runMonitoringCheck();
        this.stats.lastMonitoringRun = new Date();
        this.stats.totalAlertsTriggeredToday += result.alertsTriggered;
        this.stats.totalNotificationsSentToday += result.notificationsSent;
        
        console.log(`✅ Critical monitoring complete: ${result.alertsTriggered} alerts, ${result.notificationsSent} notifications`);
      } catch (error) {
        console.error('❌ Critical monitoring failed:', error);
      }
    });

    // Standard monitoring - hourly
    this.scheduleTask({
      name: 'hourly-monitoring',
      schedule: '0 * * * *', // Top of every hour
      description: 'Hourly business metrics monitoring (approvals, operational issues)',
      enabled: true,
      task: null,
    }, async () => {
      console.log('⏰ Running hourly monitoring check...');
      try {
        const result = await alertMonitoringService.runMonitoringCheck();
        this.stats.lastMonitoringRun = new Date();
        this.stats.totalAlertsTriggeredToday += result.alertsTriggered;
        this.stats.totalNotificationsSentToday += result.notificationsSent;

        // Log hourly stats
        await this.logSchedulerStats('hourly');
        
        console.log(`✅ Hourly monitoring complete: ${result.alertsTriggered} alerts, ${result.notificationsSent} notifications`);
      } catch (error) {
        console.error('❌ Hourly monitoring failed:', error);
      }
    });

    // Daily monitoring - 6 AM
    this.scheduleTask({
      name: 'daily-monitoring',
      schedule: '0 6 * * *', // 6 AM every day
      description: 'Daily comprehensive business health monitoring',
      enabled: true,
      task: null,
    }, async () => {
      console.log('🌅 Running daily monitoring check...');
      try {
        const result = await alertMonitoringService.runMonitoringCheck();
        this.stats.lastMonitoringRun = new Date();
        this.stats.totalAlertsTriggeredToday += result.alertsTriggered;
        this.stats.totalNotificationsSentToday += result.notificationsSent;

        // Reset daily stats
        this.resetDailyStats();

        // Log daily summary
        await this.logSchedulerStats('daily');
        
        console.log(`✅ Daily monitoring complete: ${result.alertsTriggered} alerts, ${result.notificationsSent} notifications`);
      } catch (error) {
        console.error('❌ Daily monitoring failed:', error);
      }
    });

    // Weekly monitoring - Mondays at 7 AM
    this.scheduleTask({
      name: 'weekly-monitoring',
      schedule: '0 7 * * 1', // 7 AM every Monday
      description: 'Weekly business trend analysis and health report',
      enabled: true,
      task: null,
    }, async () => {
      console.log('📅 Running weekly monitoring and trend analysis...');
      try {
        const result = await alertMonitoringService.runMonitoringCheck();
        
        // Send weekly digest notifications
        const digestResult = await notificationService.sendDigestNotifications('weekly_summary');
        
        console.log(`✅ Weekly monitoring complete: ${result.alertsTriggered} alerts, ${digestResult.sent} digests sent`);
      } catch (error) {
        console.error('❌ Weekly monitoring failed:', error);
      }
    });

    // Monthly monitoring - 1st of month at 8 AM
    this.scheduleTask({
      name: 'monthly-monitoring',
      schedule: '0 8 1 * *', // 8 AM on 1st day of month
      description: 'Monthly comprehensive business health and compliance review',
      enabled: true,
      task: null,
    }, async () => {
      console.log('📊 Running monthly monitoring and compliance review...');
      try {
        const result = await alertMonitoringService.runMonitoringCheck();
        
        // Send monthly digest notifications
        const digestResult = await notificationService.sendDigestNotifications('monthly_report');
        
        console.log(`✅ Monthly monitoring complete: ${result.alertsTriggered} alerts, ${digestResult.sent} reports sent`);
      } catch (error) {
        console.error('❌ Monthly monitoring failed:', error);
      }
    });
  }

  /**
   * Schedule notification processing tasks
   */
  private scheduleNotificationProcessingTasks(): void {
    // Notification queue processing - every 5 minutes
    this.scheduleTask({
      name: 'queue-processing',
      schedule: '*/5 * * * *', // Every 5 minutes
      description: 'Process pending notification queue',
      enabled: true,
      task: null,
    }, async () => {
      console.log('📮 Processing notification queue...');
      try {
        const result = await notificationService.processNotificationQueue(50);
        this.stats.queueProcessingStats.lastProcessed = new Date();
        this.stats.queueProcessingStats.totalProcessed += result.processed;
        
        if (result.processed > 0) {
          this.stats.queueProcessingStats.successRate = result.successful / result.processed;
          console.log(`✅ Queue processing complete: ${result.processed} processed, ${result.successful} successful`);
        }
      } catch (error) {
        console.error('❌ Queue processing failed:', error);
      }
    });

    // Daily digest notifications - 8 AM
    this.scheduleTask({
      name: 'daily-digest',
      schedule: '0 8 * * *', // 8 AM every day
      description: 'Send daily digest notifications to users who opted in',
      enabled: true,
      task: null,
    }, async () => {
      console.log('📧 Sending daily digest notifications...');
      try {
        const result = await notificationService.sendDigestNotifications('daily_digest');
        console.log(`✅ Daily digest complete: ${result.sent} sent, ${result.failed} failed`);
      } catch (error) {
        console.error('❌ Daily digest failed:', error);
      }
    });

    // Failed notification retry - every hour
    this.scheduleTask({
      name: 'failed-notification-retry',
      schedule: '30 * * * *', // 30 minutes past every hour
      description: 'Retry failed notifications with exponential backoff',
      enabled: true,
      task: null,
    }, async () => {
      console.log('🔄 Retrying failed notifications...');
      try {
        const failedNotifications = await storage.getFailedNotifications(20);
        let retriedCount = 0;

        for (const notification of failedNotifications) {
          // Simple exponential backoff - retry if it's been at least (attempts^2) hours
          const hoursBack = Math.pow(notification.attempts || 1, 2);
          const cutoffTime = new Date();
          cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

          if (!notification.lastAttemptAt || notification.lastAttemptAt < cutoffTime) {
            try {
              const createNotification = {
                userId: notification.userId,
                alertType: notification.alertType,
                alertCategory: notification.alertCategory,
                priority: notification.priority,
                channels: ['in_app', 'email'],
                title: notification.title,
                message: notification.message,
                entityType: notification.entityType || undefined,
                entityId: notification.entityId || undefined,
                actionUrl: notification.actionUrl || undefined,
                templateData: notification.templateData || undefined,
              };

              await notificationService.sendNotification(createNotification);
              retriedCount++;
            } catch (retryError) {
              console.error(`Failed to retry notification ${notification.id}:`, retryError);
            }
          }
        }

        if (retriedCount > 0) {
          console.log(`✅ Notification retry complete: ${retriedCount} notifications retried`);
        }
      } catch (error) {
        console.error('❌ Failed notification retry failed:', error);
      }
    });
  }

  /**
   * Schedule maintenance and cleanup tasks
   */
  private scheduleMaintenanceTasks(): void {
    // Cleanup old notifications - daily at 2 AM
    this.scheduleTask({
      name: 'notification-cleanup',
      schedule: '0 2 * * *', // 2 AM every day
      description: 'Archive old notifications and clean up processed items',
      enabled: true,
      task: null,
    }, async () => {
      console.log('🧹 Running notification cleanup...');
      try {
        // Clean up notifications older than 90 days
        const cleanupResult = await notificationService.cleanupOldNotifications(90);
        
        // Archive notification history older than 1 year
        const archiveResult = await storage.archiveNotificationHistory(365);
        
        console.log(`✅ Cleanup complete: ${cleanupResult.deleted} notifications, ${archiveResult.archived} history records archived`);
      } catch (error) {
        console.error('❌ Notification cleanup failed:', error);
      }
    });

    // Health check and statistics - every 6 hours
    this.scheduleTask({
      name: 'health-check',
      schedule: '0 */6 * * *', // Every 6 hours
      description: 'System health check and statistics reporting',
      enabled: true,
      task: null,
    }, async () => {
      console.log('🏥 Running system health check...');
      try {
        // Get system health metrics
        const monitoringDashboard = await alertMonitoringService.getMonitoringDashboard();
        
        // Log system health
        console.log('📊 System Health Report:');
        console.log(`  - Active Alert Configurations: ${monitoringDashboard.systemHealth.activeConfigurations}`);
        console.log(`  - Alerts Last 24h: ${monitoringDashboard.systemHealth.totalAlertsLast24h}`);
        console.log(`  - Critical Alerts Active: ${monitoringDashboard.systemHealth.criticalAlertsActive}`);
        console.log(`  - Notifications Sent Today: ${this.stats.totalNotificationsSentToday}`);
        console.log(`  - Queue Processing Success Rate: ${(this.stats.queueProcessingStats.successRate * 100).toFixed(1)}%`);

        // Create system health alert if there are critical issues
        if (monitoringDashboard.systemHealth.criticalAlertsActive > 5) {
          await this.createSystemHealthAlert(
            'High number of critical alerts',
            `${monitoringDashboard.systemHealth.criticalAlertsActive} critical alerts are currently active`,
            'critical'
          );
        }

        console.log('✅ Health check complete');
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    });

    // Performance monitoring - daily at midnight
    this.scheduleTask({
      name: 'performance-monitoring',
      schedule: '0 0 * * *', // Midnight every day
      description: 'Monitor notification system performance and generate reports',
      enabled: true,
      task: null,
    }, async () => {
      console.log('📈 Running performance monitoring...');
      try {
        // Get notification analytics
        const analytics = await storage.getNotificationAnalytics(
          undefined,
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          new Date().toISOString() // Today
        );

        // Log performance metrics
        console.log('📊 Performance Report:');
        console.log(`  - Delivery Success Rate: ${(analytics.deliveryStats.successRate * 100).toFixed(1)}%`);
        console.log(`  - Average Delivery Time: ${analytics.deliveryStats.averageDeliveryTime}ms`);
        console.log(`  - Engagement Rate: ${(analytics.engagementStats.openRate * 100).toFixed(1)}%`);

        console.log('✅ Performance monitoring complete');
      } catch (error) {
        console.error('❌ Performance monitoring failed:', error);
      }
    });
  }

  /**
   * Schedule a task with the cron scheduler
   */
  private scheduleTask(
    taskConfig: Omit<ScheduledTask, 'task'>,
    taskFunction: () => Promise<void>
  ): void {
    try {
      if (!cron.validate(taskConfig.schedule)) {
        console.error(`Invalid cron expression for task ${taskConfig.name}: ${taskConfig.schedule}`);
        return;
      }

      const scheduledTask = cron.schedule(taskConfig.schedule, async () => {
        const taskInfo = this.scheduledTasks.get(taskConfig.name);
        if (taskInfo?.enabled) {
          try {
            console.log(`⏰ Starting scheduled task: ${taskConfig.name}`);
            const startTime = Date.now();
            
            await taskFunction();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Task completed: ${taskConfig.name} (${duration}ms)`);

            // Update task info
            if (taskInfo) {
              taskInfo.lastRun = new Date();
            }

          } catch (error) {
            console.error(`❌ Task failed: ${taskConfig.name}`, error);
            
            // Log task failure
            await auditService.logOperation(
              {
                userId: 'system',
                userName: 'NotificationScheduler',
                source: 'scheduler',
                severity: 'error',
              },
              {
                entityType: 'scheduler_tasks',
                entityId: taskConfig.name,
                action: 'create',
                operationType: 'task_execution_failed',
                description: `Scheduled task ${taskConfig.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                newValues: {
                  taskName: taskConfig.name,
                  error: error instanceof Error ? error.message : String(error),
                },
              }
            );
          }
        }
      }, {
        timezone: 'UTC'
      });

      // Store the task
      const task: ScheduledTask = {
        ...taskConfig,
        task: scheduledTask,
      };

      this.scheduledTasks.set(taskConfig.name, task);
      
      if (taskConfig.enabled) {
        scheduledTask.start();
        this.stats.activeTasks++;
      }

      this.stats.totalTasks++;

      console.log(`📅 Scheduled task: ${taskConfig.name} (${taskConfig.schedule})`);

    } catch (error) {
      console.error(`Failed to schedule task ${taskConfig.name}:`, error);
    }
  }

  /**
   * Enable or disable a scheduled task
   */
  async toggleTask(taskName: string, enabled: boolean): Promise<boolean> {
    try {
      const task = this.scheduledTasks.get(taskName);
      if (!task) {
        console.error(`Task not found: ${taskName}`);
        return false;
      }

      task.enabled = enabled;
      
      if (enabled && task.task) {
        task.task.start();
        this.stats.activeTasks++;
        console.log(`✅ Enabled scheduled task: ${taskName}`);
      } else if (!enabled && task.task) {
        task.task.stop();
        this.stats.activeTasks--;
        console.log(`⏸️ Disabled scheduled task: ${taskName}`);
      }

      return true;
    } catch (error) {
      console.error(`Failed to toggle task ${taskName}:`, error);
      return false;
    }
  }

  /**
   * Get scheduler statistics
   */
  getSchedulerStats(): SchedulerStats & { tasks: Array<{
    name: string;
    schedule: string;
    description: string;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
  }> } {
    const tasks = Array.from(this.scheduledTasks.values()).map(task => ({
      name: task.name,
      schedule: task.schedule,
      description: task.description,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
    }));

    return {
      ...this.stats,
      tasks,
    };
  }

  /**
   * Create a system health alert
   */
  private async createSystemHealthAlert(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    try {
      // Get admin users for system health alerts
      const adminUsers = await storage.getAllUsers();
      const admins = adminUsers.filter(user => user.role === 'admin');

      for (const admin of admins) {
        await notificationService.createBusinessAlert({
          userId: admin.id,
          alertType: 'system_alert',
          alertCategory: 'system_health',
          priority: priority,
          title: `System Health: ${title}`,
          message: message,
          actionUrl: '/admin/system-health',
          templateData: {
            userName: admin.firstName ? `${admin.firstName} ${admin.lastName}` : admin.email,
            severity: priority.toUpperCase(),
            timestamp: new Date().toLocaleString(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to create system health alert:', error);
    }
  }

  /**
   * Reset daily statistics
   */
  private resetDailyStats(): void {
    this.stats.totalNotificationsSentToday = 0;
    this.stats.totalAlertsTriggeredToday = 0;
  }

  /**
   * Log scheduler statistics
   */
  private async logSchedulerStats(frequency: 'hourly' | 'daily'): Promise<void> {
    try {
      await auditService.logOperation(
        {
          userId: 'system',
          userName: 'NotificationScheduler',
          source: 'scheduler',
          severity: 'info',
        },
        {
          entityType: 'scheduler_stats',
          action: 'create',
          operationType: `${frequency}_stats`,
          description: `${frequency} scheduler statistics`,
          newValues: {
            ...this.stats,
            frequency,
          },
        }
      );
    } catch (error) {
      console.error('Failed to log scheduler stats:', error);
    }
  }

  /**
   * Shutdown the scheduler and stop all tasks
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down notification scheduler...');

    for (const [taskName, task] of this.scheduledTasks) {
      try {
        if (task.task) {
          task.task.stop();
          console.log(`⏹️ Stopped task: ${taskName}`);
        }
      } catch (error) {
        console.error(`Error stopping task ${taskName}:`, error);
      }
    }

    this.scheduledTasks.clear();
    this.stats.activeTasks = 0;
    this.isInitialized = false;

    console.log('✅ Notification scheduler shutdown complete');
  }
}

export const notificationSchedulerService = NotificationSchedulerService.getInstance();