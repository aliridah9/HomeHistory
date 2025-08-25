import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GeolocationService } from './services/geolocation.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyResponseDto, PropertiesQueryDto, PropertyStatsDto } from './dto';
export declare class PropertiesService {
    private prisma;
    private supabase;
    private geolocationService;
    constructor(prisma: PrismaService, supabase: SupabaseService, geolocationService: GeolocationService);
    createProperty(userId: string, dto: CreatePropertyDto): Promise<PropertyResponseDto>;
    getProperties(userId: string, query: PropertiesQueryDto): Promise<{
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
    getProperty(userId: string, propertyId: string): Promise<PropertyResponseDto>;
    updateProperty(userId: string, propertyId: string, dto: UpdatePropertyDto): Promise<PropertyResponseDto>;
    deleteProperty(userId: string, propertyId: string): Promise<void>;
    getPropertyStats(userId: string): Promise<PropertyStatsDto>;
    toggleFavorite(userId: string, propertyId: string, isFavorite: boolean): Promise<{
        success: boolean;
        isFavorite: boolean;
    }>;
    getPropertyTimeline(userId: string, propertyId: string): Promise<{
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
    generateShareLink(userId: string, propertyId: string, options: any): Promise<{
        shareLink: string;
        shareToken: string;
        expiresAt: Date;
        permissions: any;
    }>;
    importProperties(userId: string, source: string, data: any): Promise<{
        message: string;
        source: string;
        estimatedProcessingTime: string;
    }>;
    exportProperties(userId: string, format: string, propertyIds?: string[]): Promise<{
        downloadUrl: string;
        expiresAt: Date;
        fileSize: number;
    }>;
    private verifyPropertyOwnership;
    private formatPropertyResponse;
    private calculateTotalPortfolioValue;
    private generateSecureToken;
}
//# sourceMappingURL=properties.service.d.ts.map
