import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { MaintenanceType, MaintenancePriority } from './maintenance-task.dto';

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
  CUSTOM = 'custom',
}

export enum ScheduleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
}

export class CreateMaintenanceScheduleDto {
  @ApiProperty({ description: 'Property ID' })
  @IsUUID()
  propertyId: string;

  @ApiProperty({ description: 'Schedule name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Schedule description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Maintenance type', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ description: 'Priority level', enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority = MaintenancePriority.MEDIUM;

  @ApiProperty({ description: 'Schedule frequency', enum: ScheduleFrequency })
  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @ApiProperty({ description: 'Custom frequency in days (for custom frequency)', required: false })
  @IsNumber()
  @IsOptional()
  customFrequencyDays?: number;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Estimated cost per occurrence', required: false })
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiProperty({ description: 'Assigned contractor ID', required: false })
  @IsUUID()
  @IsOptional()
  contractorId?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Whether schedule is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}

export class UpdateMaintenanceScheduleDto {
  @ApiProperty({ description: 'Schedule name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Schedule description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Maintenance type', enum: MaintenanceType, required: false })
  @IsEnum(MaintenanceType)
  @IsOptional()
  type?: MaintenanceType;

  @ApiProperty({ description: 'Priority level', enum: MaintenancePriority, required: false })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiProperty({ description: 'Schedule frequency', enum: ScheduleFrequency, required: false })
  @IsEnum(ScheduleFrequency)
  @IsOptional()
  frequency?: ScheduleFrequency;

  @ApiProperty({ description: 'Custom frequency in days (for custom frequency)', required: false })
  @IsNumber()
  @IsOptional()
  customFrequencyDays?: number;

  @ApiProperty({ description: 'Start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Estimated cost per occurrence', required: false })
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiProperty({ description: 'Assigned contractor ID', required: false })
  @IsUUID()
  @IsOptional()
  contractorId?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Schedule status', enum: ScheduleStatus, required: false })
  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;
}

export class MaintenanceScheduleResponseDto {
  @ApiProperty({ description: 'Schedule ID' })
  id: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId: string;

  @ApiProperty({ description: 'Schedule name' })
  name: string;

  @ApiProperty({ description: 'Schedule description' })
  description: string;

  @ApiProperty({ description: 'Maintenance type', enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ description: 'Priority level', enum: MaintenancePriority })
  priority: MaintenancePriority;

  @ApiProperty({ description: 'Schedule frequency', enum: ScheduleFrequency })
  frequency: ScheduleFrequency;

  @ApiProperty({ description: 'Custom frequency in days' })
  customFrequencyDays?: number;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  endDate?: Date;

  @ApiProperty({ description: 'Estimated cost per occurrence' })
  estimatedCost?: number;

  @ApiProperty({ description: 'Assigned contractor ID' })
  contractorId?: string;

  @ApiProperty({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'Schedule status', enum: ScheduleStatus })
  status: ScheduleStatus;

  @ApiProperty({ description: 'Next scheduled date' })
  nextScheduledDate?: Date;

  @ApiProperty({ description: 'Last executed date' })
  lastExecutedDate?: Date;

  @ApiProperty({ description: 'Total executions count' })
  executionsCount: number;

  @ApiProperty({ description: 'Schedule creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Schedule last update date' })
  updatedAt: Date;
}

export class MaintenanceScheduleQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ description: 'Filter by property ID', required: false })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ description: 'Filter by status', enum: ScheduleStatus, required: false })
  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;

  @ApiProperty({ description: 'Filter by type', enum: MaintenanceType, required: false })
  @IsEnum(MaintenanceType)
  @IsOptional()
  type?: MaintenanceType;

  @ApiProperty({ description: 'Filter by frequency', enum: ScheduleFrequency, required: false })
  @IsEnum(ScheduleFrequency)
  @IsOptional()
  frequency?: ScheduleFrequency;

  @ApiProperty({ description: 'Filter by contractor ID', required: false })
  @IsUUID()
  @IsOptional()
  contractorId?: string;
}
