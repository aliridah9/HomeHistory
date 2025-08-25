/**
 * Embedding Service - Text embedding generation and similarity search
 * Handles vector embeddings for semantic search and property matching
 */
import { ConfigService } from '@nestjs/config';
import { EmbeddingRequest, EmbeddingResponse, SearchQuery, SearchResult, EmbeddingModel, BatchProcessingJob } from '../interfaces/ai.interfaces';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
import { PrismaService } from '../../modules/database/prisma.service';
export declare class EmbeddingService {
    private configService;
    private cacheManager;
    private aiDatabase;
    private prisma;
    private readonly logger;
    private openai;
    private readonly DEFAULT_MODEL;
    private readonly DEFAULT_DIMENSIONS;
    private readonly SIMILARITY_THRESHOLD;
    private readonly MODEL_SPECS;
    constructor(configService: ConfigService, cacheManager: CacheManagerService, aiDatabase: AIDatabaseService, prisma: PrismaService);
    private initializeOpenAI;
    /**
     * Generate embedding for text
     */
    generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    /**
     * Generate embeddings for multiple texts in batch
     */
    generateBatchEmbeddings(texts: string[], options?: {
        model?: EmbeddingModel;
        dimensions?: number;
        userId?: string;
        batchSize?: number;
    }): Promise<EmbeddingResponse[]>;
    /**
     * Perform semantic similarity search
     */
    similaritySearch(query: SearchQuery): Promise<SearchResult[]>;
    /**
     * Find similar properties based on property features
     */
    findSimilarProperties(propertyId: string, options?: {
        limit?: number;
        threshold?: number;
        includeFeatures?: string[];
    }): Promise<SearchResult[]>;
    /**
     * Store property embedding in database
     */
    storePropertyEmbedding(propertyId: string, content: string, metadata?: Record<string, any>, model?: EmbeddingModel): Promise<void>;
    /**
     * Update embeddings for all properties (batch job)
     */
    updateAllPropertyEmbeddings(): Promise<BatchProcessingJob>;
    /**
     * Get embedding statistics
     */
    getEmbeddingStats(): Promise<{
        totalEmbeddings: number;
        modelDistribution: Record<string, number>;
        averageDimensions: number;
        lastUpdated: Date;
    }>;
    private processPropertyEmbeddings;
    private buildPropertyContent;
    private buildWhereConditions;
    private generateSnippet;
    private extractHighlights;
    private calculateEmbeddingCost;
    private generateRequestId;
    private generateJobId;
    private generateCacheKey;
    private trackEmbeddingUsage;
    private sleep;
}
//# sourceMappingURL=embedding.service.d.ts.map
