import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsObject, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

class LocationFilterDto {
  @ApiProperty({ description: 'City name', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'State code', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'ZIP code', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ description: 'Search radius in miles', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radius?: number;
}

class SearchFiltersDto {
  @ApiProperty({ description: 'Property types to include', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyType?: string[];

  @ApiProperty({ description: 'Price range [min, max]', required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  priceRange?: [number, number];

  @ApiProperty({ description: 'Location filters', required: false, type: LocationFilterDto })
  @IsOptional()
  @Type(() => LocationFilterDto)
  location?: LocationFilterDto;

  @ApiProperty({ description: 'Date range [start, end]', required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  dateRange?: [Date, Date];
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query text', minLength: 1 })
  @IsString()
  @MinLength(1)
  query: string;

  @ApiProperty({ description: 'Search filters', required: false, type: SearchFiltersDto })
  @IsOptional()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @ApiProperty({ description: 'Maximum number of results', required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Similarity threshold', required: false, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;
}
