import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
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
export declare class ParsingProcessor implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private notificationsService;
    private readonly logger;
    private isRunning;
    private isHealthy;
    private startTime;
    private lastHeartbeat;
    private processedJobs;
    private failedJobs;
    private processingTimes;
    private processingInterval?;
    private healthCheckInterval?;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    initialize(): Promise<void>;
    start(): Promise<{
        success: boolean;
        message: string;
    }>;
    stop(): Promise<{
        success: boolean;
        message: string;
    }>;
    getStatus(): ProcessorStatus;
    healthCheck(): Promise<{
        healthy: boolean;
        status: string;
        details: Record<string, any>;
    }>;
    getMetrics(): Promise<ProcessingMetrics>;
    scheduledHealthCheck(): Promise<void>;
    private processPendingJobs;
    private processJob;
    private processDocumentJob;
    private processBatchJob;
    private startHealthMonitoring;
    private calculateAverageProcessingTime;
}
//# sourceMappingURL=parsing.processor.d.ts.map
