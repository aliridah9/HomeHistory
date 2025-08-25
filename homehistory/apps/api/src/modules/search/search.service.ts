import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { VectorService } from './vector.service';
import { NaturalSearchDto, FilterSearchDto, SearchResultDto } from './dto';
import { Property, Report } from '@homehistory/database';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private vectorService: VectorService,
  ) {}

  async naturalSearch(userId: string, dto: NaturalSearchDto): Promise<SearchResultDto> {
    // Generate embedding for the search query
    const queryEmbedding = await this.vectorService.generateEmbedding(dto.query);

    // Search in vector database
    const vectorResults = await this.supabase.searchByVector(
      'property_embeddings',
      queryEmbedding,
      dto.limit || 10,
      0.7, // similarity threshold
    );

    // Get property IDs from vector results
    const propertyIds = vectorResults.map((r: any) => r.property_id);

    // Fetch full property data with RLS
    const properties = await this.prisma.property.findMany({
      where: {
        id: { in: propertyIds },
        userId, // RLS filter
      },
      include: {
        reports: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Parse user intent from query
    const intent = await this.vectorService.parseSearchIntent(dto.query);

    return {
      id: properties[0]?.id || '',
      address: properties[0]?.address || '',
      city: properties[0]?.city || '',
      state: properties[0]?.state || '',
      zipCode: properties[0]?.zipCode || '',
      price: (properties[0] as any)?.price || 0,
      bedrooms: properties[0]?.bedrooms || 0,
      bathrooms: properties[0]?.bathrooms || 0,
      propertyType: properties[0]?.propertyType || '',
      relevanceScore: vectorResults[0]?.similarity || 0,
      insights: dto.includeInsights ? ['AI-powered search result'] : [],
    };
  }

  async filterSearch(userId: string, dto: FilterSearchDto): Promise<SearchResultDto> {
    const whereClause: any = {
      userId, // RLS filter
    };

    // Build filter conditions
    if (dto.city) {
      whereClause.city = { contains: dto.city, mode: 'insensitive' };
    }

    if (dto.state) {
      whereClause.state = dto.state;
    }

    if (dto.minPrice || dto.maxPrice) {
      whereClause.price = {
        gte: dto.minPrice || 0,
        lte: dto.maxPrice || 999999999,
      };
    }

    if (dto.minBedrooms || dto.maxBedrooms) {
      whereClause.bedrooms = {
        gte: dto.minBedrooms || 0,
        lte: dto.maxBedrooms || 999,
      };
    }

    if (dto.propertyType) {
      whereClause.propertyType = dto.propertyType;
    }

    // Execute search
    const properties = await this.prisma.property.findMany({
      where: whereClause,
      include: {
        reports: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: 0,
    });

    // Return first result as SearchResultDto
    const property = properties[0];
    if (!property) {
      return {
        id: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        propertyType: '',
        relevanceScore: 0,
        insights: [],
      };
    }

    return {
      id: property.id,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      price: (property as any)?.price || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      propertyType: property.propertyType || '',
      relevanceScore: 1.0,
      insights: ['Filter-based search result'],
    };
  }

  async getSuggestions(userId: string, query: string): Promise<string[]> {
    // Get user's recent searches
    const recentSearches = await this.prisma.auditLog.findMany({
      where: {
        userId,
        action: 'search_performed',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get popular search terms
    const popularSearches = await this.prisma.$queryRaw<any[]>`
      SELECT metadata->>'query' as query, COUNT(*) as count
      FROM audit_logs
      WHERE action = 'search_performed'
      AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY metadata->>'query'
      ORDER BY count DESC
      LIMIT 10
    `;

    // Combine and deduplicate suggestions
    const suggestions = new Set<string>();
    
    // Add autocomplete based on query
    if (query.length >= 2) {
      const properties = await this.prisma.property.findMany({
        where: {
          userId,
          OR: [
            { address: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      properties.forEach(p => {
        suggestions.add(p.address);
        suggestions.add(`${p.city}, ${p.state}`);
      });
    }

    // Add recent searches
    recentSearches.forEach(log => {
      const metadata = log.metadata as any;
      if (metadata?.query) {
        suggestions.add(metadata.query);
      }
    });

    // Add popular searches
    popularSearches.forEach(search => {
      if (search.query) {
        suggestions.add(search.query);
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }

  async findSimilarProperties(userId: string, propertyId: string, limit: number = 5): Promise<Property[]> {
    // Get the reference property
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId, userId },
    });

    if (!property) {
      return [];
    }

    // Find similar properties based on multiple criteria
    const similarProperties = await this.prisma.property.findMany({
      where: {
        userId,
        NOT: { id: propertyId },
        AND: [
          // Similar location
          {
            OR: [
              { city: property.city },
              {
                AND: [
                  { latitude: { gte: property.latitude! - 0.05 } },
                  { latitude: { lte: property.latitude! + 0.05 } },
                  { longitude: { gte: property.longitude! - 0.05 } },
                  { longitude: { lte: property.longitude! + 0.05 } },
                ],
              },
            ],
          },
          // Similar size (within 20%)
          property.squareFeet ? {
            squareFeet: {
              gte: Math.floor(property.squareFeet * 0.8),
              lte: Math.ceil(property.squareFeet * 1.2),
            },
          } : {},
          // Similar age (within 10 years)
          property.yearBuilt ? {
            yearBuilt: {
              gte: property.yearBuilt - 10,
              lte: property.yearBuilt + 10,
            },
          } : {},
        ],
      },
      include: {
        reports: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: limit,
    });

    // If we have embeddings, also search by vector similarity
    if (similarProperties.length < limit) {
      const embedding = await this.getPropertyEmbedding(propertyId);
      if (embedding) {
        const vectorResults = await this.supabase.searchByVector(
          'property_embeddings',
          embedding,
          limit - similarProperties.length,
          0.8,
        );

        const additionalIds = vectorResults
          .map((r: any) => r.property_id)
          .filter((id: string) => id !== propertyId && !similarProperties.find(p => p.id === id));

        const additionalProperties = await this.prisma.property.findMany({
          where: {
            id: { in: additionalIds },
            userId,
          },
          include: {
            reports: {
              where: { status: 'published' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        similarProperties.push(...additionalProperties);
      }
    }

    return similarProperties;
  }

  private generateHighlights(property: Property, query: string): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/\s+/);

    // Check address
    if (terms.some(term => property.address.toLowerCase().includes(term))) {
      highlights.address = [property.address];
    }

    // Check city
    if (terms.some(term => property.city.toLowerCase().includes(term))) {
      highlights.city = [property.city];
    }

    // Check property type
    if (property.propertyType && terms.some(term => property.propertyType!.toLowerCase().includes(term))) {
      highlights.propertyType = [property.propertyType];
    }

    return highlights;
  }

  private async getPropertyEmbedding(propertyId: string): Promise<number[] | null> {
    const result = await this.supabase.getAdminClient()
      .from('property_embeddings')
      .select('embedding')
      .eq('property_id', propertyId)
      .single();

    return result.data?.embedding || null;
  }

  async searchProperties(searchCriteria: any, userId: string): Promise<SearchResultDto[]> {
    // Implementation for property search
    const properties = await this.prisma.property.findMany({
      where: { userId },
      take: 10,
    });

    return properties.map(property => ({
      id: property.id,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      price: (property as any)?.price || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      propertyType: property.propertyType || '',
      relevanceScore: 1.0,
      insights: ['Search result'],
    }));
  }

  async getSearchSuggestions(query: string, userId: string): Promise<string[]> {
    return this.getSuggestions(userId, query);
  }

  async getAvailableFilters(userId: string): Promise<any> {
    return {
      propertyTypes: ['SINGLE_FAMILY', 'MULTI_FAMILY', 'CONDO', 'TOWNHOUSE'],
      cities: ['Austin', 'Dallas', 'Houston'],
      states: ['TX', 'CA', 'NY'],
      priceRanges: [
        { min: 0, max: 200000, label: 'Under $200k' },
        { min: 200000, max: 500000, label: '$200k - $500k' },
        { min: 500000, max: 1000000, label: '$500k - $1M' },
      ],
    };
  }

  async saveSearch(searchData: any): Promise<void> {
    // Implementation for saving search
    await this.prisma.auditLog.create({
      data: {
        userId: searchData.userId,
        action: 'search_saved',
        entityType: 'search',
        entityId: 'search_' + Date.now(),
        metadata: searchData,
      },
    });
  }

  async getSavedSearches(userId: string): Promise<any[]> {
    const savedSearches = await this.prisma.auditLog.findMany({
      where: {
        userId,
        action: 'search_saved',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return savedSearches.map(log => ({
      id: log.entityId,
      query: (log.metadata as any)?.query,
      filters: (log.metadata as any)?.filters,
      createdAt: log.createdAt,
    }));
  }

  async getSearchAnalytics(userId: string, timeframe: string): Promise<any> {
    return {
      totalSearches: 0,
      popularQueries: [],
      searchTrends: [],
      averageResults: 0,
    };
  }

  async recordSearchFeedback(feedbackData: any): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: feedbackData.userId,
        action: 'search_feedback',
        entityType: 'search',
        entityId: feedbackData.searchId,
        metadata: feedbackData,
      },
    });
  }

  async getTrendingSearches(): Promise<string[]> {
    return ['3 bedroom houses', 'downtown condos', 'family homes'];
  }
}
