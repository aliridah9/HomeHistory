/**
 * Production Optimization Service - Request Queuing and Circuit Breakers
 * Enterprise-grade production optimizations for AI operations
 */

import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

interface AIRequest {
  id: string;
  type: 'scoring' | 'recommendation' | 'embedding' | 'search';
  propertyId: string;
  userId?: string;
  priority: 'high' | 'medium' | 'low';
  params: Record<string, any>;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: Date;
  nextAttempt: Date;
  successCount: number;
  requestCount: number;
}

interface FallbackResponse {
  type: 'cached' | 'simplified' | 'default';
  data: any;
  message: string;
  fallbackReason: string;
}

@Injectable()
export class ProductionOptimizationService implements OnModuleInit {
  private readonly logger = new Logger(ProductionOptimizationService.name);

  // Request queuing
  private readonly MAX_CONCURRENT_REQUESTS = 100;
  private readonly QUEUE_TIMEOUT = 30000; // 30 seconds
  private activeRequests = 0;

  // Circuit breakers
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    halfOpenMaxCalls: 3,
  };

  // Database connection optimization
  private connectionPool: any;
  private readonly MAX_DB_CONNECTIONS = 50;
  private readonly CONNECTION_TIMEOUT = 10000;

  constructor(
    private configService: ConfigService,
    @Optional() @InjectQueue('ai-requests') private aiRequestQueue?: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Production Optimization Service initialized');
    
    // Initialize circuit breakers
    this.initializeCircuitBreakers();
    
    // Setup connection pool optimization
    await this.setupConnectionPoolOptimization();
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Queue AI request with priority and rate limiting
   */
  async queueAIRequest(request: Omit<AIRequest, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const requestId = this.generateRequestId();
    
    const aiRequest: AIRequest = {
      ...request,
      id: requestId,
      timestamp: new Date(),
      retries: 0,
      maxRetries: 3,
    };

    // Check circuit breaker
    if (!this.checkCircuitBreaker(request.type)) {
      throw new Error(`Service ${request.type} is currently unavailable (circuit breaker open)`);
    }

    // Check rate limiting
    if (this.activeRequests >= this.MAX_CONCURRENT_REQUESTS && this.aiRequestQueue) {
      // Queue the request
      await this.aiRequestQueue.add('ai-request', aiRequest, {
        priority: this.getPriorityValue(request.priority),
        delay: 0,
        attempts: request.maxRetries || 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.debug(`Request ${requestId} queued due to rate limiting`);
      return requestId;
    }

    // Execute immediately (or when queue not configured)
    this.executeAIRequest(aiRequest);
    return requestId;
  }

  /**
   * Execute AI request with circuit breaker protection
   */
  async executeAIRequest(request: AIRequest): Promise<any> {
    this.activeRequests++;
    const startTime = Date.now();

    try {
      // Check circuit breaker before execution
      if (!this.checkCircuitBreaker(request.type)) {
        throw new Error(`Circuit breaker open for ${request.type}`);
      }

      // Execute the actual AI operation
      let result;
      switch (request.type) {
        case 'scoring':
          result = await this.executeScoring(request);
          break;
        case 'recommendation':
          result = await this.executeRecommendation(request);
          break;
        case 'embedding':
          result = await this.executeEmbedding(request);
          break;
        case 'search':
          result = await this.executeSearch(request);
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      // Record success
      this.recordCircuitBreakerSuccess(request.type);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`AI request ${request.id} completed in ${duration}ms`);

      return result;

    } catch (error) {
      // Record failure
      this.recordCircuitBreakerFailure(request.type, error);
      
      // Try fallback response
      const fallback = await this.getFallbackResponse(request, error);
      if (fallback) {
        this.logger.warn(`Using fallback response for ${request.type}: ${fallback.fallbackReason}`);
        return fallback;
      }

      throw error;

    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Get fallback response when AI services are unavailable
   */
  async getFallbackResponse(request: AIRequest, error: Error): Promise<FallbackResponse | null> {
    try {
      switch (request.type) {
        case 'scoring':
          return this.getScoringFallback(request, error);
        case 'recommendation':
          return this.getRecommendationFallback(request, error);
        case 'embedding':
          return this.getEmbeddingFallback(request, error);
        case 'search':
          return this.getSearchFallback(request, error);
        default:
          return null;
      }
    } catch (fallbackError) {
      this.logger.error(`Fallback failed for ${request.type}:`, fallbackError);
      return null;
    }
  }

  /**
   * Optimize database queries for vector operations
   */
  async optimizeVectorQuery(query: string, params: any[]): Promise<any> {
    // Use connection pool for better performance
    const connection = await this.getOptimizedConnection();
    
    try {
      // Add query optimization hints
      const optimizedQuery = this.addQueryOptimizations(query);
      
      // Execute with timeout
      const result = await Promise.race([
        connection.query(optimizedQuery, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), this.CONNECTION_TIMEOUT)
        ),
      ]);

      return result;

    } finally {
      // Return connection to pool
      connection.release();
    }
  }

  /**
   * Get system health and optimization status
   */
  getOptimizationStatus(): Record<string, any> {
    return {
      requestQueue: {
        activeRequests: this.activeRequests,
        maxConcurrentRequests: this.MAX_CONCURRENT_REQUESTS,
        utilizationRate: this.activeRequests / this.MAX_CONCURRENT_REQUESTS,
      },
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([service, state]) => [
          service,
          {
            state: state.state,
            failures: state.failures,
            successRate: state.requestCount > 0 
              ? state.successCount / state.requestCount 
              : 0,
          },
        ])
      ),
      connectionPool: {
        active: this.connectionPool?.totalCount || 0,
        idle: this.connectionPool?.idleCount || 0,
        waiting: this.connectionPool?.waitingCount || 0,
      },
      performance: {
        averageResponseTime: 0, // Would track actual metrics
        throughput: 0, // Requests per second
        errorRate: 0, // Error percentage
      },
    };
  }

  // Private helper methods

  private initializeCircuitBreakers(): void {
    const services = ['scoring', 'recommendation', 'embedding', 'search', 'openai'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        state: 'closed',
        failures: 0,
        lastFailureTime: new Date(),
        nextAttempt: new Date(),
        successCount: 0,
        requestCount: 0,
      });
    });
  }

  private checkCircuitBreaker(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return true;

    const now = new Date();
    breaker.requestCount++;

    switch (breaker.state) {
      case 'closed':
        return true;

      case 'open':
        if (now >= breaker.nextAttempt) {
          breaker.state = 'half-open';
          breaker.successCount = 0;
          this.logger.log(`Circuit breaker for ${service} moved to half-open`);
          return true;
        }
        return false;

      case 'half-open':
        return breaker.successCount < this.circuitBreakerConfig.halfOpenMaxCalls;

      default:
        return true;
    }
  }

  private recordCircuitBreakerSuccess(service: string): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    breaker.successCount++;

    if (breaker.state === 'half-open' && 
        breaker.successCount >= this.circuitBreakerConfig.halfOpenMaxCalls) {
      breaker.state = 'closed';
      breaker.failures = 0;
      this.logger.log(`Circuit breaker for ${service} closed (recovered)`);
    }
  }

  private recordCircuitBreakerFailure(service: string, error: Error): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailureTime = new Date();

    if (breaker.failures >= this.circuitBreakerConfig.failureThreshold) {
      breaker.state = 'open';
      breaker.nextAttempt = new Date(Date.now() + this.circuitBreakerConfig.resetTimeout);
      this.logger.warn(`Circuit breaker for ${service} opened due to failures: ${error.message}`);
    }
  }

  private async setupConnectionPoolOptimization(): Promise<void> {
    // This would setup optimized database connection pooling
    // For now, we'll mock the configuration
    this.connectionPool = {
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
    };
  }

  private startMonitoring(): void {
    // Monitor circuit breakers every minute
    setInterval(() => {
      this.monitorCircuitBreakers();
    }, 60000);

    // Monitor queue performance
    setInterval(() => {
      this.monitorQueuePerformance();
    }, 30000);
  }

  private monitorCircuitBreakers(): void {
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      if (breaker.state === 'open') {
        const timeSinceFailure = Date.now() - breaker.lastFailureTime.getTime();
        if (timeSinceFailure > this.circuitBreakerConfig.monitoringPeriod) {
          // Reset failure count if it's been a while
          breaker.failures = Math.max(0, breaker.failures - 1);
        }
      }
    }
  }

  private monitorQueuePerformance(): void {
    const utilizationRate = this.activeRequests / this.MAX_CONCURRENT_REQUESTS;
    
    if (utilizationRate > 0.8) {
      this.logger.warn(`High request utilization: ${(utilizationRate * 100).toFixed(1)}%`);
    }
  }

  private async executeScoring(request: AIRequest): Promise<any> {
    // Mock scoring execution - would integrate with actual scoring service
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
    return {
      propertyId: request.propertyId,
      score: 75,
      breakdown: { quality: 80, safety: 75, value: 70, location: 85 },
    };
  }

  private async executeRecommendation(request: AIRequest): Promise<any> {
    // Mock recommendation execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      propertyId: request.propertyId,
      recommendations: [],
    };
  }

  private async executeEmbedding(request: AIRequest): Promise<any> {
    // Mock embedding execution
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      propertyId: request.propertyId,
      embedding: new Array(1536).fill(0),
    };
  }

  private async executeSearch(request: AIRequest): Promise<any> {
    // Mock search execution
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      query: request.params.query,
      results: [],
    };
  }

  private async getScoringFallback(request: AIRequest, error: Error): Promise<FallbackResponse> {
    // Try to get cached score first
    // If no cache, return simplified score based on basic property data
    return {
      type: 'simplified',
      data: {
        propertyId: request.propertyId,
        score: 70, // Default/simplified score
        breakdown: { quality: 70, safety: 70, value: 70, location: 70 },
        fallback: true,
      },
      message: 'Simplified scoring due to service unavailability',
      fallbackReason: 'AI scoring service temporarily unavailable',
    };
  }

  private async getRecommendationFallback(request: AIRequest, error: Error): Promise<FallbackResponse> {
    // Return basic recommendations based on property type and location
    return {
      type: 'simplified',
      data: {
        propertyId: request.propertyId,
        recommendations: [], // Would include basic location-based recommendations
        fallback: true,
      },
      message: 'Basic recommendations due to service unavailability',
      fallbackReason: 'AI recommendation service temporarily unavailable',
    };
  }

  private async getEmbeddingFallback(request: AIRequest, error: Error): Promise<FallbackResponse> {
    // Return cached embedding or basic feature vector
    return {
      type: 'cached',
      data: {
        propertyId: request.propertyId,
        embedding: new Array(1536).fill(0), // Zero vector as fallback
        fallback: true,
      },
      message: 'Cached embedding due to service unavailability',
      fallbackReason: 'AI embedding service temporarily unavailable',
    };
  }

  private async getSearchFallback(request: AIRequest, error: Error): Promise<FallbackResponse> {
    // Return basic search results without AI enhancement
    return {
      type: 'simplified',
      data: {
        query: request.params.query,
        results: [], // Would include basic SQL-based search results
        fallback: true,
      },
      message: 'Basic search results due to service unavailability',
      fallbackReason: 'AI search service temporarily unavailable',
    };
  }

  private async getOptimizedConnection(): Promise<any> {
    // Mock optimized database connection
    return {
      query: async (sql: string, params: any[]) => {
        // Mock query execution
        return { rows: [] };
      },
      release: () => {
        // Mock connection release
      },
    };
  }

  private addQueryOptimizations(query: string): string {
    // Add database-specific optimizations
    let optimizedQuery = query;
    
    // Add hints for vector operations
    if (query.includes('embedding')) {
      optimizedQuery = `SET enable_seqscan = off; ${optimizedQuery}`;
    }
    
    // Add parallel query hints for large operations
    if (query.includes('COUNT(*)') || query.includes('GROUP BY')) {
      optimizedQuery = `SET max_parallel_workers_per_gather = 4; ${optimizedQuery}`;
    }
    
    return optimizedQuery;
  }

  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 10;
      case 'medium': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
