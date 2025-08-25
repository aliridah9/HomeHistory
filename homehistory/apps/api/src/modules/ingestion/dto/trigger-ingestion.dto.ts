import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TriggerIngestionDto {
  @ApiProperty({ description: 'Property ID to ingest data for' })
  @IsString()
  propertyId: string;

  @ApiProperty({ 
    description: 'Data source name',
    enum: ['zillow', 'county_records', 'tax_assessor', 'permit_data', 'google_maps']
  })
  @IsString()
  dataSourceName: string;

  @ApiProperty({ description: 'Force refresh even if recently synced', required: false })
  @IsOptional()
  forceRefresh?: boolean;
}
