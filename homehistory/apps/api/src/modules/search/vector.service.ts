/**
 * Vector Service - pgvector operations for semantic search
 * Handles vector similarity search with Supabase pgvector extension
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface VectorSearchOptions {
  embedding: number[];
  threshold?: number;
  limit?: number;
  filters?: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  distance: number;
  similarity: number;
  content: string;
  metadata: any;
}

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Perform vector similarity search
   */
  async searchSimilar(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const {
      embedding,
      threshold = 0.3,
      limit = 20,
      filters = {}
    } = options;

    try {
      // Build filter conditions
      let whereClause = '';
      const params = [embedding, threshold, limit];
      let paramIndex = 4;

      if (filters.propertyType) {
        whereClause += ` AND p.property_type = $${paramIndex}`;
        params.push(filters.propertyType);
        paramIndex++;
      }

      if (filters.city) {
        whereClause += ` AND p.city ILIKE $${paramIndex}`;
        params.push(`%${filters.city}%` as any);
        paramIndex++;
      }

      if (filters.minPrice) {
        whereClause += ` AND p.price >= $${paramIndex}`;
        params.push(filters.minPrice);
        paramIndex++;
      }

      if (filters.maxPrice) {
        whereClause += ` AND p.price <= $${paramIndex}`;
        params.push(filters.maxPrice);
        paramIndex++;
      }

      // Execute vector similarity search
      const query = `
        SELECT 
          pe.property_id as id,
          pe.content,
          pe.metadata,
          (pe.embedding <=> $1::vector) as distance,
          (1 - (pe.embedding <=> $1::vector)) as similarity,
          p.address,
          p.city,
          p.state,
          p.property_type,
          p.price
        FROM property_embeddings pe
        JOIN properties p ON pe.property_id = p.id
        WHERE (1 - (pe.embedding <=> $1::vector)) > $2
          ${whereClause}
        ORDER BY pe.embedding <=> $1::vector
        LIMIT $3
      `;

      const results = await this.prisma.$queryRawUnsafe(query, ...params);

      return (results as any[]).map(row => ({
        id: row.id,
        distance: parseFloat(row.distance),
        similarity: parseFloat(row.similarity),
        content: row.content,
        metadata: {
          ...row.metadata,
          address: row.address,
          city: row.city,
          state: row.state,
          propertyType: row.property_type,
          price: row.price,
        },
      }));

    } catch (error) {
      this.logger.error('Vector similarity search failed:', error);
      throw error;
    }
  }

  /**
   * Find similar properties by property ID
   */
  async findSimilarProperties(
    propertyId: string,
    options: {
      limit?: number;
      threshold?: number;
      excludeSelf?: boolean;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const { limit = 10, threshold = 0.7, excludeSelf = true } = options;

    try {
      // Get the property's embedding
      const propertyEmbedding = await this.prisma.propertyEmbedding.findUnique({
        where: { propertyId },
        select: { embedding: true },
      });

      if (!propertyEmbedding) {
        throw new Error(`No embedding found for property ${propertyId}`);
      }

      const embedding = propertyEmbedding.embedding as number[];

      // Find similar properties
      const query = `
        SELECT 
          pe.property_id as id,
          pe.content,
          pe.metadata,
          (pe.embedding <=> $1::vector) as distance,
          (1 - (pe.embedding <=> $1::vector)) as similarity,
          p.address,
          p.city,
          p.state,
          p.property_type,
          p.bedrooms,
          p.bathrooms,
          p.square_feet,
          p.price
        FROM property_embeddings pe
        JOIN properties p ON pe.property_id = p.id
        WHERE (1 - (pe.embedding <=> $1::vector)) > $2
          ${excludeSelf ? 'AND pe.property_id != $4' : ''}
        ORDER BY pe.embedding <=> $1::vector
        LIMIT $3
      `;

      const params = excludeSelf 
        ? [embedding, threshold, limit, propertyId]
        : [embedding, threshold, limit];

      const results = await this.prisma.$queryRawUnsafe(query, ...params);

      return (results as any[]).map(row => ({
        id: row.id,
        distance: parseFloat(row.distance),
        similarity: parseFloat(row.similarity),
        content: row.content,
        metadata: {
          ...row.metadata,
          address: row.address,
          city: row.city,
          state: row.state,
          propertyType: row.property_type,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          squareFeet: row.square_feet,
          price: row.price,
        },
      }));

    } catch (error) {
      this.logger.error(`Failed to find similar properties for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Get vector search statistics
   */
  async getVectorStats(): Promise<{
    totalEmbeddings: number;
    averageDimensions: number;
    indexHealth: string;
  }> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_embeddings,
          AVG(array_length(embedding, 1)) as avg_dimensions
        FROM property_embeddings
        WHERE embedding IS NOT NULL
      `;

      const result = (stats as any[])[0];

      return {
        totalEmbeddings: parseInt(result.total_embeddings || '0'),
        averageDimensions: parseFloat(result.avg_dimensions || '0'),
        indexHealth: 'healthy', // TODO: Add actual index health check
      };

    } catch (error) {
      this.logger.error('Failed to get vector stats:', error);
      return {
        totalEmbeddings: 0,
        averageDimensions: 0,
        indexHealth: 'unknown',
      };
    }
  }

  /**
   * Optimize vector search performance
   */
  async optimizeVectorIndex(): Promise<{ success: boolean; message: string }> {
    try {
      // Rebuild vector index for better performance
      await this.prisma.$executeRaw`
        REINDEX INDEX idx_property_embeddings_vector;
      `;

      // Update table statistics
      await this.prisma.$executeRaw`
        ANALYZE property_embeddings;
      `;

      this.logger.log('Vector index optimization completed');

      return {
        success: true,
        message: 'Vector index optimized successfully',
      };

    } catch (error) {
      this.logger.error('Vector index optimization failed:', error);
      return {
        success: false,
        message: `Optimization failed: ${error.message}`,
      };
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Mock implementation - in production this would call OpenAI's embedding API
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
    return mockEmbedding;
  }

  async parseSearchIntent(query: string): Promise<any> {
    // Mock implementation - in production this would use NLP to parse intent
    return {
      type: 'property_search',
      filters: {
        propertyType: query.includes('house') ? 'SINGLE_FAMILY' : undefined,
        bedrooms: query.match(/(\d+)\s*bedroom/)?.[1] ? parseInt(query.match(/(\d+)\s*bedroom/)?.[1] || '0') : undefined,
        priceRange: query.includes('under') ? 'low' : query.includes('over') ? 'high' : undefined,
      }
    };
  }
}
