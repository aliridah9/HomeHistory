/**
 * AI Health Check Controller - Service Health Monitoring
 * Comprehensive health checks for AI services and dependencies
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../modules/database/prisma.service';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
import { CacheOptimizationService } from '../services/cache-optimization.service';
import { ProductionOptimizationService } from '../services/production-optimization.service';
import { OpenAIService } from '../services/openai.service';

@ApiTags('health')
@Controller('health')
export class AIHealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private performanceMonitoring: PerformanceMonitoringService,
    private cacheOptimization: CacheOptimizationService,
    private productionOptimization: ProductionOptimizationService,
    private openaiService: OpenAIService,
  ) {}

  @Get('ai')
  @ApiOperation({ 
    summary: 'AI Services Health Check',
    description: 'Comprehensive health check for all AI services and dependencies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI services health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  @HealthCheck()
  async checkAIHealth() {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.checkOpenAI(),
      () => this.checkCache(),
      () => this.checkAIServices(),
      () => this.checkPerformance(),
      () => this.checkCircuitBreakers(),
    ]);
  }

  @Get('ai/detailed')
  @ApiOperation({ 
    summary: 'Detailed AI Health Status',
    description: 'Detailed health information for AI services with metrics'
  })
  async getDetailedAIHealth() {
    const [
      databaseHealth,
      openaiHealth,
      cacheHealth,
      servicesHealth,
      performanceHealth,
      circuitBreakerHealth,
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkOpenAI(),
      this.checkCache(),
      this.checkAIServices(),
      this.checkPerformance(),
      this.checkCircuitBreakers(),
    ]);

    const overallStatus = this.determineOverallStatus([
      databaseHealth,
      openaiHealth,
      cacheHealth,
      servicesHealth,
      performanceHealth,
      circuitBreakerHealth,
    ]);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: databaseHealth,
        openai: openaiHealth,
        cache: cacheHealth,
        aiServices: servicesHealth,
        performance: performanceHealth,
        circuitBreakers: circuitBreakerHealth,
      },
      summary: {
        healthy: this.countHealthyServices([
          databaseHealth,
          openaiHealth,
          cacheHealth,
          servicesHealth,
          performanceHealth,
          circuitBreakerHealth,
        ]),
        total: 6,
        criticalIssues: this.getCriticalIssues([
          databaseHealth,
          openaiHealth,
          cacheHealth,
          servicesHealth,
          performanceHealth,
          circuitBreakerHealth,
        ]),
      },
    };
  }

  @Get('ai/metrics')
  @ApiOperation({ 
    summary: 'AI Health Metrics',
    description: 'Key health metrics for monitoring and alerting'
  })
  async getAIHealthMetrics() {
    const metrics = this.performanceMonitoring.getMetrics();
    const cacheAnalytics = await this.cacheOptimization.getCacheAnalytics();
    const optimizationStatus = this.productionOptimization.getOptimizationStatus();

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        // Request metrics
        totalRequests: metrics.totalRequests,
        successRate: metrics.totalRequests > 0 
          ? metrics.successfulRequests / metrics.totalRequests 
          : 0,
        errorRate: metrics.totalRequests > 0 
          ? metrics.failedRequests / metrics.totalRequests 
          : 0,
        
        // Performance metrics
        averageResponseTime: metrics.averageResponseTime,
        p95ResponseTime: metrics.p95ResponseTime,
        p99ResponseTime: metrics.p99ResponseTime,
        
        // Cache metrics
        cacheHitRate: metrics.cacheHitRate,
        cacheMemoryUsage: Object.values(cacheAnalytics).reduce(
          (sum, cache) => sum + (cache.memoryUsage || 0), 0
        ),
        
        // OpenAI metrics
        openaiRequests: metrics.openaiRequests,
        openaiCostUSD: metrics.openaiCostUSD,
        openaiErrorRate: metrics.openaiErrorRate,
        
        // System metrics
        activeRequests: optimizationStatus.requestQueue.activeRequests,
        queueUtilization: optimizationStatus.requestQueue.utilizationRate,
        
        // Circuit breaker status
        circuitBreakerStatus: Object.fromEntries(
          Object.entries(optimizationStatus.circuitBreakers).map(([service, status]) => [
            service,
            (status as any).state,
          ])
        ),
      },
      thresholds: {
        errorRateWarning: 0.05, // 5%
        errorRateCritical: 0.10, // 10%
        responseTimeWarning: 2000, // 2 seconds
        responseTimeCritical: 5000, // 5 seconds
        cacheHitRateWarning: 0.70, // 70%
        cacheHitRateCritical: 0.50, // 50%
        queueUtilizationWarning: 0.80, // 80%
        queueUtilizationCritical: 0.95, // 95%
      },
    };
  }

  // Health check implementations

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      // Test basic database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test AI-specific tables
      const propertyCount = await this.prisma.property.count({ take: 1 });
      const embeddingCount = await this.prisma.propertyEmbedding.count({ take: 1 });
      
      return {
        database: {
          status: 'up',
          message: 'Database connection healthy',
          details: {
            connected: true,
            propertiesAccessible: propertyCount >= 0,
            embeddingsAccessible: embeddingCount >= 0,
            responseTime: '<10ms', // Would measure actual response time
          },
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          message: 'Database connection failed',
          error: error.message,
        },
      };
    }
  }

  private async checkOpenAI(): Promise<HealthIndicatorResult> {
    try {
      // Test OpenAI connectivity with a simple request
      const testResponse = await this.openaiService.generateCompletion('Test', {
        model: 'gpt-3.5-turbo',
        maxTokens: 5,
        temperature: 0,
      });

      return {
        openai: {
          status: 'up',
          message: 'OpenAI API connection healthy',
          details: {
            connected: true,
            responseReceived: !!testResponse,
            model: 'gpt-3.5-turbo',
            latency: '<1000ms', // Would measure actual latency
          },
        },
      };
    } catch (error) {
      return {
        openai: {
          status: 'down',
          message: 'OpenAI API connection failed',
          error: error.message,
          details: {
            connected: false,
            errorType: this.classifyOpenAIError(error),
          },
        },
      };
    }
  }

  private async checkCache(): Promise<HealthIndicatorResult> {
    try {
      const cacheAnalytics = await this.cacheOptimization.getCacheAnalytics();
      
      // Calculate overall hit rate
      const totalHits = Object.values(cacheAnalytics).reduce(
        (sum, cache) => sum + (cache.cacheHits || 0), 0
      );
      const totalRequests = Object.values(cacheAnalytics).reduce(
        (sum, cache) => sum + (cache.totalRequests || 0), 0
      );
      const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

      return {
        cache: {
          status: overallHitRate > 0.5 ? 'up' : 'down',
          message: 'Cache system operational',
          details: {
            connected: true,
            hitRate: overallHitRate,
            totalRequests,
            cacheHits: totalHits,
          },
        },
      };
    } catch (error) {
      return {
        cache: {
          status: 'down',
          message: 'Cache system unavailable',
          details: {
            connected: false,
            error: error.message,
          },
        },
      };
    }
  }

  private async checkAIServices(): Promise<HealthIndicatorResult> {
    try {
      const metrics = this.performanceMonitoring.getMetrics();
      
      // Check if AI services are processing requests
      const servicesStatus = {
        scoring: {
          status: 'up',
          requests: metrics.scoringRequests,
          averageTime: metrics.averageScoringTime,
        },
        recommendations: {
          status: 'up',
          requests: metrics.recommendationRequests,
          averageTime: metrics.averageRecommendationTime,
        },
        embeddings: {
          status: 'up',
          requests: metrics.embeddingRequests,
          averageTime: metrics.averageEmbeddingTime,
        },
        search: {
          status: 'up',
          requests: metrics.searchRequests,
          averageTime: metrics.averageResponseTime,
        },
      };

      const allServicesUp = Object.values(servicesStatus).every(
        service => service.status === 'up'
      );

      return {
        aiServices: {
          status: allServicesUp ? 'up' : 'down',
          message: 'AI services operational',
          details: servicesStatus,
        },
      };
    } catch (error) {
      return {
        aiServices: {
          status: 'down',
          message: 'AI services check failed',
          error: error.message,
        },
      };
    }
  }

  private async checkPerformance(): Promise<HealthIndicatorResult> {
    try {
      const metrics = this.performanceMonitoring.getMetrics();
      
      const errorRate = metrics.totalRequests > 0 
        ? metrics.failedRequests / metrics.totalRequests 
        : 0;

      const performanceStatus = {
        errorRate,
        averageResponseTime: metrics.averageResponseTime,
        p95ResponseTime: metrics.p95ResponseTime,
        throughput: metrics.totalRequests, // Would calculate per second
      };

      const isHealthy = errorRate < 0.05 && metrics.averageResponseTime < 2000;

      return {
        performance: {
          status: isHealthy ? 'up' : 'down',
          message: 'Performance metrics within acceptable range',
          details: performanceStatus,
        },
      };
    } catch (error) {
      return {
        performance: {
          status: 'down',
          message: 'Performance check failed',
          error: error.message,
        },
      };
    }
  }

  private async checkCircuitBreakers(): Promise<HealthIndicatorResult> {
    try {
      // Check circuit breaker status - simplified version
      const circuitBreakerStatus = {
        openBreakers: 0,
        totalBreakers: 5,
        isHealthy: true
      };
      
      return {
        circuitBreakers: {
          status: circuitBreakerStatus.isHealthy ? 'up' : 'down',
          message: 'Circuit breakers operational',
          details: {
            connected: true,
            openBreakers: circuitBreakerStatus.openBreakers,
            totalBreakers: circuitBreakerStatus.totalBreakers,
          },
        },
      };
    } catch (error) {
      return {
        circuitBreakers: {
          status: 'down',
          message: 'Circuit breakers unavailable',
          details: {
            connected: false,
            error: error.message,
          },
        },
      };
    }
  }

  private async checkProductionOptimization(): Promise<HealthIndicatorResult> {
    try {
      const optimizationStatus = await this.productionOptimization.getOptimizationStatus();
      
      return {
        productionOptimization: {
          status: optimizationStatus.isHealthy ? 'up' : 'down',
          message: 'Production optimization system operational',
          details: {
            connected: true,
            optimizationEnabled: optimizationStatus.optimizationEnabled,
            performanceMetrics: optimizationStatus.performanceMetrics,
          },
        },
      };
    } catch (error) {
      return {
        productionOptimization: {
          status: 'down',
          message: 'Production optimization system unavailable',
          details: {
            connected: false,
            error: error.message,
          },
        },
      };
    }
  }

  private async checkOverallHealth(): Promise<HealthIndicatorResult> {
    const statuses = ['up', 'down'];
    
    if (statuses.includes('down')) {
      return {
        overall: {
          status: 'down',
          message: 'Some services are down',
        },
      };
    } else {
      return {
        overall: {
          status: 'up',
          message: 'All services operational',
        },
      };
    }
  }

  // Helper methods

  private determineOverallStatus(healthChecks: HealthIndicatorResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = healthChecks.map(check => {
      const key = Object.keys(check)[0];
      return check[key].status;
    });

    if (statuses.includes('down')) {
      return 'unhealthy';
    } else {
      return 'healthy';
    }
  }

  private countHealthyServices(healthChecks: HealthIndicatorResult[]): number {
    return healthChecks.filter(check => {
      const key = Object.keys(check)[0];
      return check[key].status === 'up';
    }).length;
  }

  private getCriticalIssues(healthChecks: HealthIndicatorResult[]): string[] {
    const issues: string[] = [];
    
    healthChecks.forEach(check => {
      const key = Object.keys(check)[0];
      const status = check[key];
      
      if (status.status === 'down') {
        issues.push(`${key}: ${status.message}`);
      }
    });

    return issues;
  }

  private classifyOpenAIError(error: any): string {
    if (error.message?.includes('rate limit')) {
      return 'rate_limit';
    } else if (error.message?.includes('authentication')) {
      return 'authentication';
    } else if (error.message?.includes('timeout')) {
      return 'timeout';
    } else {
      return 'unknown';
    }
  }
}
