import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ZillowService } from './services/zillow.service';
import { CountyRecordsService } from './services/county-records.service';
import { TaxAssessorService } from './services/tax-assessor.service';
import { PermitDataService } from './services/permit-data.service';
import { TriggerIngestionDto, IngestionStatusDto } from './dto';
export declare class IngestionService {
    private prisma;
    private supabase;
    private ingestionQueue;
    private zillowService;
    private countyRecordsService;
    private taxAssessorService;
    private permitDataService;
    private dataSourceServices;
    constructor(prisma: PrismaService, supabase: SupabaseService, ingestionQueue: Queue, zillowService: ZillowService, countyRecordsService: CountyRecordsService, taxAssessorService: TaxAssessorService, permitDataService: PermitDataService);
    triggerIngestion(userId: string, dto: TriggerIngestionDto): Promise<IngestionStatusDto>;
    triggerAllSourcesForProperty(userId: string, propertyId: string): Promise<IngestionStatusDto[]>;
    processIngestion(jobData: any): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@homehistory/database").$Enums.ReportStatus;
        propertyId: string | null;
        source: string;
        fileUrl: string;
        extractedText: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    getIngestionStatus(userId: string, propertyId: string): Promise<IngestionStatusDto[]>;
    getIngestionHistory(userId: string, propertyId: string): Promise<{
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
    private verifyPropertyOwnership;
    private storeRawData;
    private getSyncStatusMessage;
}
//# sourceMappingURL=ingestion.service.d.ts.map
