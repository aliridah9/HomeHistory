/**
 * Embedding Service - Text embedding generation and similarity search
 * Handles vector embeddings for semantic search and property matching
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { 
  EmbeddingRequest, 
  EmbeddingResponse, 
  SearchQuery, 
  SearchResult,
  AIUsageMetrics,
  EmbeddingModel,
  BatchProcessingJob
} from '../interfaces/ai.interfaces';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
import { PrismaService } from '../../modules/database/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI;
  private readonly DEFAULT_MODEL: EmbeddingModel = 'text-embedding-3-small';
  private readonly DEFAULT_DIMENSIONS = 1536;
  private readonly SIMILARITY_THRESHOLD = 0.7;

  // Embedding model specifications
  private readonly MODEL_SPECS = {
    'text-embedding-3-small': {
      dimensions: 1536,
      maxTokens: 8192,
      costPer1kTokens: 0.00002,
    },
    'text-embedding-3-large': {
      dimensions: 3072,
      maxTokens: 8192,
      costPer1kTokens: 0.00013,
    },
    'text-embedding-ada-002': {
      dimensions: 1536,
      maxTokens: 8192,
      costPer1kTokens: 0.0001,
    },
  };

  constructor(
    private configService: ConfigService,
    private cacheManager: CacheManagerService,
    private aiDatabase: AIDatabaseService,
    private prisma: PrismaService,
  ) {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      organization: this.configService.get<string>('OPENAI_ORG_ID'),
    });
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const requestId = this.generateRequestId();
    const model = request.model || this.DEFAULT_MODEL;
    const cacheKey = this.generateCacheKey(request.text, model);

    try {
      // Check cache first
      const cached = await this.cacheManager.get<EmbeddingResponse>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for embedding: ${request.text.substring(0, 50)}...`);
        return { ...cached, cached: true, requestId };
      }

      const startTime = Date.now();

      const spec = this.MODEL_SPECS[model as keyof typeof this.MODEL_SPECS];
      // Generate embedding
      const response = await this.openai.embeddings.create({
        model,
        input: request.text,
        dimensions: request.dimensions ?? spec?.dimensions
        
      });

      const latency = Date.now() - startTime;
      const embedding = response.data[0].embedding;
      const tokens = response.usage.total_tokens;
      const cost = this.calculateEmbeddingCost(model, tokens);

      const result: EmbeddingResponse = {
        embedding,
        model,
        dimensions: embedding.length,
        tokens,
        cost,
        cached: false,
        requestId,
      };

      // Track usage
      await this.trackEmbeddingUsage({
        requestId,
        model,
        promptTokens: tokens,
        completionTokens: 0,
        totalTokens: tokens,
        cost,
        latency,
        timestamp: new Date(),
        userId: request.userId,
        operation: 'embedding_generation',
      });

      // Cache the result
      await this.cacheManager.set(cacheKey, result, { 
        ttl: 86400, // 24 hours
        tags: ['embedding', model] 
      });

      return result;

    } catch (error) {
      this.logger.error(`Embedding generation failed for text: ${request.text.substring(0, 50)}...`, error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: {
      model?: EmbeddingModel;
      dimensions?: number;
      userId?: string;
      batchSize?: number;
    } = {},
  ): Promise<EmbeddingResponse[]> {
    const { model = this.DEFAULT_MODEL, batchSize = 100 } = options;
    const results: EmbeddingResponse[] = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => 
        this.generateEmbedding({
          text,
          model,
          dimensions: options.dimensions,
          userId: options.userId,
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await this.sleep(100);
      }
    }

    return results;
  }

  /**
   * Perform semantic similarity search
   */
  async similaritySearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      let queryEmbedding: number[];

      if (query.embedding) {
        queryEmbedding = query.embedding;
      } else {
        const embeddingResponse = await this.generateEmbedding({
          text: query.query,
          model: this.DEFAULT_MODEL,
        });
        queryEmbedding = embeddingResponse.embedding;
      }

      // Build SQL query with filters
      const whereConditions = this.buildWhereConditions(query.filters);
      const limit = query.limit || 20;
      const threshold = query.threshold || this.SIMILARITY_THRESHOLD;

      // Perform vector similarity search using pgvector
      const results = await this.prisma.$queryRaw`
        SELECT 
          p.id as property_id,
          p.address,
          p.city,
          p.state,
          p.property_type,
          pe.content,
          pe.metadata,
          (pe.embedding <=> ${queryEmbedding}::vector) as distance,
          (1 - (pe.embedding <=> ${queryEmbedding}::vector)) as similarity_score
        FROM property_embeddings pe
        JOIN properties p ON pe.property_id = p.id
        WHERE (1 - (pe.embedding <=> ${queryEmbedding}::vector)) > ${threshold}
          ${whereConditions ? `AND ${whereConditions}` : ''}
        ORDER BY pe.embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;

      return (results as any[]).map(row => ({
        propertyId: row.property_id,
        score: parseFloat(row.similarity_score),
        snippet: this.generateSnippet(row.content, query.query),
        highlights: this.extractHighlights(row.content, query.query),
        metadata: {
          address: row.address,
          city: row.city,
          state: row.state,
          propertyType: row.property_type,
          ...row.metadata,
        },
      }));

    } catch (error) {
      this.logger.error('Similarity search failed:', error);
      throw error;
    }
  }

  /**
   * Find similar properties based on property features
   */
  async findSimilarProperties(
    propertyId: string,
    options: {
      limit?: number;
      threshold?: number;
      includeFeatures?: string[];
    } = {},
  ): Promise<SearchResult[]> {
    try {
      const { limit = 10, threshold = 0.8 } = options;

      // Get the property's embedding
      const propertyEmbedding = await this.prisma.$queryRaw`
        SELECT embedding, content, metadata
        FROM property_embeddings
        WHERE property_id = ${propertyId}
        LIMIT 1
      `;

      if (!propertyEmbedding || (propertyEmbedding as any[]).length === 0) {
        throw new Error(`No embedding found for property ${propertyId}`);
      }

      const embedding = (propertyEmbedding as any)[0].embedding;

      // Find similar properties
      const results = await this.prisma.$queryRaw`
        SELECT 
          p.id as property_id,
          p.address,
          p.city,
          p.state,
          p.property_type,
          p.bedrooms,
          p.bathrooms,
          p.square_feet,
          pe.content,
          pe.metadata,
          (1 - (pe.embedding <=> ${embedding}::vector)) as similarity_score
        FROM property_embeddings pe
        JOIN properties p ON pe.property_id = p.id
        WHERE pe.property_id != ${propertyId}
          AND (1 - (pe.embedding <=> ${embedding}::vector)) > ${threshold}
        ORDER BY pe.embedding <=> ${embedding}::vector
        LIMIT ${limit}
      `;

      return (results as any[]).map(row => ({
        propertyId: row.property_id,
        score: parseFloat(row.similarity_score),
        snippet: row.content?.substring(0, 200) + '...',
        highlights: [],
        metadata: {
          address: row.address,
          city: row.city,
          state: row.state,
          propertyType: row.property_type,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          squareFeet: row.square_feet,
          ...row.metadata,
        },
      }));

    } catch (error) {
      this.logger.error(`Failed to find similar properties for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Store property embedding in database
   */
  async storePropertyEmbedding(
    propertyId: string,
    content: string,
    metadata: Record<string, any> = {},
    model: EmbeddingModel = this.DEFAULT_MODEL,
  ): Promise<void> {
    try {
      const embeddingResponse = await this.generateEmbedding({
        text: content,
        model,
      });

      // Store in database using AI database service
      await this.aiDatabase.storePropertyEmbedding(propertyId, embeddingResponse, content);

      this.logger.debug(`Stored embedding for property ${propertyId}`);

    } catch (error) {
      this.logger.error(`Failed to store embedding for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Update embeddings for all properties (batch job)
   */
  async updateAllPropertyEmbeddings(): Promise<BatchProcessingJob> {
    const jobId = this.generateJobId();
    
    try {
      // Get all properties that need embedding updates
      const properties = await this.prisma.property.findMany({
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          propertyType: true,
          yearBuilt: true,
          squareFeet: true,
          bedrooms: true,
          bathrooms: true,
        },
      });

      const job: BatchProcessingJob = {
        jobId,
        type: 'embedding',
        status: 'processing',
        items: properties,
        results: [],
        progress: 0,
        startedAt: new Date(),
      };

      // Process properties in background
      this.processPropertyEmbeddings(job);

      return job;

    } catch (error) {
      this.logger.error('Failed to start property embedding update job:', error);
      throw error;
    }
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    totalEmbeddings: number;
    modelDistribution: Record<string, number>;
    averageDimensions: number;
    lastUpdated: Date;
  }> {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_embeddings,
        AVG(array_length(embedding, 1)) as avg_dimensions,
        MAX(updated_at) as last_updated,
        model,
        COUNT(*) as model_count
      FROM property_embeddings
      GROUP BY model
    `;

    const modelDistribution: Record<string, number> = {};
    let totalEmbeddings = 0;
    let averageDimensions = 0;
    let lastUpdated = new Date(0);

    (stats as any[]).forEach(row => {
      const count = Number(row.model_count) || 0;
      modelDistribution[row.model as string] = count;
      totalEmbeddings += count;
      averageDimensions = Number(row.avg_dimensions) || 0;
      const updated = row.last_updated ? new Date(row.last_updated) : null;
      if (updated && updated > lastUpdated) {
        lastUpdated = updated;
      }
    });

    return {
      totalEmbeddings,
      modelDistribution,
      averageDimensions,
      lastUpdated,
    };
  }

  // Private helper methods

  private async processPropertyEmbeddings(job: BatchProcessingJob): Promise<void> {
    try {
      for (let i = 0; i < job.items.length; i++) {
        const property = job.items[i];
        
        try {
          const content = this.buildPropertyContent(property);
          await this.storePropertyEmbedding(property.id, content, {
            address: property.address,
            city: property.city,
            state: property.state,
            propertyType: property.propertyType,
          });

          job.results.push({ propertyId: property.id, status: 'success' });
        } catch (error) {
          job.results.push({ propertyId: property.id, status: 'error', error: error.message });
        }

        job.progress = ((i + 1) / job.items.length) * 100;
        
        // Add delay to respect rate limits
        await this.sleep(50);
      }

      job.status = 'completed';
      job.completedAt = new Date();

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    }
  }

  private buildPropertyContent(property: any): string {
    const parts = [
      `Property at ${property.address}, ${property.city}, ${property.state}`,
      `Type: ${property.propertyType}`,
    ];

    if (property.yearBuilt) parts.push(`Built in ${property.yearBuilt}`);
    if (property.squareFeet) parts.push(`${property.squareFeet} square feet`);
    if (property.bedrooms) parts.push(`${property.bedrooms} bedrooms`);
    if (property.bathrooms) parts.push(`${property.bathrooms} bathrooms`);

    return parts.join('. ');
  }

  private buildWhereConditions(filters: SearchQuery['filters']): string {
    if (!filters) return '';

    const conditions = [];

    if (filters.propertyType?.length) {
      const types = filters.propertyType.map(t => `'${t}'`).join(',');
      conditions.push(`p.property_type IN (${types})`);
    }

    if (filters.priceRange) {
      conditions.push(`p.purchase_price BETWEEN ${filters.priceRange[0]} AND ${filters.priceRange[1]}`);
    }

    if (filters.location?.city) {
      conditions.push(`p.city ILIKE '%${filters.location.city}%'`);
    }

    if (filters.location?.state) {
      conditions.push(`p.state = '${filters.location.state}'`);
    }

    if (filters.dateRange) {
      conditions.push(`p.created_at BETWEEN '${filters.dateRange[0].toISOString()}' AND '${filters.dateRange[1].toISOString()}'`);
    }

    return conditions.join(' AND ');
  }

  private generateSnippet(content: string, query: string): string {
    if (!content) return '';
    
    const queryWords = query.toLowerCase().split(' ');
    const sentences = content.split('. ');
    
    // Find sentence with most query word matches
    let bestSentence = sentences[0];
    let maxMatches = 0;
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const matches = queryWords.filter(word => lowerSentence.includes(word)).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }
    
    return bestSentence.length > 200 ? bestSentence.substring(0, 200) + '...' : bestSentence;
  }

  private extractHighlights(content: string, query: string): string[] {
    const queryWords = query.toLowerCase().split(' ');
    const highlights = [];
    
    for (const word of queryWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        highlights.push(...matches);
      }
    }
    
    return [...new Set(highlights)]; // Remove duplicates
  }

  private calculateEmbeddingCost(model: string, tokens: number): number {
    const costPer1kTokens = this.MODEL_SPECS[model as EmbeddingModel]?.costPer1kTokens || 0.0001;
    return (tokens / 1000) * costPer1kTokens;
  }

  private generateRequestId(): string {
    return `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(text: string, model: string): string {
    const hash = createHash('sha256').update(`${text}:${model}`).digest('hex');
    return `embedding:${model}:${hash}`;
  }

  private async trackEmbeddingUsage(metrics: AIUsageMetrics): Promise<void> {
    // TODO: Store usage metrics in database
    this.logger.debug(`Embedding usage: ${metrics.totalTokens} tokens, $${metrics.cost.toFixed(6)}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
