import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiPropertyOptional({
    description: 'Document title',
    example: 'Property Deed'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Original property deed for 123 Main St'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Document tags',
    example: ['legal', 'deed', 'important']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Property ID this document is associated with',
    example: 'prop_123'
  })
  @IsOptional()
  @IsString()
  propertyId?: string;
}
