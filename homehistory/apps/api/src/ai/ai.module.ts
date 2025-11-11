/**
 * AI Module - Core AI infrastructure for HomeHistory
 * Enterprise-grade AI module with OpenAI integration, caching, and monitoring
 */

import { Module, Global } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './services/openai.service';
import { EmbeddingService } from './services/embedding.service';
import { CacheManagerService } from './services/cache-manager.service';
import { AIDatabaseService } from './services/ai-database.service';
import { ScrapedDataService } from './services/scraped-data.service';
import { AISearchService } from './services/ai-search.service';
import { ScoringEngineService } from './services/scoring-engine.service';
import { RecommendationService } from './services/recommendation.service';
import { CacheOptimizationService } from './services/cache-optimization.service';
import { PerformanceMonitoringService } from './services/performance-monitoring.service';
import { ProductionOptimizationService } from './services/production-optimization.service';
import { AIController } from './ai.controller';
import { ScoringController } from './controllers/scoring.controller';
import { RecommendationController } from './controllers/recommendation.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AIHealthController } from './controllers/health.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { SavedSearchesController } from './controllers/saved-searches.controller';
import { FavoritesController } from './controllers/favorites.controller';
import { UserPreferencesController } from './controllers/user-preferences.controller';
import { AnalyticsTrackingService } from './services/analytics-tracking.service';
import { DatabaseModule } from '../modules/database/database.module';
import { SupabaseModule } from '../modules/supabase/supabase.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SupabaseModule,
    TerminusModule,
  ],
  controllers: [
    AIController,
    ScoringController,
    RecommendationController,
    AdminDashboardController,
    AIHealthController,
    AnalyticsController,
    SavedSearchesController,
    FavoritesController,
    UserPreferencesController,
  ],
  providers: [
    AIDatabaseService,
    CacheManagerService,
    ScrapedDataService,
    OpenAIService,
    EmbeddingService,
    AISearchService,
    ScoringEngineService,
    RecommendationService,
    CacheOptimizationService,
    PerformanceMonitoringService,
    ProductionOptimizationService,
    AnalyticsTrackingService,
  ],
  exports: [
    AIDatabaseService,
    OpenAIService,
    EmbeddingService,
    CacheManagerService,
    ScrapedDataService,
    AISearchService,
    ScoringEngineService,
    RecommendationService,
    CacheOptimizationService,
    PerformanceMonitoringService,
    ProductionOptimizationService,
    AnalyticsTrackingService,
  ],
})
export class AIModule {
  constructor() {
    console.log('🤖 AI Module initialized - HomeHistory Real Estate Intelligence Platform');
  }
}
