export declare class FileProcessingService {
    extractTextFromPdf(buffer: Buffer): Promise<string>;
    validateFileType(fileType: string): Promise<boolean>;
    getFileSize(buffer: Buffer): Promise<number>;
}
//# sourceMappingURL=file-processing.service.d.ts.map
