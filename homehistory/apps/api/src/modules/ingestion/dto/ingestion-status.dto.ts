import { ApiProperty } from '@nestjs/swagger';
import { SyncStatus } from '@homehistory/database';

export class IngestionStatusDto {
  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  dataSourceName: string;

  @ApiProperty({ enum: SyncStatus })
  status: SyncStatus;

  @ApiProperty({ nullable: true })
  lastSynced: Date | null;

  @ApiProperty()
  message: string;
}
