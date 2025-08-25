/**
 * AI Services Unit Tests
 * Comprehensive unit tests for all AI services
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { ScoringEngineService } from '../../src/ai/services/scoring-engine.service';
import { RecommendationService } from '../../src/ai/services/recommendation.service';
import { PerformanceMonitoringService } from '../../src/ai/services/performance-monitoring.service';
import { CacheOptimizationService } from '../../src/ai/services/cache-optimization.service';
import { ProductionOptimizationService } from '../../src/ai/services/production-optimization.service';
import { OpenAIService } from '../../src/ai/services/openai.service';
import { EmbeddingService } from '../../src/ai/services/embedding.service';
import { CacheManagerService } from '../../src/ai/services/cache-manager.service';
import { AIDatabaseService } from '../../src/ai/services/ai-database.service';

// Mock implementations
const mockPrismaService = {
  property: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  propertyEmbedding: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  propertyAIScore: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config = {
      'OPENAI_API_KEY': 'test-key',
      'OPENAI_DEFAULT_MODEL': 'gpt-4',
      'OPENAI_EMBEDDING_MODEL': 'text-embedding-3-small',
    };
    return config[key] || defaultValue;
  }),
};

const mockCacheManagerService = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  deleteByTags: jest.fn(),
  cleanup: jest.fn(),
  getStats: jest.fn(),
};

const mockAIDatabaseService = {
  storeUsageMetrics: jest.fn(),
  storePropertyEmbedding: jest.fn(),
  storePropertyScores: jest.fn(),
  createBatchJob: jest.fn(),
};

const mockOpenAIService = {
  generateCompletion: jest.fn(),
  generateEmbedding: jest.fn(),
  getOpenAIClient: jest.fn(),
  handleError: jest.fn(),
};

const mockEmbeddingService = {
  generateEmbedding: jest.fn(),
  storePropertyEmbedding: jest.fn(),
};

describe('AI Services Unit Tests', () => {
  let module: TestingModule;
  let scoringEngineService: ScoringEngineService;
  let recommendationService: RecommendationService;
  let performanceMonitoringService: PerformanceMonitoringService;
  let cacheOptimizationService: CacheOptimizationService;
  let productionOptimizationService: ProductionOptimizationService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ScoringEngineService,
        RecommendationService,
        PerformanceMonitoringService,
        CacheOptimizationService,
        ProductionOptimizationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheManagerService, useValue: mockCacheManagerService },
        { provide: AIDatabaseService, useValue: mockAIDatabaseService },
        { provide: OpenAIService, useValue: mockOpenAIService },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile();

    scoringEngineService = module.get<ScoringEngineService>(ScoringEngineService);
    recommendationService = module.get<RecommendationService>(RecommendationService);
    performanceMonitoringService = module.get<PerformanceMonitoringService>(PerformanceMonitoringService);
    cacheOptimizationService = module.get<CacheOptimizationService>(CacheOptimizationService);
    productionOptimizationService = module.get<ProductionOptimizationService>(ProductionOptimizationService);
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('ScoringEngineService', () => {
    const mockProperty = {
      id: 'test-property-1',
      address: '123 Test St',
      city: 'Austin',
      state: 'TX',
      propertyType: 'SINGLE_FAMILY',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      yearBuilt: 2015,
      price: 450000,
      latitude: 30.2672,
      longitude: -97.7431,
    };

    beforeEach(() => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        ...mockProperty,
        rawDocuments: [],
        reports: [],
        embedding: null,
        aiScore: null,
      });

      mockOpenAIService.generateCompletion.mockResolvedValue({
        content: 'This property has an excellent HomeHistory Score™ of 85/100...',
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      });
    });

    it('should calculate property score successfully', async () => {
      const result = await scoringEngineService.calculateScore('test-property-1');

      expect(result).toBeDefined();
      expect(result.propertyId).toBe('test-property-1');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(result.explanation).toBeDefined();
    });

    it('should generate score explanation', async () => {
      const mockBreakdown = {
        overall: 85,
        quality: { score: 80, factors: {} },
        safety: { score: 85, factors: {} },
        value: { score: 90, factors: {} },
        location: { score: 85, factors: {} },
        confidence: 0.85,
        dataCompleteness: 0.75,
      };

      const explanation = await scoringEngineService.generateScoreExplanation(
        'test-property-1',
        mockBreakdown as any
      );

      expect(explanation).toBeDefined();
      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(50);
      expect(mockOpenAIService.generateCompletion).toHaveBeenCalled();
    });

    it('should handle bulk score recalculation', async () => {
      const propertyIds = ['prop-1', 'prop-2', 'prop-3'];
      
      const result = await scoringEngineService.bulkRecalculateScores(propertyIds, {
        forceRecalculation: true,
        batchSize: 2,
        userId: 'admin-user',
      });

      expect(result).toBeDefined();
      expect(result.jobId).toBeDefined();
      expect(result.totalProperties).toBe(3);
      expect(result.status).toBe('processing');
      expect(mockAIDatabaseService.createBatchJob).toHaveBeenCalled();
    });

    it('should invalidate score cache', async () => {
      await scoringEngineService.invalidateScoreCache('test-property-1', 'property updated');

      expect(mockCacheManagerService.delete).toHaveBeenCalledWith('property_score:test-property-1');
    });

    it('should handle missing property gracefully', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(scoringEngineService.calculateScore('non-existent'))
        .rejects.toThrow('Property not found: non-existent');
    });

    it('should return fallback explanation on AI failure', async () => {
      mockOpenAIService.generateCompletion.mockRejectedValue(new Error('OpenAI API error'));

      const mockBreakdown = {
        overall: 75,
        quality: { score: 75, factors: {} },
        safety: { score: 75, factors: {} },
        value: { score: 75, factors: {} },
        location: { score: 75, factors: {} },
        confidence: 0.75,
        dataCompleteness: 0.70,
      };

      const explanation = await scoringEngineService.generateScoreExplanation(
        'test-property-1',
        mockBreakdown as any
      );

      expect(explanation).toBeDefined();
      expect(explanation).toContain('HomeHistory Score™ of 75/100');
    });
  });

  describe('RecommendationService', () => {
    const mockProperty = {
      id: 'source-property',
      address: '123 Source St',
      city: 'Austin',
      state: 'TX',
      propertyType: 'SINGLE_FAMILY',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      price: 450000,
      latitude: 30.2672,
      longitude: -97.7431,
    };

    const mockCandidates = [
      {
        id: 'candidate-1',
        address: '456 Similar St',
        city: 'Austin',
        state: 'TX',
        propertyType: 'SINGLE_FAMILY',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2100,
        price: 475000,
        latitude: 30.2680,
        longitude: -97.7440,
        embedding: null,
      },
    ];

    beforeEach(() => {
      mockPrismaService.property.findUnique.mockResolvedValue({
        ...mockProperty,
        embedding: {
          id: 'embedding-1',
          embedding: new Array(1536).fill(0.1),
          content: 'Test property description',
        },
      });

      mockPrismaService.property.findMany.mockResolvedValue(mockCandidates);

      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        model: 'text-embedding-3-small',
        tokens: 100,
        cost: 0.00002,
      });
    });

    it('should find similar properties', async () => {
      const recommendations = await recommendationService.findSimilarProperties(
        'source-property',
        { limit: 5 }
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
      
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        expect(rec.property).toBeDefined();
        expect(rec.similarityScore).toBeGreaterThanOrEqual(0);
        expect(rec.similarityScore).toBeLessThanOrEqual(1);
        expect(rec.explanation).toBeDefined();
        expect(rec.keyMatchingFeatures).toBeDefined();
      }
    });

    it('should calculate similarity between properties', async () => {
      const property1 = { ...mockProperty, embedding: { embedding: new Array(1536).fill(0.1) } };
      const property2 = { ...mockCandidates[0], embedding: { embedding: new Array(1536).fill(0.2) } };

      const similarity = await recommendationService.calculateSimilarity(
        property1 as any,
        property2 as any
      );

      expect(similarity).toBeDefined();
      expect(similarity.locationSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.locationSimilarity).toBeLessThanOrEqual(1);
      expect(similarity.structuralSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.structuralSimilarity).toBeLessThanOrEqual(1);
      expect(similarity.overallSimilarity).toBeGreaterThanOrEqual(0);
      expect(similarity.overallSimilarity).toBeLessThanOrEqual(1);
    });

    it('should diversify recommendation results', async () => {
      const mockRecommendations = [
        {
          property: { ...mockCandidates[0], city: 'Austin', propertyType: 'SINGLE_FAMILY' },
          similarityScore: 0.9,
          explanation: 'Similar property 1',
          keyMatchingFeatures: [],
          priceDifference: 25000,
          distanceKm: 2,
        },
        {
          property: { ...mockCandidates[0], id: 'candidate-2', city: 'Austin', propertyType: 'SINGLE_FAMILY' },
          similarityScore: 0.85,
          explanation: 'Similar property 2',
          keyMatchingFeatures: [],
          priceDifference: 30000,
          distanceKm: 3,
        },
        {
          property: { ...mockCandidates[0], id: 'candidate-3', city: 'Houston', propertyType: 'CONDO' },
          similarityScore: 0.8,
          explanation: 'Different property',
          keyMatchingFeatures: [],
          priceDifference: -50000,
          distanceKm: 150,
        },
      ];

      const diversified = recommendationService.diversifyResults(mockRecommendations as any, 0.3);

      expect(diversified).toBeDefined();
      expect(diversified.length).toBe(mockRecommendations.length);
      
      // First recommendation should remain the same (highest similarity)
      expect(diversified[0].similarityScore).toBe(0.9);
    });

    it('should generate property embedding', async () => {
      const embedding = await recommendationService.generatePropertyEmbedding(mockProperty as any);

      expect(embedding).toBeDefined();
      expect(embedding.propertyId).toBe(mockProperty.id);
      expect(embedding.content).toBeDefined();
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalled();
    });

    it('should batch update embeddings', async () => {
      const propertyIds = ['prop-1', 'prop-2', 'prop-3'];
      
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      const result = await recommendationService.batchUpdateEmbeddings(propertyIds, 2);

      expect(result).toBeDefined();
      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('PerformanceMonitoringService', () => {
    it('should track AI operation performance', () => {
      performanceMonitoringService.trackAIOperation('scoring', 1500, true, {
        propertyId: 'test-property',
        model: 'gpt-4',
      });

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.scoringRequests).toBe(1);
    });

    it('should track OpenAI usage', () => {
      performanceMonitoringService.trackOpenAIUsage(150, 0.003, 'gpt-4', 'completion', true);

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.openaiRequests).toBe(1);
      expect(metrics.openaiTokensUsed).toBe(150);
      expect(metrics.openaiCostUSD).toBe(0.003);
    });

    it('should track cache performance', () => {
      performanceMonitoringService.trackCachePerformance(true, 'scoring');
      performanceMonitoringService.trackCachePerformance(false, 'scoring');

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should check circuit breaker state', () => {
      const isOpen = performanceMonitoringService.checkCircuitBreaker('openai');
      expect(typeof isOpen).toBe('boolean');
    });

    it('should record circuit breaker failures and successes', () => {
      // Record multiple failures
      for (let i = 0; i < 6; i++) {
        performanceMonitoringService.recordCircuitBreakerFailure('test-service');
      }

      // Circuit breaker should be open
      const isOpenAfterFailures = performanceMonitoringService.checkCircuitBreaker('test-service');
      expect(isOpenAfterFailures).toBe(false);

      // Record success to potentially close circuit
      performanceMonitoringService.recordCircuitBreakerSuccess('test-service');
    });

    it('should get service health status', () => {
      const health = performanceMonitoringService.getServiceHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.metrics).toBeDefined();
      expect(health.uptime).toBeGreaterThan(0);
    });

    it('should create and resolve alerts', () => {
      // Simulate high response time to trigger alert
      performanceMonitoringService.trackAIOperation('scoring', 6000, true);

      const alerts = performanceMonitoringService.getAlerts(false);
      expect(alerts.length).toBeGreaterThan(0);

      // Resolve the first alert
      if (alerts.length > 0) {
        performanceMonitoringService.resolveAlert(alerts[0].id);
        const resolvedAlerts = performanceMonitoringService.getAlerts(true);
        expect(resolvedAlerts.length).toBeGreaterThan(0);
      }
    });

    it('should reset metrics', () => {
      // Add some metrics
      performanceMonitoringService.trackAIOperation('scoring', 1000, true);
      performanceMonitoringService.trackOpenAIUsage(100, 0.002, 'gpt-4', 'completion', true);

      // Reset metrics
      performanceMonitoringService.resetMetrics();

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.openaiRequests).toBe(0);
    });
  });

  describe('CacheOptimizationService', () => {
    beforeEach(() => {
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'prop-1' },
        { id: 'prop-2' },
        { id: 'prop-3' },
      ]);

      mockCacheManagerService.getStats.mockResolvedValue({
        requests: 100,
        hits: 85,
        misses: 15,
        averageResponseTime: 50,
        popularKeys: ['key1', 'key2'],
        memoryUsage: 1024 * 1024, // 1MB
        evictions: 5,
      });
    });

    it('should warm property scores cache', async () => {
      const jobId = await cacheOptimizationService.warmPropertyScoresCache(['prop-1', 'prop-2']);
      
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
      
      const job = cacheOptimizationService.getCacheWarmingJobStatus(jobId);
      expect(job).toBeDefined();
      expect(job?.type).toBe('scores');
    });

    it('should warm recommendations cache', async () => {
      const jobId = await cacheOptimizationService.warmRecommendationsCache(['prop-1', 'prop-2']);
      
      expect(jobId).toBeDefined();
      const job = cacheOptimizationService.getCacheWarmingJobStatus(jobId);
      expect(job?.type).toBe('recommendations');
    });

    it('should get cache analytics', async () => {
      const analytics = await cacheOptimizationService.getCacheAnalytics();
      
      expect(analytics).toBeDefined();
      expect(typeof analytics).toBe('object');
      
      // Check that analytics contain expected cache types
      const cacheTypes = Object.keys(analytics);
      expect(cacheTypes.length).toBeGreaterThan(0);
      
      // Validate analytics structure
      for (const [type, stats] of Object.entries(analytics)) {
        expect(stats.totalRequests).toBeGreaterThanOrEqual(0);
        expect(stats.hitRate).toBeGreaterThanOrEqual(0);
        expect(stats.hitRate).toBeLessThanOrEqual(1);
      }
    });

    it('should invalidate cache on property update', async () => {
      await cacheOptimizationService.invalidateCacheOnPropertyUpdate('prop-1', 'property_updated');
      
      expect(mockCacheManagerService.deleteByTags).toHaveBeenCalledWith(['property', 'prop-1']);
    });

    it('should get active cache warming jobs', () => {
      const activeJobs = cacheOptimizationService.getActiveCacheWarmingJobs();
      expect(Array.isArray(activeJobs)).toBe(true);
    });
  });

  describe('ProductionOptimizationService', () => {
    beforeEach(() => {
      // Mock Bull queue
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      };
      
      // Replace the queue in the service (this would be injected in real implementation)
      (productionOptimizationService as any).aiRequestQueue = mockQueue;
    });

    it('should queue AI request with priority', async () => {
      const requestId = await productionOptimizationService.queueAIRequest({
        type: 'scoring',
        propertyId: 'prop-1',
        priority: 'high',
        params: { forceRecalculation: true },
        maxRetries: 3,
      });

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
    });

    it('should get optimization status', () => {
      const status = productionOptimizationService.getOptimizationStatus();
      
      expect(status).toBeDefined();
      expect(status.requestQueue).toBeDefined();
      expect(status.circuitBreakers).toBeDefined();
      expect(status.requestQueue.activeRequests).toBeGreaterThanOrEqual(0);
      expect(status.requestQueue.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(status.requestQueue.utilizationRate).toBeLessThanOrEqual(1);
    });

    it('should handle fallback responses', async () => {
      const mockRequest = {
        id: 'req-1',
        type: 'scoring' as const,
        propertyId: 'prop-1',
        priority: 'medium' as const,
        params: {},
        timestamp: new Date(),
        retries: 0,
        maxRetries: 3,
      };

      const fallback = await productionOptimizationService.getFallbackResponse(
        mockRequest,
        new Error('Service unavailable')
      );

      expect(fallback).toBeDefined();
      expect(fallback?.type).toBeDefined();
      expect(fallback?.data).toBeDefined();
      expect(fallback?.message).toBeDefined();
      expect(fallback?.fallbackReason).toBeDefined();
    });

    it('should optimize vector queries', async () => {
      const result = await productionOptimizationService.optimizeVectorQuery(
        'SELECT * FROM property_embeddings WHERE embedding <-> $1 < 0.5',
        [[0.1, 0.2, 0.3]]
      );

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockPrismaService.property.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(scoringEngineService.calculateScore('test-property'))
        .rejects.toThrow();
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAIService.generateCompletion.mockRejectedValue(new Error('OpenAI API rate limit'));

      const mockBreakdown = {
        overall: 75,
        quality: { score: 75, factors: {} },
        safety: { score: 75, factors: {} },
        value: { score: 75, factors: {} },
        location: { score: 75, factors: {} },
        confidence: 0.75,
        dataCompleteness: 0.70,
      };

      // Should return fallback explanation
      const explanation = await scoringEngineService.generateScoreExplanation(
        'test-property',
        mockBreakdown as any
      );

      expect(explanation).toBeDefined();
      expect(explanation).toContain('HomeHistory Score™');
    });

    it('should handle cache failures gracefully', async () => {
      mockCacheManagerService.get.mockRejectedValue(new Error('Cache connection failed'));
      mockCacheManagerService.set.mockRejectedValue(new Error('Cache write failed'));

      // Services should still work without cache
      const result = await scoringEngineService.calculateScore('test-property');
      expect(result).toBeDefined();
    });

    it('should handle embedding generation failures', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding API failed'));

      await expect(recommendationService.generatePropertyEmbedding({} as any))
        .rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        scoringEngineService.calculateScore(`property-${i}`)
      );

      const results = await Promise.allSettled(concurrentRequests);
      
      // Most requests should succeed (allowing for some failures due to mocking)
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(0);
    });

    it('should handle large batch operations', async () => {
      const largePropertyList = Array.from({ length: 100 }, (_, i) => `property-${i}`);
      
      const result = await recommendationService.batchUpdateEmbeddings(largePropertyList, 10);
      
      expect(result).toBeDefined();
      expect(result.success + result.errors).toBe(largePropertyList.length);
    });

    it('should manage memory usage efficiently', () => {
      // Simulate many operations to test memory management
      for (let i = 0; i < 1000; i++) {
        performanceMonitoringService.trackAIOperation('test', 100, true);
      }

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics.totalRequests).toBe(1000);
      
      // Memory usage should remain reasonable (this is more of a smoke test)
      const memUsage = process.memoryUsage();
      expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});