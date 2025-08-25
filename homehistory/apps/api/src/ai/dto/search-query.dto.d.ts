declare class LocationFilterDto {
    city?: string;
    state?: string;
    zipCode?: string;
    radius?: number;
}
declare class SearchFiltersDto {
    propertyType?: string[];
    priceRange?: [number, number];
    location?: LocationFilterDto;
    dateRange?: [Date, Date];
}
export declare class SearchQueryDto {
    query: string;
    filters?: SearchFiltersDto;
    limit?: number;
    threshold?: number;
}
export {};
//# sourceMappingURL=search-query.dto.d.ts.map
