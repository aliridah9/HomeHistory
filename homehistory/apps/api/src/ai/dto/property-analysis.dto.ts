import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class PropertyAnalysisDto {
  @ApiProperty({ description: 'Property ID to analyze' })
  @IsString()
  propertyId: string;

  @ApiProperty({ 
    description: 'Type of analysis to perform',
    enum: ['summary', 'valuation', 'risk', 'investment', 'market']
  })
  @IsEnum(['summary', 'valuation', 'risk', 'investment', 'market'])
  analysisType: 'summary' | 'valuation' | 'risk' | 'investment' | 'market';

  @ApiProperty({ description: 'Include market comparables', required: false })
  @IsOptional()
  @IsBoolean()
  includeComparables?: boolean;

  @ApiProperty({ description: 'Include market trends', required: false })
  @IsOptional()
  @IsBoolean()
  includeMarketTrends?: boolean;

  @ApiProperty({ description: 'Include risk factors', required: false })
  @IsOptional()
  @IsBoolean()
  includeRiskFactors?: boolean;

  @ApiProperty({ description: 'Custom analysis prompt', required: false })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiProperty({ description: 'Maximum tokens for response', required: false, minimum: 100, maximum: 8000 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(8000)
  maxTokens?: number;

  @ApiProperty({ description: 'Temperature for AI response', required: false, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;
}
