import { ApiProperty } from '@nestjs/swagger';

export class BulkUploadResponseDto {
  @ApiProperty({
    description: 'Total number of files processed',
    example: 5
  })
  totalFiles: number;

  @ApiProperty({
    description: 'Number of successfully uploaded files',
    example: 4
  })
  successfulUploads: number;

  @ApiProperty({
    description: 'Number of failed uploads',
    example: 1
  })
  failedUploads: number;

  @ApiProperty({
    description: 'Array of successfully uploaded document IDs',
    example: ['doc_123', 'doc_124', 'doc_125', 'doc_126']
  })
  uploadedDocumentIds: string[];

  @ApiProperty({
    description: 'Array of error messages for failed uploads',
    example: ['File too large: document5.pdf']
  })
  errors: string[];

  @ApiProperty({
    description: 'Total processing time in milliseconds',
    example: 2500
  })
  processingTimeMs: number;
}
