import { IngestionService } from './ingestion.service';
import { TriggerIngestionDto, IngestionStatusDto } from './dto';
import { User } from '@homehistory/database';
export declare class IngestionController {
    private readonly ingestionService;
    constructor(ingestionService: IngestionService);
    triggerIngestion(user: User, dto: TriggerIngestionDto): Promise<IngestionStatusDto>;
    triggerAllSources(user: User, propertyId: string): Promise<IngestionStatusDto[]>;
    getIngestionStatus(user: User, propertyId: string): Promise<IngestionStatusDto[]>;
    getIngestionHistory(user: User, propertyId: string): Promise<{
        documents: {
            type: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@homehistory/database").$Enums.ReportStatus;
            propertyId: string | null;
            source: string;
            fileUrl: string;
            extractedText: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        auditLogs: {
            id: string;
            createdAt: Date;
            userId: string | null;
            action: string;
            entityType: string;
            entityId: string;
            changes: import("@prisma/client/runtime/library").JsonValue | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    }>;
}
//# sourceMappingURL=ingestion.controller.d.ts.map
