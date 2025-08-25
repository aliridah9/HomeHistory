import { PropertyType } from '@homehistory/database';
export declare class PropertyResponseDto {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    yearBuilt: number | null;
    squareFeet: number | null;
    lotSize: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    propertyType: PropertyType | null;
    createdAt: Date;
    updatedAt: Date;
    latestReport: any;
    documentCount: number;
    reportCount: number;
}
//# sourceMappingURL=property-response.dto.d.ts.map
