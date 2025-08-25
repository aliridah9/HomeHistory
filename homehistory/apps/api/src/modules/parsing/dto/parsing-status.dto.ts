import { ApiProperty } from '@nestjs/swagger';

export class ParsingStatusDto {
  @ApiProperty()
  documentId: string;

  @ApiProperty({ enum: ['queued', 'processing', 'completed', 'failed', 'not_started'] })
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_started';

  @ApiProperty({ nullable: true })
  jobId: string | null;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  progress?: number;
}
