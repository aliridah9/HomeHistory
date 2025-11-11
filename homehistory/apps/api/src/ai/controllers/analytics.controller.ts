/**
 * Analytics Controller
 * Provides endpoints for tracking and retrieving AI analytics
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsTrackingService } from '../services/analytics-tracking.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('api/ai/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsTrackingService,
  ) {}

  /**
   * Track search event
   */
  @Post('search')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackSearch(
    @Body() data: {
      query: string;
      searchType: string;
      filters?: any;
      extractedCriteria?: any;
      resultsCount: number;
      responseTimeMs: number;
      clickedPropertyIds?: string[];
      favoritedPropertyIds?: string[];
      conversion?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    await this.analyticsService.trackSearch({
      userId: user?.id,
      sessionId: user?.sessionId,
      ...data,
    });
  }

  /**
   * Track property view
   */
  @Post('property-view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackPropertyView(
    @Body() data: {
      propertyId: string;
      referrer?: string;
      referrerQuery?: string;
      timeSpentSeconds?: number;
      actionsTaken?: string[];
      scoreAtView?: number;
      leftVia?: string;
    },
    @CurrentUser() user: any,
  ) {
    await this.analyticsService.trackPropertyView({
      userId: user?.id,
      sessionId: user?.sessionId,
      ...data,
    });
  }

  /**
   * Submit recommendation feedback
   */
  @Post('recommendation-feedback')
  @HttpCode(HttpStatus.NO_CONTENT)
  async submitRecommendationFeedback(
    @Body() data: {
      sourcePropertyId: string;
      recommendedPropertyId: string;
      rating: number;
      helpful: boolean;
      comments?: string;
      issues?: string[];
      similarityScore?: number;
    },
    @CurrentUser() user: any,
  ) {
    await this.analyticsService.storeRecommendationFeedback({
      userId: user.id,
      ...data,
    });
  }

  /**
   * Get usage summary (Admin only)
   */
  @Get('usage-summary')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getUsageSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('serviceType') serviceType?: string,
  ) {
    const start = new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());

    const summary = await this.analyticsService.getUsageSummary(
      start,
      end,
      serviceType,
    );

    return {
      success: true,
      data: summary,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }

  /**
   * Get top search queries (Admin only)
   */
  @Get('top-searches')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getTopSearches(
    @Query('limit') limit?: number,
    @Query('days') days?: number,
  ) {
    const queries = await this.analyticsService.getTopSearchQueries(
      limit ? parseInt(limit.toString()) : 100,
      days ? parseInt(days.toString()) : 30,
    );

    return {
      success: true,
      data: queries,
    };
  }

  /**
   * Get recommendation accuracy metrics (Admin only)
   */
  @Get('recommendation-accuracy')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getRecommendationAccuracy() {
    const metrics = await this.analyticsService.getRecommendationAccuracy();

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get search conversion funnel
   */
  @Get('conversion-funnel')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getConversionFunnel(@Query('days') days?: number) {
    const funnel = await this.analyticsService.getSearchConversionFunnel(
      days ? parseInt(days.toString()) : 7,
    );

    return {
      success: true,
      data: funnel,
    };
  }

  /**
   * Get personal analytics (for current user)
   */
  @Get('personal')
  async getPersonalAnalytics(@CurrentUser() user: any) {
    // TODO: Implement user-specific analytics
    return {
      success: true,
      data: {
        totalSearches: 0,
        favoriteProperties: 0,
        recommendationsViewed: 0,
        averageScore: 0,
      },
    };
  }
}

