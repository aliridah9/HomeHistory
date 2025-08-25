/**
 * AI Controller - API endpoints for AI operations
 * RESTful endpoints for property analysis, document processing, and semantic search
 */
import { OpenAIService } from './services/openai.service';
import { EmbeddingService } from './services/embedding.service';
import { CacheManagerService } from './services/cache-manager.service';
import { PropertyAnalysisDto, DocumentAnalysisDto, EmbeddingRequestDto, SearchQueryDto, CompletionRequestDto } from './dto';
import { User } from '@homehistory/database';
export declare class AIController {
    private readonly openaiService;
    private readonly embeddingService;
    private readonly cacheManager;
    constructor(openaiService: OpenAIService, embeddingService: EmbeddingService, cacheManager: CacheManagerService);
    analyzeProperty(user: User, dto: PropertyAnalysisDto): Promise<import("./interfaces/ai.interfaces").PropertyAnalysisResponse>;
    analyzeDocument(user: User, dto: DocumentAnalysisDto): Promise<import("./interfaces/ai.interfaces").DocumentAnalysisResponse>;
    generateEmbedding(user: User, dto: EmbeddingRequestDto): Promise<import("./interfaces/ai.interfaces").EmbeddingResponse>;
    generateBatchEmbeddings(user: User, dto: {
        texts: string[];
        model?: string;
        dimensions?: number;
    }): Promise<import("./interfaces/ai.interfaces").EmbeddingResponse[]>;
    similaritySearch(user: User, dto: SearchQueryDto): Promise<import("./interfaces/ai.interfaces").SearchResult[]>;
    findSimilarProperties(user: User, propertyId: string, limit?: number, threshold?: number): Promise<import("./interfaces/ai.interfaces").SearchResult[]>;
    generateCompletion(user: User, dto: CompletionRequestDto): Promise<{
        content: string;
        usage: import("./interfaces/ai.interfaces").AIUsageMetrics;
    }>;
    getModelCapabilities(model: string): import("./interfaces/ai.interfaces").ModelCapabilities;
    getUsageStats(timeframe?: 'hour' | 'day' | 'week' | 'month'): {
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        averageLatency: number;
        errorRate: number;
    };
    getEmbeddingStats(): Promise<{
        totalEmbeddings: number;
        modelDistribution: Record<string, number>;
        averageDimensions: number;
        lastUpdated: Date;
    }>;
    updateAllEmbeddings(user: User): Promise<import("./interfaces/ai.interfaces").BatchProcessingJob>;
    getCacheStats(): {
        entries: number;
        hits: number;
        misses: number;
        hitRate: number;
        totalSize: string;
        averageSize: string;
        stats: any;
    };
    getCacheHealth(): {
        status: "healthy" | "degraded" | "unhealthy";
        memoryUsage: string;
        hitRate: number;
        errorRate: number;
        avgResponseTime: number;
    };
    clearCache(): Promise<{
        message: string;
    }>;
    clearCacheByTags(dto: {
        tags: string[];
    }): Promise<{
        message: string;
        deletedCount: number;
    }>;
    getHealth(): {
        status: string;
        timestamp: string;
        services: {
            openai: string;
            embedding: string;
            cache: "healthy" | "unhealthy" | "degraded";
        };
        version: string;
    };
}
//# sourceMappingURL=ai.controller.d.ts.map
