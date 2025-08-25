import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsObject, IsBoolean, IsArray } from 'class-validator';

export enum CriteriaType {
  NUMERIC = 'numeric',
  BOOLEAN = 'boolean',
  CATEGORICAL = 'categorical',
  TEXT = 'text',
  DATE = 'date',
}

export enum CriteriaCategory {
  LOCATION = 'location',
  PROPERTY_FEATURES = 'property_features',
  MARKET_CONDITIONS = 'market_conditions',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  ENVIRONMENTAL = 'environmental',
  INFRASTRUCTURE = 'infrastructure',
  DEMOGRAPHICS = 'demographics',
}

export class CreateScoringCriteriaDto {
  @ApiProperty({ description: 'Criteria name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Criteria description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Criteria category', enum: CriteriaCategory })
  @IsEnum(CriteriaCategory)
  category: CriteriaCategory;

  @ApiProperty({ description: 'Criteria type', enum: CriteriaType })
  @IsEnum(CriteriaType)
  type: CriteriaType;

  @ApiProperty({ description: 'Weight in scoring algorithm (0-100)' })
  @IsNumber()
  weight: number;

  @ApiProperty({ description: 'Minimum acceptable value', required: false })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiProperty({ description: 'Maximum acceptable value', required: false })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiProperty({ description: 'Target value for optimal score', required: false })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiProperty({ description: 'Acceptable values for categorical criteria', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptableValues?: string[];

  @ApiProperty({ description: 'Scoring formula or logic', required: false })
  @IsString()
  @IsOptional()
  formula?: string;

  @ApiProperty({ description: 'Whether criteria is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ description: 'Additional configuration', required: false })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class UpdateScoringCriteriaDto {
  @ApiProperty({ description: 'Criteria name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Criteria description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Criteria category', enum: CriteriaCategory, required: false })
  @IsEnum(CriteriaCategory)
  @IsOptional()
  category?: CriteriaCategory;

  @ApiProperty({ description: 'Criteria type', enum: CriteriaType, required: false })
  @IsEnum(CriteriaType)
  @IsOptional()
  type?: CriteriaType;

  @ApiProperty({ description: 'Weight in scoring algorithm (0-100)', required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ description: 'Minimum acceptable value', required: false })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiProperty({ description: 'Maximum acceptable value', required: false })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiProperty({ description: 'Target value for optimal score', required: false })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiProperty({ description: 'Acceptable values for categorical criteria', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptableValues?: string[];

  @ApiProperty({ description: 'Scoring formula or logic', required: false })
  @IsString()
  @IsOptional()
  formula?: string;

  @ApiProperty({ description: 'Whether criteria is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Additional configuration', required: false })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class ScoringCriteriaResponseDto {
  @ApiProperty({ description: 'Criteria ID' })
  id: string;

  @ApiProperty({ description: 'Criteria name' })
  name: string;

  @ApiProperty({ description: 'Criteria description' })
  description: string;

  @ApiProperty({ description: 'Criteria category', enum: CriteriaCategory })
  category: CriteriaCategory;

  @ApiProperty({ description: 'Criteria type', enum: CriteriaType })
  type: CriteriaType;

  @ApiProperty({ description: 'Weight in scoring algorithm (0-100)' })
  weight: number;

  @ApiProperty({ description: 'Minimum acceptable value' })
  minValue?: number;

  @ApiProperty({ description: 'Maximum acceptable value' })
  maxValue?: number;

  @ApiProperty({ description: 'Target value for optimal score' })
  targetValue?: number;

  @ApiProperty({ description: 'Acceptable values for categorical criteria' })
  acceptableValues?: string[];

  @ApiProperty({ description: 'Scoring formula or logic' })
  formula?: string;

  @ApiProperty({ description: 'Whether criteria is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Additional configuration' })
  config?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class ScoringCriteriaQueryDto {
  @ApiProperty({ description: 'Filter by name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Filter by category', enum: CriteriaCategory, required: false })
  @IsEnum(CriteriaCategory)
  @IsOptional()
  category?: CriteriaCategory;

  @ApiProperty({ description: 'Filter by type', enum: CriteriaType, required: false })
  @IsEnum(CriteriaType)
  @IsOptional()
  type?: CriteriaType;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Filter by minimum weight', required: false })
  @IsNumber()
  @IsOptional()
  minWeight?: number;

  @ApiProperty({ description: 'Filter by maximum weight', required: false })
  @IsNumber()
  @IsOptional()
  maxWeight?: number;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;
}
