import { ApiProperty } from '@nestjs/swagger';

export class PropertyStatsDto {
  @ApiProperty({ description: 'Total number of properties' })
  totalProperties: number;

  @ApiProperty({ 
    description: 'Properties breakdown by type',
    type: [Object],
    example: [{ type: 'SINGLE_FAMILY', count: 5 }, { type: 'CONDO', count: 2 }]
  })
  propertiesByType: Array<{ type: string; count: number }>;

  @ApiProperty({ 
    description: 'Properties breakdown by state',
    type: [Object],
    example: [{ state: 'CA', count: 4 }, { state: 'NY', count: 3 }]
  })
  propertiesByState: Array<{ state: string; count: number }>;

  @ApiProperty({ description: 'Average square feet across all properties' })
  averageSquareFeet: number;

  @ApiProperty({ description: 'Estimated total portfolio value' })
  estimatedTotalValue: number;

  @ApiProperty({ description: 'Recent activity count (last 30 days)' })
  recentActivityCount: number;
}
