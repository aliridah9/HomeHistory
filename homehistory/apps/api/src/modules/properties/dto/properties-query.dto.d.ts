import { PropertyType } from '@homehistory/database';
export declare class PropertiesQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    state?: string;
    propertyType?: PropertyType;
    minYear?: number;
    maxYear?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
}
//# sourceMappingURL=properties-query.dto.d.ts.map
