/**
 * Production Optimization Service - Request Queuing and Circuit Breakers
 * Enterprise-grade production optimizations for AI operations
 */
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
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
interface FallbackResponse {
    type: 'cached' | 'simplified' | 'default';
    data: any;
    message: string;
    fallbackReason: string;
}
export declare class ProductionOptimizationService implements OnModuleInit {
    private configService;
    private aiRequestQueue;
    private readonly logger;
    private readonly MAX_CONCURRENT_REQUESTS;
    private readonly QUEUE_TIMEOUT;
    private activeRequests;
    private circuitBreakers;
    private readonly circuitBreakerConfig;
    private connectionPool;
    private readonly MAX_DB_CONNECTIONS;
    private readonly CONNECTION_TIMEOUT;
    constructor(configService: ConfigService, aiRequestQueue: Queue);
    onModuleInit(): Promise<void>;
    /**
     * Queue AI request with priority and rate limiting
     */
    queueAIRequest(request: Omit<AIRequest, 'id' | 'timestamp' | 'retries'>): Promise<string>;
    /**
     * Execute AI request with circuit breaker protection
     */
    executeAIRequest(request: AIRequest): Promise<any>;
    /**
     * Get fallback response when AI services are unavailable
     */
    getFallbackResponse(request: AIRequest, error: Error): Promise<FallbackResponse | null>;
    /**
     * Optimize database queries for vector operations
     */
    optimizeVectorQuery(query: string, params: any[]): Promise<any>;
    /**
     * Get system health and optimization status
     */
    getOptimizationStatus(): Record<string, any>;
    private initializeCircuitBreakers;
    private checkCircuitBreaker;
    private recordCircuitBreakerSuccess;
    private recordCircuitBreakerFailure;
    private setupConnectionPoolOptimization;
    private startMonitoring;
    private monitorCircuitBreakers;
    private monitorQueuePerformance;
    private executeScoring;
    private executeRecommendation;
    private executeEmbedding;
    private executeSearch;
    private getScoringFallback;
    private getRecommendationFallback;
    private getEmbeddingFallback;
    private getSearchFallback;
    private getOptimizedConnection;
    private addQueryOptimizations;
    private getPriorityValue;
    private generateRequestId;
}
export {};
//# sourceMappingURL=production-optimization.service.d.ts.map
