/**
 * AI Health Check Controller - Service Health Monitoring
 * Comprehensive health checks for AI services and dependencies
 */
import { HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../modules/database/prisma.service';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
import { CacheOptimizationService } from '../services/cache-optimization.service';
import { ProductionOptimizationService } from '../services/production-optimization.service';
import { OpenAIService } from '../services/openai.service';
export declare class AIHealthController {
    private health;
    private prisma;
    private performanceMonitoring;
    private cacheOptimization;
    private productionOptimization;
    private openaiService;
    constructor(health: HealthCheckService, prisma: PrismaService, performanceMonitoring: PerformanceMonitoringService, cacheOptimization: CacheOptimizationService, productionOptimization: ProductionOptimizationService, openaiService: OpenAIService);
    checkAIHealth(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    getDetailedAIHealth(): Promise<{
        status: "healthy" | "unhealthy" | "degraded";
        timestamp: string;
        services: {
            database: HealthIndicatorResult;
            openai: HealthIndicatorResult;
            cache: HealthIndicatorResult;
            aiServices: HealthIndicatorResult;
            performance: HealthIndicatorResult;
            circuitBreakers: HealthIndicatorResult;
        };
        summary: {
            healthy: number;
            total: number;
            criticalIssues: string[];
        };
    }>;
    getAIHealthMetrics(): Promise<{
        timestamp: string;
        metrics: {
            totalRequests: number;
            successRate: number;
            errorRate: number;
            averageResponseTime: number;
            p95ResponseTime: number;
            p99ResponseTime: number;
            cacheHitRate: number;
            cacheMemoryUsage: number;
            openaiRequests: number;
            openaiCostUSD: number;
            openaiErrorRate: number;
            activeRequests: any;
            queueUtilization: any;
            circuitBreakerStatus: {
                [k: string]: any;
            };
        };
        thresholds: {
            errorRateWarning: number;
            errorRateCritical: number;
            responseTimeWarning: number;
            responseTimeCritical: number;
            cacheHitRateWarning: number;
            cacheHitRateCritical: number;
            queueUtilizationWarning: number;
            queueUtilizationCritical: number;
        };
    }>;
    private checkDatabase;
    private checkOpenAI;
    private checkCache;
    private checkAIServices;
    private checkPerformance;
    private checkCircuitBreakers;
    private checkProductionOptimization;
    private checkOverallHealth;
    private determineOverallStatus;
    private countHealthyServices;
    private getCriticalIssues;
    private classifyOpenAIError;
}
//# sourceMappingURL=health.controller.d.ts.map
