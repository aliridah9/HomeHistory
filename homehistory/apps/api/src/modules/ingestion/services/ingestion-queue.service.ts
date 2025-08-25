import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/dto';

export interface IngestionJob {
  id: string;
  type: 'document' | 'property' | 'bulk';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: any;
  userId: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageProcessingTime: number;
}

@Injectable()
export class IngestionQueueService {
  private readonly logger = new Logger(IngestionQueueService.name);
  private readonly maxConcurrentJobs = 5;
  private activeJobs = new Map<string, IngestionJob>();
  private jobQueue: IngestionJob[] = [];

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    this.startQueueProcessor();
  }

  async addJob(
    type: IngestionJob['type'],
    data: any,
    userId: string,
    priority: IngestionJob['priority'] = 'medium',
  ): Promise<string> {
    this.logger.log(`Adding ${type} ingestion job for user ${userId}`);

    const job: IngestionJob = {
      id: this.generateJobId(),
      type,
      status: 'pending',
      priority,
      data,
      userId,
      createdAt: new Date(),
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
    };

    // Store job in database
    // Mock implementation - ingestionJob model doesn't exist in schema
    console.log(`Creating ingestion job ${job.id} of type ${job.type}`);

    // Add to queue
    this.addToQueue(job);

    return job.id;
  }

  async getJob(jobId: string): Promise<IngestionJob | null> {
    // Check active jobs first
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId)!;
    }

    // Check queue
    const queuedJob = this.jobQueue.find(job => job.id === jobId);
    if (queuedJob) {
      return queuedJob;
    }

    // Check database
    // Mock implementation - ingestionJob model doesn't exist in schema
    const dbJob: any = null;

    if (!dbJob) {
      return null;
    }

    return {
      id: dbJob.id,
      type: dbJob.type as IngestionJob['type'],
      status: dbJob.status as IngestionJob['status'],
      priority: dbJob.priority as IngestionJob['priority'],
      data: dbJob.data,
      userId: dbJob.userId,
      createdAt: dbJob.createdAt,
      startedAt: dbJob.startedAt || undefined,
      completedAt: dbJob.completedAt || undefined,
      progress: dbJob.progress,
      result: dbJob.result,
      error: dbJob.error || undefined,
      retryCount: dbJob.retryCount,
      maxRetries: dbJob.maxRetries,
    };
  }

  async getUserJobs(userId: string, status?: IngestionJob['status']): Promise<IngestionJob[]> {
    const whereClause: any = { userId };
    if (status) {
      whereClause.status = status;
    }

    // Mock implementation - ingestionJob model doesn't exist in schema
    const dbJobs: any[] = [];

    return dbJobs.map(dbJob => ({
      id: dbJob.id,
      type: dbJob.type as IngestionJob['type'],
      status: dbJob.status as IngestionJob['status'],
      priority: dbJob.priority as IngestionJob['priority'],
      data: dbJob.data,
      userId: dbJob.userId,
      createdAt: dbJob.createdAt,
      startedAt: dbJob.startedAt || undefined,
      completedAt: dbJob.completedAt || undefined,
      progress: dbJob.progress,
      result: dbJob.result,
      error: dbJob.error || undefined,
      retryCount: dbJob.retryCount,
      maxRetries: dbJob.maxRetries,
    }));
  }

  async cancelJob(jobId: string, userId: string): Promise<boolean> {
    this.logger.log(`Cancelling job ${jobId} for user ${userId}`);

    // Check if job exists and belongs to user
    const job = await this.getJob(jobId);
    if (!job || job.userId !== userId) {
      return false;
    }

    // Remove from active jobs if processing
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.delete(jobId);
    }

    // Remove from queue
    this.jobQueue = this.jobQueue.filter(job => job.id !== jobId);

    // Mock implementation - ingestionJob model doesn't exist in schema
    console.log(`Cancelling job ${jobId}`);

    return true;
  }

  async retryJob(jobId: string, userId: string): Promise<boolean> {
    this.logger.log(`Retrying job ${jobId} for user ${userId}`);

    const job = await this.getJob(jobId);
    if (!job || job.userId !== userId) {
      return false;
    }

    if (job.retryCount >= job.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    // Reset job status
    const retryJob: IngestionJob = {
      ...job,
      status: 'pending',
      progress: 0,
      retryCount: job.retryCount + 1,
      error: undefined,
      result: undefined,
      startedAt: undefined,
      completedAt: undefined,
    };

    // Mock implementation - ingestionJob model doesn't exist in schema
    console.log(`Retrying job ${jobId}`);

    // Add back to queue
    this.addToQueue(retryJob);

    return true;
  }

  async getQueueStats(): Promise<QueueStats> {
    // Mock implementation - ingestionJob model doesn't exist in schema
    const stats: any[] = [];
    const total = 0;
    const pending = 0;
    const processing = 0;
    const completed = 0;
    const failed = 0;
    const cancelled = 0;

    // Calculate average processing time
    const completedJobs: any[] = [];

    const averageProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const duration = job.completedAt!.getTime() - job.startedAt!.getTime();
          return sum + duration;
        }, 0) / completedJobs.length
      : 0;

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      cancelled,
      averageProcessingTime,
    };
  }

  private addToQueue(job: IngestionJob) {
    // Insert job based on priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const jobPriority = priorityOrder[job.priority];
    
    let insertIndex = this.jobQueue.length;
    for (let i = 0; i < this.jobQueue.length; i++) {
      const queuePriority = priorityOrder[this.jobQueue[i].priority];
      if (jobPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.jobQueue.splice(insertIndex, 0, job);
    this.logger.log(`Job ${job.id} added to queue at position ${insertIndex}`);
  }

  private async startQueueProcessor() {
    setInterval(async () => {
      await this.processQueue();
    }, 1000); // Check queue every second
  }

  private async processQueue() {
    // Don't start new jobs if we're at capacity
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    // Get next job from queue
    const nextJob = this.jobQueue.shift();
    if (!nextJob) {
      return;
    }

    // Start processing
    this.activeJobs.set(nextJob.id, nextJob);
    this.processJob(nextJob);
  }

  private async processJob(job: IngestionJob) {
    try {
      this.logger.log(`Starting to process job ${job.id} (${job.type})`);

      // Update job status
      job.status = 'processing';
      job.startedAt = new Date();
      await this.updateJobStatus(job);

      // Simulate processing based on job type
      switch (job.type) {
        case 'document':
          await this.processDocumentJob(job);
          break;
        case 'property':
          await this.processPropertyJob(job);
          break;
        case 'bulk':
          await this.processBulkJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark as completed
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      await this.updateJobStatus(job);

      // Send notification
      await this.notificationsService.createNotification({
        userId: job.userId,
        type: NotificationType.DOCUMENT_PROCESSED,
        title: 'Ingestion Completed',
        message: `Your ${job.type} ingestion job has been completed successfully`,
        entityId: job.id,
        entityType: 'ingestion_job',
        metadata: {
          jobType: job.type,
          result: job.result,
        },
      });

    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);

      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
      await this.updateJobStatus(job);

      // Send failure notification
      await this.notificationsService.createNotification({
        userId: job.userId,
        type: NotificationType.SYSTEM_ALERT,
        title: 'Ingestion Failed',
        message: `Your ${job.type} ingestion job failed: ${error.message}`,
        entityId: job.id,
        entityType: 'ingestion_job',
        metadata: {
          jobType: job.type,
          error: error.message,
        },
      });
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(job.id);
    }
  }

  private async processDocumentJob(job: IngestionJob) {
    // Simulate document processing
    for (let i = 0; i <= 100; i += 10) {
      job.progress = i;
      await this.updateJobProgress(job);
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
    }

    job.result = {
      documentsProcessed: 1,
      success: true,
    };
  }

  private async processPropertyJob(job: IngestionJob) {
    // Simulate property processing
    for (let i = 0; i <= 100; i += 20) {
      job.progress = i;
      await this.updateJobProgress(job);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate work
    }

    job.result = {
      propertiesProcessed: 1,
      success: true,
    };
  }

  private async processBulkJob(job: IngestionJob) {
    // Simulate bulk processing
    const totalItems = job.data.items?.length || 10;
    
    for (let i = 0; i < totalItems; i++) {
      job.progress = Math.round((i / totalItems) * 100);
      await this.updateJobProgress(job);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    }

    job.result = {
      itemsProcessed: totalItems,
      success: true,
    };
  }

  private async updateJobStatus(job: IngestionJob) {
    // Mock implementation - ingestionJob model doesn't exist in schema
    console.log(`Updating job ${job.id} status to ${job.status}`);
  }

  private async updateJobProgress(job: IngestionJob) {
    // Mock implementation - ingestionJob model doesn't exist in schema
    console.log(`Updating job ${job.id} progress to ${job.progress}%`);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
