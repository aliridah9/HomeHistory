/**
 * HomeHistory Score™ Engine Integration Tests
 * Tests for the "Carfax for Homes" scoring system
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ScoringEngineService } from '../../src/ai/services/scoring-engine.service';
import { prisma, createTestUser, createTestProperty, generateTestToken } from '../setup';

describe('HomeHistory Score™ Engine Integration (e2e)', () => {
  let app: INestApplication;
  let scoringEngine: ScoringEngineService;
  let testUser: any;
  let testProperty: any;
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import necessary modules for testing
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    scoringEngine = moduleFixture.get<ScoringEngineService>(ScoringEngineService);
    await app.init();

    // Create test data
    testUser = await createTestUser();
    const adminUser = await createTestUser({ role: 'ADMIN' });
    
    authToken = generateTestToken(testUser.id);
    adminToken = generateTestToken(adminUser.id);

    // Create test property with comprehensive data
    testProperty = await createTestProperty(testUser.id, {
      address: '123 Test Property Lane',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      propertyType: 'SINGLE_FAMILY',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      yearBuilt: 2015,
      price: 450000,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/properties/:id/score', () => {
    it('should calculate and return HomeHistory Score™', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('propertyId', testProperty.id);
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body).toHaveProperty('explanation');
      expect(response.body).toHaveProperty('lastCalculated');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('dataCompleteness');

      // Validate score range
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(100);

      // Validate breakdown structure
      const breakdown = response.body.breakdown;
      expect(breakdown).toHaveProperty('overall');
      expect(breakdown).toHaveProperty('quality');
      expect(breakdown).toHaveProperty('safety');
      expect(breakdown).toHaveProperty('value');
      expect(breakdown).toHaveProperty('location');
      expect(breakdown).toHaveProperty('confidence');
      expect(breakdown).toHaveProperty('dataCompleteness');

      // Validate category scores
      expect(breakdown.quality.score).toBeGreaterThanOrEqual(0);
      expect(breakdown.quality.score).toBeLessThanOrEqual(100);
      expect(breakdown.safety.score).toBeGreaterThanOrEqual(0);
      expect(breakdown.safety.score).toBeLessThanOrEqual(100);
      expect(breakdown.value.score).toBeGreaterThanOrEqual(0);
      expect(breakdown.value.score).toBeLessThanOrEqual(100);
      expect(breakdown.location.score).toBeGreaterThanOrEqual(0);
      expect(breakdown.location.score).toBeLessThanOrEqual(100);

      // Validate explanation
      expect(response.body.explanation).toBeDefined();
      expect(typeof response.body.explanation).toBe('string');
      expect(response.body.explanation.length).toBeGreaterThan(100);
      expect(response.body.explanation.length).toBeLessThan(500);
    });

    it('should return cached score on subsequent requests', async () => {
      // First request
      const start1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request (should be faster due to caching)
      const start2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const time2 = Date.now() - start2;

      // Scores should be identical
      expect(response1.body.score).toBe(response2.body.score);
      expect(response1.body.explanation).toBe(response2.body.explanation);

      // Second request should generally be faster
      expect(time2).toBeLessThan(time1 * 2); // Allow some variance
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score`)
        .expect(401);
    });

    it('should return 404 for non-existent property', async () => {
      const fakeId = 'non-existent-property-id';
      await request(app.getHttpServer())
        .get(`/api/properties/${fakeId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/properties/:id/recalculate-score', () => {
    it('should recalculate score (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/properties/${testProperty.id}/recalculate-score`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('calculationTime');
      expect(response.body).toHaveProperty('changes');

      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(100);
      expect(response.body.calculationTime).toBeGreaterThan(0);
      expect(Array.isArray(response.body.changes)).toBe(true);
    });

    it('should require admin access', async () => {
      await request(app.getHttpServer())
        .post(`/api/properties/${testProperty.id}/recalculate-score`)
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/properties/${testProperty.id}/recalculate-score`)
        .expect(401);
    });
  });

  describe('GET /api/properties/:id/score-history', () => {
    it('should return score history', async () => {
      // First, ensure we have a score
      await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('propertyId', testProperty.id);
      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('summary');

      expect(Array.isArray(response.body.history)).toBe(true);
      
      if (response.body.history.length > 0) {
        const historyEntry = response.body.history[0];
        expect(historyEntry).toHaveProperty('date');
        expect(historyEntry).toHaveProperty('score');
        expect(historyEntry).toHaveProperty('changeReason');
        expect(historyEntry).toHaveProperty('breakdown');
      }

      // Validate summary
      const summary = response.body.summary;
      expect(summary).toHaveProperty('totalEntries');
      expect(summary).toHaveProperty('scoreRange');
      expect(summary).toHaveProperty('trend');
      expect(summary).toHaveProperty('lastUpdated');

      expect(['improving', 'declining', 'stable']).toContain(summary.trend);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score-history?limit=5`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.history.length).toBeLessThanOrEqual(5);
    });

    it('should respect date range parameters', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();

      const response = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score-history`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('summary');
    });
  });

  describe('GET /api/properties/:id/score-breakdown', () => {
    it('should return detailed score breakdown', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score-breakdown`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('propertyId', testProperty.id);
      expect(response.body).toHaveProperty('overallScore');
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('insights');
      expect(response.body).toHaveProperty('metadata');

      // Validate categories
      const categories = response.body.categories;
      expect(categories).toHaveProperty('quality');
      expect(categories).toHaveProperty('safety');
      expect(categories).toHaveProperty('value');
      expect(categories).toHaveProperty('location');

      // Validate category structure
      const quality = categories.quality;
      expect(quality).toHaveProperty('score');
      expect(quality).toHaveProperty('weight');
      expect(quality).toHaveProperty('contribution');
      expect(quality).toHaveProperty('factors');

      // Validate weights sum to 1.0
      const totalWeight = quality.weight + categories.safety.weight + 
                         categories.value.weight + categories.location.weight;
      expect(totalWeight).toBeCloseTo(1.0, 2);

      // Validate insights
      expect(Array.isArray(response.body.insights)).toBe(true);
      if (response.body.insights.length > 0) {
        const insight = response.body.insights[0];
        expect(insight).toHaveProperty('category');
        expect(insight).toHaveProperty('impact');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('recommendation');
        expect(['positive', 'negative', 'neutral']).toContain(insight.impact);
      }

      // Validate metadata
      const metadata = response.body.metadata;
      expect(metadata).toHaveProperty('confidence');
      expect(metadata).toHaveProperty('dataCompleteness');
      expect(metadata).toHaveProperty('lastCalculated');
      expect(metadata).toHaveProperty('version');
    });
  });

  describe('POST /api/properties/bulk-update-scores', () => {
    it('should start bulk score update job (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/properties/bulk-update-scores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyIds: [testProperty.id],
          forceRecalculation: true,
          batchSize: 10,
        })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('totalProperties');
      expect(response.body).toHaveProperty('estimatedTime');
      expect(response.body).toHaveProperty('status');

      expect(response.body.totalProperties).toBe(1);
      expect(response.body.status).toBe('processing');
    });

    it('should require admin access', async () => {
      await request(app.getHttpServer())
        .post('/api/properties/bulk-update-scores')
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .send({
          propertyIds: [testProperty.id],
        })
        .expect(403);
    });

    it('should handle empty property list', async () => {
      await request(app.getHttpServer())
        .post('/api/properties/bulk-update-scores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          propertyIds: [],
        })
        .expect(400);
    });
  });

  describe('GET /api/properties/score-analytics', () => {
    it('should return score analytics (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/score-analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('insights');

      // Validate overview
      const overview = response.body.overview;
      expect(overview).toHaveProperty('totalProperties');
      expect(overview).toHaveProperty('averageScore');
      expect(overview).toHaveProperty('scoreDistribution');
      expect(overview).toHaveProperty('lastUpdated');

      // Validate trends
      const trends = response.body.trends;
      expect(trends).toHaveProperty('scoreChanges');
      expect(trends).toHaveProperty('categoryTrends');
      expect(trends).toHaveProperty('regionalVariations');

      // Validate insights
      expect(Array.isArray(response.body.insights)).toBe(true);
    });

    it('should require admin access', async () => {
      await request(app.getHttpServer())
        .get('/api/properties/score-analytics')
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .expect(403);
    });

    it('should support timeframe parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/properties/score-analytics?timeframe=week')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('trends');
    });
  });

  describe('Scoring Algorithm Validation', () => {
    it('should calculate scores within valid ranges', async () => {
      const score = await scoringEngine.calculateScore(testProperty.id);

      // Overall score validation
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);

      // Category score validation
      expect(score.breakdown.quality.score).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.quality.score).toBeLessThanOrEqual(100);
      expect(score.breakdown.safety.score).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.safety.score).toBeLessThanOrEqual(100);
      expect(score.breakdown.value.score).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.value.score).toBeLessThanOrEqual(100);
      expect(score.breakdown.location.score).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.location.score).toBeLessThanOrEqual(100);

      // Confidence and completeness validation
      expect(score.confidence).toBeGreaterThanOrEqual(0);
      expect(score.confidence).toBeLessThanOrEqual(1);
      expect(score.dataCompleteness).toBeGreaterThanOrEqual(0);
      expect(score.dataCompleteness).toBeLessThanOrEqual(1);
    });

    it('should generate consistent scores for same property', async () => {
      const score1 = await scoringEngine.calculateScore(testProperty.id);
      const score2 = await scoringEngine.calculateScore(testProperty.id);

      expect(score1.score).toBe(score2.score);
      expect(score1.breakdown.quality.score).toBe(score2.breakdown.quality.score);
      expect(score1.breakdown.safety.score).toBe(score2.breakdown.safety.score);
      expect(score1.breakdown.value.score).toBe(score2.breakdown.value.score);
      expect(score1.breakdown.location.score).toBe(score2.breakdown.location.score);
    });

    it('should have proper weighted calculation', async () => {
      const score = await scoringEngine.calculateScore(testProperty.id);
      const breakdown = score.breakdown;

      // Calculate expected weighted score
      const expectedScore = Math.round(
        breakdown.quality.score * 0.30 +
        breakdown.safety.score * 0.25 +
        breakdown.value.score * 0.25 +
        breakdown.location.score * 0.20
      );

      expect(score.score).toBe(expectedScore);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache when property data changes', async () => {
      // Get initial score
      const initialResponse = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Invalidate cache
      await scoringEngine.invalidateScoreCache(testProperty.id, 'Test invalidation');

      // Get score again (should be recalculated)
      const newResponse = await request(app.getHttpServer())
        .get(`/api/properties/${testProperty.id}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Scores might be the same, but lastCalculated should be different
      expect(new Date(newResponse.body.lastCalculated).getTime())
        .toBeGreaterThan(new Date(initialResponse.body.lastCalculated).getTime());
    });
  });

  describe('Error Handling', () => {
    it('should handle missing property gracefully', async () => {
      const fakeId = 'non-existent-property-id';
      
      try {
        await scoringEngine.calculateScore(fakeId);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Property not found');
      }
    });

    it('should handle scoring service errors gracefully', async () => {
      // This would test error scenarios like API failures, database issues, etc.
      // Implementation would depend on specific error scenarios to test
    });
  });
});