import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsObject, IsArray, IsDateString } from 'class-validator';

export enum CalculationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CalculationType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  TRIGGERED = 'triggered',
  BATCH = 'batch',
}

export class CreateScoreCalculationDto {
  @ApiProperty({ description: 'Property ID' })
  @IsUUID()
  propertyId: string;

  @ApiProperty({ description: 'Calculation type', enum: CalculationType })
  @IsEnum(CalculationType)
  type: CalculationType;

  @ApiProperty({ description: 'Scoring criteria IDs to use', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  criteriaIds: string[];

  @ApiProperty({ description: 'Calculation parameters', required: false })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiProperty({ description: 'Priority level (1-10)', required: false })
  @IsNumber()
  @IsOptional()
  priority?: number = 5;

  @ApiProperty({ description: 'Scheduled execution time', required: false })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({ description: 'Additional options', required: false })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}

export class UpdateScoreCalculationDto {
  @ApiProperty({ description: 'Calculation status', enum: CalculationStatus, required: false })
  @IsEnum(CalculationStatus)
  @IsOptional()
  status?: CalculationStatus;

  @ApiProperty({ description: 'Calculation progress (0-100)', required: false })
  @IsNumber()
  @IsOptional()
  progress?: number;

  @ApiProperty({ description: 'Calculation result', required: false })
  @IsObject()
  @IsOptional()
  result?: Record<string, any>;

  @ApiProperty({ description: 'Error message if failed', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ description: 'Start time', required: false })
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @ApiProperty({ description: 'Completion time', required: false })
  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ScoreCalculationResponseDto {
  @ApiProperty({ description: 'Calculation ID' })
  id: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId: string;

  @ApiProperty({ description: 'Calculation type', enum: CalculationType })
  type: CalculationType;

  @ApiProperty({ description: 'Scoring criteria IDs used' })
  criteriaIds: string[];

  @ApiProperty({ description: 'Calculation status', enum: CalculationStatus })
  status: CalculationStatus;

  @ApiProperty({ description: 'Calculation progress (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Calculation parameters' })
  parameters?: Record<string, any>;

  @ApiProperty({ description: 'Calculation result' })
  result?: Record<string, any>;

  @ApiProperty({ description: 'Error message if failed' })
  errorMessage?: string;

  @ApiProperty({ description: 'Priority level' })
  priority: number;

  @ApiProperty({ description: 'Scheduled execution time' })
  scheduledAt?: Date;

  @ApiProperty({ description: 'Start time' })
  startedAt?: Date;

  @ApiProperty({ description: 'Completion time' })
  completedAt?: Date;

  @ApiProperty({ description: 'Additional options' })
  options?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class ScoreCalculationQueryDto {
  @ApiProperty({ description: 'Filter by property ID', required: false })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ description: 'Filter by calculation type', enum: CalculationType, required: false })
  @IsEnum(CalculationType)
  @IsOptional()
  type?: CalculationType;

  @ApiProperty({ description: 'Filter by status', enum: CalculationStatus, required: false })
  @IsEnum(CalculationStatus)
  @IsOptional()
  status?: CalculationStatus;

  @ApiProperty({ description: 'Filter by priority range - minimum', required: false })
  @IsNumber()
  @IsOptional()
  minPriority?: number;

  @ApiProperty({ description: 'Filter by priority range - maximum', required: false })
  @IsNumber()
  @IsOptional()
  maxPriority?: number;

  @ApiProperty({ description: 'Filter by date range - start', required: false })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ description: 'Filter by date range - end', required: false })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;
}

export class ScoreBreakdownDto {
  @ApiProperty({ description: 'Criteria ID' })
  criteriaId: string;

  @ApiProperty({ description: 'Criteria name' })
  criteriaName: string;

  @ApiProperty({ description: 'Raw value' })
  rawValue: any;

  @ApiProperty({ description: 'Normalized value (0-100)' })
  normalizedValue: number;

  @ApiProperty({ description: 'Weight applied' })
  weight: number;

  @ApiProperty({ description: 'Weighted score' })
  weightedScore: number;

  @ApiProperty({ description: 'Additional details' })
  details?: Record<string, any>;
}
