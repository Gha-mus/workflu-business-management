import * as cron from 'node-cron';
import { storage } from './storage';
import { exportService } from './exportService';
import type { ExportJob } from '@shared/schema';

export class SchedulerService {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  /**
   * Initialize the scheduler service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing export scheduler service...');

    // Load existing export jobs and schedule them
    await this.loadAndScheduleExistingJobs();

    // Schedule periodic cleanup
    this.scheduleCleanupTasks();

    // Schedule job health checks
    this.scheduleHealthChecks();

    this.isInitialized = true;
    console.log('Export scheduler service initialized successfully');
  }

  /**
   * Load existing export jobs from database and schedule them
   */
  private async loadAndScheduleExistingJobs(): Promise<void> {
    try {
      const exportJobs = await storage.getExportJobs();
      
      for (const job of exportJobs) {
        if (job.isActive) {
          await this.scheduleJob(job);
        }
      }

      console.log(`Scheduled ${exportJobs.filter(j => j.isActive).length} export jobs`);
    } catch (error) {
      console.error('Error loading existing export jobs:', error);
    }
  }

  /**
   * Schedule an individual export job
   */
  async scheduleJob(job: ExportJob): Promise<void> {
    try {
      // Remove existing scheduled job if it exists
      if (this.scheduledJobs.has(job.id)) {
        this.scheduledJobs.get(job.id)?.stop();
        this.scheduledJobs.delete(job.id);
      }

      // Parse schedule - support different formats
      const cronExpression = this.parseToCronExpression(job.schedule);
      
      if (!cron.validate(cronExpression)) {
        console.error(`Invalid cron expression for job ${job.id}: ${cronExpression}`);
        return;
      }

      // Create scheduled task
      const task = cron.schedule(cronExpression, async () => {
        await this.executeExportJob(job);
      }, {
        timezone: 'UTC'
      });

      // Store the task
      this.scheduledJobs.set(job.id, task);
      
      // Start the task
      task.start();

      // Update next run time in database
      // Note: nextRun would be handled by the database trigger or separate update

      console.log(`Scheduled export job: ${job.jobName} (${job.id}) with schedule: ${cronExpression}`);
    } catch (error) {
      console.error(`Error scheduling job ${job.id}:`, error);
    }
  }

  /**
   * Execute an export job
   */
  private async executeExportJob(job: ExportJob): Promise<void> {
    console.log(`Executing export job: ${job.jobName} (${job.id})`);

    try {
      // Update last run time  
      // Note: lastRun and nextRun would be handled by the database trigger or separate update

      // Parse job parameters
      const parameters = job.parameters as any || {};
      
      // Create export request
      const exportParams = {
        userId: job.userId,
        exportType: job.exportType,
        format: job.format,
        dateRange: parameters.dateRange,
        filters: parameters.filters,
        preferences: {
          emailDelivery: !!(job.emailRecipients && job.emailRecipients.length > 0),
          emailRecipients: job.emailRecipients,
          compression: parameters.compression || false,
          customFields: parameters.customFields
        }
      };

      // Execute the export
      const exportResult = await exportService.createExport(exportParams);

      console.log(`Export job ${job.id} completed successfully. Export ID: ${exportResult.id}`);

      // Send notification email if configured
      if (job.emailRecipients && job.emailRecipients.length > 0) {
        // Note: Email sending would be implemented in exportService
        console.log(`Export job ${job.id} results will be emailed to: ${job.emailRecipients.join(', ')}`);
      }

    } catch (error) {
      console.error(`Error executing export job ${job.id}:`, error);
      
      // Optionally disable job if it fails repeatedly
      // This would require tracking failure count
    }
  }

  /**
   * Create a new scheduled export job
   */
  async createScheduledJob(jobData: {
    userId: string;
    jobName: string;
    exportType: string;
    format: string;
    schedule: string;
    parameters?: any;
    emailRecipients?: string[];
  }): Promise<ExportJob> {
    try {
      // Validate schedule
      const cronExpression = this.parseToCronExpression(jobData.schedule);
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid schedule format: ${jobData.schedule}`);
      }

      // Create job in database
      const job = await storage.createExportJob({
        userId: jobData.userId,
        jobName: jobData.jobName,
        exportType: jobData.exportType,
        format: jobData.format,
        schedule: jobData.schedule,
        parameters: jobData.parameters,
        emailRecipients: jobData.emailRecipients,
        isActive: true
      });

      // Schedule the job
      await this.scheduleJob(job);

      return job;
    } catch (error) {
      console.error('Error creating scheduled job:', error);
      throw error;
    }
  }

  /**
   * Update an existing scheduled job
   */
  async updateScheduledJob(jobId: string, updates: Partial<{
    jobName: string;
    exportType: string;
    format: string;
    schedule: string;
    parameters: any;
    emailRecipients: string[];
    isActive: boolean;
  }>): Promise<ExportJob> {
    try {
      // Update job in database
      const updatedJob = await storage.updateExportJob(jobId, updates);

      // Re-schedule if schedule changed or job activated
      if (updates.schedule || updates.isActive !== undefined) {
        if (updatedJob.isActive) {
          await this.scheduleJob(updatedJob);
        } else {
          await this.unscheduleJob(jobId);
        }
      }

      return updatedJob;
    } catch (error) {
      console.error(`Error updating scheduled job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a scheduled export job
   */
  async deleteScheduledJob(jobId: string): Promise<void> {
    try {
      // Remove from scheduler
      await this.unscheduleJob(jobId);

      // Delete from database
      await storage.deleteExportJob(jobId);

      console.log(`Deleted scheduled export job: ${jobId}`);
    } catch (error) {
      console.error(`Error deleting scheduled job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Unschedule a job (stop but don't delete)
   */
  async unscheduleJob(jobId: string): Promise<void> {
    if (this.scheduledJobs.has(jobId)) {
      const task = this.scheduledJobs.get(jobId);
      task?.stop();
      task?.destroy();
      this.scheduledJobs.delete(jobId);
      console.log(`Unscheduled export job: ${jobId}`);
    }
  }

  /**
   * Parse different schedule formats to cron expression
   */
  private parseToCronExpression(schedule: string): string {
    switch (schedule.toLowerCase()) {
      case 'daily':
        return '0 0 * * *'; // Every day at midnight
      case 'weekly':
        return '0 0 * * 0'; // Every Sunday at midnight
      case 'monthly':
        return '0 0 1 * *'; // First day of every month at midnight
      case 'hourly':
        return '0 * * * *'; // Every hour
      default:
        // Assume it's already a cron expression
        return schedule;
    }
  }

  /**
   * Calculate next run time for a cron expression
   */
  private calculateNextRun(cronExpression: string): Date {
    // This is a simplified implementation
    // A full implementation would use a cron parsing library
    const now = new Date();
    
    switch (cronExpression) {
      case '0 0 * * *': // daily
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
        
      case '0 0 * * 0': // weekly
        const nextSunday = new Date(now);
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
        nextSunday.setHours(0, 0, 0, 0);
        return nextSunday;
        
      case '0 0 1 * *': // monthly
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;
        
      case '0 * * * *': // hourly
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0, 0, 0);
        return nextHour;
        
      default:
        // For custom cron expressions, add 1 hour as default
        const defaultNext = new Date(now);
        defaultNext.setHours(defaultNext.getHours() + 1);
        return defaultNext;
    }
  }

  /**
   * Schedule periodic cleanup tasks
   */
  private scheduleCleanupTasks(): void {
    // Clean up expired exports daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running scheduled export cleanup...');
      try {
        await exportService.cleanupExpiredExports();
        console.log('Export cleanup completed successfully');
      } catch (error) {
        console.error('Error during export cleanup:', error);
      }
    }, {
      timezone: 'UTC'
    });
  }

  /**
   * Schedule health checks for scheduled jobs
   */
  private scheduleHealthChecks(): void {
    // Check job health every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Error during scheduler health check:', error);
      }
    }, {
      timezone: 'UTC'
    });
  }

  /**
   * Perform health check on scheduled jobs
   */
  private async performHealthCheck(): Promise<void> {
    const activeJobs = await storage.getExportJobs();
    const currentTime = new Date();

    for (const job of activeJobs.filter(j => j.isActive)) {
      // Check if job should have run by now but hasn't
      if (job.nextRun && job.nextRun < currentTime) {
        const timeDiff = currentTime.getTime() - job.nextRun.getTime();
        
        // If more than 1 hour overdue, log warning
        if (timeDiff > 60 * 60 * 1000) {
          console.warn(`Export job ${job.jobName} (${job.id}) is overdue by ${Math.round(timeDiff / 60000)} minutes`);
          
          // Re-schedule the job
          await this.scheduleJob(job);
        }
      }

      // Ensure job is actually scheduled
      if (!this.scheduledJobs.has(job.id)) {
        console.warn(`Export job ${job.jobName} (${job.id}) was not scheduled. Re-scheduling...`);
        await this.scheduleJob(job);
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    initialized: boolean;
    scheduledJobsCount: number;
    scheduledJobs: Array<{
      id: string;
      name: string;
      isRunning: boolean;
    }>;
  } {
    return {
      initialized: this.isInitialized,
      scheduledJobsCount: this.scheduledJobs.size,
      scheduledJobs: Array.from(this.scheduledJobs).map(([id, task]) => ({
        id,
        name: `export_job_${id}`,
        isRunning: task.getStatus() === 'scheduled'
      }))
    };
  }

  /**
   * Stop all scheduled jobs (for graceful shutdown)
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down export scheduler service...');
    
    for (const [jobId, task] of Array.from(this.scheduledJobs.entries())) {
      try {
        task.stop();
        task.destroy();
      } catch (error) {
        console.error(`Error stopping scheduled job ${jobId}:`, error);
      }
    }
    
    this.scheduledJobs.clear();
    this.isInitialized = false;
    
    console.log('Export scheduler service shut down successfully');
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();