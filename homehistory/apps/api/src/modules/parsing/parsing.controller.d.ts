import { User } from '@homehistory/database';
import { ParsingService } from './parsing.service';
import { ParsingProcessor } from './parsing.processor';
import { ParseDocumentDto, ParseBatchDto, ParsingStatusDto } from './dto';
export declare class ParsingController {
    private readonly parsingService;
    private readonly parsingProcessor;
    constructor(parsingService: ParsingService, parsingProcessor: ParsingProcessor);
    parseDocument(user: User, parseDocumentDto: ParseDocumentDto): Promise<ParsingStatusDto>;
    parseBatch(user: User, parseBatchDto: ParseBatchDto): Promise<ParsingStatusDto[]>;
    getParsingStatus(user: User, jobId: string): Promise<ParsingStatusDto>;
    getUserJobs(user: User, status?: string, page?: number, limit?: number): Promise<any>;
    cancelJob(user: User, jobId: string): Promise<any>;
    retryJob(user: User, jobId: string): Promise<any>;
    deleteJob(user: User, jobId: string): Promise<void>;
    getParsingStats(user: User): Promise<any>;
    startProcessor(): Promise<{
        success: boolean;
        message: string;
    }>;
    stopProcessor(): Promise<{
        success: boolean;
        message: string;
    }>;
    getProcessorStatus(): Promise<import("./parsing.processor").ProcessorStatus>;
    healthCheck(): Promise<{
        healthy: boolean;
        status: string;
        details: Record<string, any>;
    }>;
}
//# sourceMappingURL=parsing.controller.d.ts.map
