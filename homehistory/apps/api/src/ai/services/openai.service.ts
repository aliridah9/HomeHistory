/**
 * OpenAI Service - Enterprise-grade OpenAI integration
 * Handles API calls, error handling, rate limiting, and cost tracking
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { 
  OpenAIConfig, 
  AIUsageMetrics, 
  PropertyAnalysisRequest, 
  PropertyAnalysisResponse,
  DocumentAnalysisRequest,
  DocumentAnalysisResponse,
  AIError,
  RateLimitInfo,
  ModelCapabilities,
  CompletionModel,
  EmbeddingModel
} from '../interfaces/ai.interfaces';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
import { createHash } from 'crypto';

@Injectable()
export class OpenAIService implements OnModuleInit {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private config: OpenAIConfig;
  private usageMetrics: AIUsageMetrics[] = [];
  private rateLimitInfo: RateLimitInfo;

  // Model pricing (per 1K tokens)
  private readonly MODEL_PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'text-embedding-3-small': { input: 0.00002, output: 0 },
    'text-embedding-3-large': { input: 0.00013, output: 0 },
  };

  constructor(
    private configService: ConfigService,
    private cacheManager: CacheManagerService,
    private aiDatabase: AIDatabaseService,
  ) {
    this.initializeConfig();
  }

  async onModuleInit() {
    await this.initializeOpenAI();
    this.logger.log('OpenAI Service initialized successfully');
  }

  private initializeConfig() {
    this.config = {
      apiKey: this.configService.get<string>('OPENAI_API_KEY')!,
      organization: this.configService.get<string>('OPENAI_ORG_ID'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      defaultModel: this.configService.get<string>('OPENAI_DEFAULT_MODEL', 'gpt-4'),
      embeddingModel: this.configService.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
      maxTokens: this.configService.get<number>('OPENAI_MAX_TOKENS', 4000),
      temperature: this.configService.get<number>('OPENAI_TEMPERATURE', 0.1),
      timeout: this.configService.get<number>('OPENAI_TIMEOUT', 60000),
      maxRetries: this.configService.get<number>('OPENAI_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>('OPENAI_RETRY_DELAY', 1000),
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  private async initializeOpenAI() {
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    // Test connection
    try {
      await this.openai.models.list();
      this.logger.log('OpenAI connection established');
    } catch (error) {
      this.logger.error('Failed to connect to OpenAI:', error);
      throw error;
    }
  }

  /**
   * Generate property analysis using GPT-4
   */
  async analyzeProperty(request: PropertyAnalysisRequest): Promise<PropertyAnalysisResponse> {
    const requestId = this.generateRequestId();
    const cacheKey = this.generateCacheKey('property_analysis', request);

    try {
      // Check cache first
      const cached = await this.cacheManager.get<PropertyAnalysisResponse>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for property analysis: ${request.propertyId}`);
        return { ...cached, cached: true, requestId };
      }

      const startTime = Date.now();
      const prompt = this.buildPropertyAnalysisPrompt(request);

      const completion = await this.executeWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: request.customPrompt ? this.config.defaultModel : 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt('property_analysis'),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature || this.config.temperature,
          response_format: { type: 'json_object' },
        });
      });

      const latency = Date.now() - startTime;
      const usage = completion.usage!;

      // Parse response
      const content = completion.choices?.[0]?.message?.content ?? '{}';
      const analysis = JSON.parse(content);
      
      const response: PropertyAnalysisResponse = {
        propertyId: request.propertyId,
        analysisType: request.analysisType,
        summary: analysis.summary,
        keyInsights: analysis.keyInsights || [],
        riskFactors: analysis.riskFactors || [],
        marketComparables: analysis.marketComparables || [],
        valuation: analysis.valuation,
        confidence: analysis.confidence || 0.8,
        sources: analysis.sources || [],
        generatedAt: new Date(),
        requestId,
        cached: false,
      };

      // Track usage metrics
      await this.trackUsage({
        requestId,
        model: completion.model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost: this.calculateCost(completion.model, usage.prompt_tokens, usage.completion_tokens),
        latency,
        timestamp: new Date(),
        propertyId: request.propertyId,
        operation: 'property_analysis',
      });

      // Cache the response
      await this.cacheManager.set(cacheKey, response, { ttl: 3600, tags: ['property', request.propertyId] });

      // Store in database
      await this.aiDatabase.storeAnalysisResult(response, 'system', 3600);

      return response;

    } catch (error) {
      this.logger.error(`Property analysis failed for ${request.propertyId}:`, error);
      throw this.handleError(error, requestId);
    }
  }

  /**
   * Analyze document content using GPT-4
   */
  async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> {
    const requestId = this.generateRequestId();
    const cacheKey = this.generateCacheKey('document_analysis', request);

    try {
      // Check cache first
      const cached = await this.cacheManager.get<DocumentAnalysisResponse>(cacheKey);
      if (cached) {
        return { ...cached, requestId };
      }

      const startTime = Date.now();
      const prompt = this.buildDocumentAnalysisPrompt(request);

      const completion = await this.executeWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt('document_analysis'),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });
      });

      const processingTime = Date.now() - startTime;
      const usage = completion.usage!;

      // Parse response
      const content = completion.choices?.[0]?.message?.content ?? '{}';
      const analysis = JSON.parse(content);
      
      const response: DocumentAnalysisResponse = {
        documentId: request.documentId,
        documentType: request.documentType,
        extractionType: request.extractionType,
        summary: analysis.summary,
        structuredData: analysis.structuredData || {},
        issues: analysis.issues || [],
        compliance: analysis.compliance || [],
        entities: analysis.entities || [],
        confidence: analysis.confidence || 0.8,
        processingTime,
        requestId,
      };

      // Track usage
      await this.trackUsage({
        requestId,
        model: completion.model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost: this.calculateCost(completion.model, usage.prompt_tokens, usage.completion_tokens),
        latency: processingTime,
        timestamp: new Date(),
        operation: 'document_analysis',
      });

      // Cache the response
      await this.cacheManager.set(cacheKey, response, { ttl: 7200, tags: ['document', request.documentId] });

      return response;

    } catch (error) {
      this.logger.error(`Document analysis failed for ${request.documentId}:`, error);
      throw this.handleError(error, requestId);
    }
  }

  /**
   * Generate text completion
   */
  async generateCompletion(
    prompt: string,
    options: {
      model?: CompletionModel;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
      userId?: string;
    } = {},
  ): Promise<{ content: string; usage: AIUsageMetrics }> {
    const requestId = this.generateRequestId();

    try {
      const startTime = Date.now();

      const completion = await this.executeWithRetry(async () => {
        return await this.openai.chat.completions.create({
          model: options.model || this.config.defaultModel,
          messages: [
            ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
            { role: 'user' as const, content: prompt },
          ],
          max_tokens: options.maxTokens || this.config.maxTokens,
          temperature: options.temperature || this.config.temperature,
        });
      });

      const latency = Date.now() - startTime;
      const usage = completion.usage!;

      const usageMetrics: AIUsageMetrics = {
        requestId,
        model: completion.model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost: this.calculateCost(completion.model, usage.prompt_tokens, usage.completion_tokens),
        latency,
        timestamp: new Date(),
        userId: options.userId,
        operation: 'completion',
      };

      await this.trackUsage(usageMetrics);

      return {
        content: completion.choices?.[0]?.message?.content ?? '',
        usage: usageMetrics,
      };

    } catch (error) {
      this.logger.error('Completion generation failed:', error);
      throw this.handleError(error, requestId);
    }
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(model: string): ModelCapabilities {
    const pricing = this.MODEL_PRICING[model] || { input: 0, output: 0 };
    
    const capabilities: Record<string, Partial<ModelCapabilities>> = {
      'gpt-4': { maxTokens: 8192, contextWindow: 8192, supportsFunctions: true, supportsVision: false },
      'gpt-4-turbo': { maxTokens: 4096, contextWindow: 128000, supportsFunctions: true, supportsVision: true },
      'gpt-4o': { maxTokens: 4096, contextWindow: 128000, supportsFunctions: true, supportsVision: true },
      'gpt-3.5-turbo': { maxTokens: 4096, contextWindow: 16385, supportsFunctions: true, supportsVision: false },
    };

    return {
      model,
      maxTokens: capabilities[model]?.maxTokens || 4096,
      contextWindow: capabilities[model]?.contextWindow || 4096,
      supportsFunctions: capabilities[model]?.supportsFunctions || false,
      supportsVision: capabilities[model]?.supportsVision || false,
      costPer1kTokens: pricing,
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageLatency: number;
    errorRate: number;
  } {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'hour': cutoff.setHours(now.getHours() - 1); break;
      case 'day': cutoff.setDate(now.getDate() - 1); break;
      case 'week': cutoff.setDate(now.getDate() - 7); break;
      case 'month': cutoff.setMonth(now.getMonth() - 1); break;
    }

    const metrics = this.usageMetrics.filter(m => m.timestamp >= cutoff);
    
    return {
      totalRequests: metrics.length,
      totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
      totalCost: metrics.reduce((sum, m) => sum + m.cost, 0),
      averageLatency: metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length || 0,
      errorRate: 0, // TODO: Track errors separately
    };
  }

  // Private helper methods

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error) || attempt === this.config.maxRetries) {
          throw error;
        }

        const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    if (error?.status) {
      // Retry on rate limits, server errors, and timeouts
      return [429, 500, 502, 503, 504].includes(error.status);
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = this.MODEL_PRICING[model];
    if (!pricing) return 0;

    return (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(operation: string, data: any): string {
    const hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    return `ai:${operation}:${hash}`;
  }

  private async trackUsage(metrics: AIUsageMetrics): Promise<void> {
    this.usageMetrics.push(metrics);
    
    // Keep only last 10000 metrics in memory
    if (this.usageMetrics.length > 10000) {
      this.usageMetrics = this.usageMetrics.slice(-5000);
    }

    // Store in database for long-term analytics
    await this.aiDatabase.storeUsageMetrics(metrics);
    
    this.logger.debug(`Usage tracked: ${metrics.totalTokens} tokens, $${metrics.cost.toFixed(4)}`);
  }

  private handleError(error: any, requestId: string): AIError {
    const aiError: AIError = {
      code: error?.code || 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred',
      details: error,
      retryable: this.isRetryableError(error),
      timestamp: new Date(),
      requestId,
    };

    return aiError;
  }

  private buildPropertyAnalysisPrompt(request: PropertyAnalysisRequest): string {
    // TODO: Build comprehensive prompt based on property data
    return `Analyze the property with ID ${request.propertyId} for ${request.analysisType} analysis.`;
  }

  private buildDocumentAnalysisPrompt(request: DocumentAnalysisRequest): string {
    // TODO: Build document analysis prompt
    return `Analyze the ${request.documentType} document for ${request.extractionType} extraction.`;
  }

  private getSystemPrompt(type: 'property_analysis' | 'document_analysis'): string {
    const prompts = {
      property_analysis: `You are a real estate AI analyst for HomeHistory, a $1B+ real estate intelligence platform. 
        Provide comprehensive, data-driven property analysis with high accuracy and professional insights.
        Always respond in valid JSON format with the required fields.`,
      document_analysis: `You are a document analysis AI for HomeHistory real estate platform.
        Extract structured information, identify issues, and assess compliance accurately.
        Always respond in valid JSON format with the required fields.`,
    };

    return prompts[type] || 'You are a helpful AI assistant for real estate analysis.';
  }

  // Minimal helpers expected by report builder service
  async generatePropertySummary(property: any, propertyData: any): Promise<string> {
    const { content } = await this.generateCompletion(
      `Provide a concise executive summary for the property at ${property.address}, ${property.city}, ${property.state}.`,
      { systemPrompt: 'You are an expert real estate analyst. Return 3-5 sentences.' }
    );
    return content || 'Summary not available.';
  }

  async generateInsights(property: any, propertyData: any, incidents: any, insurance: any): Promise<any> {
    const { content } = await this.generateCompletion(
      `Generate key recommendations and risks for the property at ${property.address}, considering incidents and insurance context. Return JSON with {"recommendations": string[]}.`,
      { systemPrompt: 'Return valid JSON only.' }
    );
    try {
      const parsed = JSON.parse(content || '{}');
      return parsed;
    } catch {
      return { recommendations: [] };
    }
  }
}
