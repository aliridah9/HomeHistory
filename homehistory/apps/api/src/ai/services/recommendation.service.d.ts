/**
 * HomeHistory Recommendation Engine - "Similar Properties" System
 * AI-powered property recommendations using vector embeddings and similarity scoring
 */
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/database/prisma.service';
import { EmbeddingService } from './embedding.service';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
import { Property, PropertyType, PropertyEmbedding } from '@prisma/client';
export interface PropertyRecommendation {
    property: Property & {
        embedding?: PropertyEmbedding;
    };
    similarityScore: number;
    explanation: string;
    keyMatchingFeatures: string[];
    priceDifference: number;
    distanceKm: number;
    thumbnailUrl?: string;
}
export interface RecommendationOptions {
    limit?: number;
    maxDistance?: number;
    priceRangePercent?: number;
    includePropertyTypes?: PropertyType[];
    excludePropertyIds?: string[];
    minSimilarityScore?: number;
    diversityWeight?: number;
}
export interface PropertyFeatureVector {
    propertyId: string;
    locationFeatures: number[];
    structuralFeatures: number[];
    amenityFeatures: number[];
    styleFeatures: number[];
    priceFeatures: number[];
    qualityFeatures: number[];
    embedding: number[];
}
export interface SimilarityMetrics {
    locationSimilarity: number;
    structuralSimilarity: number;
    amenitySimilarity: number;
    styleSimilarity: number;
    priceSimilarity: number;
    overallSimilarity: number;
}
export declare class RecommendationService {
    private configService;
    private prisma;
    private embeddingService;
    private cacheManager;
    private aiDatabase;
    private readonly logger;
    private readonly DEFAULT_LIMIT;
    private readonly DEFAULT_MAX_DISTANCE;
    private readonly DEFAULT_PRICE_RANGE;
    private readonly DEFAULT_MIN_SIMILARITY;
    private readonly DEFAULT_DIVERSITY_WEIGHT;
    private readonly SIMILARITY_WEIGHTS;
    private readonly RECOMMENDATION_CACHE_TTL;
    private readonly EMBEDDING_CACHE_TTL;
    constructor(configService: ConfigService, prisma: PrismaService, embeddingService: EmbeddingService, cacheManager: CacheManagerService, aiDatabase: AIDatabaseService);
    /**
     * Find similar properties using AI-powered recommendation engine
     */
    findSimilarProperties(propertyId: string, options?: RecommendationOptions): Promise<PropertyRecommendation[]>;
    /**
     * Generate property embedding from features
     */
    generatePropertyEmbedding(property: Property): Promise<PropertyEmbedding>;
    /**
     * Calculate similarity between two properties
     */
    calculateSimilarity(property1: Property & {
        embedding?: PropertyEmbedding;
    }, property2: Property & {
        embedding?: PropertyEmbedding;
    }): Promise<SimilarityMetrics>;
    /**
     * Diversify recommendation results to avoid too many similar properties
     */
    diversifyResults(recommendations: PropertyRecommendation[], diversityWeight?: number): PropertyRecommendation[];
    /**
     * Invalidate recommendation cache when property data changes
     */
    invalidateRecommendationCache(propertyId: string): Promise<void>;
    /**
     * Batch update property embeddings (background job)
     */
    batchUpdateEmbeddings(propertyIds: string[], batchSize?: number): Promise<{
        success: number;
        errors: number;
    }>;
    private getPropertyWithEmbedding;
    private findCandidateProperties;
    private calculateBatchSimilarities;
    private createPropertyDescription;
    private calculateLocationSimilarity;
    private calculateStructuralSimilarity;
    private calculateAmenitySimilarity;
    private calculateStyleSimilarity;
    private calculatePriceSimilarity;
    private calculateCosineSimilarity;
    private calculateDistance;
    private calculateDiversityScore;
    private identifyMatchingFeatures;
    private generateRecommendationExplanations;
    private generateSimpleExplanation;
    private generateRecommendationCacheKey;
}
//# sourceMappingURL=recommendation.service.d.ts.map
