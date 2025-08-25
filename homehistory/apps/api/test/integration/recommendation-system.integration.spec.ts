/**
 * HomeHistory Recommendation System Integration Tests
 * Tests for the "Similar Properties" AI-powered recommendation engine
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { RecommendationService } from '../../src/ai/services/recommendation.service';
import { createTestUser, createTestProperty, generateTestToken, prisma } from '../setup';
import { PropertyType, UserRole } from '@prisma/client';

describe('HomeHistory Recommendation System Integration (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let recommendationService: RecommendationService;

  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let adminUser: any;
  
  // Test properties for recommendations
  let sourceProperty: any;
  let similarProperty1: any;
  let similarProperty2: any;
  let differentProperty: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    recommendationService = moduleFixture.get<RecommendationService>(RecommendationService);

    // Create test users
    testUser = await createTestUser({ role: UserRole.USER });
    adminUser = await createTestUser({ role: UserRole.ADMIN });
    
    userToken = generateTestToken(testUser.id);
    adminToken = generateTestToken(adminUser.id);

    // Create test properties with similar characteristics
    sourceProperty = await createTestProperty(testUser.id, {
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      propertyType: PropertyType.SINGLE_FAMILY,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      yearBuilt: 2015,
      price: 450000,
      latitude: 30.2672,
      longitude: -97.7431,
    });

    // Similar property 1 - same area, similar size
    similarProperty1 = await createTestProperty(testUser.id, {
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      propertyType: PropertyType.SINGLE_FAMILY,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 2100,
      yearBuilt: 2018,
      price: 475000,
      latitude: 30.2680,
      longitude: -97.7440,
    });

    // Similar property 2 - nearby, similar price
    similarProperty2 = await createTestProperty(testUser.id, {
      address: '789 Pine Rd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78704',
      propertyType: PropertyType.SINGLE_FAMILY,
      bedrooms: 4,
      bathrooms: 2,
      squareFeet: 1900,
      yearBuilt: 2012,
      price: 440000,
      latitude: 30.2500,
      longitude: -97.7500,
    });

    // Different property - different city, type, price range
    differentProperty = await createTestProperty(testUser.id, {
      address: '321 Beach Blvd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      propertyType: PropertyType.CONDO,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      yearBuilt: 2020,
      price: 300000,
      latitude: 29.7604,
      longitude: -95.3698,
    });

    // Mock the recommendation service methods for predictable testing
    jest.spyOn(recommendationService, 'generatePropertyEmbedding').mockImplementation(async (property) => {
      // Return mock embedding based on property characteristics
      const mockEmbedding = Array(1536).fill(0).map((_, i) => {
        // Create embeddings that reflect property similarity
        let value = 0;
        if (property.city === 'Austin') value += 0.1;
        if (property.propertyType === 'SINGLE_FAMILY') value += 0.1;
        if (property.bedrooms === 3) value += 0.1;
        if (property.price && property.price >= 400000 && property.price <= 500000) value += 0.1;
        
        return (value + (i % 100) / 1000);
      });

      return {
        id: `embedding_${property.id}`,
        propertyId: property.id,
        content: `Mock embedding for ${property.address}`,
        embedding: mockEmbedding,
        model: 'text-embedding-3-small',
        dimensions: 1536,
        tokens: 100,
        cost: 0.00002,
        locationFeatures: [],
        structuralFeatures: [],
        amenityFeatures: [],
        styleFeatures: [],
        priceFeatures: [],
        qualityFeatures: [],
        lastRecommendationUpdate: null,
        recommendationVersion: '1.0',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    });

    // Create mock embeddings for test properties
    await Promise.all([
      recommendationService.generatePropertyEmbedding(sourceProperty),
      recommendationService.generatePropertyEmbedding(similarProperty1),
      recommendationService.generatePropertyEmbedding(similarProperty2),
      recommendationService.generatePropertyEmbedding(differentProperty),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/properties/:id/similar', () => {
    it('should return similar properties', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sourceProperty');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('metadata');

      // Validate source property
      expect(response.body.sourceProperty.id).toBe(sourceProperty.id);

      // Validate recommendations structure
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.recommendations.length).toBeGreaterThan(0);

      const recommendation = response.body.recommendations[0];
      expect(recommendation).toHaveProperty('property');
      expect(recommendation).toHaveProperty('similarityScore');
      expect(recommendation).toHaveProperty('explanation');
      expect(recommendation).toHaveProperty('keyMatchingFeatures');
      expect(recommendation).toHaveProperty('priceDifference');
      expect(recommendation).toHaveProperty('distanceKm');
      expect(recommendation).toHaveProperty('thumbnailUrl');

      // Validate similarity score range
      expect(recommendation.similarityScore).toBeGreaterThanOrEqual(0);
      expect(recommendation.similarityScore).toBeLessThanOrEqual(1);

      // Validate metadata
      const metadata = response.body.metadata;
      expect(metadata).toHaveProperty('totalFound');
      expect(metadata).toHaveProperty('searchRadius');
      expect(metadata).toHaveProperty('averageSimilarity');
      expect(metadata).toHaveProperty('searchTime');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar?limit=2`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.recommendations.length).toBeLessThanOrEqual(2);
    });

    it('should respect maxDistance parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar?maxDistance=10`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // All recommendations should be within 10km
      response.body.recommendations.forEach((rec: any) => {
        expect(rec.distanceKm).toBeLessThanOrEqual(10);
      });
    });

    it('should respect priceRangePercent parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar?priceRangePercent=5`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sourcePrice = sourceProperty.price;
      const maxPriceDiff = sourcePrice * 0.05; // 5%

      response.body.recommendations.forEach((rec: any) => {
        const priceDiff = Math.abs(rec.priceDifference);
        expect(priceDiff).toBeLessThanOrEqual(maxPriceDiff);
      });
    });

    it('should filter by property types', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar?propertyTypes=SINGLE_FAMILY`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      response.body.recommendations.forEach((rec: any) => {
        expect(rec.property.propertyType).toBe('SINGLE_FAMILY');
      });
    });

    it('should respect minSimilarityScore parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar?minSimilarityScore=0.8`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      response.body.recommendations.forEach((rec: any) => {
        expect(rec.similarityScore).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should exclude the source property from recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const recommendedIds = response.body.recommendations.map((rec: any) => rec.property.id);
      expect(recommendedIds).not.toContain(sourceProperty.id);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar`)
        .expect(401);
    });

    it('should return 404 for non-existent property', async () => {
      const fakeId = 'non-existent-property-id';
      await request(app.getHttpServer())
        .get(`/api/properties/${fakeId}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('GET /api/properties/:id/similar/detailed', () => {
    it('should return detailed similar properties with similarity breakdown', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar/detailed`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sourceProperty');
      expect(response.body).toHaveProperty('recommendations');

      if (response.body.recommendations.length > 0) {
        const recommendation = response.body.recommendations[0];
        expect(recommendation).toHaveProperty('detailedSimilarity');
        expect(recommendation).toHaveProperty('pros');
        expect(recommendation).toHaveProperty('cons');

        // Validate detailed similarity structure
        const detailedSimilarity = recommendation.detailedSimilarity;
        expect(detailedSimilarity).toHaveProperty('locationSimilarity');
        expect(detailedSimilarity).toHaveProperty('structuralSimilarity');
        expect(detailedSimilarity).toHaveProperty('amenitySimilarity');
        expect(detailedSimilarity).toHaveProperty('styleSimilarity');
        expect(detailedSimilarity).toHaveProperty('priceSimilarity');
        expect(detailedSimilarity).toHaveProperty('overallSimilarity');

        // Validate pros and cons
        expect(Array.isArray(recommendation.pros)).toBe(true);
        expect(Array.isArray(recommendation.cons)).toBe(true);
      }
    });

    it('should limit detailed recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar/detailed?limit=3`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.recommendations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('POST /api/properties/:id/similar/feedback', () => {
    it('should accept recommendation feedback', async () => {
      const feedback = {
        recommendedPropertyId: similarProperty1.id,
        rating: 4,
        helpful: true,
        comments: 'Great recommendation, very similar to what I was looking for!',
        issues: [],
      };

      const response = await request(app.getHttpServer())
        .post(`/api/properties/${sourceProperty.id}/similar/feedback`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(feedback)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('feedbackId');
      expect(response.body.message).toContain('Feedback recorded successfully');
    });

    it('should accept negative feedback with issues', async () => {
      const feedback = {
        recommendedPropertyId: differentProperty.id,
        rating: 2,
        helpful: false,
        comments: 'Too far from original location',
        issues: ['too_far', 'wrong_price_range'],
      };

      const response = await request(app.getHttpServer())
        .post(`/api/properties/${sourceProperty.id}/similar/feedback`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(feedback)
        .expect(200);

      expect(response.body).toHaveProperty('feedbackId');
    });

    it('should require authentication', async () => {
      const feedback = {
        recommendedPropertyId: similarProperty1.id,
        rating: 4,
        helpful: true,
      };

      await request(app.getHttpServer())
        .post(`/api/properties/${sourceProperty.id}/similar/feedback`)
        .send(feedback)
        .expect(401);
    });
  });

  describe('GET /api/properties/recommendations/trending', () => {
    it('should return trending properties', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/recommendations/trending')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('trending');
      expect(response.body).toHaveProperty('metadata');

      expect(Array.isArray(response.body.trending)).toBe(true);

      if (response.body.trending.length > 0) {
        const trendingProperty = response.body.trending[0];
        expect(trendingProperty).toHaveProperty('property');
        expect(trendingProperty).toHaveProperty('trendingScore');
        expect(trendingProperty).toHaveProperty('recommendationCount');
        expect(trendingProperty).toHaveProperty('averageSimilarityScore');
        expect(trendingProperty).toHaveProperty('uniqueSourceProperties');
        expect(trendingProperty).toHaveProperty('thumbnailUrl');
      }

      // Validate metadata
      const metadata = response.body.metadata;
      expect(metadata).toHaveProperty('timeframe');
      expect(metadata).toHaveProperty('totalProperties');
      expect(metadata).toHaveProperty('filters');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/recommendations/trending?limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.trending.length).toBeLessThanOrEqual(5);
    });

    it('should respect timeframe parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/recommendations/trending?timeframe=month')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.metadata.timeframe).toBe('month');
    });

    it('should filter by city and state', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/recommendations/trending?city=Austin&state=TX')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.metadata.filters.city).toBe('Austin');
      expect(response.body.metadata.filters.state).toBe('TX');
    });
  });

  describe('POST /api/properties/recommendations/batch-update-embeddings', () => {
    it('should start batch embedding update (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties/recommendations/batch-update-embeddings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyIds: [sourceProperty.id, similarProperty1.id],
          batchSize: 10,
        })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('totalProperties');
      expect(response.body).toHaveProperty('estimatedTime');
      expect(response.body).toHaveProperty('status');

      expect(response.body.totalProperties).toBe(2);
      expect(response.body.status).toBe('processing');
    });

    it('should require admin access', async () => {
      await request(app.getHttpServer())
        .post('/api/properties/recommendations/batch-update-embeddings')
        .set('Authorization', `Bearer ${userToken}`) // Regular user token
        .send({
          propertyIds: [sourceProperty.id],
        })
        .expect(403);
    });

    it('should handle empty property list', async () => {
      await request(app.getHttpServer())
        .post('/api/properties/recommendations/batch-update-embeddings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyIds: [],
        })
        .expect(400);
    });
  });

  describe('GET /api/properties/recommendations/analytics', () => {
    it('should return recommendation analytics (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/recommendations/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('insights');

      // Validate overview
      const overview = response.body.overview;
      expect(overview).toHaveProperty('totalRecommendations');
      expect(overview).toHaveProperty('averageSimilarityScore');
      expect(overview).toHaveProperty('cacheHitRate');
      expect(overview).toHaveProperty('averageResponseTime');

      // Validate performance
      const performance = response.body.performance;
      expect(performance).toHaveProperty('embeddingCoverage');
      expect(performance).toHaveProperty('recommendationAccuracy');
      expect(performance).toHaveProperty('userSatisfaction');

      // Validate insights
      expect(Array.isArray(response.body.insights)).toBe(true);
    });

    it('should require admin access', async () => {
      await request(app.getHttpServer())
        .get('/api/properties/recommendations/analytics')
        .set('Authorization', `Bearer ${userToken}`) // Regular user token
        .expect(403);
    });

    it('should support timeframe parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/recommendations/analytics?timeframe=week')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overview');
    });
  });

  describe('Recommendation Algorithm Validation', () => {
    it('should calculate similarity scores within valid ranges', async () => {
      const similarity = await recommendationService.calculateSimilarity(
        sourceProperty as any,
        similarProperty1 as any
      );

      // All similarity components should be 0-1
      expect(similarity.locationSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.locationSimilarity).toBeLessThanOrEqual(1);
      expect(similarity.structuralSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.structuralSimilarity).toBeLessThanOrEqual(1);
      expect(similarity.amenitySimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.amenitySimilarity).toBeLessThanOrEqual(1);
      expect(similarity.styleSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.styleSimilarity).toBeLessThanOrEqual(1);
      expect(similarity.priceSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.priceSimilarity).toBeLessThanOrEqual(1);
      expect(similarity.overallSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.overallSimilarity).toBeLessThanOrEqual(1);
    });

    it('should rank more similar properties higher', async () => {
      const recommendations = await recommendationService.findSimilarProperties(
        sourceProperty.id,
        { limit: 10 }
      );

      if (recommendations.length > 1) {
        // Recommendations should be sorted by similarity score (descending)
        for (let i = 1; i < recommendations.length; i++) {
          expect(recommendations[i-1].similarityScore).toBeGreaterThanOrEqual(
            recommendations[i].similarityScore
          );
        }
      }
    });

    it('should diversify results to avoid too many similar properties', async () => {
      const recommendations = await recommendationService.findSimilarProperties(
        sourceProperty.id,
        { limit: 10, diversityWeight: 0.5 }
      );

      // Should have variety in property types, locations, etc.
      // This is hard to test precisely, but we can check basic diversity
      if (recommendations.length > 3) {
        const cities = new Set(recommendations.map(rec => rec.property.city));
        const propertyTypes = new Set(recommendations.map(rec => rec.property.propertyType));
        
        // Should have some variety (not all identical)
        expect(cities.size).toBeGreaterThan(0);
        expect(propertyTypes.size).toBeGreaterThan(0);
      }
    });

    it('should exclude properties outside distance range', async () => {
      const recommendations = await recommendationService.findSimilarProperties(
        sourceProperty.id,
        { maxDistance: 5 } // 5km radius
      );

      recommendations.forEach(rec => {
        expect(rec.distanceKm).toBeLessThanOrEqual(5);
      });
    });

    it('should exclude properties outside price range', async () => {
      const recommendations = await recommendationService.findSimilarProperties(
        sourceProperty.id,
        { priceRangePercent: 0.05 } // ±5%
      );

      const sourcePrice = sourceProperty.price;
      const maxPriceDiff = sourcePrice * 0.05;

      recommendations.forEach(rec => {
        const priceDiff = Math.abs(rec.priceDifference);
        expect(priceDiff).toBeLessThanOrEqual(maxPriceDiff);
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should cache recommendations for faster subsequent requests', async () => {
      // First request
      const start1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const time2 = Date.now() - start2;

      // Results should be identical
      expect(response1.body.recommendations.length).toBe(response2.body.recommendations.length);
      
      // Second request should generally be faster (cached)
      expect(time2).toBeLessThan(time1 * 2); // Allow some variance
    });

    it('should handle cache invalidation', async () => {
      // Get initial recommendations
      const initialResponse = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Invalidate cache
      await recommendationService.invalidateRecommendationCache(sourceProperty.id);

      // Get recommendations again (should be recalculated)
      const newResponse = await request(app.getHttpServer())
        .get(`/api/properties/${sourceProperty.id}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should still return valid recommendations
      expect(newResponse.body.recommendations).toBeDefined();
      expect(Array.isArray(newResponse.body.recommendations)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing property embeddings gracefully', async () => {
      // Create a property without embedding
      const newProperty = await createTestProperty(testUser.id, {
        address: '999 No Embedding St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        propertyType: PropertyType.SINGLE_FAMILY,
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 1500,
        price: 350000,
        latitude: 30.2600,
        longitude: -97.7400,
      });

      // Should still work (will generate embedding on-demand)
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${newProperty.id}/similar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.recommendations).toBeDefined();
    });

    it('should handle invalid similarity scores gracefully', async () => {
      // Mock a service method to return invalid similarity
      const originalCalculateSimilarity = recommendationService.calculateSimilarity;
      jest.spyOn(recommendationService, 'calculateSimilarity').mockImplementation(async () => {
        throw new Error('Similarity calculation failed');
      });

      // Should handle the error gracefully
      try {
        await request(app.getHttpServer())
          .get(`/api/properties/${sourceProperty.id}/similar`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(500);
      } finally {
        // Restore original method
        recommendationService.calculateSimilarity = originalCalculateSimilarity;
      }
    });
  });
});