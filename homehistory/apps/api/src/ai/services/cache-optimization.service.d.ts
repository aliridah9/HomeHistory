/**
 * AI Cache Optimization Service - Intelligent Cache Warming and Analytics
 * Enterprise-grade cache management for AI operations
 */
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/database/prisma.service';
import { CacheManagerService } from './cache-manager.service';
import { ScoringEngineService } from './scoring-engine.service';
import { RecommendationService } from './recommendation.service';
import { EmbeddingService } from './embedding.service';
interface CacheAnalytics {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageResponseTime: number;
    popularKeys: string[];
    memoryUsage: number;
    evictionCount: number;
}
interface CacheWarmingJob {
    id: string;
    type: 'scores' | 'recommendations' | 'embeddings';
    propertyIds: string[];
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}
export declare class CacheOptimizationService implements OnModuleInit {
    private configService;
    private prisma;
    private cacheManager;
    private scoringEngine;
    private recommendationService;
    private embeddingService;
    private readonly logger;
    private readonly POPULAR_PROPERTIES_LIMIT;
    private readonly CACHE_WARMING_BATCH_SIZE;
    private readonly CACHE_WARMING_DELAY;
    private cacheAnalytics;
    private warmingJobs;
    constructor(configService: ConfigService, prisma: PrismaService, cacheManager: CacheManagerService, scoringEngine: ScoringEngineService, recommendationService: RecommendationService, embeddingService: EmbeddingService);
    onModuleInit(): Promise<void>;
    /**
     * Warm cache for popular properties based on view counts and recent activity
     */
    warmPopularPropertiesCache(): Promise<void>;
    /**
     * Warm cache for property scores
     */
    warmPropertyScoresCache(propertyIds: string[]): Promise<string>;
    /**
     * Warm cache for property recommendations
     */
    warmRecommendationsCache(propertyIds: string[]): Promise<string>;
    /**
     * Get cache analytics for monitoring
     */
    getCacheAnalytics(): Promise<Record<string, CacheAnalytics>>;
    /**
     * Invalidate cache when property data updates
     */
    invalidateCacheOnPropertyUpdate(propertyId: string, updateType: string): Promise<void>;
    /**
     * Perform cache maintenance operations
     */
    performCacheMaintenance(): Promise<void>;
    /**
     * Get cache warming job status
     */
    getCacheWarmingJobStatus(jobId: string): CacheWarmingJob | null;
    /**
     * Get all active cache warming jobs
     */
    getActiveCacheWarmingJobs(): CacheWarmingJob[];
    private executeCacheWarmingJob;
    private getPopularProperties;
    private initializeCacheAnalytics;
    private updateCacheAnalytics;
    private checkCacheHealth;
    private trackCacheInvalidation;
    private generateJobId;
}
export {};
//# sourceMappingURL=cache-optimization.service.d.ts.map
