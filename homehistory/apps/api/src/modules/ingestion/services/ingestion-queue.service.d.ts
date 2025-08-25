import { PrismaService } from '../../modules/database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
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
export declare class IngestionQueueService {
    private prisma;
    private notificationsService;
    private readonly logger;
    private readonly maxConcurrentJobs;
    private activeJobs;
    private jobQueue;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    addJob(type: IngestionJob['type'], data: any, userId: string, priority?: IngestionJob['priority']): Promise<string>;
    getJob(jobId: string): Promise<IngestionJob | null>;
    getUserJobs(userId: string, status?: IngestionJob['status']): Promise<IngestionJob[]>;
    cancelJob(jobId: string, userId: string): Promise<boolean>;
    retryJob(jobId: string, userId: string): Promise<boolean>;
    getQueueStats(): Promise<QueueStats>;
    private addToQueue;
    private startQueueProcessor;
    private processQueue;
    private processJob;
    private processDocumentJob;
    private processPropertyJob;
    private processBulkJob;
    private updateJobStatus;
    private updateJobProgress;
    private generateJobId;
}
//# sourceMappingURL=ingestion-queue.service.d.ts.map
