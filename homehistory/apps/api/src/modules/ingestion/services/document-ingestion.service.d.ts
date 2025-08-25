import { PrismaService } from '../../modules/database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
export interface DocumentIngestionResult {
    success: boolean;
    documentId: string;
    message: string;
    errors?: string[];
    metadata?: Record<string, any>;
}
export interface DocumentProcessingOptions {
    extractText?: boolean;
    generateEmbeddings?: boolean;
    analyzeContent?: boolean;
    validateFormat?: boolean;
    notifyUser?: boolean;
}
export declare class DocumentIngestionService {
    private prisma;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    ingestDocument(fileUrl: string, fileType: string, userId: string, propertyId?: string, options?: DocumentProcessingOptions): Promise<DocumentIngestionResult>;
    processDocument(documentId: string, options: DocumentProcessingOptions): Promise<{
        success: boolean;
        errors?: string[];
        metadata?: Record<string, any>;
    }>;
    bulkIngestDocuments(files: Array<{
        fileUrl: string;
        fileType: string;
        propertyId?: string;
    }>, userId: string, options?: DocumentProcessingOptions): Promise<DocumentIngestionResult[]>;
    getIngestionStatus(documentId: string): Promise<{
        status: string;
        progress: number;
        message: string;
        metadata?: Record<string, any>;
    }>;
    private isValidFileType;
    private extractTextFromDocument;
    private generateEmbeddings;
    private analyzeDocumentContent;
    private validateDocumentFormat;
    private calculateProgress;
    private getStatusMessage;
}
//# sourceMappingURL=document-ingestion.service.d.ts.map
