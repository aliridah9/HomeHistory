import { PrismaService } from '../database/prisma.service';
import { MaintenanceSchedulerService } from './services/maintenance-scheduler.service';
import { CreateMaintenanceTaskDto, UpdateMaintenanceTaskDto, MaintenanceTaskQueryDto, MaintenanceTaskResponseDto } from './dto';
export declare class MaintenanceService {
    private prisma;
    private schedulerService;
    constructor(prisma: PrismaService, schedulerService: MaintenanceSchedulerService);
    createMaintenance(userId: string, dto: CreateMaintenanceTaskDto): Promise<MaintenanceTaskResponseDto>;
    getMaintenance(userId: string, query: MaintenanceTaskQueryDto): Promise<{
        maintenance: MaintenanceTaskResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getMaintenanceById(userId: string, maintenanceId: string): Promise<MaintenanceTaskResponseDto>;
    updateMaintenance(userId: string, maintenanceId: string, dto: UpdateMaintenanceTaskDto): Promise<MaintenanceTaskResponseDto>;
    deleteMaintenance(userId: string, maintenanceId: string): Promise<void>;
    getMaintenanceStats(userId: string): Promise<any>;
    getUpcomingMaintenance(userId: string): Promise<{
        upcoming: MaintenanceTaskResponseDto[];
    }>;
    getOverdueMaintenance(userId: string): Promise<{
        overdue: MaintenanceTaskResponseDto[];
    }>;
    completeMaintenance(userId: string, maintenanceId: string, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    scheduleMaintenance(userId: string, maintenanceId: string, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getPropertyMaintenance(userId: string, propertyId: string, query: MaintenanceTaskQueryDto): Promise<{
        maintenance: MaintenanceTaskResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    bulkScheduleMaintenance(userId: string, data: any): Promise<{
        scheduled: number;
        maintenanceRecords: MaintenanceTaskResponseDto[];
    }>;
    private verifyPropertyAccess;
    private formatMaintenanceResponse;
}
//# sourceMappingURL=maintenance.service.d.ts.map
