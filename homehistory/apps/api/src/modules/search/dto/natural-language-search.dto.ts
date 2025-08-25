import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NaturalSearchDto {
  @ApiProperty({
    description: 'Natural language search query',
    example: 'Find 3 bedroom houses under $500k in downtown area'
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 20,
    default: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Include AI-powered insights in results',
    example: true,
    default: true
  })
  @IsOptional()
  includeInsights?: boolean = true;
}

export class FilterSearchDto {
  @ApiPropertyOptional({
    description: 'Property type filter',
    example: 'SINGLE_FAMILY'
  })
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 200000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 500000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum number of bedrooms',
    example: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of bedrooms',
    example: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBedrooms?: number;

  @ApiPropertyOptional({
    description: 'City filter',
    example: 'Austin'
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State filter',
    example: 'TX'
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Zip code filter',
    example: '78701'
  })
  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class SearchResultDto {
  @ApiProperty({
    description: 'Property ID',
    example: 'prop_123'
  })
  id: string;

  @ApiProperty({
    description: 'Property address',
    example: '123 Main St'
  })
  address: string;

  @ApiProperty({
    description: 'Property city',
    example: 'Austin'
  })
  city: string;

  @ApiProperty({
    description: 'Property state',
    example: 'TX'
  })
  state: string;

  @ApiProperty({
    description: 'Property zip code',
    example: '78701'
  })
  zipCode: string;

  @ApiPropertyOptional({
    description: 'Property price',
    example: 450000
  })
  price?: number;

  @ApiPropertyOptional({
    description: 'Number of bedrooms',
    example: 3
  })
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Number of bathrooms',
    example: 2.5
  })
  bathrooms?: number;

  @ApiPropertyOptional({
    description: 'Property type',
    example: 'SINGLE_FAMILY'
  })
  propertyType?: string;

  @ApiPropertyOptional({
    description: 'Search relevance score',
    example: 0.95
  })
  relevanceScore?: number;

  @ApiPropertyOptional({
    description: 'AI-generated insights',
    example: ['Great location near downtown', 'Recently renovated kitchen']
  })
  insights?: string[];
}
