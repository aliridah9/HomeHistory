import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyResponseDto, PropertiesQueryDto, PropertyStatsDto } from './dto';
import { User } from '@homehistory/database';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    createProperty(user: User, dto: CreatePropertyDto): Promise<PropertyResponseDto>;
    getProperties(user: User, query: PropertiesQueryDto): Promise<{
        properties: PropertyResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        filters: {
            search: string | undefined;
            city: string | undefined;
            state: string | undefined;
            propertyType: import("@homehistory/database").$Enums.PropertyType | undefined;
            minYear: number | undefined;
            maxYear: number | undefined;
            minSquareFeet: number | undefined;
            maxSquareFeet: number | undefined;
        };
    }>;
    getPropertyStats(user: User): Promise<PropertyStatsDto>;
    getProperty(user: User, propertyId: string): Promise<PropertyResponseDto>;
    updateProperty(user: User, propertyId: string, dto: UpdatePropertyDto): Promise<PropertyResponseDto>;
    deleteProperty(user: User, propertyId: string): Promise<void>;
    addToFavorites(user: User, propertyId: string): Promise<{
        success: boolean;
        isFavorite: boolean;
    }>;
    removeFromFavorites(user: User, propertyId: string): Promise<{
        success: boolean;
        isFavorite: boolean;
    }>;
    getPropertyTimeline(user: User, propertyId: string): Promise<{
        timeline: ({
            type: string;
            date: Date;
            action: string;
            details: import("@prisma/client/runtime/library").JsonValue;
        } | {
            type: string;
            date: Date;
            action: string;
            details: {
                documentType: string;
                source: string;
                status: import("@homehistory/database").$Enums.ReportStatus;
            };
        } | {
            type: string;
            date: Date;
            action: string;
            details: {
                status: import("@homehistory/database").$Enums.ReportStatus;
                publishedAt: Date | null;
            };
        })[];
    }>;
    shareProperty(user: User, propertyId: string, dto: {
        expiresIn?: number;
        permissions?: string[];
    }): Promise<{
        shareLink: string;
        shareToken: string;
        expiresAt: Date;
        permissions: any;
    }>;
    importProperties(user: User, dto: {
        source: string;
        data: any;
    }): Promise<{
        message: string;
        source: string;
        estimatedProcessingTime: string;
    }>;
    exportProperties(user: User, dto: {
        format: 'csv' | 'json' | 'pdf';
        propertyIds?: string[];
    }): Promise<{
        downloadUrl: string;
        expiresAt: Date;
        fileSize: number;
    }>;
}
//# sourceMappingURL=properties.controller.d.ts.map
