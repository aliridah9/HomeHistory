import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsObject, IsArray, IsDateString } from 'class-validator';

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Template ID to use for generation' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Property ID for property-specific reports' })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ description: 'Report parameters/data' })
  @IsObject()
  parameters: Record<string, any>;

  @ApiProperty({ description: 'Output format preference', required: false })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiProperty({ description: 'Additional options for generation', required: false })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}

export class UpdateReportDto {
  @ApiProperty({ description: 'Report status', enum: ReportStatus, required: false })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiProperty({ description: 'Generated report content', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Report file URL', required: false })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({ description: 'Generation progress (0-100)', required: false })
  @IsOptional()
  progress?: number;

  @ApiProperty({ description: 'Error message if generation failed', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReportGenerationResponseDto {
  @ApiProperty({ description: 'Report generation ID' })
  id: string;

  @ApiProperty({ description: 'Template ID used' })
  templateId: string;

  @ApiProperty({ description: 'Property ID if applicable' })
  propertyId?: string;

  @ApiProperty({ description: 'Report status', enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty({ description: 'Generation progress (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Generated report content' })
  content?: string;

  @ApiProperty({ description: 'Report file URL' })
  fileUrl?: string;

  @ApiProperty({ description: 'Error message if failed' })
  errorMessage?: string;

  @ApiProperty({ description: 'Generation parameters' })
  parameters: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Completion date' })
  completedAt?: Date;
}

export class ReportGenerationQueryDto {
  @ApiProperty({ description: 'Filter by status', enum: ReportStatus, required: false })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiProperty({ description: 'Filter by template ID', required: false })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ description: 'Filter by property ID', required: false })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

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
