import { IsArray, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkValidationDto {
  @ApiProperty({ description: 'Array of document IDs to validate' })
  @IsArray()
  @IsString({ each: true })
  documentIds: string[];

  @ApiProperty({ description: 'Action to perform', enum: ['approve', 'reject'] })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiProperty({ description: 'Notes for bulk action', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Rejection reason if rejecting', required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
