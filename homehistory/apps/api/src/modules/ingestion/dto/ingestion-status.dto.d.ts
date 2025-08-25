import { SyncStatus } from '@homehistory/database';
export declare class IngestionStatusDto {
    propertyId: string;
    dataSourceName: string;
    status: SyncStatus;
    lastSynced: Date | null;
    message: string;
}
//# sourceMappingURL=ingestion-status.dto.d.ts.map
