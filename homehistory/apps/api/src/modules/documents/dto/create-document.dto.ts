import { IsString, IsOptional, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Document title',
    example: 'Property Deed'
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Original property deed for 123 Main St'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'URL to the document file',
    example: 'https://storage.example.com/documents/deed.pdf'
  })
  @IsUrl()
  fileUrl: string;

  @ApiProperty({
    description: 'File type/MIME type',
    example: 'application/pdf'
  })
  @IsString()
  fileType: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024000
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Document status',
    example: 'PENDING',
    default: 'PENDING'
  })
  @IsOptional()
  @IsString()
  status?: string = 'PENDING';

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { category: 'legal', priority: 'high' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
