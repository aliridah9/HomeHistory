import { PrismaService } from '../database/prisma.service';
import { ValidateDocumentDto, BulkValidationDto, PendingDocumentsQueryDto } from './dto';
export declare class ValidationService {
    private prisma;
    constructor(prisma: PrismaService);
    getPendingDocuments(query: PendingDocumentsQueryDto): Promise<{
        documents: ({
            property: {
                user: {
                    name: string | null;
                    email: string;
                    id: string;
                };
                id: string;
                address: string;
                city: string;
                state: string;
            } | null;
        } & {
            type: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@homehistory/database").$Enums.ReportStatus;
            propertyId: string | null;
            source: string;
            fileUrl: string;
            extractedText: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDocumentForValidation(documentId: string): Promise<{
        document: {
            property: ({
                user: {
                    name: string | null;
                    email: string;
                    id: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                latitude: number | null;
                longitude: number | null;
                address: string;
                city: string;
                state: string;
                zipCode: string;
                country: string;
                yearBuilt: number | null;
                squareFeet: number | null;
                lotSize: number | null;
                bedrooms: number | null;
                bathrooms: number | null;
                propertyType: import("@homehistory/database").$Enums.PropertyType | null;
            }) | null;
        } & {
            type: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@homehistory/database").$Enums.ReportStatus;
            propertyId: string | null;
            source: string;
            fileUrl: string;
            extractedText: import("@prisma/client/runtime/library").JsonValue | null;
        };
        validationHistory: {
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
    approveDocument(adminId: string, documentId: string, dto: ValidateDocumentDto): Promise<{
        document: {
            type: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@homehistory/database").$Enums.ReportStatus;
            propertyId: string | null;
            source: string;
            fileUrl: string;
            extractedText: import("@prisma/client/runtime/library").JsonValue | null;
        };
        message: string;
    }>;
    rejectDocument(adminId: string, documentId: string, dto: ValidateDocumentDto): Promise<{
        document: {
            type: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@homehistory/database").$Enums.ReportStatus;
            propertyId: string | null;
            source: string;
            fileUrl: string;
            extractedText: import("@prisma/client/runtime/library").JsonValue | null;
        };
        message: string;
    }>;
    bulkValidation(adminId: string, dto: BulkValidationDto): Promise<{
        results: ({
            documentId: string;
            status: string;
            result: {
                document: {
                    type: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: import("@homehistory/database").$Enums.ReportStatus;
                    propertyId: string | null;
                    source: string;
                    fileUrl: string;
                    extractedText: import("@prisma/client/runtime/library").JsonValue | null;
                };
                message: string;
            } | undefined;
            error?: undefined;
        } | {
            documentId: string;
            status: string;
            error: any;
            result?: undefined;
        })[];
        summary: {
            total: number;
            successful: number;
            failed: number;
        };
    }>;
    getValidationStats(): Promise<{
        counts: {
            pending: number;
            verified: number;
            processedToday: number;
        };
        averageProcessingTimeHours: number;
        queueBreakdown: {
            bySource: {
                source: string;
                count: number;
            }[];
            byType: {
                type: string;
                count: number;
            }[];
        };
    }>;
    private getDocumentById;
    private calculateAverageProcessingTime;
}
//# sourceMappingURL=validation.service.d.ts.map
