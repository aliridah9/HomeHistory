/**
 * AI Search Service - Natural Language Search Engine for HomeHistory
 * Implements hybrid search combining NLP, vector similarity, and traditional filters
 */
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/database/prisma.service';
import { EmbeddingService } from './embedding.service';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
export interface NaturalLanguageQuery {
    query: string;
    userId?: string;
    limit?: number;
    offset?: number;
}
export interface ExtractedSearchCriteria {
    propertyTypes?: string[];
    location?: {
        city?: string;
        state?: string;
        zipCode?: string;
        neighborhood?: string;
        radius?: number;
    };
    priceRange?: {
        min?: number;
        max?: number;
    };
    features?: {
        bedrooms?: {
            min?: number;
            max?: number;
        };
        bathrooms?: {
            min?: number;
            max?: number;
        };
        squareFeet?: {
            min?: number;
            max?: number;
        };
        yearBuilt?: {
            min?: number;
            max?: number;
        };
    };
    amenities?: string[];
    vibeKeywords?: string[];
    sortBy?: 'relevance' | 'price' | 'date' | 'size';
    sortOrder?: 'asc' | 'desc';
    confidence: number;
}
export interface SearchResult {
    propertyId: string;
    relevanceScore: number;
    semanticScore: number;
    filterScore: number;
    property: {
        id: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        bedrooms?: number;
        bathrooms?: number;
        squareFeet?: number;
        yearBuilt?: number;
        price?: number;
        description?: string;
        amenities?: string[];
        images?: string[];
    };
    matchReasons: string[];
    highlights: string[];
}
export interface SearchResponse {
    results: SearchResult[];
    totalCount: number;
    searchTime: number;
    query: {
        original: string;
        processed: ExtractedSearchCriteria;
        embedding?: number[];
    };
    suggestions?: string[];
    filters: {
        appliedFilters: Record<string, any>;
        availableFilters: Record<string, any>;
    };
}
export declare class AISearchService {
    private configService;
    private prisma;
    private embeddingService;
    private cacheManager;
    private aiDatabase;
    private readonly logger;
    private openai;
    private readonly SEARCH_FUNCTION_SCHEMA;
    constructor(configService: ConfigService, prisma: PrismaService, embeddingService: EmbeddingService, cacheManager: CacheManagerService, aiDatabase: AIDatabaseService);
    private initializeOpenAI;
    /**
     * Process natural language query and return search results
     */
    processNaturalLanguageQuery(query: NaturalLanguageQuery): Promise<SearchResponse>;
    /**
     * Extract structured search criteria from natural language using GPT-4
     */
    extractSearchCriteria(query: string): Promise<ExtractedSearchCriteria>;
    /**
     * Generate search embedding for semantic similarity
     */
    generateSearchEmbedding(query: string): Promise<{
        embedding: number[];
        model: string;
    }>;
    /**
     * Perform hybrid search combining traditional filters with vector similarity
     */
    hybridSearch(criteria: ExtractedSearchCriteria, embedding: {
        embedding: number[];
        model: string;
    }, options: {
        limit: number;
        offset: number;
        userId?: string;
    }): Promise<{
        results: SearchResult[];
        totalCount: number;
    }>;
    private buildWhereConditions;
    private prepareCityFilters;
    private generateMatchReasons;
    private extractHighlights;
    private generateSearchSuggestions;
    private getAvailableFilters;
    private extractAppliedFilters;
    private trackSearchAnalytics;
    private generateRequestId;
    private hashString;
}
//# sourceMappingURL=ai-search.service.d.ts.map
