import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ParseDocumentDto, ParseBatchDto, ParsingStatusDto } from './dto';
export declare class ParsingService {
    private prisma;
    private supabase;
    private parsingQueue;
    constructor(prisma: PrismaService, supabase: SupabaseService, parsingQueue: Queue);
    parseDocument(userId: string, dto: ParseDocumentDto): Promise<ParsingStatusDto>;
    parseBatch(userId: string, dto: ParseBatchDto): Promise<ParsingStatusDto[]>;
    processParsingJob(jobData: any): Promise<any>;
    getParsingStatus(userId: string, documentId: string): Promise<ParsingStatusDto>;
    getParsingQueue(isAdmin: boolean): Promise<{
        waiting: number;
        active: number;
        jobs: {
            id: import("bull").JobId;
            documentId: any;
            status: string;
            createdAt: Date;
            progress: any;
        }[];
    }>;
    private parsePdf;
    private processExtractedData;
    private extractPermitData;
    private extractInspectionData;
    private extractInsuranceData;
    private extractTaxData;
    private extractZillowData;
    private storeProcessedData;
    private verifyDocumentAccess;
    private downloadFile;
    private extractPattern;
    private extractDate;
    private extractCurrency;
    private extractList;
    getUserJobs(userId: string, status?: string, page?: number, limit?: number): Promise<any>;
    cancelJob(userId: string, jobId: string): Promise<any>;
    retryJob(userId: string, jobId: string): Promise<any>;
    deleteJob(userId: string, jobId: string): Promise<void>;
    getParsingStats(userId: string): Promise<any>;
}
//# sourceMappingURL=parsing.service.d.ts.map
