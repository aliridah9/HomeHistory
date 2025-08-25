/**
 * AI Database Service - Database operations for AI module
 * Handles all AI-related database operations with Supabase integration
 */
import { PrismaService } from '../../modules/database/prisma.service';
import { SupabaseService } from '../../modules/supabase/supabase.service';
import { AIUsageMetrics, PropertyAnalysisResponse, DocumentAnalysisResponse, EmbeddingResponse, BatchProcessingJob } from '../interfaces/ai.interfaces';
export declare class AIDatabaseService {
    private prisma;
    private supabase;
    private readonly logger;
    constructor(prisma: PrismaService, supabase: SupabaseService);
    /**
     * Store AI usage metrics
     */
    storeUsageMetrics(metrics: AIUsageMetrics): Promise<void>;
    /**
     * Store property analysis result
     */
    storeAnalysisResult(result: PropertyAnalysisResponse, userId: string, ttl?: number): Promise<void>;
    /**
     * Store document analysis result
     */
    storeDocumentAnalysis(result: DocumentAnalysisResponse, userId: string, ttl?: number): Promise<void>;
    updateDocumentAnalysis(analysisId: string, result: DocumentAnalysisResponse): Promise<void>;
    createDocumentAnalysis(documentId: string, analysisType: string): Promise<string>;
    /**
     * Store property embedding
     */
    storePropertyEmbedding(propertyId: string, embedding: EmbeddingResponse, content: string): Promise<void>;
    /**
     * Get property embedding
     */
    getPropertyEmbedding(propertyId: string): Promise<number[] | null>;
    /**
     * Store AI cache entry
     */
    storeCacheEntry<T>(key: string, data: T, options?: {
        ttl?: number;
        tags?: string[];
        dataType?: string;
    }): Promise<void>;
    /**
     * Get AI cache entry
     */
    getCacheEntry<T>(key: string): Promise<T | null>;
    /**
     * Create batch processing job
     */
    createBatchJob(job: BatchProcessingJob, userId?: string): Promise<void>;
    /**
     * Update batch processing job
     */
    updateBatchJob(jobId: string, updates: Partial<BatchProcessingJob>): Promise<void>;
    /**
     * Get batch processing job
     */
    getBatchJob(jobId: string): Promise<BatchProcessingJob | null>;
    /**
     * Store property AI scores
     */
    storePropertyScores(propertyId: string, scores: {
        overallScore: number;
        qualityScore: number;
        safetyScore: number;
        valueScore: number;
        locationScore: number;
        investmentScore: number;
        confidence: number;
        model: string;
        methodology: any;
        factors: any;
    }): Promise<void>;
    /**
     * Get usage analytics
     */
    getUsageAnalytics(userId?: string, timeframe?: 'hour' | 'day' | 'week' | 'month'): Promise<{
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        averageLatency: number;
        modelBreakdown: Record<string, any>;
    }>;
    /**
     * Clean up expired cache entries
     */
    cleanupExpiredCache(): Promise<number>;
    /**
     * Get cache statistics
     */
    getCacheStats(): Promise<{
        totalEntries: number;
        totalSize: number;
        hitRate: number;
        typeBreakdown: Record<string, number>;
    }>;
    private hashKey;
    private mapJobStatus;
    private mapJobStatusFromDb;
}
//# sourceMappingURL=ai-database.service.d.ts.map
