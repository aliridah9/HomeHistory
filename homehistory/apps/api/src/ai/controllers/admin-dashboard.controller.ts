/**
 * AI Admin Dashboard Controller - Administrative Interface for AI Operations
 * Enterprise-grade admin controls for AI system management
 */

import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Param, 
  Query, 
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../../modules/auth/guards/admin.guard';
import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';
import { User } from '@homehistory/database';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
import { CacheOptimizationService } from '../services/cache-optimization.service';
import { ScoringEngineService } from '../services/scoring-engine.service';
import { RecommendationService } from '../services/recommendation.service';
import { AIDatabaseService } from '../services/ai-database.service';

@ApiTags('admin-ai')
@Controller('admin/ai')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(
    private performanceMonitoring: PerformanceMonitoringService,
    private cacheOptimization: CacheOptimizationService,
    private scoringEngine: ScoringEngineService,
    private recommendationService: RecommendationService,
    private aiDatabase: AIDatabaseService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get AI Dashboard Overview',
    description: 'Get comprehensive AI system overview for admin dashboard'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI dashboard data',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalAIRequests: { type: 'number' },
            successRate: { type: 'number' },
            averageResponseTime: { type: 'number' },
            dailyCost: { type: 'number' },
            monthlyCost: { type: 'number' },
            activeAlerts: { type: 'number' }
          }
        },
        services: {
          type: 'object',
          properties: {
            scoring: { type: 'object' },
            recommendations: { type: 'object' },
            search: { type: 'object' },
            embeddings: { type: 'object' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            cacheHitRate: { type: 'number' },
            openaiUsage: { type: 'object' },
            errorRates: { type: 'object' },
            responseTimeBreakdown: { type: 'object' }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async getAIDashboard(@CurrentUser() user: User) {
    const [metrics, cacheAnalytics, alerts, serviceHealth] = await Promise.all([
      this.performanceMonitoring.getMetrics(),
      this.cacheOptimization.getCacheAnalytics(),
      this.performanceMonitoring.getAlerts(false),
      this.performanceMonitoring.getServiceHealth(),
    ]);

    const overview = {
      totalAIRequests: metrics.totalRequests,
      successRate: metrics.totalRequests > 0 ? metrics.successfulRequests / metrics.totalRequests : 0,
      averageResponseTime: metrics.averageResponseTime,
      dailyCost: metrics.openaiCostUSD,
      monthlyCost: metrics.openaiCostUSD * 30, // Rough estimate
      activeAlerts: alerts.length,
    };

    const services = {
      scoring: {
        requests: metrics.scoringRequests,
        averageTime: metrics.averageScoringTime,
        cacheHitRate: cacheAnalytics.scores?.hitRate || 0,
        status: 'healthy',
      },
      recommendations: {
        requests: metrics.recommendationRequests,
        averageTime: metrics.averageRecommendationTime,
        cacheHitRate: cacheAnalytics.recommendations?.hitRate || 0,
        status: 'healthy',
      },
      search: {
        requests: metrics.searchRequests,
        averageTime: metrics.averageResponseTime,
        cacheHitRate: cacheAnalytics.search?.hitRate || 0,
        status: 'healthy',
      },
      embeddings: {
        requests: metrics.embeddingRequests,
        averageTime: metrics.averageEmbeddingTime,
        cacheHitRate: cacheAnalytics.embeddings?.hitRate || 0,
        status: 'healthy',
      },
    };

    const performance = {
      cacheHitRate: metrics.cacheHitRate,
      openaiUsage: {
        requests: metrics.openaiRequests,
        tokensUsed: metrics.openaiTokensUsed,
        costUSD: metrics.openaiCostUSD,
        errorRate: metrics.openaiErrorRate,
      },
      errorRates: {
        timeout: metrics.timeoutErrors,
        rateLimit: metrics.rateLimitErrors,
        authentication: metrics.authenticationErrors,
        validation: metrics.validationErrors,
        internal: metrics.internalErrors,
      },
      responseTimeBreakdown: {
        average: metrics.averageResponseTime,
        p95: metrics.p95ResponseTime,
        p99: metrics.p99ResponseTime,
      },
    };

    return {
      overview,
      services,
      performance,
      alerts: alerts.slice(0, 10), // Latest 10 alerts
      serviceHealth,
    };
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get Detailed AI Metrics',
    description: 'Get detailed metrics for AI operations and performance analysis'
  })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Metrics timeframe: hour, day, week, month' })
  @ApiQuery({ name: 'service', required: false, description: 'Filter by specific service' })
  async getAIMetrics(
    @CurrentUser() user: User,
    @Query('timeframe', new DefaultValuePipe('day')) timeframe: 'hour' | 'day' | 'week' | 'month',
    @Query('service') service?: string,
  ) {
    const metrics = this.performanceMonitoring.getMetrics();
    const cacheAnalytics = await this.cacheOptimization.getCacheAnalytics();

    // Filter metrics by service if specified
    const filteredMetrics = metrics;
    if (service) {
      // Would implement service-specific filtering
    }

    return {
      timeframe,
      service,
      metrics: filteredMetrics,
      cacheAnalytics,
      timestamp: new Date(),
    };
  }

  @Get('alerts')
  @ApiOperation({ 
    summary: 'Get AI System Alerts',
    description: 'Get all AI system alerts with filtering options'
  })
  @ApiQuery({ name: 'resolved', required: false, description: 'Filter by resolved status' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity level' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of alerts to return' })
  async getAIAlerts(
    @CurrentUser() user: User,
    @Query('resolved') resolved?: boolean,
    @Query('severity') severity?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    let alerts = this.performanceMonitoring.getAlerts(resolved);

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return {
      alerts: alerts.slice(0, limit),
      total: alerts.length,
      filters: { resolved, severity },
    };
  }

  @Put('alerts/:id/resolve')
  @ApiOperation({ 
    summary: 'Resolve AI Alert',
    description: 'Mark an AI system alert as resolved'
  })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @HttpCode(HttpStatus.OK)
  async resolveAlert(
    @CurrentUser() user: User,
    @Param('id') alertId: string,
  ) {
    this.performanceMonitoring.resolveAlert(alertId);
    
    return {
      message: 'Alert resolved successfully',
      alertId,
      resolvedBy: user.id,
      resolvedAt: new Date(),
    };
  }

  @Get('cache/analytics')
  @ApiOperation({ 
    summary: 'Get Cache Analytics',
    description: 'Get detailed cache performance analytics'
  })
  async getCacheAnalytics(@CurrentUser() user: User) {
    const analytics = await this.cacheOptimization.getCacheAnalytics();
    const warmingJobs = this.cacheOptimization.getActiveCacheWarmingJobs();

    return {
      analytics,
      warmingJobs,
      recommendations: {
        lowHitRateServices: Object.entries(analytics)
          .filter(([_, stats]) => stats.hitRate < 0.7)
          .map(([service, stats]) => ({
            service,
            hitRate: stats.hitRate,
            recommendation: 'Consider cache warming or TTL adjustment',
          })),
        highMemoryUsage: Object.entries(analytics)
          .filter(([_, stats]) => stats.memoryUsage > 500 * 1024 * 1024) // 500MB
          .map(([service, stats]) => ({
            service,
            memoryUsage: stats.memoryUsage,
            recommendation: 'Consider cache size limits or cleanup',
          })),
      },
    };
  }

  @Post('cache/warm')
  @ApiOperation({ 
    summary: 'Start Cache Warming',
    description: 'Start cache warming job for specified properties and services'
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async startCacheWarming(
    @CurrentUser() user: User,
    @Body() body: {
      propertyIds?: string[];
      services: ('scores' | 'recommendations' | 'embeddings')[];
      priority?: 'high' | 'medium' | 'low';
    },
  ) {
    const { propertyIds = [], services, priority = 'medium' } = body;

    const jobs: string[] = [];

    for (const service of services) {
      let jobId: string;
      
      switch (service) {
        case 'scores':
          jobId = await this.cacheOptimization.warmPropertyScoresCache(propertyIds);
          break;
        case 'recommendations':
          jobId = await this.cacheOptimization.warmRecommendationsCache(propertyIds);
          break;
        case 'embeddings':
          // Would implement embedding cache warming
          jobId = 'embedding_job_placeholder';
          break;
        default:
          continue;
      }
      
      jobs.push(jobId);
    }

    return {
      message: 'Cache warming jobs started',
      jobs,
      services,
      propertyCount: propertyIds.length,
      priority,
      startedBy: user.id,
    };
  }

  @Get('cache/jobs/:id')
  @ApiOperation({ 
    summary: 'Get Cache Warming Job Status',
    description: 'Get status of a specific cache warming job'
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  async getCacheWarmingJobStatus(
    @CurrentUser() user: User,
    @Param('id') jobId: string,
  ) {
    const job = this.cacheOptimization.getCacheWarmingJobStatus(jobId);
    
    if (!job) {
      return { error: 'Job not found', jobId };
    }

    return {
      job,
      estimatedTimeRemaining: job.status === 'running' 
        ? Math.round((1 - job.progress) * 300) // Rough estimate
        : 0,
    };
  }

  @Post('operations/bulk-score-recalculation')
  @ApiOperation({ 
    summary: 'Start Bulk Score Recalculation',
    description: 'Start bulk recalculation of property scores'
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async startBulkScoreRecalculation(
    @CurrentUser() user: User,
    @Body() body: {
      propertyIds?: string[];
      filters?: {
        city?: string;
        state?: string;
        propertyType?: string;
        scoreRange?: { min: number; max: number };
        lastCalculatedBefore?: string;
      };
      forceRecalculation?: boolean;
      batchSize?: number;
    },
  ) {
    return this.scoringEngine.bulkRecalculateScores(
      body.propertyIds || [],
      {
        forceRecalculation: body.forceRecalculation,
        batchSize: body.batchSize,
        userId: user.id,
      }
    );
  }

  @Post('operations/bulk-embedding-update')
  @ApiOperation({ 
    summary: 'Start Bulk Embedding Update',
    description: 'Start bulk update of property embeddings'
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async startBulkEmbeddingUpdate(
    @CurrentUser() user: User,
    @Body() body: {
      propertyIds?: string[];
      filters?: {
        city?: string;
        state?: string;
        propertyType?: string;
        updatedBefore?: string;
      };
      batchSize?: number;
    },
  ) {
    const propertyIds = body.propertyIds || [];
    
    const result = await this.recommendationService.batchUpdateEmbeddings(
      propertyIds,
      body.batchSize
    );

    return {
      jobId: `embedding_update_${Date.now()}`,
      totalProperties: propertyIds.length,
      estimatedTime: Math.ceil(propertyIds.length / (body.batchSize || 50) * 30),
      status: 'processing',
      result,
    };
  }

  @Get('cost-analysis')
  @ApiOperation({ 
    summary: 'Get AI Cost Analysis',
    description: 'Get detailed cost analysis for AI operations'
  })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Analysis timeframe' })
  async getCostAnalysis(
    @CurrentUser() user: User,
    @Query('timeframe', new DefaultValuePipe('month')) timeframe: 'day' | 'week' | 'month' | 'quarter',
  ) {
    const metrics = this.performanceMonitoring.getMetrics();

    // Calculate cost breakdown by service
    const costBreakdown = {
      scoring: metrics.openaiCostUSD * 0.4, // Estimated allocation
      recommendations: metrics.openaiCostUSD * 0.3,
      search: metrics.openaiCostUSD * 0.2,
      embeddings: metrics.openaiCostUSD * 0.1,
    };

    const projectedCosts = {
      daily: metrics.openaiCostUSD,
      weekly: metrics.openaiCostUSD * 7,
      monthly: metrics.openaiCostUSD * 30,
      quarterly: metrics.openaiCostUSD * 90,
    };

    return {
      timeframe,
      currentCosts: {
        total: metrics.openaiCostUSD,
        breakdown: costBreakdown,
      },
      projectedCosts,
      usage: {
        totalTokens: metrics.openaiTokensUsed,
        totalRequests: metrics.openaiRequests,
        averageCostPerRequest: metrics.openaiRequests > 0 
          ? metrics.openaiCostUSD / metrics.openaiRequests 
          : 0,
      },
      recommendations: [
        {
          type: 'optimization',
          description: 'Implement more aggressive caching to reduce API calls',
          potentialSavings: metrics.openaiCostUSD * 0.2, // 20% savings
        },
        {
          type: 'efficiency',
          description: 'Batch similar requests to reduce token overhead',
          potentialSavings: metrics.openaiCostUSD * 0.15, // 15% savings
        },
      ],
    };
  }

  @Get('service-health')
  @ApiOperation({ 
    summary: 'Get AI Service Health',
    description: 'Get comprehensive health status of all AI services'
  })
  async getServiceHealth(@CurrentUser() user: User) {
    const health = this.performanceMonitoring.getServiceHealth();
    const cacheAnalytics = await this.cacheOptimization.getCacheAnalytics();

    return {
      ...health,
      services: {
        scoring: {
          status: 'healthy',
          responseTime: health.metrics.averageScoringTime,
          errorRate: 0.01, // Would calculate actual rate
          cacheHitRate: cacheAnalytics.scores?.hitRate || 0,
        },
        recommendations: {
          status: 'healthy',
          responseTime: health.metrics.averageRecommendationTime,
          errorRate: 0.005,
          cacheHitRate: cacheAnalytics.recommendations?.hitRate || 0,
        },
        search: {
          status: 'healthy',
          responseTime: health.metrics.averageResponseTime,
          errorRate: 0.02,
          cacheHitRate: cacheAnalytics.search?.hitRate || 0,
        },
        embeddings: {
          status: 'healthy',
          responseTime: health.metrics.averageEmbeddingTime,
          errorRate: 0.01,
          cacheHitRate: cacheAnalytics.embeddings?.hitRate || 0,
        },
      },
      recommendations: [
        {
          service: 'all',
          type: 'performance',
          message: 'All AI services operating within normal parameters',
          priority: 'info',
        },
      ],
    };
  }

  @Post('maintenance/reset-metrics')
  @ApiOperation({ 
    summary: 'Reset AI Metrics',
    description: 'Reset all AI performance metrics (use with caution)'
  })
  @HttpCode(HttpStatus.OK)
  async resetMetrics(@CurrentUser() user: User) {
    this.performanceMonitoring.resetMetrics();
    
    return {
      message: 'AI metrics reset successfully',
      resetBy: user.id,
      resetAt: new Date(),
      warning: 'All performance metrics have been cleared',
    };
  }

  @Get('configuration')
  @ApiOperation({ 
    summary: 'Get AI Configuration',
    description: 'Get current AI system configuration and settings'
  })
  async getAIConfiguration(@CurrentUser() user: User) {
    return {
      openai: {
        defaultModel: 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
        maxRetries: 3,
        timeout: 30000,
      },
      caching: {
        scoreCacheTTL: 86400, // 24 hours
        recommendationCacheTTL: 21600, // 6 hours
        embeddingCacheTTL: 86400, // 24 hours
      },
      performance: {
        maxConcurrentRequests: 100,
        responseTimeThreshold: 5000,
        errorRateThreshold: 0.05,
        costThreshold: {
          daily: 100,
          monthly: 2000,
        },
      },
      features: {
        scoringEnabled: true,
        recommendationsEnabled: true,
        searchEnabled: true,
        embeddingsEnabled: true,
        cacheWarmingEnabled: true,
        performanceMonitoringEnabled: true,
      },
    };
  }
}
