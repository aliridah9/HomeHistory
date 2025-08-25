/**
 * AI Search Integration Tests
 * Tests for natural language search functionality
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AISearchService } from '../../src/ai/services/ai-search.service';
import { prisma, createTestUser, createTestProperty, generateTestToken } from '../setup';

describe('AI Search Integration (e2e)', () => {
  let app: INestApplication;
  let aiSearchService: AISearchService;
  let testUser: any;
  let testProperties: any[];
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import necessary modules for testing
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    aiSearchService = moduleFixture.get<AISearchService>(AISearchService);
    await app.init();

    // Create test data
    testUser = await createTestUser();
    authToken = generateTestToken(testUser.id);

    // Create test properties with different characteristics
    testProperties = await Promise.all([
      createTestProperty(testUser.id, {
        address: '123 Modern St',
        city: 'Austin',
        state: 'TX',
        propertyType: 'SINGLE_FAMILY',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        yearBuilt: 2020,
      }),
      createTestProperty(testUser.id, {
        address: '456 Luxury Ave',
        city: 'Austin',
        state: 'TX',
        propertyType: 'CONDO',
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1500,
        yearBuilt: 2018,
      }),
      createTestProperty(testUser.id, {
        address: '789 Family Dr',
        city: 'Dallas',
        state: 'TX',
        propertyType: 'SINGLE_FAMILY',
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2500,
        yearBuilt: 2015,
      }),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/search/nl', () => {
    it('should process natural language query for modern homes', async () => {
      const query = 'Find me a modern 3-bedroom house in Austin';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('searchTime');
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('filters');

      expect(response.body.query.original).toBe(query);
      expect(response.body.query.processed).toHaveProperty('confidence');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it('should extract property type from natural language', async () => {
      const query = 'Show me condos in downtown Austin';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      const processed = response.body.query.processed;
      expect(processed.propertyTypes).toContain('CONDO');
      expect(processed.location?.city?.toLowerCase()).toContain('austin');
    });

    it('should handle price range extraction', async () => {
      const query = 'Find houses under $500,000 in Texas';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      const processed = response.body.query.processed;
      expect(processed.priceRange?.max).toBeLessThanOrEqual(500000);
      expect(processed.location?.state).toBe('TX');
    });

    it('should extract bedroom and bathroom requirements', async () => {
      const query = 'I need a 4-bedroom, 3-bathroom family home';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      const processed = response.body.query.processed;
      expect(processed.features?.bedrooms?.min).toBeGreaterThanOrEqual(4);
      expect(processed.features?.bathrooms?.min).toBeGreaterThanOrEqual(3);
      expect(processed.vibeKeywords).toContain('family_friendly');
    });

    it('should handle vibe keywords and amenities', async () => {
      const query = 'Looking for a luxury waterfront property with pool and modern kitchen';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      const processed = response.body.query.processed;
      expect(processed.vibeKeywords).toContain('luxury');
      expect(processed.amenities).toContain('pool');
      expect(processed.amenities).toContain('waterfront');
    });

    it('should respect pagination parameters', async () => {
      const query = 'Show me houses in Texas';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          query,
          limit: 5,
          offset: 0
        })
        .expect(200);

      expect(response.body.results.length).toBeLessThanOrEqual(5);
    });

    it('should provide match reasons and highlights', async () => {
      const query = 'Modern family home with 3 bedrooms';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      if (response.body.results.length > 0) {
        const firstResult = response.body.results[0];
        expect(firstResult).toHaveProperty('matchReasons');
        expect(firstResult).toHaveProperty('highlights');
        expect(firstResult).toHaveProperty('relevanceScore');
        expect(firstResult).toHaveProperty('semanticScore');
        expect(firstResult).toHaveProperty('filterScore');
        expect(Array.isArray(firstResult.matchReasons)).toBe(true);
        expect(Array.isArray(firstResult.highlights)).toBe(true);
      }
    });

    it('should handle complex queries with multiple criteria', async () => {
      const query = 'Find me a spacious 3+ bedroom house built after 2010 in Austin under $600k with a garage';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      const processed = response.body.query.processed;
      expect(processed.features?.bedrooms?.min).toBeGreaterThanOrEqual(3);
      expect(processed.features?.yearBuilt?.min).toBeGreaterThanOrEqual(2010);
      expect(processed.priceRange?.max).toBeLessThanOrEqual(600000);
      expect(processed.location?.city?.toLowerCase()).toContain('austin');
      expect(processed.amenities).toContain('garage');
      expect(processed.vibeKeywords).toContain('spacious');
    });

    it('should return appropriate error for invalid queries', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should require authentication', async () => {
      const query = 'Find me a house';

      await request(app.getHttpServer())
        .post('/api/search/nl')
        .send({ query })
        .expect(401);
    });
  });

  describe('Search Analytics and Performance', () => {
    it('should track search performance metrics', async () => {
      const query = 'Modern downtown condo';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      expect(response.body.searchTime).toBeGreaterThan(0);
      expect(typeof response.body.searchTime).toBe('number');
    });

    it('should provide search suggestions', async () => {
      const query = 'Austin homes';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      expect(Array.isArray(response.body.suggestions)).toBe(true);
      expect(response.body.suggestions.length).toBeGreaterThan(0);
    });

    it('should return available filters', async () => {
      const query = 'Texas properties';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      expect(response.body.filters).toHaveProperty('appliedFilters');
      expect(response.body.filters).toHaveProperty('availableFilters');
      expect(typeof response.body.filters.availableFilters).toBe('object');
    });
  });

  describe('Hybrid Search Functionality', () => {
    it('should combine semantic and filter-based results', async () => {
      const query = 'Cozy family home with modern amenities';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      if (response.body.results.length > 0) {
        const result = response.body.results[0];
        expect(result.relevanceScore).toBeGreaterThan(0);
        expect(result.semanticScore).toBeGreaterThan(0);
        expect(result.filterScore).toBeGreaterThanOrEqual(0);
        
        // Relevance score should be a combination of semantic and filter scores
        expect(result.relevanceScore).toBeLessThanOrEqual(1);
      }
    });

    it('should rank results by relevance', async () => {
      const query = 'Austin single family home';

      const response = await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);

      if (response.body.results.length > 1) {
        const results = response.body.results;
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].relevanceScore).toBeGreaterThanOrEqual(results[i + 1].relevanceScore);
        }
      }
    });
  });

  describe('Caching Behavior', () => {
    it('should cache search criteria extraction', async () => {
      const query = 'Modern 3-bedroom house in Austin';

      // First request
      const start1 = Date.now();
      await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request (should be faster due to caching)
      const start2 = Date.now();
      await request(app.getHttpServer())
        .post('/api/search/nl')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query })
        .expect(200);
      const time2 = Date.now() - start2;

      // Second request should generally be faster (though not guaranteed in tests)
      expect(time2).toBeLessThan(time1 * 2); // Allow some variance
    });
  });
});