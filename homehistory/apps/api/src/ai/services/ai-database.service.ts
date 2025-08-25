/**
 * AI Database Service - Database operations for AI module
 * Handles all AI-related database operations with Supabase integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
import { SupabaseService } from '../../modules/supabase/supabase.service';

import { 
  AIUsageMetrics, 
  PropertyAnalysisResponse, 
  DocumentAnalysisResponse,
  EmbeddingResponse,
  BatchProcessingJob,
  AIJobStatus,
  toPrismaJson
} from '../interfaces/ai.interfaces';

@Injectable()
export class AIDatabaseService {
  private readonly logger = new Logger(AIDatabaseService.name);

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  /**
   * Store AI usage metrics
   */
  async storeUsageMetrics(metrics: AIUsageMetrics): Promise<void> {
    try {
      await this.prisma.aIUsageMetric.create({
        data: {
          requestId: metrics.requestId,
          userId: metrics.userId,
          propertyId: metrics.propertyId,
          model: metrics.model,
          operation: metrics.operation,
          promptTokens: metrics.promptTokens,
          completionTokens: metrics.completionTokens,
          totalTokens: metrics.totalTokens,
          cost: metrics.cost,
          latency: metrics.latency,
          status: 'success',
          metadata: toPrismaJson(metrics),
        },
      });

      this.logger.debug(`Stored usage metrics: ${metrics.requestId}`);
    } catch (error) {
      this.logger.error('Failed to store usage metrics:', error);
      // Don't throw - metrics storage shouldn't break AI operations
    }
  }

  /**
   * Store property analysis result
   */
  async storeAnalysisResult(
    result: PropertyAnalysisResponse,
    userId: string,
    ttl: number = 3600,
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);

      await this.prisma.aIAnalysisResult.create({
        data: {
          requestId: result.requestId,
          userId,
          propertyId: result.propertyId,
          analysisType: result.analysisType,
          model: 'gpt-4', // TODO: Get from result
          summary: result.summary,
          structuredData: toPrismaJson({
            keyInsights: result.keyInsights,
            riskFactors: result.riskFactors,
            marketComparables: result.marketComparables,
            valuation: result.valuation,
            confidence: result.confidence,
            sources: result.sources,
          }),
          confidence: result.confidence,
          cached: result.cached,
          expiresAt,
        },
      });

      this.logger.debug(`Stored analysis result: ${result.requestId}`);
    } catch (error) {
      this.logger.error('Failed to store analysis result:', error);
    }
  }

  /**
   * Store document analysis result
   */
  async storeDocumentAnalysis(
    result: DocumentAnalysisResponse,
    userId: string,
    ttl: number = 3600,
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);

      // Update existing document analysis if it exists
      const existing = await this.prisma.documentAIAnalysis.findFirst({
        where: {
          documentId: result.documentId,
        },
      });

      if (existing) {
        await this.prisma.documentAIAnalysis.update({
          where: { id: existing.id },
          data: {
            extractedText: result.summary,
            structuredData: toPrismaJson({
              structuredData: result.structuredData,
              issues: result.issues,
              compliance: result.compliance,
              entities: result.entities,
            }),
            issues: toPrismaJson(result.issues),
            compliance: toPrismaJson(result.compliance),
            entities: toPrismaJson(result.entities),
            confidence: result.confidence,
            processingTime: result.processingTime,
          },
        });
      } else {
        await this.prisma.documentAIAnalysis.create({
          data: {
            documentId: result.documentId,
            extractedText: result.summary,
            structuredData: toPrismaJson({
              structuredData: result.structuredData,
              issues: result.issues,
              compliance: result.compliance,
              entities: result.entities,
            }),
            issues: toPrismaJson(result.issues),
            compliance: toPrismaJson(result.compliance),
            entities: toPrismaJson(result.entities),
            confidence: result.confidence,
            processingTime: result.processingTime,
            model: 'gpt-4', // Default model
          },
        });
      }

      this.logger.debug(`Stored document analysis: ${result.documentId}`);
    } catch (error) {
      this.logger.error('Failed to store document analysis:', error);
    }
  }

  async updateDocumentAnalysis(
    analysisId: string,
    result: DocumentAnalysisResponse,
  ): Promise<void> {
    try {
      await this.prisma.documentAIAnalysis.update({
        where: { id: analysisId },
        data: {
          extractedText: result.summary,
          structuredData: toPrismaJson(result.structuredData),
          issues: toPrismaJson(result.issues),
          compliance: toPrismaJson(result.compliance),
          entities: toPrismaJson(result.entities),
          confidence: result.confidence,
          processingTime: result.processingTime,
        },
      });
    } catch (error) {
      this.logger.error('Failed to update document analysis:', error);
      throw error;
    }
  }

  async createDocumentAnalysis(
    documentId: string,
    analysisType: string,
  ): Promise<string> {
    try {
      const analysis = await this.prisma.documentAIAnalysis.create({
        data: {
          documentId,
          model: 'gpt-4',
          structuredData: toPrismaJson({}),
          issues: toPrismaJson([]),
          compliance: toPrismaJson([]),
          entities: toPrismaJson([]),
        },
      });
      return analysis.id;
    } catch (error) {
      this.logger.error('Failed to create document analysis:', error);
      throw error;
    }
  }

  /**
   * Store property embedding
   */
  async storePropertyEmbedding(
    propertyId: string,
    embedding: EmbeddingResponse,
    content: string,
  ): Promise<void> {
    try {
      await this.prisma.propertyEmbedding.upsert({
        where: { propertyId },
        update: {
          content,
          embedding: embedding.embedding,
          model: embedding.model,
          dimensions: embedding.dimensions,
          tokens: embedding.tokens,
          cost: embedding.cost,
        },
        create: {
          propertyId,
          content,
          embedding: embedding.embedding,
          model: embedding.model,
          dimensions: embedding.dimensions,
          tokens: embedding.tokens,
          cost: embedding.cost,
        },
      });

      this.logger.debug(`Stored property embedding: ${propertyId}`);
    } catch (error) {
      this.logger.error(`Failed to store property embedding for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Get property embedding
   */
  async getPropertyEmbedding(propertyId: string): Promise<number[] | null> {
    try {
      const result = await this.prisma.propertyEmbedding.findUnique({
        where: { propertyId },
        select: { embedding: true },
      });

      return result?.embedding as number[] || null;
    } catch (error) {
      this.logger.error(`Failed to get property embedding for ${propertyId}:`, error);
      return null;
    }
  }

  /**
   * Store AI cache entry
   */
  async storeCacheEntry<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
      dataType?: string;
    } = {},
  ): Promise<void> {
    try {
      const { ttl = 3600, tags = [], dataType = 'generic' } = options;
      const hashedKey = this.hashKey(key);
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const serialized = JSON.stringify(data);
      const size = Buffer.byteLength(serialized, 'utf8');

      await this.prisma.aICache.upsert({
        where: { hashedKey },
        update: {
          data: toPrismaJson(data),
          dataType,
          size,
          hits: { increment: 1 },
          expiresAt,
          lastAccessedAt: new Date(),
        },
        create: {
          cacheKey: key,
          hashedKey,
          data: toPrismaJson(data),
          dataType,
          tags,
          size,
          ttl,
          expiresAt,
        },
      });

      this.logger.debug(`Stored cache entry: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to store cache entry for ${key}:`, error);
    }
  }

  /**
   * Get AI cache entry
   */
  async getCacheEntry<T>(key: string): Promise<T | null> {
    try {
      const hashedKey = this.hashKey(key);
      
      const entry = await this.prisma.aICache.findUnique({
        where: { hashedKey },
      });

      if (!entry || entry.expiresAt < new Date()) {
        if (entry && entry.expiresAt < new Date()) {
          // Clean up expired entry
          await this.prisma.aICache.delete({ where: { hashedKey } });
        }
        return null;
      }

      // Update access statistics
      await this.prisma.aICache.update({
        where: { hashedKey },
        data: {
          hits: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });

      return entry.data as T;
    } catch (error) {
      this.logger.error(`Failed to get cache entry for ${key}:`, error);
      return null;
    }
  }

  /**
   * Create batch processing job
   */
  async createBatchJob(job: BatchProcessingJob, userId?: string): Promise<void> {
    try {
      await this.prisma.aIBatchJob.create({
        data: {
          jobId: job.jobId,
          jobType: job.type,
          status: this.mapJobStatus(job.status),
          userId,
          items: job.items,
          results: job.results,
          progress: job.progress,
          metadata: toPrismaJson(job),
        },
      });

      this.logger.debug(`Created batch job: ${job.jobId}`);
    } catch (error) {
      this.logger.error(`Failed to create batch job: ${job.jobId}`, error);
      throw error;
    }
  }

  /**
   * Update batch processing job
   */
  async updateBatchJob(jobId: string, updates: Partial<BatchProcessingJob>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.status) updateData.status = this.mapJobStatus(updates.status);
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.results) updateData.results = updates.results;
      if (updates.error) updateData.errorMessage = updates.error;
      if (updates.completedAt) updateData.completedAt = updates.completedAt;

      await this.prisma.aIBatchJob.update({
        where: { jobId },
        data: updateData,
      });

      this.logger.debug(`Updated batch job: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to update batch job: ${jobId}`, error);
    }
  }

  /**
   * Get batch processing job
   */
  async getBatchJob(jobId: string): Promise<BatchProcessingJob | null> {
    try {
      const job = await this.prisma.aIBatchJob.findUnique({
        where: { jobId },
      });

      if (!job) return null;

      return {
        jobId: job.jobId,
        type: job.jobType as any,
        status: this.mapJobStatusFromDb(job.status),
        items: job.items as any[],
        results: job.results as any[],
        progress: job.progress,
        startedAt: job.startedAt || undefined,
        completedAt: job.completedAt || undefined,
        error: job.errorMessage || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get batch job: ${jobId}`, error);
      return null;
    }
  }

  /**
   * Store property AI scores
   */
  async storePropertyScores(
    propertyId: string,
    scores: {
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
    },
  ): Promise<void> {
    try {
      await this.prisma.propertyAIScore.upsert({
        where: { propertyId },
        update: {
          ...scores,
          lastAnalyzedAt: new Date(),
        },
        create: {
          propertyId,
          ...scores,
        },
      });

      this.logger.debug(`Stored property AI scores: ${propertyId}`);
    } catch (error) {
      this.logger.error(`Failed to store property scores for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(
    userId?: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageLatency: number;
    modelBreakdown: Record<string, any>;
  }> {
    try {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeframe) {
        case 'hour': cutoff.setHours(now.getHours() - 1); break;
        case 'day': cutoff.setDate(now.getDate() - 1); break;
        case 'week': cutoff.setDate(now.getDate() - 7); break;
        case 'month': cutoff.setMonth(now.getMonth() - 1); break;
      }

      const whereClause: any = {
        createdAt: { gte: cutoff },
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const [totalStats, modelBreakdown] = await Promise.all([
        this.prisma.aIUsageMetric.aggregate({
          where: whereClause,
          _count: { id: true },
          _sum: { 
            totalTokens: true, 
            cost: true,
          },
          _avg: { latency: true },
        }),
        this.prisma.aIUsageMetric.groupBy({
          by: ['model'],
          where: whereClause,
          _count: { id: true },
          _sum: { 
            totalTokens: true, 
            cost: true,
          },
        }),
      ]);

      const modelBreakdownObj = modelBreakdown.reduce((acc: Record<string, any>, item) => {
        acc[item.model] = {
          requests: item._count.id,
          tokens: item._sum.totalTokens || 0,
          cost: Number(item._sum.cost || 0),
        };
        return acc;
      }, {} as Record<string, any>);

      return {
        totalRequests: totalStats._count.id,
        totalTokens: totalStats._sum.totalTokens || 0,
        totalCost: Number(totalStats._sum.cost || 0),
        averageLatency: totalStats._avg.latency || 0,
        modelBreakdown: modelBreakdownObj,
      };
    } catch (error) {
      this.logger.error('Failed to get usage analytics:', error);
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageLatency: 0,
        modelBreakdown: {},
      };
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    try {
      const result = await this.prisma.aICache.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.debug(`Cleaned up ${result.count} expired cache entries`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    typeBreakdown: Record<string, number>;
  }> {
    try {
      const [totalStats, typeBreakdown] = await Promise.all([
        this.prisma.aICache.aggregate({
          _count: { id: true },
          _sum: { size: true, hits: true },
        }),
        this.prisma.aICache.groupBy({
          by: ['dataType'],
          _count: { id: true },
        }),
      ]);

      const typeBreakdownObj = typeBreakdown.reduce((acc: Record<string, number>, item) => {
        acc[item.dataType] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      // Calculate hit rate (this is simplified - in reality you'd need miss tracking)
      const hitRate = totalStats._sum.hits ? totalStats._sum.hits / totalStats._count.id : 0;

      return {
        totalEntries: totalStats._count.id,
        totalSize: totalStats._sum.size || 0,
        hitRate,
        typeBreakdown: typeBreakdownObj,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        typeBreakdown: {},
      };
    }
  }

  // Private helper methods

  private hashKey(key: string): string {
    return require('crypto').createHash('sha256').update(key).digest('hex');
  }

  private mapJobStatus(status: BatchProcessingJob['status']): AIJobStatus {
    const statusMap: Record<BatchProcessingJob['status'], AIJobStatus> = {
      pending: AIJobStatus.PENDING,
      processing: AIJobStatus.PROCESSING,
      completed: AIJobStatus.COMPLETED,
      failed: AIJobStatus.FAILED,
    };
    return statusMap[status] || AIJobStatus.PENDING;
  }

  private mapJobStatusFromDb(status: any): BatchProcessingJob['status'] {
    const statusMap: Record<string, BatchProcessingJob['status']> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'failed', // Map cancelled to failed for compatibility
    };
    return statusMap[status] || 'pending';
  }
}
