import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class DocumentAnalysisDto {
  @ApiProperty({ description: 'Document ID to analyze' })
  @IsString()
  documentId: string;

  @ApiProperty({ 
    description: 'Type of document',
    enum: ['inspection', 'appraisal', 'deed', 'permit', 'insurance', 'other']
  })
  @IsEnum(['inspection', 'appraisal', 'deed', 'permit', 'insurance', 'other'])
  documentType: 'inspection' | 'appraisal' | 'deed' | 'permit' | 'insurance' | 'other';

  @ApiProperty({ 
    description: 'Type of extraction to perform',
    enum: ['summary', 'structured', 'issues', 'compliance', 'full']
  })
  @IsEnum(['summary', 'structured', 'issues', 'compliance', 'full'])
  extractionType: 'summary' | 'structured' | 'issues' | 'compliance' | 'full';

  @ApiProperty({ description: 'Custom fields to extract', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customFields?: string[];

  @ApiProperty({ description: 'Document language', required: false, default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;
}
