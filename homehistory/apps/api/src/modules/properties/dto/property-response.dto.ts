import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '@homehistory/database';

export class PropertyResponseDto {
  @ApiProperty({ description: 'Property ID' })
  id: string;

  @ApiProperty({ description: 'Property address' })
  address: string;

  @ApiProperty({ description: 'City' })
  city: string;

  @ApiProperty({ description: 'State' })
  state: string;

  @ApiProperty({ description: 'ZIP code' })
  zipCode: string;

  @ApiProperty({ description: 'Country' })
  country: string;

  @ApiProperty({ description: 'Latitude', nullable: true })
  latitude: number | null;

  @ApiProperty({ description: 'Longitude', nullable: true })
  longitude: number | null;

  @ApiProperty({ description: 'Year built', nullable: true })
  yearBuilt: number | null;

  @ApiProperty({ description: 'Square feet', nullable: true })
  squareFeet: number | null;

  @ApiProperty({ description: 'Lot size in acres', nullable: true })
  lotSize: number | null;

  @ApiProperty({ description: 'Number of bedrooms', nullable: true })
  bedrooms: number | null;

  @ApiProperty({ description: 'Number of bathrooms', nullable: true })
  bathrooms: number | null;

  @ApiProperty({ description: 'Property type', enum: PropertyType, nullable: true })
  propertyType: PropertyType | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Latest published report', nullable: true })
  latestReport: any;

  @ApiProperty({ description: 'Number of documents' })
  documentCount: number;

  @ApiProperty({ description: 'Number of reports' })
  reportCount: number;
}
