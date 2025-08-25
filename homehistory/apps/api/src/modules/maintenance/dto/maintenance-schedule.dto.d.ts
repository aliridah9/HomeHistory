import { MaintenanceType, MaintenancePriority } from './maintenance-task.dto';
export declare enum ScheduleFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    SEMI_ANNUALLY = "semi_annually",
    ANNUALLY = "annually",
    CUSTOM = "custom"
}
export declare enum ScheduleStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PAUSED = "paused"
}
export declare class CreateMaintenanceScheduleDto {
    propertyId: string;
    name: string;
    description: string;
    type: MaintenanceType;
    priority?: MaintenancePriority;
    frequency: ScheduleFrequency;
    customFrequencyDays?: number;
    startDate: string;
    endDate?: string;
    estimatedCost?: number;
    contractorId?: string;
    notes?: string;
    active?: boolean;
}
export declare class UpdateMaintenanceScheduleDto {
    name?: string;
    description?: string;
    type?: MaintenanceType;
    priority?: MaintenancePriority;
    frequency?: ScheduleFrequency;
    customFrequencyDays?: number;
    startDate?: string;
    endDate?: string;
    estimatedCost?: number;
    contractorId?: string;
    notes?: string;
    status?: ScheduleStatus;
}
export declare class MaintenanceScheduleResponseDto {
    id: string;
    propertyId: string;
    name: string;
    description: string;
    type: MaintenanceType;
    priority: MaintenancePriority;
    frequency: ScheduleFrequency;
    customFrequencyDays?: number;
    startDate: Date;
    endDate?: Date;
    estimatedCost?: number;
    contractorId?: string;
    notes?: string;
    status: ScheduleStatus;
    nextScheduledDate?: Date;
    lastExecutedDate?: Date;
    executionsCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MaintenanceScheduleQueryDto {
    page?: number;
    limit?: number;
    propertyId?: string;
    status?: ScheduleStatus;
    type?: MaintenanceType;
    frequency?: ScheduleFrequency;
    contractorId?: string;
}
//# sourceMappingURL=maintenance-schedule.dto.d.ts.map
