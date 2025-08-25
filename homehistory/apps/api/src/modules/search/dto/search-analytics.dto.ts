import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class SearchAnalyticsDto {
  @ApiProperty({ 
    description: 'Analytics timeframe',
    enum: ['day', 'week', 'month', 'year'],
    default: 'week',
    required: false
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  timeframe?: 'day' | 'week' | 'month' | 'year';
}
