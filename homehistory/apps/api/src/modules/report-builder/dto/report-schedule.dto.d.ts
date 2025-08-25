export declare enum ScheduleFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
    CUSTOM = "custom"
}
export declare enum ScheduleStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export declare class CreateReportScheduleDto {
    templateId: string;
    propertyId?: string;
    name: string;
    description?: string;
    frequency: ScheduleFrequency;
    cronExpression?: string;
    startDate: string;
    endDate?: string;
    parameters: Record<string, any>;
    format?: string;
    sendNotifications?: boolean;
    options?: Record<string, any>;
}
export declare class UpdateReportScheduleDto {
    name?: string;
    description?: string;
    frequency?: ScheduleFrequency;
    cronExpression?: string;
    startDate?: string;
    endDate?: string;
    parameters?: Record<string, any>;
    format?: string;
    sendNotifications?: boolean;
    status?: ScheduleStatus;
    options?: Record<string, any>;
}
export declare class ReportScheduleResponseDto {
    id: string;
    templateId: string;
    propertyId?: string;
    name: string;
    description?: string;
    frequency: ScheduleFrequency;
    cronExpression?: string;
    startDate: Date;
    endDate?: Date;
    nextRunDate: Date;
    lastRunDate?: Date;
    parameters: Record<string, any>;
    format?: string;
    sendNotifications: boolean;
    status: ScheduleStatus;
    options?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ReportScheduleQueryDto {
    status?: ScheduleStatus;
    templateId?: string;
    propertyId?: string;
    frequency?: ScheduleFrequency;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=report-schedule.dto.d.ts.map
