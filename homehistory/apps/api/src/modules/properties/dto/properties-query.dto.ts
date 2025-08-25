import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PropertyType } from '@homehistory/database';

export class PropertiesQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ description: 'Search term for address or city', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by city', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Filter by state', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Filter by property type', enum: PropertyType, required: false })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiProperty({ description: 'Minimum year built', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minYear?: number;

  @ApiProperty({ description: 'Maximum year built', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxYear?: number;

  @ApiProperty({ description: 'Minimum square feet', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSquareFeet?: number;

  @ApiProperty({ description: 'Maximum square feet', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSquareFeet?: number;

  @ApiProperty({ 
    description: 'Sort by field', 
    enum: ['createdAt', 'updatedAt', 'address', 'city', 'yearBuilt', 'squareFeet'],
    required: false,
    default: 'createdAt'
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'address', 'city', 'yearBuilt', 'squareFeet'])
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], required: false, default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({ description: 'Include archived properties', required: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean = false;
}
