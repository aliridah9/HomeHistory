import { IsArray, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseBatchDto {
  @ApiProperty({ description: 'Array of document IDs to parse' })
  @IsArray()
  @IsString({ each: true })
  documentIds: string[];

  @ApiProperty({ description: 'Parsing options', required: false })
  @IsOptional()
  @IsObject()
  parseOptions?: {
    extractImages?: boolean;
    ocrEnabled?: boolean;
    language?: string;
  };
}
