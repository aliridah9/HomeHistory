import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsArray, IsObject, IsBoolean } from 'class-validator';

export enum ReportType {
  PROPERTY_ANALYSIS = 'property_analysis',
  MARKET_REPORT = 'market_report',
  INVESTMENT_ANALYSIS = 'investment_analysis',
  COMPARATIVE_ANALYSIS = 'comparative_analysis',
  CUSTOM_REPORT = 'custom_report',
}

export enum ReportFormat {
  PDF = 'pdf',
  HTML = 'html',
  DOCX = 'docx',
  JSON = 'json',
}

export class CreateReportTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Output format', enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiProperty({ description: 'Template content (HTML/JSON)' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Template variables/schema', required: false })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>;

  @ApiProperty({ description: 'Whether template is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ description: 'Tags for categorization', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateReportTemplateDto {
  @ApiProperty({ description: 'Template name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Template description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Report type', enum: ReportType, required: false })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @ApiProperty({ description: 'Output format', enum: ReportFormat, required: false })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @ApiProperty({ description: 'Template content (HTML/JSON)', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Template variables/schema', required: false })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>;

  @ApiProperty({ description: 'Whether template is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Tags for categorization', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class ReportTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Template description' })
  description: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  type: ReportType;

  @ApiProperty({ description: 'Output format', enum: ReportFormat })
  format: ReportFormat;

  @ApiProperty({ description: 'Template content' })
  content: string;

  @ApiProperty({ description: 'Template variables/schema' })
  schema?: Record<string, any>;

  @ApiProperty({ description: 'Whether template is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Tags for categorization' })
  tags: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class ReportTemplateQueryDto {
  @ApiProperty({ description: 'Filter by name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Filter by type', enum: ReportType, required: false })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @ApiProperty({ description: 'Filter by format', enum: ReportFormat, required: false })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Filter by tags', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
