import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { VectorService } from './vector.service';
import { NaturalSearchDto, FilterSearchDto, SearchResultDto } from './dto';
import { Property } from '@homehistory/database';
export declare class SearchService {
    private prisma;
    private supabase;
    private vectorService;
    constructor(prisma: PrismaService, supabase: SupabaseService, vectorService: VectorService);
    naturalSearch(userId: string, dto: NaturalSearchDto): Promise<SearchResultDto>;
    filterSearch(userId: string, dto: FilterSearchDto): Promise<SearchResultDto>;
    getSuggestions(userId: string, query: string): Promise<string[]>;
    findSimilarProperties(userId: string, propertyId: string, limit?: number): Promise<Property[]>;
    private generateHighlights;
    private getPropertyEmbedding;
    searchProperties(searchCriteria: any, userId: string): Promise<SearchResultDto[]>;
    getSearchSuggestions(query: string, userId: string): Promise<string[]>;
    getAvailableFilters(userId: string): Promise<any>;
    saveSearch(searchData: any): Promise<void>;
    getSavedSearches(userId: string): Promise<any[]>;
    getSearchAnalytics(userId: string, timeframe: string): Promise<any>;
    recordSearchFeedback(feedbackData: any): Promise<void>;
    getTrendingSearches(): Promise<string[]>;
}
//# sourceMappingURL=search.service.d.ts.map
