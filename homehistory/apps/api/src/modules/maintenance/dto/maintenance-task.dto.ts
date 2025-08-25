import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsBoolean } from 'class-validator';

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum MaintenanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  EMERGENCY = 'emergency',
  INSPECTION = 'inspection',
}

export class CreateMaintenanceTaskDto {
  @ApiProperty({ description: 'Property ID' })
  @IsUUID()
  propertyId: string;

  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Task description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Maintenance type', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ description: 'Priority level', enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority = MaintenancePriority.MEDIUM;

  @ApiProperty({ description: 'Estimated cost', required: false })
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiProperty({ description: 'Scheduled date', required: false })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiProperty({ description: 'Due date', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ description: 'Assigned contractor ID', required: false })
  @IsUUID()
  @IsOptional()
  contractorId?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Attachments', type: [String], required: false })
  @IsOptional()
  attachments?: string[];
}

export class UpdateMaintenanceTaskDto {
  @ApiProperty({ description: 'Task title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Task description', required: false })
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

  @ApiProperty({ description: 'Task status', enum: MaintenanceStatus, required: false })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiProperty({ description: 'Estimated cost', required: false })
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiProperty({ description: 'Actual cost', required: false })
  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @ApiProperty({ description: 'Scheduled date', required: false })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiProperty({ description: 'Due date', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ description: 'Start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'Completion date', required: false })
  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @ApiProperty({ description: 'Assigned contractor ID', required: false })
  @IsUUID()
  @IsOptional()
  contractorId?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Attachments', type: [String], required: false })
  @IsOptional()
  attachments?: string[];

  @ApiProperty({ description: 'Whether task is completed', required: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class MaintenanceTaskResponseDto {
  @ApiProperty({ description: 'Task ID' })
  id: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId: string;

  @ApiProperty({ description: 'Task title' })
  title: string;

  @ApiProperty({ description: 'Task description' })
  description: string;

  @ApiProperty({ description: 'Maintenance type', enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ description: 'Priority level', enum: MaintenancePriority })
  priority: MaintenancePriority;

  @ApiProperty({ description: 'Task status', enum: MaintenanceStatus })
  status: MaintenanceStatus;

  @ApiProperty({ description: 'Estimated cost' })
  estimatedCost?: number;

  @ApiProperty({ description: 'Actual cost' })
  actualCost?: number;

  @ApiProperty({ description: 'Scheduled date' })
  scheduledDate?: Date;

  @ApiProperty({ description: 'Due date' })
  dueDate?: Date;

  @ApiProperty({ description: 'Start date' })
  startDate?: Date;

  @ApiProperty({ description: 'Completion date' })
  completionDate?: Date;

  @ApiProperty({ description: 'Assigned contractor ID' })
  contractorId?: string;

  @ApiProperty({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'Attachments' })
  attachments?: string[];

  @ApiProperty({ description: 'Whether task is completed' })
  completed: boolean;

  @ApiProperty({ description: 'Task creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Task last update date' })
  updatedAt: Date;
}

export class MaintenanceTaskQueryDto {
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

  @ApiProperty({ description: 'Filter by status', enum: MaintenanceStatus, required: false })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiProperty({ description: 'Filter by type', enum: MaintenanceType, required: false })
  @IsEnum(MaintenanceType)
  @IsOptional()
  type?: MaintenanceType;

  @ApiProperty({ description: 'Filter by priority', enum: MaintenancePriority, required: false })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiProperty({ description: 'Filter by contractor ID', required: false })
  @IsUUID()
  @IsOptional()
  contractorId?: string;

  @ApiProperty({ description: 'Filter by completion status', required: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
