import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseDocumentDto {
  @ApiProperty({ description: 'Document ID to parse' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Parsing options', required: false })
  @IsOptional()
  @IsObject()
  parseOptions?: {
    extractImages?: boolean;
    ocrEnabled?: boolean;
    language?: string;
  };
}
