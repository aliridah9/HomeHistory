import { PrismaService } from '../database/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentResponseDto, UploadDocumentDto, DocumentsQueryDto, BulkUploadResponseDto } from './dto';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    createDocument(userId: string, createDocumentDto: CreateDocumentDto): Promise<DocumentResponseDto>;
    getDocuments(userId: string, page?: number, limit?: number): Promise<DocumentResponseDto[]>;
    getDocument(userId: string, documentId: string): Promise<DocumentResponseDto>;
    updateDocument(userId: string, documentId: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentResponseDto>;
    deleteDocument(userId: string, documentId: string): Promise<void>;
    uploadDocument(userId: string, file: Express.Multer.File, dto: UploadDocumentDto): Promise<DocumentResponseDto>;
    uploadDocuments(userId: string, files: Express.Multer.File[], dto: UploadDocumentDto): Promise<BulkUploadResponseDto>;
    getDocumentStats(userId: string): Promise<any>;
    downloadDocument(userId: string, documentId: string, res: any): Promise<void>;
    getDocumentPreview(userId: string, documentId: string, size: string): Promise<any>;
    generateShareLink(userId: string, documentId: string, dto: any): Promise<any>;
    addTags(userId: string, documentId: string, tags: string[]): Promise<DocumentResponseDto>;
    removeTags(userId: string, documentId: string, tags: string[]): Promise<DocumentResponseDto>;
    getPropertyDocuments(userId: string, propertyId: string, query: DocumentsQueryDto): Promise<DocumentResponseDto[]>;
    extractText(userId: string, documentId: string): Promise<any>;
    convertDocument(userId: string, documentId: string, targetFormat: string): Promise<any>;
    private mapToResponseDto;
}
//# sourceMappingURL=documents.service.d.ts.map
