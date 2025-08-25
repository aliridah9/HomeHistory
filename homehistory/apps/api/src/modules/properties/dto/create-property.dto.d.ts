import { PropertyType } from '@homehistory/database';
export declare class CreatePropertyDto {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    yearBuilt?: number;
    squareFeet?: number;
    lotSize?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: PropertyType;
}
//# sourceMappingURL=create-property.dto.d.ts.map
