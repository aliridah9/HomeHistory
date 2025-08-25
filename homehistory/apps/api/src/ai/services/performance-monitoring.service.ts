/**
 * AI Performance Monitoring Service - Comprehensive AI Operations Monitoring
 * Enterprise-grade monitoring for AI services with Sentry integration
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

interface AIMetrics {
  // Request metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // OpenAI API metrics
  openaiRequests: number;
  openaiTokensUsed: number;
  openaiCostUSD: number;
  openaiErrorRate: number;
  
  // Service-specific metrics
  scoringRequests: number;
  recommendationRequests: number;
  embeddingRequests: number;
  searchRequests: number;
  
  // Performance metrics
  cacheHitRate: number;
  averageEmbeddingTime: number;
  averageScoringTime: number;
  averageRecommendationTime: number;
  
  // Error metrics
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

interface CostAlert {
  service: string;
  dailyCost: number;
  monthlyCost: number;
  threshold: number;
  exceeded: boolean;
}

@Injectable()
export class PerformanceMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  
  // Metrics storage
  private metrics: AIMetrics = this.initializeMetrics();
  private responseTimes: number[] = [];
  private alerts: PerformanceAlert[] = [];
  
  // Thresholds
  private readonly RESPONSE_TIME_THRESHOLD = 5000; // 5 seconds
  private readonly ERROR_RATE_THRESHOLD = 0.05; // 5%
  private readonly DAILY_COST_THRESHOLD = 100; // $100
  private readonly MONTHLY_COST_THRESHOLD = 2000; // $2000
  
  // Circuit breaker state
  private circuitBreakers: Map<string, {
    failures: number;
    lastFailure: Date;
    state: 'closed' | 'open' | 'half-open';
  }> = new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Performance Monitoring Service initialized');
    
    // Initialize circuit breakers
    this.initializeCircuitBreakers();
    
    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Track AI operation performance
   */
  trackAIOperation(
    operation: string,
    duration: number,
    success: boolean,
    metadata: Record<string, any> = {}
  ): void {
    // Update basic metrics
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Track response times
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500); // Keep last 500
    }

    // Update average response time
    this.updateResponseTimeMetrics();

    // Track operation-specific metrics
    this.trackOperationSpecificMetrics(operation, duration, success, metadata);

    // Check for alerts
    this.checkPerformanceAlerts(operation, duration, success);

    // Send to Sentry if enabled
    this.sendToSentry(operation, duration, success, metadata);
  }

  /**
   * Track OpenAI API usage
   */
  trackOpenAIUsage(
    tokens: number,
    cost: number,
    model: string,
    operation: string,
    success: boolean
  ): void {
    this.metrics.openaiRequests++;
    this.metrics.openaiTokensUsed += tokens;
    this.metrics.openaiCostUSD += cost;

    if (!success) {
      this.metrics.openaiErrorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    }

    // Check cost thresholds
    this.checkCostThresholds(cost);

    // Track to Sentry
    Sentry.addBreadcrumb({
      category: 'openai',
      message: `OpenAI ${operation} - ${model}`,
      data: { tokens, cost, success },
      level: success ? 'info' : 'warning',
    });
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(hit: boolean, operation: string): void {
    const totalCacheRequests = this.metrics.totalRequests;
    const cacheHits = hit ? 1 : 0;
    
    // Update cache hit rate (exponential moving average)
    this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.9) + (cacheHits * 0.1);
  }

  /**
   * Get current AI metrics
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance alerts
   */
  getAlerts(resolved: boolean = false): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  /**
   * Resolve performance alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.log(`Alert resolved: ${alert.message}`);
    }
  }

  /**
   * Check circuit breaker state
   */
  checkCircuitBreaker(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return true; // Allow if no breaker configured

    const now = new Date();
    
    switch (breaker.state) {
      case 'closed':
        return true; // Allow requests
        
      case 'open':
        // Check if we should try half-open
        const timeSinceLastFailure = now.getTime() - breaker.lastFailure.getTime();
        if (timeSinceLastFailure > 60000) { // 1 minute
          breaker.state = 'half-open';
          return true;
        }
        return false; // Block requests
        
      case 'half-open':
        return true; // Allow limited requests
        
      default:
        return true;
    }
  }

  /**
   * Record circuit breaker failure
   */
  recordCircuitBreakerFailure(service: string): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailure = new Date();

    // Open circuit if too many failures
    if (breaker.failures >= 5) {
      breaker.state = 'open';
      this.createAlert('service_down', 'critical', `Circuit breaker opened for ${service}`, service, breaker.failures, 5);
    }
  }

  /**
   * Record circuit breaker success
   */
  recordCircuitBreakerSuccess(service: string): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
      breaker.failures = 0;
    } else if (breaker.state === 'closed') {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
  }

  /**
   * Get service health status
   */
  getServiceHealth(): Record<string, any> {
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;

    return {
      status: errorRate < this.ERROR_RATE_THRESHOLD ? 'healthy' : 'degraded',
      metrics: this.metrics,
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      alerts: this.getAlerts(false).length,
      uptime: process.uptime(),
    };
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.responseTimes = [];
    this.alerts = [];
    this.logger.log('Metrics reset');
  }

  // Private helper methods

  @Cron(CronExpression.EVERY_MINUTE)
  private async collectMetrics(): Promise<void> {
    try {
      // Update calculated metrics
      this.updateResponseTimeMetrics();
      
      // Check for alerts
      this.checkSystemAlerts();
      
      // Send metrics to monitoring system
      await this.sendMetricsToMonitoring();
      
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }

  private initializeMetrics(): AIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      openaiRequests: 0,
      openaiTokensUsed: 0,
      openaiCostUSD: 0,
      openaiErrorRate: 0,
      scoringRequests: 0,
      recommendationRequests: 0,
      embeddingRequests: 0,
      searchRequests: 0,
      cacheHitRate: 0,
      averageEmbeddingTime: 0,
      averageScoringTime: 0,
      averageRecommendationTime: 0,
      timeoutErrors: 0,
      rateLimitErrors: 0,
      authenticationErrors: 0,
      validationErrors: 0,
      internalErrors: 0,
    };
  }

  private initializeCircuitBreakers(): void {
    const services = ['openai', 'embedding', 'scoring', 'recommendation', 'search'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        failures: 0,
        lastFailure: new Date(),
        state: 'closed',
      });
    });
  }

  private startMetricsCollection(): void {
    // Start periodic metrics collection
    setInterval(() => this.collectMetrics(), 60000); // Every minute
  }

  private updateResponseTimeMetrics(): void {
    if (this.responseTimes.length === 0) return;

    // Calculate average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;

    // Calculate percentiles
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    this.metrics.p95ResponseTime = sorted[p95Index] || 0;
    this.metrics.p99ResponseTime = sorted[p99Index] || 0;
  }

  private trackOperationSpecificMetrics(
    operation: string,
    duration: number,
    success: boolean,
    metadata: Record<string, any>
  ): void {
    switch (operation) {
      case 'scoring':
        this.metrics.scoringRequests++;
        this.metrics.averageScoringTime = (this.metrics.averageScoringTime * 0.9) + (duration * 0.1);
        break;
      case 'recommendation':
        this.metrics.recommendationRequests++;
        this.metrics.averageRecommendationTime = (this.metrics.averageRecommendationTime * 0.9) + (duration * 0.1);
        break;
      case 'embedding':
        this.metrics.embeddingRequests++;
        this.metrics.averageEmbeddingTime = (this.metrics.averageEmbeddingTime * 0.9) + (duration * 0.1);
        break;
      case 'search':
        this.metrics.searchRequests++;
        break;
    }

    // Track error types
    if (!success && metadata.error) {
      const errorType = metadata.error.type || 'internal';
      switch (errorType) {
        case 'timeout':
          this.metrics.timeoutErrors++;
          break;
        case 'rate_limit':
          this.metrics.rateLimitErrors++;
          break;
        case 'authentication':
          this.metrics.authenticationErrors++;
          break;
        case 'validation':
          this.metrics.validationErrors++;
          break;
        default:
          this.metrics.internalErrors++;
      }
    }
  }

  private checkPerformanceAlerts(operation: string, duration: number, success: boolean): void {
    // Check response time threshold
    if (duration > this.RESPONSE_TIME_THRESHOLD) {
      this.createAlert(
        'response_time',
        'high',
        `Slow ${operation} response`,
        operation,
        duration,
        this.RESPONSE_TIME_THRESHOLD
      );
    }

    // Check error rate
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;
    
    if (errorRate > this.ERROR_RATE_THRESHOLD) {
      this.createAlert(
        'error_rate',
        'high',
        `High error rate for ${operation}`,
        operation,
        errorRate,
        this.ERROR_RATE_THRESHOLD
      );
    }
  }

  private checkCostThresholds(cost: number): void {
    // This would integrate with actual cost tracking
    // For now, we'll use accumulated cost from metrics
    
    if (this.metrics.openaiCostUSD > this.DAILY_COST_THRESHOLD) {
      this.createAlert(
        'cost_threshold',
        'medium',
        'Daily OpenAI cost threshold exceeded',
        'openai_cost',
        this.metrics.openaiCostUSD,
        this.DAILY_COST_THRESHOLD
      );
    }
  }

  private checkSystemAlerts(): void {
    // Check overall system health
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;

    if (errorRate > this.ERROR_RATE_THRESHOLD * 2) { // Critical threshold
      this.createAlert(
        'error_rate',
        'critical',
        'Critical system error rate',
        'system',
        errorRate,
        this.ERROR_RATE_THRESHOLD * 2
      );
    }

    // Check cache performance
    if (this.metrics.cacheHitRate < 0.7) {
      this.createAlert(
        'response_time',
        'medium',
        'Low cache hit rate affecting performance',
        'cache',
        this.metrics.cacheHitRate,
        0.7
      );
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metric: string,
    currentValue: number,
    threshold: number
  ): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      type,
      severity,
      message,
      metric,
      currentValue,
      threshold,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Log alert
    this.logger.warn(`Performance Alert [${severity.toUpperCase()}]: ${message}`);

    // Send to Sentry
    Sentry.captureMessage(`AI Performance Alert: ${message}`, severity as any);
  }

  private sendToSentry(
    operation: string,
    duration: number,
    success: boolean,
    metadata: Record<string, any>
  ): void {
    if (!success) {
      Sentry.captureException(new Error(`AI operation failed: ${operation}`), {
        tags: { operation, duration },
        extra: metadata,
      });
    }

    // Add breadcrumb for all operations
    Sentry.addBreadcrumb({
      category: 'ai_operation',
      message: `${operation} - ${success ? 'success' : 'failure'}`,
      data: { duration, ...metadata },
      level: success ? 'info' : 'error',
    });
  }

  private async sendMetricsToMonitoring(): Promise<void> {
    // This would send metrics to external monitoring systems
    // like Prometheus, DataDog, etc.
    
    // For now, just log key metrics
    this.logger.debug(`AI Metrics - Requests: ${this.metrics.totalRequests}, Error Rate: ${(this.metrics.failedRequests / this.metrics.totalRequests * 100).toFixed(2)}%, Avg Response: ${this.metrics.averageResponseTime.toFixed(0)}ms`);
  }
}
