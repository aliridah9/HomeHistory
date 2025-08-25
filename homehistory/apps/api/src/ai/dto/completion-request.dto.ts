import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CompletionRequestDto {
  @ApiProperty({ description: 'Prompt for completion', minLength: 1, maxLength: 10000 })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  prompt: string;

  @ApiProperty({ 
    description: 'Model to use for completion',
    enum: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
    required: false,
    default: 'gpt-4'
  })
  @IsOptional()
  @IsEnum(['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'])
  model?: 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-3.5-turbo';

  @ApiProperty({ description: 'Maximum tokens for response', required: false, minimum: 1, maximum: 8000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8000)
  maxTokens?: number;

  @ApiProperty({ description: 'Temperature for randomness', required: false, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ description: 'System prompt for context', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemPrompt?: string;
}
