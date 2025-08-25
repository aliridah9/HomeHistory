import { PrismaService } from '../database/prisma.service';
import { IngestionService } from './ingestion.service';
import { NotificationsService } from '../notifications/notifications.service';
export interface ScheduledIngestionJob {
    id: string;
    type: 'document' | 'property' | 'bulk';
    schedule: string;
    lastRun?: Date;
    nextRun: Date;
    isActive: boolean;
    metadata: Record<string, any>;
}
export declare class IngestionScheduler {
    private readonly prisma;
    private readonly ingestionService;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, ingestionService: IngestionService, notificationsService: NotificationsService);
    handleScheduledJobs(): Promise<void>;
    private shouldRunJob;
    private executeScheduledJob;
    private updateJobLastRun;
    createScheduledJob(type: 'document' | 'property' | 'bulk', schedule: string, metadata: Record<string, any>, userId: string): Promise<ScheduledIngestionJob>;
    updateScheduledJob(jobId: string, updates: Partial<ScheduledIngestionJob>): Promise<ScheduledIngestionJob>;
    deleteScheduledJob(jobId: string): Promise<void>;
    getScheduledJobs(userId?: string): Promise<ScheduledIngestionJob[]>;
    private calculateNextRun;
}
//# sourceMappingURL=ingestion.scheduler.d.ts.map
