import { ConfigService } from '@nestjs/config';
export interface ZillowPropertyData {
    zpid: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    yearBuilt?: number;
    propertyType?: string;
    lotSize?: number;
    lastSoldDate?: Date;
    lastSoldPrice?: number;
    zestimate?: number;
    rentZestimate?: number;
    images?: string[];
    description?: string;
    features?: string[];
}
export interface ZillowSearchParams {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    limit?: number;
}
export declare class ZillowService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    searchProperties(params: ZillowSearchParams): Promise<ZillowPropertyData[]>;
    getPropertyDetails(zpid: string): Promise<ZillowPropertyData | null>;
    getComparableProperties(zpid: string, radius?: number): Promise<ZillowPropertyData[]>;
    getMarketTrends(city: string, state: string): Promise<{
        medianPrice: number;
        priceChange: number;
        daysOnMarket: number;
        inventory: number;
        trend: 'up' | 'down' | 'stable';
    }>;
    validateAddress(address: string, city: string, state: string, zipCode: string): Promise<{
        isValid: boolean;
        normalizedAddress?: string;
        confidence: number;
    }>;
    private makeApiCall;
}
//# sourceMappingURL=zillow.service.d.ts.map
