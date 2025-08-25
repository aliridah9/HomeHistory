/**
 * AI Controller - API endpoints for AI operations
 * RESTful endpoints for property analysis, document processing, and semantic search
 */

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator';
import { OpenAIService } from './services/openai.service';
import { EmbeddingService } from './services/embedding.service';
import { CacheManagerService } from './services/cache-manager.service';
import { 
  PropertyAnalysisDto, 
  DocumentAnalysisDto, 
  EmbeddingRequestDto,
  SearchQueryDto,
  CompletionRequestDto 
} from './dto';
import { User } from '@homehistory/database';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly embeddingService: EmbeddingService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @Post('analyze/property')
  @ApiOperation({ summary: 'Analyze property using AI' })
  @ApiResponse({ status: 200, description: 'Property analysis completed' })
  async analyzeProperty(
    @CurrentUser() user: User,
    @Body() dto: PropertyAnalysisDto,
  ) {
    return this.openaiService.analyzeProperty({
      propertyId: dto.propertyId,
      analysisType: dto.analysisType,
      includeComparables: dto.includeComparables,
      includeMarketTrends: dto.includeMarketTrends,
      includeRiskFactors: dto.includeRiskFactors,
      customPrompt: dto.customPrompt,
      maxTokens: dto.maxTokens,
      temperature: dto.temperature,
    });
  }

  @Post('analyze/document')
  @ApiOperation({ summary: 'Analyze document using AI' })
  @ApiResponse({ status: 200, description: 'Document analysis completed' })
  async analyzeDocument(
    @CurrentUser() user: User,
    @Body() dto: DocumentAnalysisDto,
  ) {
    return this.openaiService.analyzeDocument({
      documentId: dto.documentId,
      documentType: dto.documentType,
      extractionType: dto.extractionType,
      customFields: dto.customFields,
      language: dto.language,
    });
  }

  @Post('embeddings/generate')
  @ApiOperation({ summary: 'Generate text embedding' })
  @ApiResponse({ status: 200, description: 'Embedding generated successfully' })
  async generateEmbedding(
    @CurrentUser() user: User,
    @Body() dto: EmbeddingRequestDto,
  ) {
    return this.embeddingService.generateEmbedding({
      text: dto.text,
      model: dto.model,
      dimensions: dto.dimensions,
      userId: user.id,
      metadata: dto.metadata,
    });
  }

  @Post('embeddings/batch')
  @ApiOperation({ summary: 'Generate multiple embeddings in batch' })
  @ApiResponse({ status: 200, description: 'Batch embeddings generated' })
  async generateBatchEmbeddings(
    @CurrentUser() user: User,
    @Body() dto: { texts: string[]; model?: string; dimensions?: number },
  ) {
    return this.embeddingService.generateBatchEmbeddings(dto.texts, {
      model: dto.model as any,
      dimensions: dto.dimensions,
      userId: user.id,
    });
  }

  @Post('search/similarity')
  @ApiOperation({ summary: 'Perform semantic similarity search' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async similaritySearch(
    @CurrentUser() user: User,
    @Body() dto: SearchQueryDto,
  ) {
    return this.embeddingService.similaritySearch({
      query: dto.query,
      filters: dto.filters,
      limit: dto.limit,
      threshold: dto.threshold,
    });
  }

  @Get('search/similar-properties/:propertyId')
  @ApiOperation({ summary: 'Find similar properties' })
  @ApiResponse({ status: 200, description: 'Similar properties found' })
  async findSimilarProperties(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Query('limit') limit?: number,
    @Query('threshold') threshold?: number,
  ) {
    return this.embeddingService.findSimilarProperties(propertyId, {
      limit: limit ? parseInt(limit.toString()) : undefined,
      threshold: threshold ? parseFloat(threshold.toString()) : undefined,
    });
  }

  @Post('completion')
  @ApiOperation({ summary: 'Generate text completion' })
  @ApiResponse({ status: 200, description: 'Completion generated' })
  async generateCompletion(
    @CurrentUser() user: User,
    @Body() dto: CompletionRequestDto,
  ) {
    return this.openaiService.generateCompletion(dto.prompt, {
      model: dto.model,
      maxTokens: dto.maxTokens,
      temperature: dto.temperature,
      systemPrompt: dto.systemPrompt,
      userId: user.id,
    });
  }

  @Get('models/capabilities/:model')
  @ApiOperation({ summary: 'Get model capabilities' })
  @ApiResponse({ status: 200, description: 'Model capabilities returned' })
  getModelCapabilities(@Param('model') model: string) {
    return this.openaiService.getModelCapabilities(model);
  }

  @Get('usage/stats')
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics returned' })
  getUsageStats(@Query('timeframe') timeframe?: 'hour' | 'day' | 'week' | 'month') {
    return this.openaiService.getUsageStats(timeframe);
  }

  @Get('embeddings/stats')
  @ApiOperation({ summary: 'Get embedding statistics' })
  @ApiResponse({ status: 200, description: 'Embedding statistics returned' })
  async getEmbeddingStats() {
    return this.embeddingService.getEmbeddingStats();
  }

  @Post('embeddings/update-all')
  @ApiOperation({ summary: 'Update all property embeddings' })
  @ApiResponse({ status: 202, description: 'Batch job started' })
  @HttpCode(HttpStatus.ACCEPTED)
  async updateAllEmbeddings(@CurrentUser() user: User) {
    return this.embeddingService.updateAllPropertyEmbeddings();
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics returned' })
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  @Get('cache/health')
  @ApiOperation({ summary: 'Get cache health status' })
  @ApiResponse({ status: 200, description: 'Cache health status returned' })
  getCacheHealth() {
    return this.cacheManager.getHealth();
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear all cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @HttpCode(HttpStatus.OK)
  async clearCache() {
    await this.cacheManager.clear();
    return { message: 'Cache cleared successfully' };
  }

  @Post('cache/clear-tags')
  @ApiOperation({ summary: 'Clear cache by tags' })
  @ApiResponse({ status: 200, description: 'Tagged cache entries cleared' })
  async clearCacheByTags(@Body() dto: { tags: string[] }) {
    const deletedCount = await this.cacheManager.deleteByTags(dto.tags);
    return { message: `Cleared ${deletedCount} cache entries`, deletedCount };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get AI module health status' })
  @ApiResponse({ status: 200, description: 'Health status returned' })
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        openai: 'healthy',
        embedding: 'healthy',
        cache: this.cacheManager.getHealth().status,
      },
      version: '1.0.0',
    };
  }
}
