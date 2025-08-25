/**
 * OpenAI Service - Enterprise-grade OpenAI integration
 * Handles API calls, error handling, rate limiting, and cost tracking
 */
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIUsageMetrics, PropertyAnalysisRequest, PropertyAnalysisResponse, DocumentAnalysisRequest, DocumentAnalysisResponse, ModelCapabilities, CompletionModel } from '../interfaces/ai.interfaces';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
export declare class OpenAIService implements OnModuleInit {
    private configService;
    private cacheManager;
    private aiDatabase;
    private readonly logger;
    private openai;
    private config;
    private usageMetrics;
    private rateLimitInfo;
    private readonly MODEL_PRICING;
    constructor(configService: ConfigService, cacheManager: CacheManagerService, aiDatabase: AIDatabaseService);
    onModuleInit(): Promise<void>;
    private initializeConfig;
    private initializeOpenAI;
    /**
     * Generate property analysis using GPT-4
     */
    analyzeProperty(request: PropertyAnalysisRequest): Promise<PropertyAnalysisResponse>;
    /**
     * Analyze document content using GPT-4
     */
    analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse>;
    /**
     * Generate text completion
     */
    generateCompletion(prompt: string, options?: {
        model?: CompletionModel;
        maxTokens?: number;
        temperature?: number;
        systemPrompt?: string;
        userId?: string;
    }): Promise<{
        content: string;
        usage: AIUsageMetrics;
    }>;
    /**
     * Get model capabilities
     */
    getModelCapabilities(model: string): ModelCapabilities;
    /**
     * Get usage statistics
     */
    getUsageStats(timeframe?: 'hour' | 'day' | 'week' | 'month'): {
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        averageLatency: number;
        errorRate: number;
    };
    private executeWithRetry;
    private isRetryableError;
    private sleep;
    private calculateCost;
    private generateRequestId;
    private generateCacheKey;
    private trackUsage;
    private handleError;
    private buildPropertyAnalysisPrompt;
    private buildDocumentAnalysisPrompt;
    private getSystemPrompt;
}
//# sourceMappingURL=openai.service.d.ts.map
