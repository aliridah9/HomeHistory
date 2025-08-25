import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceTaskDto, UpdateMaintenanceTaskDto, MaintenanceTaskQueryDto, MaintenanceTaskResponseDto } from './dto';
import { User } from '@homehistory/database';
export declare class MaintenanceController {
    private readonly maintenanceService;
    constructor(maintenanceService: MaintenanceService);
    createMaintenance(user: User, dto: CreateMaintenanceTaskDto): Promise<MaintenanceTaskResponseDto>;
    getMaintenance(user: User, query: MaintenanceTaskQueryDto): Promise<{
        maintenance: MaintenanceTaskResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getMaintenanceStats(user: User): Promise<any>;
    getUpcomingMaintenance(user: User): Promise<{
        upcoming: MaintenanceTaskResponseDto[];
    }>;
    getOverdueMaintenance(user: User): Promise<{
        overdue: MaintenanceTaskResponseDto[];
    }>;
    getMaintenanceById(user: User, maintenanceId: string): Promise<MaintenanceTaskResponseDto>;
    updateMaintenance(user: User, maintenanceId: string, dto: UpdateMaintenanceTaskDto): Promise<MaintenanceTaskResponseDto>;
    deleteMaintenance(user: User, maintenanceId: string): Promise<void>;
    completeMaintenance(user: User, maintenanceId: string, dto: {
        notes?: string;
        cost?: number;
        completedBy?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    scheduleMaintenance(user: User, maintenanceId: string, dto: {
        scheduledDate: Date;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getPropertyMaintenance(user: User, propertyId: string, query: MaintenanceTaskQueryDto): Promise<{
        maintenance: MaintenanceTaskResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    bulkScheduleMaintenance(user: User, dto: {
        propertyIds: string[];
        maintenanceType: string;
        frequency: 'monthly' | 'quarterly' | 'annually';
        startDate: Date;
    }): Promise<{
        scheduled: number;
        maintenanceRecords: MaintenanceTaskResponseDto[];
    }>;
}
//# sourceMappingURL=maintenance.controller.d.ts.map
