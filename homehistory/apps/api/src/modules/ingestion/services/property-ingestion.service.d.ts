import { PrismaService } from '../../modules/database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
export interface PropertyIngestionResult {
    success: boolean;
    propertyId: string;
    message: string;
    errors?: string[];
    metadata?: Record<string, any>;
}
export interface PropertyData {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    yearBuilt?: number;
    price?: number;
    description?: string;
    features?: string[];
    images?: string[];
    documents?: string[];
}
export interface PropertyProcessingOptions {
    validateAddress?: boolean;
    geocodeLocation?: boolean;
    enrichData?: boolean;
    generateReport?: boolean;
    notifyUser?: boolean;
}
export declare class PropertyIngestionService {
    private prisma;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    ingestProperty(propertyData: PropertyData, userId: string, options?: PropertyProcessingOptions): Promise<PropertyIngestionResult>;
    bulkIngestProperties(properties: PropertyData[], userId: string, options?: PropertyProcessingOptions): Promise<PropertyIngestionResult[]>;
    updateProperty(propertyId: string, propertyData: Partial<PropertyData>, userId: string, options?: PropertyProcessingOptions): Promise<PropertyIngestionResult>;
    private validatePropertyData;
    private findExistingProperty;
    private processPropertyData;
    private validateAddress;
    private geocodeAddress;
    private enrichPropertyData;
    private generatePropertyReport;
}
//# sourceMappingURL=property-ingestion.service.d.ts.map
