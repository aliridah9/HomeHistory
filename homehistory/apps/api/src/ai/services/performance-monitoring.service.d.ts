/**
 * AI Performance Monitoring Service - Comprehensive AI Operations Monitoring
 * Enterprise-grade monitoring for AI services with Sentry integration
 */
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
interface AIMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    openaiRequests: number;
    openaiTokensUsed: number;
    openaiCostUSD: number;
    openaiErrorRate: number;
    scoringRequests: number;
    recommendationRequests: number;
    embeddingRequests: number;
    searchRequests: number;
    cacheHitRate: number;
    averageEmbeddingTime: number;
    averageScoringTime: number;
    averageRecommendationTime: number;
    timeoutErrors: number;
    rateLimitErrors: number;
    authenticationErrors: number;
    validationErrors: number;
    internalErrors: number;
}
interface PerformanceAlert {
    id: string;
    type: 'error_rate' | 'response_time' | 'cost_threshold' | 'service_down';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric: string;
    currentValue: number;
    threshold: number;
    timestamp: Date;
    resolved: boolean;
}
export declare class PerformanceMonitoringService implements OnModuleInit {
    private configService;
    private readonly logger;
    private metrics;
    private responseTimes;
    private alerts;
    private readonly RESPONSE_TIME_THRESHOLD;
    private readonly ERROR_RATE_THRESHOLD;
    private readonly DAILY_COST_THRESHOLD;
    private readonly MONTHLY_COST_THRESHOLD;
    private circuitBreakers;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    /**
     * Track AI operation performance
     */
    trackAIOperation(operation: string, duration: number, success: boolean, metadata?: Record<string, any>): void;
    /**
     * Track OpenAI API usage
     */
    trackOpenAIUsage(tokens: number, cost: number, model: string, operation: string, success: boolean): void;
    /**
     * Track cache performance
     */
    trackCachePerformance(hit: boolean, operation: string): void;
    /**
     * Get current AI metrics
     */
    getMetrics(): AIMetrics;
    /**
     * Get performance alerts
     */
    getAlerts(resolved?: boolean): PerformanceAlert[];
    /**
     * Resolve performance alert
     */
    resolveAlert(alertId: string): void;
    /**
     * Check circuit breaker state
     */
    checkCircuitBreaker(service: string): boolean;
    /**
     * Record circuit breaker failure
     */
    recordCircuitBreakerFailure(service: string): void;
    /**
     * Record circuit breaker success
     */
    recordCircuitBreakerSuccess(service: string): void;
    /**
     * Get service health status
     */
    getServiceHealth(): Record<string, any>;
    /**
     * Reset metrics (for testing or periodic reset)
     */
    resetMetrics(): void;
    private collectMetrics;
    private initializeMetrics;
    private initializeCircuitBreakers;
    private startMetricsCollection;
    private updateResponseTimeMetrics;
    private trackOperationSpecificMetrics;
    private checkPerformanceAlerts;
    private checkCostThresholds;
    private checkSystemAlerts;
    private createAlert;
    private sendToSentry;
    private sendMetricsToMonitoring;
}
export {};
//# sourceMappingURL=performance-monitoring.service.d.ts.map
