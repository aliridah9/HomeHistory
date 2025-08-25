import { PrismaService } from '../../modules/database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
export interface ScheduledMaintenanceJob {
    id: string;
    propertyId: string;
    maintenanceType: string;
    frequency: 'monthly' | 'quarterly' | 'annually';
    lastRun?: Date;
    nextRun: Date;
    isActive: boolean;
    metadata: Record<string, any>;
}
export declare class MaintenanceSchedulerService {
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    handleScheduledMaintenance(): Promise<void>;
    private shouldRunJob;
    private executeScheduledMaintenance;
    private updateJobLastRun;
    createScheduledMaintenance(propertyId: string, maintenanceType: string, frequency: 'monthly' | 'quarterly' | 'annually', metadata: Record<string, any>, userId: string): Promise<ScheduledMaintenanceJob>;
    updateScheduledMaintenance(jobId: string, updates: Partial<ScheduledMaintenanceJob>): Promise<ScheduledMaintenanceJob>;
    deleteScheduledMaintenance(jobId: string): Promise<void>;
    getScheduledMaintenance(propertyId?: string): Promise<ScheduledMaintenanceJob[]>;
    private calculateNextRun;
}
//# sourceMappingURL=maintenance-scheduler.service.d.ts.map
