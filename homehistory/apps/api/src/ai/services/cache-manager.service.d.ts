/**
 * Cache Manager Service - AI response caching with SHA-256 hashing
 * High-performance caching for AI operations with intelligent invalidation
 */
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheEntry, CacheOptions } from '../interfaces/ai.interfaces';
import { PrismaService } from '../../modules/database/prisma.service';
export declare class CacheManagerService implements OnModuleInit {
    private configService;
    private prisma;
    private readonly logger;
    private cache;
    private readonly DEFAULT_TTL;
    private readonly MAX_CACHE_SIZE;
    private readonly COMPRESSION_THRESHOLD;
    private readonly gzipAsync;
    private readonly gunzipAsync;
    private stats;
    constructor(configService: ConfigService, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    /**
     * Get cached value by key
     */
    get<T = any>(key: string): Promise<T | null>;
    /**
     * Set cached value with options
     */
    set<T = any>(key: string, value: T, options?: CacheOptions): Promise<void>;
    /**
     * Delete cached value
     */
    delete(key: string): Promise<boolean>;
    /**
     * Delete all cached values with specific tags
     */
    deleteByTags(tags: string[]): Promise<number>;
    /**
     * Clear all cached values
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        entries: number;
        hits: number;
        misses: number;
        hitRate: number;
        totalSize: string;
        averageSize: string;
        stats: typeof this.stats;
    };
    /**
     * Get all cache keys with optional pattern matching
     */
    getKeys(pattern?: string): string[];
    /**
     * Get cache entries by tag
     */
    getByTag(tag: string): CacheEntry[];
    /**
     * Check if key exists in cache
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get TTL for a key (in seconds)
     */
    getTTL(key: string): Promise<number>;
    /**
     * Extend TTL for a key
     */
    expire(key: string, ttl: number): Promise<boolean>;
    /**
     * Get cache health information
     */
    getHealth(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        memoryUsage: string;
        hitRate: number;
        errorRate: number;
        avgResponseTime: number;
    };
    private hashKey;
    private hashValue;
    private isExpired;
    private evictIfNeeded;
    private cleanup;
    private formatBytes;
}
//# sourceMappingURL=cache-manager.service.d.ts.map
