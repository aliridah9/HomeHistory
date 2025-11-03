/**
 * User Preferences Controller
 * Manages user AI preferences and settings
 */

import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

interface AIPreferences {
  searchPreferences: {
    enableNaturalLanguage: boolean;
    saveSearchHistory: boolean;
    enableSmartSuggestions: boolean;
    preferenceWeight: {
      location: number;
      price: number;
      size: number;
      quality: number;
    };
  };
  recommendationPreferences: {
    enableRecommendations: boolean;
    diversityLevel: 'low' | 'medium' | 'high';
    exploreNewAreas: boolean;
    similarityThreshold: number;
  };
  scoringPreferences: {
    priorityFactors: string[];
    minimumScore: number;
    showDetailedBreakdown: boolean;
  };
  notificationPreferences: {
    newRecommendations: boolean;
    scoreChanges: boolean;
    marketInsights: boolean;
    priceDrops: boolean;
  };
}

@Controller('api/user/preferences')
@UseGuards(JwtAuthGuard)
export class UserPreferencesController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get AI preferences for current user
   */
  @Get('ai')
  async getAIPreferences(@CurrentUser() user: any) {
    try {
      // Mock implementation - in production, query from database
      const preferences = await this.getDefaultPreferences(user.id);

      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update AI preferences
   */
  @Put('ai')
  async updateAIPreferences(
    @Body() preferences: Partial<AIPreferences>,
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      // In production: UPDATE user_preferences SET ai_preferences = $1 WHERE user_id = $2

      return {
        success: true,
        data: preferences,
        message: 'Preferences updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reset AI preferences to defaults
   */
  @Put('ai/reset')
  async resetAIPreferences(@CurrentUser() user: any) {
    try {
      const defaultPreferences = await this.getDefaultPreferences(user.id);

      return {
        success: true,
        data: defaultPreferences,
        message: 'Preferences reset to defaults',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get notification preferences
   */
  @Get('notifications')
  async getNotificationPreferences(@CurrentUser() user: any) {
    try {
      const preferences = await this.getDefaultPreferences(user.id);

      return {
        success: true,
        data: preferences.notificationPreferences,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update notification preferences
   */
  @Put('notifications')
  async updateNotificationPreferences(
    @Body() notifications: Partial<AIPreferences['notificationPreferences']>,
    @CurrentUser() user: any,
  ) {
    try {
      return {
        success: true,
        data: notifications,
        message: 'Notification preferences updated',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's search history
   */
  @Get('search-history')
  async getSearchHistory(
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      return {
        success: true,
        data: [],
        count: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear search history
   */
  @Put('search-history/clear')
  async clearSearchHistory(@CurrentUser() user: any) {
    try {
      return {
        success: true,
        message: 'Search history cleared',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get default preferences
   */
  private async getDefaultPreferences(userId: string): Promise<AIPreferences> {
    // In production, this would check if user has custom preferences
    // If not, return these defaults
    return {
      searchPreferences: {
        enableNaturalLanguage: true,
        saveSearchHistory: true,
        enableSmartSuggestions: true,
        preferenceWeight: {
          location: 80,
          price: 90,
          size: 70,
          quality: 85,
        },
      },
      recommendationPreferences: {
        enableRecommendations: true,
        diversityLevel: 'medium',
        exploreNewAreas: false,
        similarityThreshold: 75,
      },
      scoringPreferences: {
        priorityFactors: ['safety', 'value', 'location'],
        minimumScore: 60,
        showDetailedBreakdown: true,
      },
      notificationPreferences: {
        newRecommendations: true,
        scoreChanges: false,
        marketInsights: true,
        priceDrops: true,
      },
    };
  }
}

