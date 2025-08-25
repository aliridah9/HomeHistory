import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Document ID',
    example: 'doc_123'
  })
  id: string;

  @ApiProperty({
    description: 'Document title',
    example: 'Property Deed'
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Original property deed for 123 Main St'
  })
  description?: string;

  @ApiProperty({
    description: 'URL to the document file',
    example: 'https://storage.example.com/documents/deed.pdf'
  })
  fileUrl: string;

  @ApiProperty({
    description: 'File type/MIME type',
    example: 'application/pdf'
  })
  fileType: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024000
  })
  fileSize?: number;

  @ApiProperty({
    description: 'Document status',
    example: 'PENDING'
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { category: 'legal', priority: 'high' }
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Document creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Document last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}
