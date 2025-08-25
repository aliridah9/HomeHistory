import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsObject, MinLength, MaxLength } from 'class-validator';

export class EmbeddingRequestDto {
  @ApiProperty({ description: 'Text to generate embedding for', minLength: 1, maxLength: 8000 })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  text: string;

  @ApiProperty({ 
    description: 'Embedding model to use',
    enum: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
    required: false,
    default: 'text-embedding-3-small'
  })
  @IsOptional()
  @IsEnum(['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'])
  model?: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002';

  @ApiProperty({ description: 'Number of dimensions for embedding', required: false })
  @IsOptional()
  @IsNumber()
  dimensions?: number;

  @ApiProperty({ description: 'Additional metadata', required: false, type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
