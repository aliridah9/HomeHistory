/**
 * AI Cache Optimization Service - Intelligent Cache Warming and Analytics
 * Enterprise-grade cache management for AI operations
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
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

@Injectable()
export class CacheOptimizationService implements OnModuleInit {
  private readonly logger = new Logger(CacheOptimizationService.name);
  
  // Cache warming configuration
  private readonly POPULAR_PROPERTIES_LIMIT = 1000;
  private readonly CACHE_WARMING_BATCH_SIZE = 50;
  private readonly CACHE_WARMING_DELAY = 100; // ms between requests
  
  // Analytics tracking
  private cacheAnalytics: Map<string, CacheAnalytics> = new Map();
  private warmingJobs: Map<string, CacheWarmingJob> = new Map();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cacheManager: CacheManagerService,
    private scoringEngine: ScoringEngineService,
    private recommendationService: RecommendationService,
    private embeddingService: EmbeddingService,
  ) {}

  async onModuleInit() {
    this.logger.log('Cache Optimization Service initialized');
    
    // Initialize cache analytics
    await this.initializeCacheAnalytics();
    
    // Start cache warming for popular properties
    setTimeout(() => this.warmPopularPropertiesCache(), 30000); // 30 seconds after startup
  }

  /**
   * Warm cache for popular properties based on view counts and recent activity
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async warmPopularPropertiesCache(): Promise<void> {
    try {
      this.logger.log('Starting cache warming for popular properties');

      // Get popular properties based on recent activity
      const popularProperties = await this.getPopularProperties();
      
      if (popularProperties.length === 0) {
        this.logger.log('No popular properties found for cache warming');
        return;
      }

      // Create cache warming job
      const jobId = this.generateJobId();
      const job: CacheWarmingJob = {
        id: jobId,
        type: 'scores',
        propertyIds: popularProperties.map(p => p.id),
        priority: 'medium',
        status: 'pending',
        progress: 0,
      };

      this.warmingJobs.set(jobId, job);

      // Execute cache warming in background
      this.executeCacheWarmingJob(jobId);

      this.logger.log(`Cache warming job ${jobId} started for ${popularProperties.length} properties`);

    } catch (error) {
      this.logger.error('Failed to warm popular properties cache:', error);
    }
  }

  /**
   * Warm cache for property scores
   */
  async warmPropertyScoresCache(propertyIds: string[]): Promise<string> {
    const jobId = this.generateJobId();
    const job: CacheWarmingJob = {
      id: jobId,
      type: 'scores',
      propertyIds,
      priority: 'high',
      status: 'pending',
      progress: 0,
    };

    this.warmingJobs.set(jobId, job);
    this.executeCacheWarmingJob(jobId);

    return jobId;
  }

  /**
   * Warm cache for property recommendations
   */
  async warmRecommendationsCache(propertyIds: string[]): Promise<string> {
    const jobId = this.generateJobId();
    const job: CacheWarmingJob = {
      id: jobId,
      type: 'recommendations',
      propertyIds,
      priority: 'high',
      status: 'pending',
      progress: 0,
    };

    this.warmingJobs.set(jobId, job);
    this.executeCacheWarmingJob(jobId);

    return jobId;
  }

  /**
   * Get cache analytics for monitoring
   */
  async getCacheAnalytics(): Promise<Record<string, CacheAnalytics>> {
    const analytics: Record<string, CacheAnalytics> = {};
    
    // Get analytics for different cache types
    const cacheTypes = ['scores', 'recommendations', 'embeddings', 'search'];
    
    for (const type of cacheTypes) {
      const stats = await this.cacheManager.getStats();
      analytics[type] = {
        totalRequests: stats.hits + stats.misses,
        cacheHits: stats.hits || 0,
        cacheMisses: stats.misses || 0,
        hitRate: stats.hitRate || 0,
        averageResponseTime: 0, // Not available in current stats
        popularKeys: [], // Not available in current stats
        memoryUsage: 0, // Not available in current stats
        evictionCount: 0, // Not available in current stats
      };
    }

    return analytics;
  }

  /**
   * Invalidate cache when property data updates
   */
  async invalidateCacheOnPropertyUpdate(propertyId: string, updateType: string): Promise<void> {
    try {
      this.logger.debug(`Invalidating cache for property ${propertyId} due to ${updateType}`);

      // Invalidate all related caches
      await Promise.all([
        this.scoringEngine.invalidateScoreCache(propertyId, updateType),
        this.recommendationService.invalidateRecommendationCache(propertyId),
        this.cacheManager.deleteByTags(['property', propertyId]),
      ]);

      // Track cache invalidation
      await this.trackCacheInvalidation(propertyId, updateType);

    } catch (error) {
      this.logger.error(`Failed to invalidate cache for property ${propertyId}:`, error);
    }
  }

  /**
   * Perform cache maintenance operations
   */
  @Cron(CronExpression.EVERY_HOUR)
  async performCacheMaintenance(): Promise<void> {
    try {
      this.logger.debug('Performing cache maintenance');

      // Clean expired entries - try to use available method
      try {
        // Try to call cleanup if it exists, otherwise skip
        if (typeof (this.cacheManager as any).cleanup === 'function') {
          await (this.cacheManager as any).cleanup();
        }
      } catch (error) {
        this.logger.warn('Cache cleanup not available:', error.message);
      }

      // Update cache analytics
      await this.updateCacheAnalytics();

      // Check cache health
      await this.checkCacheHealth();

    } catch (error) {
      this.logger.error('Cache maintenance failed:', error);
    }
  }

  /**
   * Get cache warming job status
   */
  getCacheWarmingJobStatus(jobId: string): CacheWarmingJob | null {
    return this.warmingJobs.get(jobId) || null;
  }

  /**
   * Get all active cache warming jobs
   */
  getActiveCacheWarmingJobs(): CacheWarmingJob[] {
    return Array.from(this.warmingJobs.values()).filter(
      job => job.status === 'pending' || job.status === 'running'
    );
  }

  // Private helper methods

  private async executeCacheWarmingJob(jobId: string): Promise<void> {
    const job = this.warmingJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      job.startedAt = new Date();

      const totalProperties = job.propertyIds.length;
      let processedCount = 0;

      // Process properties in batches
      for (let i = 0; i < totalProperties; i += this.CACHE_WARMING_BATCH_SIZE) {
        const batch = job.propertyIds.slice(i, i + this.CACHE_WARMING_BATCH_SIZE);
        
        await Promise.all(batch.map(async (propertyId) => {
          try {
            switch (job.type) {
              case 'scores':
                await this.scoringEngine.calculateScore(propertyId);
                break;
              case 'recommendations':
                await this.recommendationService.findSimilarProperties(propertyId, { limit: 10 });
                break;
              case 'embeddings':
                const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
                if (property) {
                  await this.embeddingService.storePropertyEmbedding(propertyId, '', {});
                }
                break;
            }
            processedCount++;
          } catch (error) {
            this.logger.error(`Failed to warm cache for property ${propertyId}:`, error);
          }
        }));

        // Update progress
        job.progress = processedCount / totalProperties;

        // Add delay between batches to avoid overwhelming the system
        if (i + this.CACHE_WARMING_BATCH_SIZE < totalProperties) {
          await new Promise(resolve => setTimeout(resolve, this.CACHE_WARMING_DELAY));
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 1;

      this.logger.log(`Cache warming job ${jobId} completed: ${processedCount}/${totalProperties} properties`);

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();

      this.logger.error(`Cache warming job ${jobId} failed:`, error);
    }
  }

  private async getPopularProperties(): Promise<{ id: string; viewCount: number }[]> {
    // This would integrate with analytics to get popular properties
    // For now, return properties with recent activity
    const recentProperties = await this.prisma.property.findMany({
      select: { id: true },
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      take: this.POPULAR_PROPERTIES_LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    return recentProperties.map(p => ({ id: p.id, viewCount: 1 }));
  }

  private async initializeCacheAnalytics(): Promise<void> {
    const cacheTypes = ['scores', 'recommendations', 'embeddings', 'search'];
    
    for (const type of cacheTypes) {
      this.cacheAnalytics.set(type, {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        averageResponseTime: 0,
        popularKeys: [],
        memoryUsage: 0,
        evictionCount: 0,
      });
    }
  }

  private async updateCacheAnalytics(): Promise<void> {
    // Update analytics from cache manager stats
    const analytics = await this.getCacheAnalytics();
    
    for (const [type, stats] of Object.entries(analytics)) {
      this.cacheAnalytics.set(type, stats);
    }
  }

  private async checkCacheHealth(): Promise<void> {
    const analytics = await this.getCacheAnalytics();
    
    for (const [type, stats] of Object.entries(analytics)) {
      // Alert if hit rate is too low
      if (stats.hitRate < 0.7) {
        this.logger.warn(`Low cache hit rate for ${type}: ${(stats.hitRate * 100).toFixed(1)}%`);
      }
      
      // Alert if memory usage is too high
      if (stats.memoryUsage > 1024 * 1024 * 1024) { // 1GB
        this.logger.warn(`High memory usage for ${type} cache: ${(stats.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
      }
    }
  }

  private async trackCacheInvalidation(propertyId: string, updateType: string): Promise<void> {
    // Track cache invalidation events for analytics
    this.logger.debug(`Cache invalidated for property ${propertyId}: ${updateType}`);
  }

  private generateJobId(): string {
    return `cache_warm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
