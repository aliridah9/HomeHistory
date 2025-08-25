import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsObject, IsDateString, IsBoolean } from 'class-validator';

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export class CreateReportScheduleDto {
  @ApiProperty({ description: 'Template ID to use for scheduled reports' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Property ID for property-specific reports', required: false })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ description: 'Schedule name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Schedule description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Schedule frequency', enum: ScheduleFrequency })
  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @ApiProperty({ description: 'Custom cron expression for custom frequency', required: false })
  @IsString()
  @IsOptional()
  cronExpression?: string;

  @ApiProperty({ description: 'Start date for the schedule' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for the schedule', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Report parameters for each generation' })
  @IsObject()
  parameters: Record<string, any>;

  @ApiProperty({ description: 'Output format preference', required: false })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiProperty({ description: 'Whether to send notifications when reports are generated', required: false })
  @IsBoolean()
  @IsOptional()
  sendNotifications?: boolean = true;

  @ApiProperty({ description: 'Additional options for scheduling', required: false })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}

export class UpdateReportScheduleDto {
  @ApiProperty({ description: 'Schedule name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Schedule description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Schedule frequency', enum: ScheduleFrequency, required: false })
  @IsEnum(ScheduleFrequency)
  @IsOptional()
  frequency?: ScheduleFrequency;

  @ApiProperty({ description: 'Custom cron expression for custom frequency', required: false })
  @IsString()
  @IsOptional()
  cronExpression?: string;

  @ApiProperty({ description: 'Start date for the schedule', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date for the schedule', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Report parameters for each generation', required: false })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiProperty({ description: 'Output format preference', required: false })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiProperty({ description: 'Whether to send notifications when reports are generated', required: false })
  @IsBoolean()
  @IsOptional()
  sendNotifications?: boolean;

  @ApiProperty({ description: 'Schedule status', enum: ScheduleStatus, required: false })
  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;

  @ApiProperty({ description: 'Additional options for scheduling', required: false })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}

export class ReportScheduleResponseDto {
  @ApiProperty({ description: 'Schedule ID' })
  id: string;

  @ApiProperty({ description: 'Template ID used' })
  templateId: string;

  @ApiProperty({ description: 'Property ID if applicable' })
  propertyId?: string;

  @ApiProperty({ description: 'Schedule name' })
  name: string;

  @ApiProperty({ description: 'Schedule description' })
  description?: string;

  @ApiProperty({ description: 'Schedule frequency', enum: ScheduleFrequency })
  frequency: ScheduleFrequency;

  @ApiProperty({ description: 'Custom cron expression for custom frequency' })
  cronExpression?: string;

  @ApiProperty({ description: 'Start date for the schedule' })
  startDate: Date;

  @ApiProperty({ description: 'End date for the schedule' })
  endDate?: Date;

  @ApiProperty({ description: 'Next scheduled run date' })
  nextRunDate: Date;

  @ApiProperty({ description: 'Last run date' })
  lastRunDate?: Date;

  @ApiProperty({ description: 'Report parameters for each generation' })
  parameters: Record<string, any>;

  @ApiProperty({ description: 'Output format preference' })
  format?: string;

  @ApiProperty({ description: 'Whether to send notifications when reports are generated' })
  sendNotifications: boolean;

  @ApiProperty({ description: 'Schedule status', enum: ScheduleStatus })
  status: ScheduleStatus;

  @ApiProperty({ description: 'Additional options for scheduling' })
  options?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class ReportScheduleQueryDto {
  @ApiProperty({ description: 'Filter by status', enum: ScheduleStatus, required: false })
  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;

  @ApiProperty({ description: 'Filter by template ID', required: false })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ description: 'Filter by property ID', required: false })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ description: 'Filter by frequency', enum: ScheduleFrequency, required: false })
  @IsEnum(ScheduleFrequency)
  @IsOptional()
  frequency?: ScheduleFrequency;

  @ApiProperty({ description: 'Filter by active status (active/paused)', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;
}
