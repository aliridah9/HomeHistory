import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, DocumentResponseDto, DocumentsQueryDto, BulkUploadResponseDto } from './dto';
import { User } from '@homehistory/database';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    uploadDocument(user: User, file: Express.Multer.File, dto: UploadDocumentDto): Promise<DocumentResponseDto>;
    uploadDocuments(user: User, files: Express.Multer.File[], dto: {
        propertyId?: string;
        documentType?: string;
    }): Promise<BulkUploadResponseDto>;
    getDocuments(user: User, page?: number, limit?: number): Promise<DocumentResponseDto[]>;
    getDocumentStats(user: User): Promise<any>;
    getDocument(user: User, documentId: string): Promise<DocumentResponseDto>;
    downloadDocument(user: User, documentId: string, res: Response): Promise<void>;
    getDocumentPreview(user: User, documentId: string, size?: 'small' | 'medium' | 'large'): Promise<any>;
    deleteDocument(user: User, documentId: string): Promise<void>;
    shareDocument(user: User, documentId: string, dto: {
        expiresIn?: number;
        password?: string;
    }): Promise<any>;
    tagDocument(user: User, documentId: string, dto: {
        tags: string[];
    }): Promise<DocumentResponseDto>;
    untagDocument(user: User, documentId: string, dto: {
        tags: string[];
    }): Promise<DocumentResponseDto>;
    getPropertyDocuments(user: User, propertyId: string, query: DocumentsQueryDto): Promise<DocumentResponseDto[]>;
    extractText(user: User, documentId: string): Promise<any>;
    convertDocument(user: User, documentId: string, dto: {
        targetFormat: 'pdf' | 'png' | 'jpg' | 'docx';
    }): Promise<any>;
}
//# sourceMappingURL=documents.controller.d.ts.map
