/**
 * Cache Manager Service - AI response caching with SHA-256 hashing
 * High-performance caching for AI operations with intelligent invalidation
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';
import { CacheEntry, CacheOptions } from '../interfaces/ai.interfaces';
import { PrismaService } from '../../modules/database/prisma.service';

// In-memory cache with Redis-like interface for development
// In production, this should be replaced with Redis
interface CacheStore {
  [key: string]: CacheEntry;
}

@Injectable()
export class CacheManagerService implements OnModuleInit {
  private readonly logger = new Logger(CacheManagerService.name);
  private cache: CacheStore = {};
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly MAX_CACHE_SIZE = 1000; // Maximum entries
  private readonly COMPRESSION_THRESHOLD = 1024; // Compress data > 1KB
  
  private readonly gzipAsync = promisify(gzip);
  private readonly gunzipAsync = promisify(gunzip);

  // Cache statistics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalSize: 0,
  };

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
    this.logger.log('Cache Manager Service initialized');
  }

  /**
   * Get cached value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    const hashedKey = this.hashKey(key);
    const entry = this.cache[hashedKey];

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time and hit count
    entry.lastAccessed = new Date();
    entry.hits++;
    this.stats.hits++;

    try {
      // Decompress if needed
      let data = entry.data;
      if (entry.size > this.COMPRESSION_THRESHOLD && Buffer.isBuffer(data)) {
        const decompressed = await this.gunzipAsync(data);
        data = JSON.parse(decompressed.toString());
      }

      return data;
    } catch (error) {
      this.logger.error(`Failed to retrieve cached data for key ${key}:`, error);
      await this.delete(key);
      return null;
    }
  }

  /**
   * Set cached value with options
   */
  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const hashedKey = this.hashKey(key);
    const ttl = options.ttl || this.DEFAULT_TTL;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    try {
      let data: any = value;
      const serialized = JSON.stringify(value);
      let size = Buffer.byteLength(serialized, 'utf8');

      // Compress large data
      if (options.compress !== false && size > this.COMPRESSION_THRESHOLD) {
        const compressed = await this.gzipAsync(serialized);
        data = compressed;
        size = compressed.length;
      }

      const entry: CacheEntry<T> = {
        key: hashedKey,
        data,
        hash: this.hashValue(value),
        createdAt: new Date(),
        expiresAt,
        hits: 0,
        lastAccessed: new Date(),
        size,
        tags: options.tags || [],
      };

      // Remove old entry if exists
      if (this.cache[hashedKey]) {
        this.stats.totalSize -= this.cache[hashedKey].size;
      }

      this.cache[hashedKey] = entry;
      this.stats.totalSize += size;
      this.stats.sets++;

      // Evict if cache is too large
      await this.evictIfNeeded();

      this.logger.debug(`Cached ${key} (${this.formatBytes(size)}, TTL: ${ttl}s)`);

    } catch (error) {
      this.logger.error(`Failed to cache data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    const hashedKey = this.hashKey(key);
    const entry = this.cache[hashedKey];

    if (entry) {
      this.stats.totalSize -= entry.size;
      delete this.cache[hashedKey];
      this.stats.deletes++;
      return true;
    }

    return false;
  }

  /**
   * Delete all cached values with specific tags
   */
  async deleteByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;

    for (const [key, entry] of Object.entries(this.cache)) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.stats.totalSize -= entry.size;
        delete this.cache[key];
        deletedCount++;
      }
    }

    this.stats.deletes += deletedCount;
    this.logger.debug(`Deleted ${deletedCount} entries with tags: ${tags.join(', ')}`);
    
    return deletedCount;
  }

  /**
   * Clear all cached values
   */
  async clear(): Promise<void> {
    const count = Object.keys(this.cache).length;
    this.cache = {};
    this.stats.totalSize = 0;
    this.stats.deletes += count;
    
    this.logger.log(`Cleared ${count} cached entries`);
  }

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
    stats: {
      hits: number;
      misses: number;
      sets: number;
      deletes: number;
      evictions: number;
      totalSize: number;
    };
  } {
    const entries = Object.keys(this.cache).length;
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    const averageSize = entries > 0 ? this.stats.totalSize / entries : 0;

    return {
      entries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSize: this.formatBytes(this.stats.totalSize),
      averageSize: this.formatBytes(averageSize),
      stats: { ...this.stats },
    };
  }

  /**
   * Get all cache keys with optional pattern matching
   */
  getKeys(pattern?: string): string[] {
    const keys = Object.values(this.cache).map(entry => entry.key);
    
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return keys.filter(key => regex.test(key));
    }
    
    return keys;
  }

  /**
   * Get cache entries by tag
   */
  getByTag(tag: string): CacheEntry[] {
    return Object.values(this.cache).filter(entry => entry.tags.includes(tag));
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const hashedKey = this.hashKey(key);
    const entry = this.cache[hashedKey];
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Get TTL for a key (in seconds)
   */
  async getTTL(key: string): Promise<number> {
    const hashedKey = this.hashKey(key);
    const entry = this.cache[hashedKey];
    
    if (!entry || this.isExpired(entry)) {
      return -1;
    }
    
    return Math.ceil((entry.expiresAt.getTime() - Date.now()) / 1000);
  }

  /**
   * Extend TTL for a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    const hashedKey = this.hashKey(key);
    const entry = this.cache[hashedKey];
    
    if (!entry || this.isExpired(entry)) {
      return false;
    }
    
    entry.expiresAt = new Date(Date.now() + ttl * 1000);
    return true;
  }

  /**
   * Get cache health information
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    memoryUsage: string;
    hitRate: number;
    errorRate: number;
    avgResponseTime: number;
  } {
    const stats = this.getStats();
    const memoryUsageBytes = this.stats.totalSize;
    const maxMemory = 100 * 1024 * 1024; // 100MB limit
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (memoryUsageBytes > maxMemory * 0.9) {
      status = 'unhealthy';
    } else if (memoryUsageBytes > maxMemory * 0.7 || stats.hitRate < 0.5) {
      status = 'degraded';
    }

    return {
      status,
      memoryUsage: this.formatBytes(memoryUsageBytes),
      hitRate: stats.hitRate,
      errorRate: 0, // TODO: Track errors
      avgResponseTime: 0, // TODO: Track response times
    };
  }

  // Private helper methods

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private hashValue(value: any): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt < new Date();
  }

  private async evictIfNeeded(): Promise<void> {
    const entries = Object.values(this.cache);
    
    if (entries.length <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Sort by last accessed time (LRU eviction)
    entries.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
    
    // Remove oldest 20% of entries
    const toRemove = Math.ceil(entries.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      const entry = entries[i];
      this.stats.totalSize -= entry.size;
      delete this.cache[entry.key];
      this.stats.evictions++;
    }

    this.logger.debug(`Evicted ${toRemove} entries (LRU)`);
  }

  private cleanup(): void {
    const now = new Date();
    let expiredCount = 0;

    for (const [key, entry] of Object.entries(this.cache)) {
      if (entry.expiresAt < now) {
        this.stats.totalSize -= entry.size;
        delete this.cache[key];
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.stats.deletes += expiredCount;
      this.logger.debug(`Cleaned up ${expiredCount} expired entries`);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
