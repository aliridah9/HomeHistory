export declare class NaturalSearchDto {
    query: string;
    limit?: number;
    page?: number;
    includeInsights?: boolean;
}
export declare class FilterSearchDto {
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
    city?: string;
    state?: string;
    zipCode?: string;
}
export declare class SearchResultDto {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    relevanceScore?: number;
    insights?: string[];
}
//# sourceMappingURL=natural-language-search.dto.d.ts.map
