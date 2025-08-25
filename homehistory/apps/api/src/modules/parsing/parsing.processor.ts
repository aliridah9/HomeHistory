import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/dto';

export interface ProcessorStatus {
  isRunning: boolean;
  isHealthy: boolean;
  lastHeartbeat: Date;
  processedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
}

export interface ProcessingMetrics {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  successRate: number;
  lastProcessedAt?: Date;
}

@Injectable()
export class ParsingProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ParsingProcessor.name);
  private isRunning = false;
  private isHealthy = true;
  private startTime = new Date();
  private lastHeartbeat = new Date();
  private processedJobs = 0;
  private failedJobs = 0;
  private processingTimes: number[] = [];
  private processingInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Parsing processor initializing...');
    await this.initialize();
  }

  async onModuleDestroy() {
    this.logger.log('Parsing processor shutting down...');
    await this.stop();
  }

  async initialize() {
    try {
      // Check for any pending jobs on startup
      const pendingJobs = await this.prisma.parsingJob.findMany({
        where: { status: 'PENDING' as any },
        take: 10,
      });

      if (pendingJobs.length > 0) {
        this.logger.log(`Found ${pendingJobs.length} pending jobs on startup`);
      }

      // Start health monitoring
      this.startHealthMonitoring();

      this.logger.log('Parsing processor initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize parsing processor:', error);
      throw error;
    }
  }

  async start(): Promise<{ success: boolean; message: string }> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'Processor is already running',
      };
    }

    try {
      this.isRunning = true;
      this.startTime = new Date();
      this.lastHeartbeat = new Date();

      // Start processing loop
      this.processingInterval = setInterval(async () => {
        await this.processPendingJobs();
      }, 5000); // Check every 5 seconds

      this.logger.log('Parsing processor started successfully');
      return {
        success: true,
        message: 'Processor started successfully',
      };
    } catch (error) {
      this.isRunning = false;
      this.logger.error('Failed to start parsing processor:', error);
      return {
        success: false,
        message: `Failed to start processor: ${error.message}`,
      };
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    if (!this.isRunning) {
      return {
        success: false,
        message: 'Processor is not running',
      };
    }

    try {
      this.isRunning = false;

      // Clear intervals
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = undefined;
      }

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = undefined;
      }

      this.logger.log('Parsing processor stopped successfully');
      return {
        success: true,
        message: 'Processor stopped successfully',
      };
    } catch (error) {
      this.logger.error('Failed to stop parsing processor:', error);
      return {
        success: false,
        message: `Failed to stop processor: ${error.message}`,
      };
    }
  }

  getStatus(): ProcessorStatus {
    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = process.memoryUsage();

    return {
      isRunning: this.isRunning,
      isHealthy: this.isHealthy,
      lastHeartbeat: this.lastHeartbeat,
      processedJobs: this.processedJobs,
      failedJobs: this.failedJobs,
      averageProcessingTime: this.calculateAverageProcessingTime(),
      uptime,
      memoryUsage,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
    };
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: Record<string, any>;
  }> {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Check if processor is running
      const isRunning = this.isRunning;

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryHealthy = memoryUsage.heapUsed < 500 * 1024 * 1024; // 500MB limit

      // Check uptime
      const uptime = Date.now() - this.startTime.getTime();
      const uptimeHealthy = uptime > 0;

      // Update health status
      this.isHealthy = isRunning && memoryHealthy && uptimeHealthy;
      this.lastHeartbeat = new Date();

      return {
        healthy: this.isHealthy,
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        details: {
          isRunning,
          memoryUsage,
          memoryHealthy,
          uptime,
          uptimeHealthy,
          lastHeartbeat: this.lastHeartbeat,
          processedJobs: this.processedJobs,
          failedJobs: this.failedJobs,
        },
      };
    } catch (error) {
      this.isHealthy = false;
      this.logger.error('Health check failed:', error);
      return {
        healthy: false,
        status: 'unhealthy',
        details: {
          error: error.message,
          lastHeartbeat: this.lastHeartbeat,
        },
      };
    }
  }

  async getMetrics(): Promise<ProcessingMetrics> {
    const totalProcessed = this.processedJobs;
    const totalFailed = this.failedJobs;
    const totalJobs = totalProcessed + totalFailed;
    const successRate = totalJobs > 0 ? (totalProcessed / totalJobs) * 100 : 0;

    return {
      totalProcessed,
      totalFailed,
      averageProcessingTime: this.calculateAverageProcessingTime(),
      successRate,
      lastProcessedAt: this.lastHeartbeat,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async scheduledHealthCheck() {
    if (this.isRunning) {
      await this.healthCheck();
    }
  }

  private async processPendingJobs() {
    try {
      // Get pending jobs
      const pendingJobs = await this.prisma.parsingJob.findMany({
        where: { status: 'PENDING' as any },
        take: 5, // Process up to 5 jobs at a time
        orderBy: { createdAt: 'asc' },
      });

      if (pendingJobs.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingJobs.length} pending jobs`);

      // Process jobs concurrently
      const processingPromises = pendingJobs.map(job => this.processJob(job));
      await Promise.allSettled(processingPromises);

    } catch (error) {
      this.logger.error('Error processing pending jobs:', error);
      this.failedJobs++;
    }
  }

  private async processJob(job: any) {
    const startTime = Date.now();

    try {
      this.logger.log(`Processing job ${job.id} (${job.type})`);

      // Update job status to processing
      await this.prisma.parsingJob.update({
        where: { id: job.id },
        data: {
          status: 'PROCESSING' as any,
          startedAt: new Date(),
        },
      });

      // Process based on job type
      let result;
      switch (job.type) {
        case 'document':
          result = await this.processDocumentJob(job);
          break;
        case 'batch':
          result = await this.processBatchJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Update job as completed
      await this.prisma.parsingJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED' as any,
          completedAt: new Date(),
          result: result as any,
        },
      });

      // Send notification
      await this.notificationsService.createNotification({
        userId: job.userId,
        type: NotificationType.DOCUMENT_PROCESSED,
        title: 'Document Parsed',
        message: `Your document has been successfully parsed`,
        entityId: job.id,
        entityType: 'parsing_job',
        metadata: {
          jobType: job.type,
          result,
        },
      });

      // Update metrics
      this.processedJobs++;
      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);

      // Keep only last 100 processing times for average calculation
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      this.logger.log(`Job ${job.id} completed successfully in ${processingTime}ms`);

    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);

      // Update job as failed
      await this.prisma.parsingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED' as any,
          completedAt: new Date(),
          error: error.message,
        },
      });

      // Send failure notification
      await this.notificationsService.createNotification({
        userId: job.userId,
        type: NotificationType.SYSTEM_ALERT,
        title: 'Document Parsing Failed',
        message: `Failed to parse your document: ${error.message}`,
        entityId: job.id,
        entityType: 'parsing_job',
        metadata: {
          jobType: job.type,
          error: error.message,
        },
      });

      // Update metrics
      this.failedJobs++;
    }
  }

  private async processDocumentJob(job: any) {
    // Mock document processing - in production, this would use actual parsing libraries
    const document = job.data;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock parsing result
    return {
      extractedText: `Parsed text from ${document.fileUrl}`,
      wordCount: Math.floor(Math.random() * 1000) + 100,
      characterCount: Math.floor(Math.random() * 5000) + 500,
      language: 'en',
      confidence: 0.85 + Math.random() * 0.15,
      entities: [
        { type: 'PERSON', value: 'John Doe', confidence: 0.9 },
        { type: 'ORGANIZATION', value: 'Sample Corp', confidence: 0.8 },
      ],
      metadata: {
        processingTime: Date.now(),
        parser: 'mock-parser',
        version: '1.0.0',
      },
    };
  }

  private async processBatchJob(job: any) {
    // Mock batch processing
    const documents = job.data.documents || [];
    const results = [];

    for (const document of documents) {
      // Simulate processing each document
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      results.push({
        documentId: document.id,
        success: Math.random() > 0.1, // 90% success rate
        extractedText: `Parsed text from ${document.fileUrl}`,
        wordCount: Math.floor(Math.random() * 1000) + 100,
      });
    }

    return {
      totalDocuments: documents.length,
      successfulDocuments: results.filter(r => r.success).length,
      failedDocuments: results.filter(r => !r.success).length,
      results,
      processingTime: Date.now(),
    };
  }

  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheck();
    }, 30000); // Check every 30 seconds
  }

  private calculateAverageProcessingTime(): number {
    if (this.processingTimes.length === 0) {
      return 0;
    }
    const sum = this.processingTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.processingTimes.length;
  }
}
