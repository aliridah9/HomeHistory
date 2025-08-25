import { IsString, IsOptional, IsNumber, IsEnum, IsLatitude, IsLongitude, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '@homehistory/database';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @ApiProperty({ example: '123 Main Street', description: 'Property address' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'San Francisco', description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'CA', description: 'State code' })
  @IsString()
  state: string;

  @ApiProperty({ example: '94105', description: 'ZIP code' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 'US', description: 'Country code', required: false, default: 'US' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 37.7749, description: 'Latitude', required: false })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ example: -122.4194, description: 'Longitude', required: false })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ example: 1990, description: 'Year built', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear() + 5)
  @Type(() => Number)
  yearBuilt?: number;

  @ApiProperty({ example: 2500, description: 'Square feet', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  squareFeet?: number;

  @ApiProperty({ example: 0.25, description: 'Lot size in acres', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lotSize?: number;

  @ApiProperty({ example: 3, description: 'Number of bedrooms', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @ApiProperty({ example: 2.5, description: 'Number of bathrooms', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bathrooms?: number;

  @ApiProperty({ 
    example: 'SINGLE_FAMILY', 
    description: 'Property type',
    enum: PropertyType,
    required: false 
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;
}
