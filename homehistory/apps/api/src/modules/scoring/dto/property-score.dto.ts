import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsObject, IsDateString } from 'class-validator';

export enum ScoreType {
  OVERALL = 'overall',
  MARKET_VALUE = 'market_value',
  INVESTMENT_POTENTIAL = 'investment_potential',
  LOCATION_QUALITY = 'location_quality',
  PROPERTY_CONDITION = 'property_condition',
  RENTAL_POTENTIAL = 'rental_potential',
  TAX_EFFICIENCY = 'tax_efficiency',
  APPRECIATION_POTENTIAL = 'appreciation_potential',
}

export enum ScoreStatus {
  PENDING = 'pending',
  CALCULATING = 'calculating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  OUTDATED = 'outdated',
}

export class CreatePropertyScoreDto {
  @ApiProperty({ description: 'Property ID' })
  @IsUUID()
  propertyId: string;

  @ApiProperty({ description: 'Score type', enum: ScoreType })
  @IsEnum(ScoreType)
  type: ScoreType;

  @ApiProperty({ description: 'Score value (0-100)' })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Score breakdown by factors' })
  @IsObject()
  breakdown: Record<string, number>;

  @ApiProperty({ description: 'Confidence level (0-100)', required: false })
  @IsNumber()
  @IsOptional()
  confidence?: number;

  @ApiProperty({ description: 'Score calculation date', required: false })
  @IsDateString()
  @IsOptional()
  calculationDate?: string;

  @ApiProperty({ description: 'Data sources used for calculation', required: false })
  @IsObject()
  @IsOptional()
  dataSources?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdatePropertyScoreDto {
  @ApiProperty({ description: 'Score value (0-100)', required: false })
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiProperty({ description: 'Score breakdown by factors', required: false })
  @IsObject()
  @IsOptional()
  breakdown?: Record<string, number>;

  @ApiProperty({ description: 'Confidence level (0-100)', required: false })
  @IsNumber()
  @IsOptional()
  confidence?: number;

  @ApiProperty({ description: 'Score calculation date', required: false })
  @IsDateString()
  @IsOptional()
  calculationDate?: string;

  @ApiProperty({ description: 'Data sources used for calculation', required: false })
  @IsObject()
  @IsOptional()
  dataSources?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class PropertyScoreResponseDto {
  @ApiProperty({ description: 'Score ID' })
  id: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId: string;

  @ApiProperty({ description: 'Score type', enum: ScoreType })
  type: ScoreType;

  @ApiProperty({ description: 'Score value (0-100)' })
  score: number;

  @ApiProperty({ description: 'Score breakdown by factors' })
  breakdown: Record<string, number>;

  @ApiProperty({ description: 'Confidence level (0-100)' })
  confidence?: number;

  @ApiProperty({ description: 'Score calculation date' })
  calculationDate: Date;

  @ApiProperty({ description: 'Data sources used for calculation' })
  dataSources?: Record<string, any>;

  @ApiProperty({ description: 'Score status', enum: ScoreStatus })
  status: ScoreStatus;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PropertyScoreQueryDto {
  @ApiProperty({ description: 'Filter by property ID', required: false })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ description: 'Filter by score type', enum: ScoreType, required: false })
  @IsEnum(ScoreType)
  @IsOptional()
  type?: ScoreType;

  @ApiProperty({ description: 'Filter by score range - minimum', required: false })
  @IsNumber()
  @IsOptional()
  minScore?: number;

  @ApiProperty({ description: 'Filter by score range - maximum', required: false })
  @IsNumber()
  @IsOptional()
  maxScore?: number;

  @ApiProperty({ description: 'Filter by status', enum: ScoreStatus, required: false })
  @IsEnum(ScoreStatus)
  @IsOptional()
  status?: ScoreStatus;

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
