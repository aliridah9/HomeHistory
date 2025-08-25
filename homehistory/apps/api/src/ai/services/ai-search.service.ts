/**
 * AI Search Service - Natural Language Search Engine for HomeHistory
 * Implements hybrid search combining NLP, vector similarity, and traditional filters
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../modules/database/prisma.service';
import { EmbeddingService } from './embedding.service';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
import { createHash } from 'crypto';

// Search interfaces
export interface NaturalLanguageQuery {
  query: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface ExtractedSearchCriteria {
  propertyTypes?: string[];
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
    neighborhood?: string;
    radius?: number;
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  features?: {
    bedrooms?: { min?: number; max?: number };
    bathrooms?: { min?: number; max?: number };
    squareFeet?: { min?: number; max?: number };
    yearBuilt?: { min?: number; max?: number };
  };
  amenities?: string[];
  vibeKeywords?: string[];
  sortBy?: 'relevance' | 'price' | 'date' | 'size';
  sortOrder?: 'asc' | 'desc';
  confidence: number;
}

export interface SearchResult {
  propertyId: string;
  relevanceScore: number;
  semanticScore: number;
  filterScore: number;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    yearBuilt?: number;
    price?: number;
    description?: string;
    amenities?: string[];
    images?: string[];
  };
  matchReasons: string[];
  highlights: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  searchTime: number;
  query: {
    original: string;
    processed: ExtractedSearchCriteria;
    embedding?: number[];
  };
  suggestions?: string[];
  filters: {
    appliedFilters: Record<string, any>;
    availableFilters: Record<string, any>;
  };
}

@Injectable()
export class AISearchService {
  private readonly logger = new Logger(AISearchService.name);
  private openai: OpenAI;

  // OpenAI Function Schema for search criteria extraction
  private readonly SEARCH_FUNCTION_SCHEMA = {
    name: 'extract_search_criteria',
    description: 'Extract structured search criteria from natural language property search queries',
    parameters: {
      type: 'object',
      properties: {
        propertyTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['SINGLE_FAMILY', 'MULTI_FAMILY', 'CONDO', 'TOWNHOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER']
          },
          description: 'Types of properties the user is looking for'
        },
        location: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
            state: { type: 'string', description: 'State code (e.g., CA, NY)' },
            zipCode: { type: 'string', description: 'ZIP code' },
            neighborhood: { type: 'string', description: 'Neighborhood or area name' },
            radius: { type: 'number', description: 'Search radius in miles' }
          },
          description: 'Location-based search criteria'
        },
        priceRange: {
          type: 'object',
          properties: {
            min: { type: 'number', description: 'Minimum price in USD' },
            max: { type: 'number', description: 'Maximum price in USD' }
          },
          description: 'Price range constraints'
        },
        features: {
          type: 'object',
          properties: {
            bedrooms: {
              type: 'object',
              properties: {
                min: { type: 'number', description: 'Minimum number of bedrooms' },
                max: { type: 'number', description: 'Maximum number of bedrooms' }
              }
            },
            bathrooms: {
              type: 'object',
              properties: {
                min: { type: 'number', description: 'Minimum number of bathrooms' },
                max: { type: 'number', description: 'Maximum number of bathrooms' }
              }
            },
            squareFeet: {
              type: 'object',
              properties: {
                min: { type: 'number', description: 'Minimum square footage' },
                max: { type: 'number', description: 'Maximum square footage' }
              }
            },
            yearBuilt: {
              type: 'object',
              properties: {
                min: { type: 'number', description: 'Minimum year built' },
                max: { type: 'number', description: 'Maximum year built' }
              }
            }
          },
          description: 'Property feature constraints'
        },
        amenities: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'pool', 'garage', 'yard', 'garden', 'balcony', 'patio', 'deck',
              'fireplace', 'air_conditioning', 'heating', 'dishwasher', 'washer_dryer',
              'walk_in_closet', 'hardwood_floors', 'carpet', 'tile', 'granite_counters',
              'stainless_appliances', 'updated_kitchen', 'master_suite', 'office',
              'basement', 'attic', 'security_system', 'gated_community', 'elevator',
              'concierge', 'gym', 'spa', 'tennis_court', 'golf_course', 'waterfront',
              'mountain_view', 'city_view', 'park_view', 'pet_friendly'
            ]
          },
          description: 'Desired amenities and features'
        },
        vibeKeywords: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'modern', 'contemporary', 'traditional', 'rustic', 'luxury', 'cozy',
              'spacious', 'intimate', 'family_friendly', 'quiet', 'vibrant',
              'walkable', 'suburban', 'urban', 'rural', 'trendy', 'historic',
              'new_construction', 'renovated', 'move_in_ready', 'fixer_upper',
              'investment', 'starter_home', 'dream_home', 'retirement'
            ]
          },
          description: 'Lifestyle and aesthetic preferences'
        },
        sortBy: {
          type: 'string',
          enum: ['relevance', 'price', 'date', 'size'],
          description: 'How to sort the results'
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order'
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence level in the extraction (0-1)'
        }
      },
      required: ['confidence']
    }
  };

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
    private cacheManager: CacheManagerService,
    private aiDatabase: AIDatabaseService,
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
   * Process natural language query and return search results
   */
  async processNaturalLanguageQuery(query: NaturalLanguageQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      this.logger.log(`Processing NL query: "${query.query}"`);

      // Step 1: Extract structured criteria using GPT-4 function calling
      const extractedCriteria = await this.extractSearchCriteria(query.query);

      // Step 2: Generate embedding for semantic search
      const embedding = await this.generateSearchEmbedding(query.query);

      // Step 3: Perform hybrid search
      const searchResults = await this.hybridSearch(
        extractedCriteria,
        embedding,
        {
          limit: query.limit || 20,
          offset: query.offset || 0,
          userId: query.userId,
        }
      );

      // Step 4: Generate suggestions and available filters
      const suggestions = await this.generateSearchSuggestions(query.query, extractedCriteria);
      const availableFilters = await this.getAvailableFilters(extractedCriteria);

      const searchTime = Date.now() - startTime;

      const response: SearchResponse = {
        results: searchResults.results,
        totalCount: searchResults.totalCount,
        searchTime,
        query: {
          original: query.query,
          processed: extractedCriteria,
          embedding: embedding.embedding,
        },
        suggestions,
        filters: {
          appliedFilters: this.extractAppliedFilters(extractedCriteria),
          availableFilters,
        },
      };

      // Track search analytics
      await this.trackSearchAnalytics({
        requestId,
        userId: query.userId,
        originalQuery: query.query,
        extractedCriteria,
        resultCount: searchResults.totalCount,
        searchTime,
        confidence: extractedCriteria.confidence,
      });

      this.logger.log(`NL search completed: ${searchResults.totalCount} results in ${searchTime}ms`);

      return response;

    } catch (error) {
      this.logger.error(`Natural language search failed for query: "${query.query}"`, error);
      throw error;
    }
  }

  /**
   * Extract structured search criteria from natural language using GPT-4
   */
  async extractSearchCriteria(query: string): Promise<ExtractedSearchCriteria> {
    const cacheKey = `search_criteria:${this.hashString(query)}`;

    try {
      // Check cache first
      const cached = await this.cacheManager.get<ExtractedSearchCriteria>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for search criteria extraction: ${query}`);
        return cached;
      }

      // Use GPT-4 with function calling to extract criteria
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a real estate search expert. Extract structured search criteria from natural language property search queries. 
            Be comprehensive but conservative - only extract criteria you're confident about. 
            For ambiguous terms, prefer broader interpretations. 
            Always provide a confidence score based on query clarity.`
          },
          {
            role: 'user',
            content: `Extract search criteria from this property search query: "${query}"`
          }
        ],
        functions: [this.SEARCH_FUNCTION_SCHEMA],
        function_call: { name: 'extract_search_criteria' },
        temperature: 0.1,
      });

      const functionCall = completion.choices[0].message.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error('Failed to extract search criteria from query');
      }

      const extractedCriteria: ExtractedSearchCriteria = JSON.parse(functionCall.arguments);

      // Cache the result
      await this.cacheManager.set(cacheKey, extractedCriteria, { 
        ttl: 3600, // 1 hour
        tags: ['search', 'criteria'] 
      });

      this.logger.debug(`Extracted criteria from "${query}":`, extractedCriteria);

      return extractedCriteria;

    } catch (error) {
      this.logger.error(`Failed to extract search criteria from query: "${query}"`, error);
      
      // Return fallback criteria
      return {
        vibeKeywords: [query],
        confidence: 0.1,
      };
    }
  }

  /**
   * Generate search embedding for semantic similarity
   */
  async generateSearchEmbedding(query: string): Promise<{ embedding: number[]; model: string }> {
    try {
      const embeddingResponse = await this.embeddingService.generateEmbedding({
        text: query,
        model: 'text-embedding-3-small',
      });

      return {
        embedding: embeddingResponse.embedding,
        model: embeddingResponse.model,
      };

    } catch (error) {
      this.logger.error(`Failed to generate search embedding for query: "${query}"`, error);
      throw error;
    }
  }

  /**
   * Perform hybrid search combining traditional filters with vector similarity
   */
  async hybridSearch(
    criteria: ExtractedSearchCriteria,
    embedding: { embedding: number[]; model: string },
    options: {
      limit: number;
      offset: number;
      userId?: string;
    }
  ): Promise<{ results: SearchResult[]; totalCount: number }> {
    try {
      // Build SQL WHERE conditions for traditional filters
      const whereConditions = this.buildWhereConditions(criteria);
      
      // Perform vector similarity search with traditional filters
      const vectorSearchQuery = `
        WITH ranked_properties AS (
          SELECT 
            p.id,
            p.address,
            p.city,
            p.state,
            p.zip_code,
            p.property_type,
            p.bedrooms,
            p.bathrooms,
            p.square_feet,
            p.year_built,
            pe.content,
            pe.embedding,
            -- Calculate semantic similarity score
            (1 - (pe.embedding <=> $1::vector)) as semantic_score,
            -- Calculate filter match score
            CASE 
              WHEN p.property_type = ANY($2::text[]) THEN 0.2
              ELSE 0
            END +
            CASE 
              WHEN p.city ILIKE ANY($3::text[]) THEN 0.2
              ELSE 0
            END +
            CASE 
              WHEN p.bedrooms BETWEEN $4 AND $5 THEN 0.15
              ELSE 0
            END +
            CASE 
              WHEN p.bathrooms BETWEEN $6 AND $7 THEN 0.15
              ELSE 0
            END +
            CASE 
              WHEN p.square_feet BETWEEN $8 AND $9 THEN 0.1
              ELSE 0
            END as filter_score
          FROM properties p
          LEFT JOIN property_embeddings pe ON p.id = pe.property_id
          WHERE 
            pe.embedding IS NOT NULL
            ${whereConditions.sql ? `AND ${whereConditions.sql}` : ''}
        )
        SELECT 
          *,
          -- Combined relevance score (70% semantic, 30% filter match)
          (semantic_score * 0.7 + filter_score * 0.3) as relevance_score
        FROM ranked_properties
        WHERE semantic_score > 0.3  -- Minimum similarity threshold
        ORDER BY relevance_score DESC, semantic_score DESC
        LIMIT $10 OFFSET $11
      `;

      // Prepare query parameters
      const params = [
        embedding.embedding, // $1
        criteria.propertyTypes || [], // $2
        this.prepareCityFilters(criteria.location?.city), // $3
        criteria.features?.bedrooms?.min || 0, // $4
        criteria.features?.bedrooms?.max || 99, // $5
        criteria.features?.bathrooms?.min || 0, // $6
        criteria.features?.bathrooms?.max || 99, // $7
        criteria.features?.squareFeet?.min || 0, // $8
        criteria.features?.squareFeet?.max || 999999, // $9
        options.limit, // $10
        options.offset, // $11
        ...whereConditions.params, // Additional parameters
      ];

      // Execute the search query
      const rawResults = await this.prisma.$queryRawUnsafe(vectorSearchQuery, ...params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM properties p
        LEFT JOIN property_embeddings pe ON p.id = pe.property_id
        WHERE 
          pe.embedding IS NOT NULL
          AND (1 - (pe.embedding <=> $1::vector)) > 0.3
          ${whereConditions.sql ? `AND ${whereConditions.sql}` : ''}
      `;

      const countResult = await this.prisma.$queryRawUnsafe(
        countQuery, 
        embedding.embedding, 
        ...whereConditions.params
      );

      const totalCount = parseInt((countResult as any)[0]?.total || '0');

      // Transform results
      const results: SearchResult[] = (rawResults as any[]).map(row => ({
        propertyId: row.id,
        relevanceScore: parseFloat(row.relevance_score),
        semanticScore: parseFloat(row.semantic_score),
        filterScore: parseFloat(row.filter_score),
        property: {
          id: row.id,
          address: row.address,
          city: row.city,
          state: row.state,
          zipCode: row.zip_code,
          propertyType: row.property_type,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          squareFeet: row.square_feet,
          yearBuilt: row.year_built,
        },
        matchReasons: this.generateMatchReasons(criteria, row),
        highlights: this.extractHighlights(row.content, criteria),
      }));

      return { results, totalCount };

    } catch (error) {
      this.logger.error('Hybrid search failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private buildWhereConditions(criteria: ExtractedSearchCriteria): { sql: string; params: any[] } {
    const conditions = [];
    const params = [];
    let paramIndex = 12; // Starting after the main query parameters

    if (criteria.location?.state) {
      conditions.push(`p.state = $${paramIndex}`);
      params.push(criteria.location.state);
      paramIndex++;
    }

    if (criteria.location?.zipCode) {
      conditions.push(`p.zip_code = $${paramIndex}`);
      params.push(criteria.location.zipCode);
      paramIndex++;
    }

    if (criteria.priceRange?.min || criteria.priceRange?.max) {
      if (criteria.priceRange.min) {
        conditions.push(`p.price >= $${paramIndex}`);
        params.push(criteria.priceRange.min);
        paramIndex++;
      }
      if (criteria.priceRange.max) {
        conditions.push(`p.price <= $${paramIndex}`);
        params.push(criteria.priceRange.max);
        paramIndex++;
      }
    }

    if (criteria.features?.yearBuilt?.min || criteria.features?.yearBuilt?.max) {
      if (criteria.features.yearBuilt.min) {
        conditions.push(`p.year_built >= $${paramIndex}`);
        params.push(criteria.features.yearBuilt.min);
        paramIndex++;
      }
      if (criteria.features.yearBuilt.max) {
        conditions.push(`p.year_built <= $${paramIndex}`);
        params.push(criteria.features.yearBuilt.max);
        paramIndex++;
      }
    }

    return {
      sql: conditions.join(' AND '),
      params,
    };
  }

  private prepareCityFilters(city?: string): string[] {
    if (!city) return ['%'];
    return [`%${city}%`];
  }

  private generateMatchReasons(criteria: ExtractedSearchCriteria, property: any): string[] {
    const reasons = [];

    if (criteria.propertyTypes?.includes(property.property_type)) {
      reasons.push(`Matches property type: ${property.property_type}`);
    }

    if (criteria.location?.city && property.city.toLowerCase().includes(criteria.location.city.toLowerCase())) {
      reasons.push(`Located in ${property.city}`);
    }

    if (criteria.features?.bedrooms) {
      const { min, max } = criteria.features.bedrooms;
      if (property.bedrooms >= (min || 0) && property.bedrooms <= (max || 99)) {
        reasons.push(`Has ${property.bedrooms} bedrooms`);
      }
    }

    if (criteria.features?.bathrooms) {
      const { min, max } = criteria.features.bathrooms;
      if (property.bathrooms >= (min || 0) && property.bathrooms <= (max || 99)) {
        reasons.push(`Has ${property.bathrooms} bathrooms`);
      }
    }

    return reasons;
  }

  private extractHighlights(content: string, criteria: ExtractedSearchCriteria): string[] {
    const highlights = [];
    
    if (criteria.vibeKeywords) {
      for (const keyword of criteria.vibeKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (content && regex.test(content)) {
          highlights.push(keyword);
        }
      }
    }

    return highlights;
  }

  private async generateSearchSuggestions(
    originalQuery: string,
    criteria: ExtractedSearchCriteria
  ): Promise<string[]> {
    // Generate suggestions based on common searches and extracted criteria
    const suggestions = [];

    if (criteria.location?.city) {
      suggestions.push(`${criteria.location.city} homes for sale`);
      suggestions.push(`Best neighborhoods in ${criteria.location.city}`);
    }

    if (criteria.propertyTypes?.length) {
      for (const type of criteria.propertyTypes) {
        suggestions.push(`${type.toLowerCase().replace('_', ' ')} properties`);
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  private async getAvailableFilters(criteria: ExtractedSearchCriteria): Promise<Record<string, any>> {
    // Get available filter options based on current search context
    return {
      propertyTypes: ['SINGLE_FAMILY', 'CONDO', 'TOWNHOUSE', 'APARTMENT'],
      priceRanges: [
        { label: 'Under $300K', min: 0, max: 300000 },
        { label: '$300K - $500K', min: 300000, max: 500000 },
        { label: '$500K - $750K', min: 500000, max: 750000 },
        { label: '$750K+', min: 750000, max: null },
      ],
      bedrooms: [1, 2, 3, 4, 5],
      bathrooms: [1, 1.5, 2, 2.5, 3, 3.5, 4],
    };
  }

  private extractAppliedFilters(criteria: ExtractedSearchCriteria): Record<string, any> {
    const applied: Record<string, unknown> = {};

    if (criteria.propertyTypes?.length) {
      applied['propertyTypes'] = criteria.propertyTypes;
    }

    if (criteria.location) {
      applied['location'] = criteria.location;
    }

    if (criteria.priceRange) {
      applied['priceRange'] = criteria.priceRange;
    }

    if (criteria.features) {
      applied['features'] = criteria.features;
    }

    return applied;
  }

  private async trackSearchAnalytics(analytics: {
    requestId: string;
    userId?: string;
    originalQuery: string;
    extractedCriteria: ExtractedSearchCriteria;
    resultCount: number;
    searchTime: number;
    confidence: number;
  }): Promise<void> {
    try {
      // Store search analytics in database
      await this.aiDatabase.storeUsageMetrics({
        requestId: analytics.requestId,
        model: 'gpt-4',
        operation: 'natural_language_search',
        userId: analytics.userId,
        promptTokens: 0, // Will be tracked by OpenAI service
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        latency: analytics.searchTime,
        timestamp: new Date(),
      });

      this.logger.debug(`Tracked search analytics: ${analytics.requestId}`);
    } catch (error) {
      this.logger.error('Failed to track search analytics:', error);
      // Don't throw - analytics failure shouldn't break search
    }
  }

  private generateRequestId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex');
  }
}
