/**
 * Search Controller - Enhanced with Natural Language Search
 * Provides both traditional and AI-powered search capabilities
 */
import { SearchService } from './search.service';
import { AISearchService, SearchResponse } from '../../ai/services/ai-search.service';
import { User } from '@homehistory/database';
import { NaturalSearchDto } from './dto';
export declare class SearchController {
    private readonly searchService;
    private readonly aiSearchService;
    constructor(searchService: SearchService, aiSearchService: AISearchService);
    naturalLanguageSearch(user: User, dto: NaturalSearchDto): Promise<SearchResponse>;
    searchProperties(user: User, query?: string, city?: string, state?: string, propertyType?: string, minPrice?: number, maxPrice?: number, bedrooms?: number, bathrooms?: number, minSquareFeet?: number, maxSquareFeet?: number, sortBy?: string, sortOrder?: 'asc' | 'desc', limit?: number, offset?: number): Promise<import("./dto").SearchResultDto[]>;
    getSearchSuggestions(user: User, query: string): Promise<string[]>;
    getAvailableFilters(user: User): Promise<any>;
    saveSearch(user: User, dto: {
        name: string;
        query: string;
        criteria: any;
        notifications: boolean;
    }): Promise<void>;
    getSavedSearches(user: User): Promise<any[]>;
    getSearchAnalytics(user: User, timeframe: 'day' | 'week' | 'month'): Promise<any>;
    provideFeedback(user: User, dto: {
        searchId: string;
        propertyId: string;
        relevant: boolean;
        feedback?: string;
    }): Promise<void>;
    getTrendingSearches(): Promise<string[]>;
    getSearchHealth(): Promise<{
        status: string;
        timestamp: string;
        services: {
            traditional_search: string;
            ai_search: string;
            vector_search: string;
            cache: string;
        };
        performance: {
            average_response_time: string;
            cache_hit_rate: string;
            search_success_rate: string;
        };
        version: string;
    }>;
}
//# sourceMappingURL=search.controller.d.ts.map
