/**
 * Analytics Tracking Service
 * Tracks all AI usage, searches, and user interactions for analytics
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';

interface AIUsageMetrics {
  userId?: string;
  serviceType: string;
  operation: string;
  model?: string;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  cost?: number;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

interface SearchAnalytics {
  userId?: string;
  sessionId?: string;
  query: string;
  searchType: string;
  filters?: any;
  extractedCriteria?: any;
  resultsCount: number;
  responseTimeMs: number;
  clickedPropertyIds?: string[];
  favoritedPropertyIds?: string[];
  conversion?: boolean;
}

interface RecommendationFeedback {
  userId: string;
  sourcePropertyId: string;
  recommendedPropertyId: string;
  rating: number;
  helpful: boolean;
  comments?: string;
  issues?: string[];
  similarityScore?: number;
}

@Injectable()
export class AnalyticsTrackingService {
  private readonly logger = new Logger(AnalyticsTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track AI service usage
   */
  async trackAIUsage(metrics: AIUsageMetrics): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO ai_usage_metrics (
          user_id, service_type, operation, model,
          total_tokens, prompt_tokens, completion_tokens,
          cost, latency_ms, success, error_message, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
      `, [
        metrics.userId || null,
        metrics.serviceType,
        metrics.operation,
        metrics.model || null,
        metrics.totalTokens || 0,
        metrics.promptTokens || 0,
        metrics.completionTokens || 0,
        metrics.cost || 0,
        metrics.latencyMs || 0,
        metrics.success,
        metrics.errorMessage || null,
        metrics.metadata ? JSON.stringify(metrics.metadata) : null
      ]);
    } catch (error) {
      this.logger.error('Failed to track AI usage:', error);
    }
  }

  /**
   * Track search analytics
   */
  async trackSearch(analytics: SearchAnalytics): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO search_analytics (
          user_id, session_id, query, search_type,
          filters, extracted_criteria, results_count,
          response_time_ms, clicked_property_ids,
          favorited_property_ids, conversion
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `, [
        analytics.userId || null,
        analytics.sessionId || null,
        analytics.query,
        analytics.searchType,
        analytics.filters ? JSON.stringify(analytics.filters) : null,
        analytics.extractedCriteria ? JSON.stringify(analytics.extractedCriteria) : null,
        analytics.resultsCount,
        analytics.responseTimeMs,
        analytics.clickedPropertyIds || [],
        analytics.favoritedPropertyIds || [],
        analytics.conversion || false
      ]);
    } catch (error) {
      this.logger.error('Failed to track search:', error);
    }
  }

  /**
   * Store recommendation feedback
   */
  async storeRecommendationFeedback(feedback: RecommendationFeedback): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO recommendation_feedback (
          user_id, source_property_id, recommended_property_id,
          rating, helpful, comments, issues, similarity_score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `, [
        feedback.userId,
        feedback.sourcePropertyId,
        feedback.recommendedPropertyId,
        feedback.rating,
        feedback.helpful,
        feedback.comments || null,
        feedback.issues || [],
        feedback.similarityScore || null
      ]);
    } catch (error) {
      this.logger.error('Failed to store recommendation feedback:', error);
    }
  }

  /**
   * Track property view analytics
   */
  async trackPropertyView(data: {
    propertyId: string;
    userId?: string;
    sessionId?: string;
    referrer?: string;
    referrerQuery?: string;
    timeSpentSeconds?: number;
    actionsTaken?: string[];
    scoreAtView?: number;
    leftVia?: string;
  }): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO property_view_analytics (
          property_id, user_id, session_id, referrer,
          referrer_query, time_spent_seconds, actions_taken,
          score_at_view, left_via
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `, [
        data.propertyId,
        data.userId || null,
        data.sessionId || null,
        data.referrer || null,
        data.referrerQuery || null,
        data.timeSpentSeconds || 0,
        data.actionsTaken ? JSON.stringify(data.actionsTaken) : null,
        data.scoreAtView || null,
        data.leftVia || null
      ]);
    } catch (error) {
      this.logger.error('Failed to track property view:', error);
    }
  }

  /**
   * Track embedding generation
   */
  async trackEmbeddingGeneration(data: {
    entityType: string;
    entityId: string;
    textLength: number;
    model: string;
    dimensions: number;
    tokensUsed: number;
    cost: number;
    generationTimeMs: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO embedding_generation_log (
          entity_type, entity_id, text_length, model,
          dimensions, tokens_used, cost, generation_time_ms,
          success, error_message
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
      `, [
        data.entityType,
        data.entityId,
        data.textLength,
        data.model,
        data.dimensions,
        data.tokensUsed,
        data.cost,
        data.generationTimeMs,
        data.success,
        data.errorMessage || null
      ]);
    } catch (error) {
      this.logger.error('Failed to track embedding generation:', error);
    }
  }

  /**
   * Track cache performance
   */
  async trackCacheMetric(data: {
    cacheKeyHash: string;
    serviceType: string;
    hit: boolean;
    responseTimeMs: number;
    cachedDataAgeSeconds?: number;
  }): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO ai_cache_metrics (
          cache_key_hash, service_type, hit,
          response_time_ms, cached_data_age_seconds
        ) VALUES (
          $1, $2, $3, $4, $5
        )
      `, [
        data.cacheKeyHash,
        data.serviceType,
        data.hit,
        data.responseTimeMs,
        data.cachedDataAgeSeconds || null
      ]);
    } catch (error) {
      this.logger.error('Failed to track cache metric:', error);
    }
  }

  /**
   * Create performance alert
   */
  async createAlert(data: {
    alertType: string;
    severity: string;
    serviceType?: string;
    message: string;
    metadata?: any;
  }): Promise<string> {
    try {
      const result = await this.prisma.$executeRawUnsafe(`
        INSERT INTO ai_performance_alerts (
          alert_type, severity, service_type, message, metadata
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING id
      `, [
        data.alertType,
        data.severity,
        data.serviceType || null,
        data.message,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]);
      
      return (result as any)[0]?.id;
    } catch (error) {
      this.logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Get AI usage summary for period
   */
  async getUsageSummary(startDate: Date, endDate: Date, serviceType?: string): Promise<any> {
    try {
      const result = await this.prisma.$executeRawUnsafe(`
        SELECT 
          service_type,
          COUNT(*) as request_count,
          SUM(total_tokens) as total_tokens,
          SUM(cost) as total_cost,
          AVG(latency_ms) as avg_latency_ms,
          SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as error_count
        FROM ai_usage_metrics
        WHERE created_at BETWEEN $1 AND $2
          ${serviceType ? 'AND service_type = $3' : ''}
        GROUP BY service_type
        ORDER BY total_cost DESC
      `, serviceType ? [startDate, endDate, serviceType] : [startDate, endDate]);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get usage summary:', error);
      return [];
    }
  }

  /**
   * Get top search queries
   */
  async getTopSearchQueries(limit: number = 100, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const result = await this.prisma.$executeRawUnsafe(`
        SELECT 
          query,
          COUNT(*) as search_count,
          AVG(results_count) as avg_results,
          AVG(response_time_ms) as avg_response_time_ms,
          SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END) as conversion_count,
          (SUM(CASE WHEN conversion = true THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100) as conversion_rate
        FROM search_analytics
        WHERE created_at >= $1
        GROUP BY query
        HAVING COUNT(*) >= 3
        ORDER BY search_count DESC
        LIMIT $2
      `, [startDate, limit]);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get top search queries:', error);
      return [];
    }
  }

  /**
   * Get recommendation accuracy metrics
   */
  async getRecommendationAccuracy(): Promise<any> {
    try {
      const result = await this.prisma.$executeRawUnsafe(`
        SELECT 
          source_property_id,
          COUNT(*) as total_recommendations,
          AVG(rating) as avg_rating,
          SUM(CASE WHEN helpful = true THEN 1 ELSE 0 END) as helpful_count,
          (SUM(CASE WHEN helpful = true THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100) as helpful_percentage,
          AVG(similarity_score) as avg_similarity_score
        FROM recommendation_feedback
        GROUP BY source_property_id
        ORDER BY total_recommendations DESC
        LIMIT 100
      `);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get recommendation accuracy:', error);
      return [];
    }
  }

  /**
   * Get search conversion funnel
   */
  async getSearchConversionFunnel(days: number = 7): Promise<any> {
    try {
      const result = await this.prisma.$executeRawUnsafe(`
        SELECT * FROM get_search_conversion_funnel($1)
      `, [days]);
      
      return result?.[0] || null;
    } catch (error) {
      this.logger.error('Failed to get search conversion funnel:', error);
      return null;
    }
  }
}

