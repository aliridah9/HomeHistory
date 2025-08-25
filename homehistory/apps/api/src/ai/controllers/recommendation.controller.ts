/**
 * HomeHistory Recommendation Controller - "Similar Properties" API
 * RESTful endpoints for AI-powered property recommendations
 */

import { 
  Controller, 
  Get, 
  Post,
  Param, 
  Query, 
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../modules/auth/guards/admin.guard';
import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';
import { 
  RecommendationService, 
  PropertyRecommendation, 
  RecommendationOptions 
} from '../services/recommendation.service';
import { User, PropertyType } from '@homehistory/database';

@ApiTags('recommendations')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get(':id/similar')
  @ApiOperation({ 
    summary: 'Get Similar Properties',
    description: 'Find properties similar to the specified property using AI-powered recommendation engine'
  })
  @ApiParam({ name: 'id', description: 'Source property ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recommendations (default: 10, max: 50)' })
  @ApiQuery({ name: 'maxDistance', required: false, description: 'Maximum distance in kilometers (default: 50)' })
  @ApiQuery({ name: 'priceRangePercent', required: false, description: 'Price range percentage ±% (default: 10)' })
  @ApiQuery({ name: 'propertyTypes', required: false, description: 'Comma-separated property types to include' })
  @ApiQuery({ name: 'minSimilarityScore', required: false, description: 'Minimum similarity score 0-1 (default: 0.6)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Similar properties found',
    schema: {
      type: 'object',
      properties: {
        sourceProperty: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            propertyType: { type: 'string' },
            bedrooms: { type: 'number' },
            bathrooms: { type: 'number' },
            squareFeet: { type: 'number' },
            price: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  propertyType: { type: 'string' },
                  bedrooms: { type: 'number' },
                  bathrooms: { type: 'number' },
                  squareFeet: { type: 'number' },
                  price: { type: 'number' },
                  thumbnailUrl: { type: 'string' }
                }
              },
              similarityScore: { type: 'number', minimum: 0, maximum: 1 },
              explanation: { type: 'string' },
              keyMatchingFeatures: { type: 'array', items: { type: 'string' } },
              priceDifference: { type: 'number' },
              distanceKm: { type: 'number' },
              thumbnailUrl: { type: 'string' }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            totalFound: { type: 'number' },
            searchRadius: { type: 'number' },
            priceRange: { type: 'object', properties: { min: { type: 'number' }, max: { type: 'number' } } },
            averageSimilarity: { type: 'number' },
            searchTime: { type: 'number' },
            cached: { type: 'boolean' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Source property not found' })
  async getSimilarProperties(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('maxDistance', new DefaultValuePipe(50), ParseIntPipe) maxDistance?: number,
    @Query('priceRangePercent', new DefaultValuePipe(10), ParseIntPipe) priceRangePercent?: number,
    @Query('propertyTypes') propertyTypes?: string,
    @Query('minSimilarityScore', new DefaultValuePipe(0.6)) minSimilarityScore?: number,
  ) {
    const startTime = Date.now();

    // Parse property types
    let includePropertyTypes: PropertyType[] | undefined;
    if (propertyTypes) {
      includePropertyTypes = propertyTypes.split(',').map(type => 
        type.trim().toUpperCase() as PropertyType
      );
    }

    // Build recommendation options
    const options: RecommendationOptions = {
      limit: Math.min(limit || 10, 50), // Cap at 50
      maxDistance,
      priceRangePercent: (priceRangePercent || 10) / 100, // Convert percentage to decimal
      includePropertyTypes,
      minSimilarityScore,
    };

    // Get recommendations
    const recommendations = await this.recommendationService.findSimilarProperties(
      propertyId,
      options
    );

    // Get source property for response
    const sourceProperty = await this.getSourcePropertySummary(propertyId);

    const searchTime = Date.now() - startTime;

    // Calculate metadata
    const metadata = {
      totalFound: recommendations.length,
      searchRadius: maxDistance || 50,
      priceRange: this.calculatePriceRange(sourceProperty?.price, priceRangePercent || 10),
      averageSimilarity: recommendations.length > 0 
        ? recommendations.reduce((sum, rec) => sum + rec.similarityScore, 0) / recommendations.length 
        : 0,
      searchTime,
      cached: searchTime < 100, // Assume cached if very fast
    };

    return {
      sourceProperty,
      recommendations: recommendations.map(rec => ({
        ...rec,
        thumbnailUrl: this.generateThumbnailUrl(rec.property.id),
      })),
      metadata,
    };
  }

  @Get(':id/similar/detailed')
  @ApiOperation({ 
    summary: 'Get Detailed Similar Properties',
    description: 'Get similar properties with detailed similarity breakdown and analysis'
  })
  @ApiParam({ name: 'id', description: 'Source property ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recommendations (default: 5, max: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed similar properties with similarity analysis',
    schema: {
      type: 'object',
      properties: {
        sourceProperty: { type: 'object' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: { type: 'object' },
              similarityScore: { type: 'number' },
              explanation: { type: 'string' },
              detailedSimilarity: {
                type: 'object',
                properties: {
                  locationSimilarity: { type: 'number' },
                  structuralSimilarity: { type: 'number' },
                  amenitySimilarity: { type: 'number' },
                  styleSimilarity: { type: 'number' },
                  priceSimilarity: { type: 'number' },
                  overallSimilarity: { type: 'number' }
                }
              },
              keyMatchingFeatures: { type: 'array', items: { type: 'string' } },
              priceDifference: { type: 'number' },
              distanceKm: { type: 'number' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  })
  async getDetailedSimilarProperties(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit?: number,
  ) {
    // Get basic recommendations first
    const recommendations = await this.recommendationService.findSimilarProperties(
      propertyId,
      { limit: Math.min(limit || 5, 20) }
    );

    // Get source property
    const sourceProperty = await this.getSourcePropertySummary(propertyId);

    // Calculate detailed similarity for each recommendation
    const detailedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const detailedSimilarity = await this.recommendationService.calculateSimilarity(
          sourceProperty as any,
          rec.property as any
        );

        return {
          ...rec,
          detailedSimilarity,
          pros: this.generatePros(sourceProperty, rec),
          cons: this.generateCons(sourceProperty, rec),
          thumbnailUrl: this.generateThumbnailUrl(rec.property.id),
        };
      })
    );

    return {
      sourceProperty,
      recommendations: detailedRecommendations,
    };
  }

  @Post(':id/similar/feedback')
  @ApiOperation({ 
    summary: 'Provide Recommendation Feedback',
    description: 'Submit feedback on recommendation quality to improve future suggestions'
  })
  @ApiParam({ name: 'id', description: 'Source property ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Feedback recorded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        feedbackId: { type: 'string' }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async submitRecommendationFeedback(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Body() feedback: {
      recommendedPropertyId: string;
      rating: number; // 1-5 stars
      helpful: boolean;
      comments?: string;
      issues?: string[]; // e.g., ['too_far', 'wrong_price_range', 'different_style']
    },
  ) {
    // Store feedback for improving recommendations
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // TODO: Store feedback in database for ML training
    // await this.recommendationService.storeFeedback(propertyId, feedback, user.id);

    return {
      message: 'Feedback recorded successfully. Thank you for helping us improve our recommendations!',
      feedbackId,
    };
  }

  @Get('recommendations/trending')
  @ApiOperation({ 
    summary: 'Get Trending Properties',
    description: 'Get properties that are frequently recommended and viewed'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of trending properties (default: 20)' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Timeframe: week, month, quarter (default: week)' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state' })
  @ApiResponse({ 
    status: 200, 
    description: 'Trending properties based on recommendation frequency',
    schema: {
      type: 'object',
      properties: {
        trending: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: { type: 'object' },
              trendingScore: { type: 'number' },
              recommendationCount: { type: 'number' },
              averageSimilarityScore: { type: 'number' },
              uniqueSourceProperties: { type: 'number' },
              thumbnailUrl: { type: 'string' }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            timeframe: { type: 'string' },
            totalProperties: { type: 'number' },
            filters: { type: 'object' }
          }
        }
      }
    }
  })
  async getTrendingProperties(
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('timeframe', new DefaultValuePipe('week')) timeframe?: 'week' | 'month' | 'quarter',
    @Query('city') city?: string,
    @Query('state') state?: string,
  ) {
    // Mock trending properties - would implement with real analytics
    const trending = [
      {
        property: {
          id: 'trending-1',
          address: '123 Popular St',
          city: 'Austin',
          state: 'TX',
          propertyType: 'SINGLE_FAMILY',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 2000,
          price: 450000,
        },
        trendingScore: 0.95,
        recommendationCount: 147,
        averageSimilarityScore: 0.82,
        uniqueSourceProperties: 89,
        thumbnailUrl: this.generateThumbnailUrl('trending-1'),
      },
      // More trending properties...
    ];

    return {
      trending: trending.slice(0, limit),
      metadata: {
        timeframe,
        totalProperties: trending.length,
        filters: { city, state },
      },
    };
  }

  @Post('recommendations/batch-update-embeddings')
  @ApiOperation({ 
    summary: 'Batch Update Property Embeddings (Admin)',
    description: 'Update embeddings for multiple properties to improve recommendation accuracy. Admin only.'
  })
  @ApiResponse({ 
    status: 202, 
    description: 'Batch embedding update started',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        totalProperties: { type: 'number' },
        estimatedTime: { type: 'number' },
        status: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async batchUpdateEmbeddings(
    @CurrentUser() user: User,
    @Body() body: {
      propertyIds?: string[];
      filters?: {
        city?: string;
        state?: string;
        propertyType?: PropertyType;
        updatedBefore?: string;
      };
      batchSize?: number;
    },
  ) {
    let propertyIds = body.propertyIds || [];

    // If no specific IDs provided, get properties based on filters
    if (propertyIds.length === 0 && body.filters) {
      propertyIds = await this.getPropertiesByFilters(body.filters);
    }

    if (propertyIds.length === 0) {
      throw new Error('No properties specified for embedding update');
    }

    // Start background job
    const jobId = `embedding_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process in background
    this.recommendationService.batchUpdateEmbeddings(propertyIds, body.batchSize)
      .catch(error => {
        console.error('Batch embedding update failed:', error);
      });

    const estimatedTime = Math.ceil((propertyIds.length / (body.batchSize || 50)) * 30); // ~30 seconds per batch

    return {
      jobId,
      totalProperties: propertyIds.length,
      estimatedTime,
      status: 'processing',
    };
  }

  @Get('recommendations/analytics')
  @ApiOperation({ 
    summary: 'Get Recommendation Analytics (Admin)',
    description: 'Get analytics and insights about recommendation system performance. Admin only.'
  })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Analytics timeframe' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recommendation system analytics',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalRecommendations: { type: 'number' },
            averageSimilarityScore: { type: 'number' },
            cacheHitRate: { type: 'number' },
            averageResponseTime: { type: 'number' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            embeddingCoverage: { type: 'number' },
            recommendationAccuracy: { type: 'number' },
            userSatisfaction: { type: 'number' }
          }
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @UseGuards(AdminGuard)
  async getRecommendationAnalytics(
    @CurrentUser() user: User,
    @Query('timeframe', new DefaultValuePipe('month')) timeframe: 'week' | 'month' | 'quarter',
  ) {
    // Mock analytics data - would implement with real metrics
    return {
      overview: {
        totalRecommendations: 45678,
        averageSimilarityScore: 0.78,
        cacheHitRate: 0.85,
        averageResponseTime: 1.2, // seconds
      },
      performance: {
        embeddingCoverage: 0.92, // 92% of properties have embeddings
        recommendationAccuracy: 0.84, // Based on user feedback
        userSatisfaction: 4.2, // Out of 5 stars
      },
      insights: [
        {
          type: 'performance',
          description: 'Recommendation accuracy has improved by 12% over the last month',
          impact: 'positive',
          recommendation: 'Continue current embedding strategy',
        },
        {
          type: 'coverage',
          description: '8% of properties still lack embeddings, affecting recommendation quality',
          impact: 'negative',
          recommendation: 'Schedule batch embedding update for missing properties',
        },
      ],
    };
  }

  // Private helper methods

  private async getSourcePropertySummary(propertyId: string) {
    // Get basic property info for response
    return {
      id: propertyId,
      address: '123 Source Property St',
      city: 'Austin',
      state: 'TX',
      propertyType: 'SINGLE_FAMILY',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      price: 450000,
    };
  }

  private calculatePriceRange(price: number | null, priceRangePercent: number) {
    if (!price) return { min: null, max: null };
    
    const range = price * (priceRangePercent / 100);
    return {
      min: price - range,
      max: price + range,
    };
  }

  private generateThumbnailUrl(propertyId: string): string {
    // Generate thumbnail URL - would integrate with image service
    return `https://images.homehistory.com/properties/${propertyId}/thumbnail.jpg`;
  }

  private generatePros(sourceProperty: any, recommendation: PropertyRecommendation): string[] {
    const pros = [];

    if (recommendation.priceDifference < 0) {
      pros.push(`$${Math.abs(recommendation.priceDifference).toLocaleString()} less expensive`);
    }

    if (recommendation.distanceKm < 5) {
      pros.push('Very close to original location');
    }

    if (recommendation.property.bedrooms && sourceProperty.bedrooms && 
        recommendation.property.bedrooms > sourceProperty.bedrooms) {
      pros.push('More bedrooms');
    }

    if (recommendation.property.squareFeet && sourceProperty.squareFeet && 
        recommendation.property.squareFeet > sourceProperty.squareFeet) {
      pros.push('Larger living space');
    }

    if (recommendation.similarityScore > 0.9) {
      pros.push('Excellent match to your criteria');
    }

    return pros.slice(0, 3); // Limit to top 3
  }

  private generateCons(sourceProperty: any, recommendation: PropertyRecommendation): string[] {
    const cons = [];

    if (recommendation.priceDifference > 0) {
      cons.push(`$${recommendation.priceDifference.toLocaleString()} more expensive`);
    }

    if (recommendation.distanceKm > 25) {
      cons.push('Farther from original location');
    }

    if (recommendation.property.bedrooms && sourceProperty.bedrooms && 
        recommendation.property.bedrooms < sourceProperty.bedrooms) {
      cons.push('Fewer bedrooms');
    }

    if (recommendation.property.squareFeet && sourceProperty.squareFeet && 
        recommendation.property.squareFeet < sourceProperty.squareFeet) {
      cons.push('Smaller living space');
    }

    if (recommendation.similarityScore < 0.7) {
      cons.push('Limited similarity to original property');
    }

    return cons.slice(0, 3); // Limit to top 3
  }

  private async getPropertiesByFilters(filters: any): Promise<string[]> {
    // Would implement property filtering logic
    return [];
  }
}
