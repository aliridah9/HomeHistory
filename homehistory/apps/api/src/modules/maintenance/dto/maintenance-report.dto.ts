import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { MaintenanceType, MaintenanceStatus } from './maintenance-task.dto';

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export class CreateMaintenanceReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Report description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Report format', enum: ReportFormat, default: ReportFormat.PDF })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat = ReportFormat.PDF;

  @ApiProperty({ description: 'Start date for report period' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for report period' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Property IDs to include in report', type: [String], required: false })
  @IsOptional()
  propertyIds?: string[];

  @ApiProperty({ description: 'Filter by maintenance type', enum: MaintenanceType, required: false })
  @IsEnum(MaintenanceType)
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @ApiProperty({ description: 'Filter by maintenance status', enum: MaintenanceStatus, required: false })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  maintenanceStatus?: MaintenanceStatus;

  @ApiProperty({ description: 'Include cost analysis', default: true })
  @IsBoolean()
  @IsOptional()
  includeCostAnalysis?: boolean = true;

  @ApiProperty({ description: 'Include performance metrics', default: true })
  @IsBoolean()
  @IsOptional()
  includePerformanceMetrics?: boolean = true;

  @ApiProperty({ description: 'Include contractor analysis', default: false })
  @IsBoolean()
  @IsOptional()
  includeContractorAnalysis?: boolean = false;

  @ApiProperty({ description: 'Additional filters', required: false })
  @IsOptional()
  filters?: Record<string, any>;
}

export class MaintenanceReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Report name' })
  name: string;

  @ApiProperty({ description: 'Report description' })
  description: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  type: ReportType;

  @ApiProperty({ description: 'Report format', enum: ReportFormat })
  format: ReportFormat;

  @ApiProperty({ description: 'Start date for report period' })
  startDate: Date;

  @ApiProperty({ description: 'End date for report period' })
  endDate: Date;

  @ApiProperty({ description: 'Property IDs included in report' })
  propertyIds?: string[];

  @ApiProperty({ description: 'Maintenance type filter' })
  maintenanceType?: MaintenanceType;

  @ApiProperty({ description: 'Maintenance status filter' })
  maintenanceStatus?: MaintenanceStatus;

  @ApiProperty({ description: 'Whether cost analysis is included' })
  includeCostAnalysis: boolean;

  @ApiProperty({ description: 'Whether performance metrics are included' })
  includePerformanceMetrics: boolean;

  @ApiProperty({ description: 'Whether contractor analysis is included' })
  includeContractorAnalysis: boolean;

  @ApiProperty({ description: 'Additional filters applied' })
  filters?: Record<string, any>;

  @ApiProperty({ description: 'Report file URL', required: false })
  fileUrl?: string;

  @ApiProperty({ description: 'Report generation status' })
  status: 'pending' | 'generating' | 'completed' | 'failed';

  @ApiProperty({ description: 'Report generation progress (0-100)', required: false })
  progress?: number;

  @ApiProperty({ description: 'Error message if generation failed', required: false })
  errorMessage?: string;

  @ApiProperty({ description: 'Report creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Report completion date', required: false })
  completedAt?: Date;
}

export class MaintenanceAnalyticsDto {
  @ApiProperty({ description: 'Total maintenance tasks' })
  totalTasks: number;

  @ApiProperty({ description: 'Completed tasks' })
  completedTasks: number;

  @ApiProperty({ description: 'Pending tasks' })
  pendingTasks: number;

  @ApiProperty({ description: 'In progress tasks' })
  inProgressTasks: number;

  @ApiProperty({ description: 'Overdue tasks' })
  overdueTasks: number;

  @ApiProperty({ description: 'Total estimated cost' })
  totalEstimatedCost: number;

  @ApiProperty({ description: 'Total actual cost' })
  totalActualCost: number;

  @ApiProperty({ description: 'Cost variance' })
  costVariance: number;

  @ApiProperty({ description: 'Average completion time in days' })
  averageCompletionTime: number;

  @ApiProperty({ description: 'Tasks by type' })
  tasksByType: Record<MaintenanceType, number>;

  @ApiProperty({ description: 'Tasks by status' })
  tasksByStatus: Record<MaintenanceStatus, number>;

  @ApiProperty({ description: 'Tasks by priority' })
  tasksByPriority: Record<string, number>;

  @ApiProperty({ description: 'Monthly trends' })
  monthlyTrends: Array<{
    month: string;
    tasks: number;
    cost: number;
  }>;

  @ApiProperty({ description: 'Top contractors by task count' })
  topContractors: Array<{
    contractorId: string;
    contractorName: string;
    taskCount: number;
    totalCost: number;
  }>;

  @ApiProperty({ description: 'Properties with most maintenance needs' })
  propertiesByMaintenanceNeeds: Array<{
    propertyId: string;
    propertyAddress: string;
    taskCount: number;
    totalCost: number;
  }>;
}

export class MaintenanceReportQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ description: 'Filter by report type', enum: ReportType, required: false })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @ApiProperty({ description: 'Filter by report format', enum: ReportFormat, required: false })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @ApiProperty({ description: 'Filter by status', required: false })
  @IsOptional()
  status?: 'pending' | 'generating' | 'completed' | 'failed';

  @ApiProperty({ description: 'Filter by start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'Filter by end date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
