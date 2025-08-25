import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateDocumentDto {
  @ApiProperty({ description: 'Validation notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Rejection reason if rejecting', required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
