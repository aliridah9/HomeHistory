import { MaintenanceType, MaintenanceStatus } from './maintenance-task.dto';
export declare enum ReportType {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ANNUALLY = "annually",
    CUSTOM = "custom"
}
export declare enum ReportFormat {
    PDF = "pdf",
    EXCEL = "excel",
    CSV = "csv",
    JSON = "json"
}
export declare class CreateMaintenanceReportDto {
    name: string;
    description: string;
    type: ReportType;
    format?: ReportFormat;
    startDate: string;
    endDate: string;
    propertyIds?: string[];
    maintenanceType?: MaintenanceType;
    maintenanceStatus?: MaintenanceStatus;
    includeCostAnalysis?: boolean;
    includePerformanceMetrics?: boolean;
    includeContractorAnalysis?: boolean;
    filters?: Record<string, any>;
}
export declare class MaintenanceReportResponseDto {
    id: string;
    name: string;
    description: string;
    type: ReportType;
    format: ReportFormat;
    startDate: Date;
    endDate: Date;
    propertyIds?: string[];
    maintenanceType?: MaintenanceType;
    maintenanceStatus?: MaintenanceStatus;
    includeCostAnalysis: boolean;
    includePerformanceMetrics: boolean;
    includeContractorAnalysis: boolean;
    filters?: Record<string, any>;
    fileUrl?: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    progress?: number;
    errorMessage?: string;
    createdAt: Date;
    completedAt?: Date;
}
export declare class MaintenanceAnalyticsDto {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalEstimatedCost: number;
    totalActualCost: number;
    costVariance: number;
    averageCompletionTime: number;
    tasksByType: Record<MaintenanceType, number>;
    tasksByStatus: Record<MaintenanceStatus, number>;
    tasksByPriority: Record<string, number>;
    monthlyTrends: Array<{
        month: string;
        tasks: number;
        cost: number;
    }>;
    topContractors: Array<{
        contractorId: string;
        contractorName: string;
        taskCount: number;
        totalCost: number;
    }>;
    propertiesByMaintenanceNeeds: Array<{
        propertyId: string;
        propertyAddress: string;
        taskCount: number;
        totalCost: number;
    }>;
}
export declare class MaintenanceReportQueryDto {
    page?: number;
    limit?: number;
    type?: ReportType;
    format?: ReportFormat;
    status?: 'pending' | 'generating' | 'completed' | 'failed';
    startDate?: string;
    endDate?: string;
}
//# sourceMappingURL=maintenance-report.dto.d.ts.map
