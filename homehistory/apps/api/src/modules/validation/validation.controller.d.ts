import { ValidationService } from './validation.service';
import { ValidateDocumentDto, BulkValidationDto, PendingDocumentsQueryDto } from './dto';
import { User } from '@homehistory/database';
export declare class ValidationController {
    private readonly validationService;
    constructor(validationService: ValidationService);
    getPendingDocuments(user: User, query: PendingDocumentsQueryDto): Promise<{
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
    getDocumentForValidation(user: User, documentId: string): Promise<{
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
    approveDocument(user: User, documentId: string, dto: ValidateDocumentDto): Promise<{
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
    rejectDocument(user: User, documentId: string, dto: ValidateDocumentDto): Promise<{
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
    bulkValidation(user: User, dto: BulkValidationDto): Promise<{
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
    getValidationStats(user: User): Promise<{
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
}
//# sourceMappingURL=validation.controller.d.ts.map
