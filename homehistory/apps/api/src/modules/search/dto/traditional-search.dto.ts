import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class TraditionalSearchDto {
  @ApiProperty({ description: 'General search query', required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ description: 'City filter', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'State filter', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'ZIP code filter', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ 
    description: 'Property type filter',
    enum: ['SINGLE_FAMILY', 'MULTI_FAMILY', 'CONDO', 'TOWNHOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER'],
    required: false
  })
  @IsOptional()
  @IsEnum(['SINGLE_FAMILY', 'MULTI_FAMILY', 'CONDO', 'TOWNHOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER'])
  propertyType?: string;

  @ApiProperty({ description: 'Minimum price', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ description: 'Maximum price', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ description: 'Number of bedrooms', minimum: 0, maximum: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  bedrooms?: number;

  @ApiProperty({ description: 'Number of bathrooms', minimum: 0, maximum: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  bathrooms?: number;

  @ApiProperty({ description: 'Minimum square footage', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSquareFeet?: number;

  @ApiProperty({ description: 'Maximum square footage', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSquareFeet?: number;

  @ApiProperty({ description: 'Minimum year built', minimum: 1800, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  minYearBuilt?: number;

  @ApiProperty({ description: 'Maximum year built', required: false })
  @IsOptional()
  @IsNumber()
  maxYearBuilt?: number;

  @ApiProperty({ 
    description: 'Sort field',
    enum: ['price', 'createdAt', 'updatedAt', 'squareFeet', 'yearBuilt', 'relevance'],
    default: 'createdAt',
    required: false
  })
  @IsOptional()
  @IsEnum(['price', 'createdAt', 'updatedAt', 'squareFeet', 'yearBuilt', 'relevance'])
  sortBy?: string;

  @ApiProperty({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ 
    description: 'Maximum number of results',
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ 
    description: 'Results offset for pagination',
    minimum: 0,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
