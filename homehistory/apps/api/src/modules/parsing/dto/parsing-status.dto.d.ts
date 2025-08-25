export declare class ParsingStatusDto {
    documentId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_started';
    jobId: string | null;
    message: string;
    progress?: number;
}
//# sourceMappingURL=parsing-status.dto.d.ts.map
