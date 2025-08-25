/**
 * HomeHistory Recommendation Engine - "Similar Properties" System
 * AI-powered property recommendations using vector embeddings and similarity scoring
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/database/prisma.service';
import { EmbeddingService } from './embedding.service';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
import { PropertyType } from '@prisma/client';
import { createHash } from 'crypto';

// Recommendation interfaces
type StoredEmbedding = { embedding?: number[] } | null;

export interface PropertyWithEmbedding {
  id: string;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  yearBuilt?: number | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price?: number | null;
  metadata?: any;
  embedding?: StoredEmbedding;
}

export interface PropertyRecommendation {
  property: PropertyWithEmbedding;
  similarityScore: number;          // 0-1 similarity score
  explanation: string;              // Why this property is similar
  keyMatchingFeatures: string[];    // Specific matching attributes
  priceDifference: number;          // Price difference from source
  distanceKm: number;               // Distance in kilometers
  thumbnailUrl?: string;            // Property image
}

export interface RecommendationOptions {
  limit?: number;                   // Number of recommendations (default: 10)
  maxDistance?: number;             // Max distance in km (default: 50)
  priceRangePercent?: number;       // Price range ±% (default: 10)
  includePropertyTypes?: PropertyType[];  // Specific property types
  excludePropertyIds?: string[];    // Properties to exclude
  minSimilarityScore?: number;      // Minimum similarity threshold (default: 0.6)
  diversityWeight?: number;         // Weight for result diversification (default: 0.3)
}

export interface PropertyFeatureVector {
  propertyId: string;
  locationFeatures: number[];       // Lat/lng, neighborhood features
  structuralFeatures: number[];     // Size, bedrooms, bathrooms, etc.
  amenityFeatures: number[];        // Pool, garage, etc.
  styleFeatures: number[];          // Architectural style, year built
  priceFeatures: number[];          // Price, price per sqft
  qualityFeatures: number[];        // Condition, maintenance score
  embedding: number[];              // Combined feature embedding
}

export interface SimilarityMetrics {
  locationSimilarity: number;       // 0-1 geographic similarity
  structuralSimilarity: number;     // 0-1 size/layout similarity
  amenitySimilarity: number;        // 0-1 amenity similarity
  styleSimilarity: number;          // 0-1 style similarity
  priceSimilarity: number;          // 0-1 price similarity
  overallSimilarity: number;        // 0-1 composite similarity
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  // Recommendation configuration
  private readonly DEFAULT_LIMIT = 10;
  private readonly DEFAULT_MAX_DISTANCE = 50; // km
  private readonly DEFAULT_PRICE_RANGE = 0.10; // ±10%
  private readonly DEFAULT_MIN_SIMILARITY = 0.6;
  private readonly DEFAULT_DIVERSITY_WEIGHT = 0.3;
  
  // Feature weights for similarity calculation
  private readonly SIMILARITY_WEIGHTS = {
    location: 0.25,      // Geographic proximity and neighborhood
    structural: 0.30,    // Size, bedrooms, bathrooms
    amenity: 0.20,       // Features and amenities
    style: 0.15,         // Architectural style and age
    price: 0.10,         // Price similarity
  };

  // Cache configuration
  private readonly RECOMMENDATION_CACHE_TTL = 21600; // 6 hours
  private readonly EMBEDDING_CACHE_TTL = 86400;      // 24 hours

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
    private cacheManager: CacheManagerService,
    private aiDatabase: AIDatabaseService,
  ) {}

  /**
   * Find similar properties using AI-powered recommendation engine
   */
  async findSimilarProperties(
    propertyId: string,
    options: RecommendationOptions = {}
  ): Promise<PropertyRecommendation[]> {
    const {
      limit = this.DEFAULT_LIMIT,
      maxDistance = this.DEFAULT_MAX_DISTANCE,
      priceRangePercent = this.DEFAULT_PRICE_RANGE,
      includePropertyTypes,
      excludePropertyIds = [],
      minSimilarityScore = this.DEFAULT_MIN_SIMILARITY,
      diversityWeight = this.DEFAULT_DIVERSITY_WEIGHT,
    } = options;

    const cacheKey = this.generateRecommendationCacheKey(propertyId, options);

    try {
      this.logger.log(`Finding similar properties for: ${propertyId}`);

      // Check cache first
      const cached = await this.cacheManager.get<PropertyRecommendation[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for recommendations: ${propertyId}`);
        return cached;
      }

      const startTime = Date.now();

      // Get source property with embedding
      const sourceProperty = await this.getPropertyWithEmbedding(propertyId);
      if (!sourceProperty) {
        throw new Error(`Source property not found: ${propertyId}`);
      }

      // Generate embedding if not exists
      let sourceEmbedding = sourceProperty.embedding;
      if (!sourceEmbedding) {
        sourceEmbedding = await this.generatePropertyEmbedding(sourceProperty);
      }

      // Find candidate properties within constraints
      const candidates = await this.findCandidateProperties(sourceProperty, {
        maxDistance,
        priceRangePercent,
        includePropertyTypes,
        excludePropertyIds: [...excludePropertyIds, propertyId], // Exclude source
      });

      this.logger.debug(`Found ${candidates.length} candidate properties`);

      // Calculate similarities for all candidates
      const similarities = await this.calculateBatchSimilarities(
        sourceProperty,
        sourceEmbedding,
        candidates
      );

      // Filter by minimum similarity score
      const filteredSimilarities = similarities.filter(
        sim => sim.similarityScore >= minSimilarityScore
      );

      // Diversify results to avoid too many similar properties
      const diversifiedResults = this.diversifyResults(
        filteredSimilarities,
        diversityWeight
      );

      // Sort by similarity score and limit results
      const sortedResults = diversifiedResults
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

      // Generate explanations for recommendations
      const recommendations = await this.generateRecommendationExplanations(
        sourceProperty,
        sortedResults
      );

      const calculationTime = Date.now() - startTime;

      // Cache the results
      await this.cacheManager.set(cacheKey, recommendations, {
        ttl: this.RECOMMENDATION_CACHE_TTL,
        tags: ['recommendations', propertyId],
      });

      this.logger.log(
        `Generated ${recommendations.length} recommendations for ${propertyId} (${calculationTime}ms)`
      );

      return recommendations;

    } catch (error) {
      this.logger.error(`Failed to find similar properties for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Generate property embedding from features
   */
  async generatePropertyEmbedding(property: PropertyWithEmbedding): Promise<StoredEmbedding> {
    try {
      this.logger.debug(`Generating embedding for property: ${property.id}`);

      // Create comprehensive property description for embedding
      const propertyDescription = this.createPropertyDescription(property);

      // Generate text embedding using OpenAI
      const embeddingResponse = await this.embeddingService.generateEmbedding({
        text: propertyDescription,
        model: 'text-embedding-3-small',
        operation: 'property_recommendation',
      });

      // Store embedding in database (manual upsert for compatibility)
      const existing = await this.prisma.propertyEmbedding.findUnique({ where: { propertyId: property.id } });
      let propertyEmbedding;
      if (existing) {
        propertyEmbedding = await this.prisma.propertyEmbedding.update({
          where: { propertyId: property.id },
          data: {
            content: propertyDescription,
            embedding: embeddingResponse.embedding as any,
            model: embeddingResponse.model,
            dimensions: embeddingResponse.embedding.length,
            tokens: embeddingResponse.tokens,
            cost: embeddingResponse.cost,
          },
        });
      } else {
        propertyEmbedding = await this.prisma.propertyEmbedding.create({
          data: {
            propertyId: property.id,
            content: propertyDescription,
            embedding: embeddingResponse.embedding as any,
            model: embeddingResponse.model,
            dimensions: embeddingResponse.embedding.length,
            tokens: embeddingResponse.tokens,
            cost: embeddingResponse.cost,
          },
        });
      }

      this.logger.debug(`Generated embedding for property ${property.id}`);
      return (propertyEmbedding as unknown as StoredEmbedding) ?? null;

    } catch (error) {
      this.logger.error(`Failed to generate embedding for property ${property.id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate similarity between two properties
   */
  async calculateSimilarity(
    property1: PropertyWithEmbedding,
    property2: PropertyWithEmbedding
  ): Promise<SimilarityMetrics> {
    try {
      // Ensure both properties have embeddings
      const embedding1 = property1.embedding || await this.generatePropertyEmbedding(property1);
      const embedding2 = property2.embedding || await this.generatePropertyEmbedding(property2);

      // Calculate component similarities
      const locationSimilarity = this.calculateLocationSimilarity(property1, property2);
      const structuralSimilarity = this.calculateStructuralSimilarity(property1, property2);
      const amenitySimilarity = this.calculateAmenitySimilarity(property1, property2);
      const styleSimilarity = this.calculateStyleSimilarity(property1, property2);
      const priceSimilarity = this.calculatePriceSimilarity(property1, property2);

      // Calculate embedding cosine similarity
      const vec1 = (embedding1?.embedding ?? []) as number[];
      const vec2 = (embedding2?.embedding ?? []) as number[];
      const embeddingSimilarity = this.calculateCosineSimilarity(vec1, vec2);

      // Weighted composite similarity
      const overallSimilarity = 
        locationSimilarity * this.SIMILARITY_WEIGHTS.location +
        structuralSimilarity * this.SIMILARITY_WEIGHTS.structural +
        amenitySimilarity * this.SIMILARITY_WEIGHTS.amenity +
        styleSimilarity * this.SIMILARITY_WEIGHTS.style +
        priceSimilarity * this.SIMILARITY_WEIGHTS.price;

      // Boost with embedding similarity
      const finalSimilarity = (overallSimilarity * 0.7) + (embeddingSimilarity * 0.3);

      return {
        locationSimilarity,
        structuralSimilarity,
        amenitySimilarity,
        styleSimilarity,
        priceSimilarity,
        overallSimilarity: Math.min(1.0, finalSimilarity),
      };

    } catch (error) {
      this.logger.error('Failed to calculate property similarity:', error);
      throw error;
    }
  }

  /**
   * Diversify recommendation results to avoid too many similar properties
   */
  diversifyResults(
    recommendations: PropertyRecommendation[],
    diversityWeight: number = 0.3
  ): PropertyRecommendation[] {
    if (recommendations.length <= 5) {
      return recommendations; // No need to diversify small result sets
    }

    const diversified: PropertyRecommendation[] = [];
    const remaining = [...recommendations];

    // Always include the top recommendation
    if (remaining.length > 0) {
      diversified.push(remaining.shift()!);
    }

    // Diversify the rest
    while (remaining.length > 0 && diversified.length < recommendations.length) {
      let bestCandidate = remaining[0];
      let bestScore = this.calculateDiversityScore(bestCandidate, diversified, diversityWeight);

      // Find the candidate with the best diversity score
      for (let i = 1; i < remaining.length; i++) {
        const candidate = remaining[i];
        const diversityScore = this.calculateDiversityScore(candidate, diversified, diversityWeight);
        
        if (diversityScore > bestScore) {
          bestCandidate = candidate;
          bestScore = diversityScore;
        }
      }

      // Add the best candidate and remove from remaining
      diversified.push(bestCandidate);
      const index = remaining.indexOf(bestCandidate);
      remaining.splice(index, 1);
    }

    return diversified;
  }

  /**
   * Invalidate recommendation cache when property data changes
   */
  async invalidateRecommendationCache(propertyId: string): Promise<void> {
    try {
      await this.cacheManager.deleteByTags(['recommendations', propertyId]);
      this.logger.debug(`Invalidated recommendation cache for property: ${propertyId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate recommendation cache for ${propertyId}:`, error);
    }
  }

  /**
   * Batch update property embeddings (background job)
   */
  async batchUpdateEmbeddings(
    propertyIds: string[],
    batchSize: number = 50
  ): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    this.logger.log(`Starting batch embedding update for ${propertyIds.length} properties`);

    for (let i = 0; i < propertyIds.length; i += batchSize) {
      const batch = propertyIds.slice(i, i + batchSize);
      
      for (const propertyId of batch) {
        try {
          const property = await this.prisma.property.findUnique({
            where: { id: propertyId },
          });

          if (property) {
            await this.generatePropertyEmbedding(property);
            success++;
          }
        } catch (error) {
          this.logger.error(`Failed to update embedding for property ${propertyId}:`, error);
          errors++;
        }
      }

      // Small delay between batches to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.logger.log(`Batch embedding update complete: ${success} success, ${errors} errors`);
    return { success, errors };
  }

  // Private helper methods

  private async getPropertyWithEmbedding(propertyId: string): Promise<PropertyWithEmbedding | null> {
    const result = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        embedding: true,
      },
    });
    if (!result) return null;
    return ({ ...result, metadata: (result as any).metadata as any }) as unknown as PropertyWithEmbedding;
  }

  private async findCandidateProperties(
    sourceProperty: PropertyWithEmbedding,
    options: {
      maxDistance: number;
      priceRangePercent: number;
      includePropertyTypes?: PropertyType[];
      excludePropertyIds: string[];
    }
  ): Promise<PropertyWithEmbedding[]> {
    const { maxDistance, priceRangePercent, includePropertyTypes, excludePropertyIds } = options;

    // Calculate price range - use type assertion for price field
    const sourcePrice = (sourceProperty as any).price;
    const minPrice = sourcePrice ? sourcePrice * (1 - priceRangePercent) : 0;
    const maxPrice = sourcePrice ? sourcePrice * (1 + priceRangePercent) : Number.MAX_VALUE;

    // Build where clause
    const whereClause: any = {
      id: { notIn: excludePropertyIds },
      latitude: { not: null },
      longitude: { not: null },
    };

    if (sourcePrice) {
      whereClause.price = {
        gte: minPrice,
        lte: maxPrice,
      };
    }

    if (includePropertyTypes && includePropertyTypes.length > 0) {
      whereClause.propertyType = { in: includePropertyTypes };
    }

    // Find properties within geographic bounds (rough filtering)
    const lat = sourceProperty.latitude ?? 0;
    const lng = sourceProperty.longitude ?? 0;
    const latRange = maxDistance / 111; // Rough km to degree conversion
    const lngRange = maxDistance / (111 * Math.cos(lat * Math.PI / 180 || 1));

    whereClause.latitude = {
      gte: lat - latRange,
      lte: lat + latRange,
    };
    whereClause.longitude = {
      gte: lng - lngRange,
      lte: lng + lngRange,
    };

    const candidates = (await this.prisma.property.findMany({
      where: whereClause,
      include: {
        embedding: true,
      },
      take: 500, // Limit to avoid memory issues
    })) as unknown as PropertyWithEmbedding[];

    // Filter by exact distance
    return candidates.filter(candidate => {
      const distance = this.calculateDistance(
        lat,
        lng,
        candidate.latitude ?? 0,
        candidate.longitude ?? 0
      );
      return distance <= maxDistance;
    });
  }

  private async calculateBatchSimilarities(
    sourceProperty: PropertyWithEmbedding,
    sourceEmbedding: StoredEmbedding,
    candidates: PropertyWithEmbedding[]
  ): Promise<PropertyRecommendation[]> {
    const recommendations: PropertyRecommendation[] = [];

    for (const candidate of candidates) {
      try {
        const similarity = await this.calculateSimilarity(
          { ...sourceProperty, embedding: sourceEmbedding },
          candidate
        );

    const distance = this.calculateDistance(
      sourceProperty.latitude ?? 0,
      sourceProperty.longitude ?? 0,
      candidate.latitude ?? 0,
      candidate.longitude ?? 0
    );

        const priceDifference = (sourceProperty as any).price && (candidate as any).price 
          ? (candidate as any).price - (sourceProperty as any).price 
          : 0;

        recommendations.push({
          property: candidate,
          similarityScore: similarity.overallSimilarity,
          explanation: '', // Will be generated later
          keyMatchingFeatures: this.identifyMatchingFeatures(sourceProperty, candidate, similarity),
          priceDifference,
          distanceKm: distance,
        });

      } catch (error) {
        this.logger.error(`Failed to calculate similarity for property ${candidate.id}:`, error);
      }
    }

    return recommendations;
  }

  private createPropertyDescription(property: PropertyWithEmbedding): string {
    const parts = [];

    // Basic property info
    if (property.propertyType) {
      parts.push(`${property.propertyType.toLowerCase().replace('_', ' ')} in ${property.city}, ${property.state}`);
    }
    
    if (property.bedrooms && property.bathrooms) {
      parts.push(`${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms`);
    }
    
    if (property.squareFeet) {
      parts.push(`${property.squareFeet} square feet`);
    }
    
    if (property.yearBuilt) {
      parts.push(`built in ${property.yearBuilt}`);
    }
    
    if ((property as any).price) {
      parts.push(`priced at $${(property as any).price.toLocaleString()}`);
    }

    // Add neighborhood context
    parts.push(`located in ${property.zipCode} area`);

    // Add any additional features from metadata
    if ((property as any).metadata && typeof (property as any).metadata === 'object') {
      const metadata = (property as any).metadata as any;
      if (metadata.features) {
        parts.push(`features: ${metadata.features.join(', ')}`);
      }
      if (metadata.style) {
        parts.push(`${metadata.style} style`);
      }
    }

    return parts.join(', ');
  }

  private calculateLocationSimilarity(property1: PropertyWithEmbedding, property2: PropertyWithEmbedding): number {
    // Distance-based similarity (closer = more similar)
    const distance = this.calculateDistance(
      property1.latitude ?? 0,
      property1.longitude ?? 0,
      property2.latitude ?? 0,
      property2.longitude ?? 0
    );

    // Convert distance to similarity (0-1 scale)
    const maxDistance = 50; // km
    const similarity = Math.max(0, 1 - (distance / maxDistance));

    // Boost similarity for same city/state
    let boost = 1.0;
    if (property1.city === property2.city) boost += 0.1;
    if (property1.state === property2.state) boost += 0.05;
    if (property1.zipCode === property2.zipCode) boost += 0.15;

    return Math.min(1.0, similarity * boost);
  }

  private calculateStructuralSimilarity(property1: any, property2: any): number {
    let similarity = 0;
    let factors = 0;

    // Bedroom similarity
    if (property1.bedrooms && property2.bedrooms) {
      const bedroomDiff = Math.abs(property1.bedrooms - property2.bedrooms);
      similarity += Math.max(0, 1 - (bedroomDiff / 3)); // Normalize by max expected difference
      factors++;
    }

    // Bathroom similarity
    if (property1.bathrooms && property2.bathrooms) {
      const bathroomDiff = Math.abs(property1.bathrooms - property2.bathrooms);
      similarity += Math.max(0, 1 - (bathroomDiff / 2));
      factors++;
    }

    // Square footage similarity
    if (property1.squareFeet && property2.squareFeet) {
      const sizeDiff = Math.abs(property1.squareFeet - property2.squareFeet);
      const avgSize = (property1.squareFeet + property2.squareFeet) / 2;
      similarity += Math.max(0, 1 - (sizeDiff / avgSize));
      factors++;
    }

    // Property type exact match
    if (property1.propertyType === property2.propertyType) {
      similarity += 1.0;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  private calculateAmenitySimilarity(property1: any, property2: any): number {
    // This would analyze amenities from metadata
    // For now, return a base similarity
    return 0.7; // Placeholder
  }

  private calculateStyleSimilarity(property1: any, property2: any): number {
    let similarity = 0;
    let factors = 0;

    // Year built similarity
    if (property1.yearBuilt && property2.yearBuilt) {
      const yearDiff = Math.abs(property1.yearBuilt - property2.yearBuilt);
      similarity += Math.max(0, 1 - (yearDiff / 50)); // 50-year normalization
      factors++;
    }

    return factors > 0 ? similarity / factors : 0.5;
  }

  private calculatePriceSimilarity(property1: any, property2: any): number {
    // Handle cases where price might not be available
    if (!(property1 as any).price || !(property2 as any).price) return 0.5;
    
    const priceDiff = Math.abs((property1 as any).price - (property2 as any).price);
    const avgPrice = ((property1 as any).price + (property2 as any).price) / 2;
    
    // Calculate similarity based on price difference percentage
    const priceDiffPercent = priceDiff / avgPrice;
    
    // Return similarity score (0-1) where 0% difference = 1.0, 100% difference = 0.0
    return Math.max(0, 1 - priceDiffPercent);
  }

  private calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateDiversityScore(
    candidate: PropertyRecommendation,
    selected: PropertyRecommendation[],
    diversityWeight: number
  ): number {
    if (selected.length === 0) return candidate.similarityScore;

    // Calculate average similarity to already selected properties
    let avgSimilarityToSelected = 0;
    for (const selectedProp of selected) {
      // Simple diversity based on property type and location
      let diversity = 1.0;
      
      if (candidate.property.propertyType === selectedProp.property.propertyType) {
        diversity -= 0.2;
      }
      
      if (candidate.property.city === selectedProp.property.city) {
        diversity -= 0.1;
      }
      
      if (candidate.property.zipCode === selectedProp.property.zipCode) {
        diversity -= 0.1;
      }

      avgSimilarityToSelected += (1 - diversity);
    }
    avgSimilarityToSelected /= selected.length;

    // Combine similarity score with diversity (lower avgSimilarityToSelected is better)
    return (candidate.similarityScore * (1 - diversityWeight)) + 
           ((1 - avgSimilarityToSelected) * diversityWeight);
  }

  private identifyMatchingFeatures(
    sourceProperty: any,
    candidateProperty: any,
    similarity: SimilarityMetrics
  ): string[] {
    const features = [];

    if (sourceProperty.propertyType && sourceProperty.propertyType === candidateProperty.propertyType) {
      features.push(`Same property type (${sourceProperty.propertyType.toLowerCase().replace('_', ' ')})`);
    }

    if (sourceProperty.bedrooms === candidateProperty.bedrooms && sourceProperty.bedrooms) {
      features.push(`${sourceProperty.bedrooms} bedrooms`);
    }

    if (Math.abs((sourceProperty.bathrooms || 0) - (candidateProperty.bathrooms || 0)) <= 0.5) {
      features.push(`Similar bathrooms (${candidateProperty.bathrooms})`);
    }

    if (sourceProperty.city === candidateProperty.city) {
      features.push(`Same city (${sourceProperty.city})`);
    }

    if (similarity.locationSimilarity > 0.8) {
      features.push('Nearby location');
    }

    if (similarity.priceSimilarity > 0.8) {
      features.push('Similar price range');
    }

    return features.slice(0, 4); // Limit to top 4 features
  }

  private async generateRecommendationExplanations(
    sourceProperty: any,
    recommendations: PropertyRecommendation[]
  ): Promise<PropertyRecommendation[]> {
    return recommendations.map(rec => ({
      ...rec,
      explanation: this.generateSimpleExplanation(sourceProperty, rec),
    }));
  }

  private generateSimpleExplanation(
    sourceProperty: any,
    recommendation: PropertyRecommendation
  ): string {
    const features = recommendation.keyMatchingFeatures;
    const distance = recommendation.distanceKm;
    const priceDiff = recommendation.priceDifference;

    let explanation = sourceProperty.propertyType
      ? `Similar ${sourceProperty.propertyType.toLowerCase().replace('_', ' ')} `
      : 'Similar property ';
    
    if (distance < 5) {
      explanation += 'in the same area';
    } else if (distance < 15) {
      explanation += 'nearby';
    } else {
      explanation += `${distance.toFixed(1)}km away`;
    }

    if (features.length > 0) {
      explanation += ` with ${features.slice(0, 2).join(' and ').toLowerCase()}`;
    }

    if (priceDiff !== 0) {
      const diffFormatted = Math.abs(priceDiff).toLocaleString();
      explanation += priceDiff > 0 
        ? ` ($${diffFormatted} more)` 
        : ` ($${diffFormatted} less)`;
    }

    return explanation + '.';
  }

  private generateRecommendationCacheKey(propertyId: string, options: RecommendationOptions): string {
    const optionsHash = createHash('md5').update(JSON.stringify(options)).digest('hex').substr(0, 8);
    return `recommendations:${propertyId}:${optionsHash}`;
  }
}
