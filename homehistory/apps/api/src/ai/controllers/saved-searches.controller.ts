/**
 * Saved Searches Controller
 * Manages user's saved search queries and alerts
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: any;
  alertsEnabled: boolean;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Controller('api/saved-searches')
@UseGuards(JwtAuthGuard)
export class SavedSearchesController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all saved searches for current user
   */
  @Get()
  async getSavedSearches(@CurrentUser() user: any) {
    try {
      // For now, return mock data since we need to add the saved_searches table
      // In production, this would query the database
      const savedSearches = await this.getMockSavedSearches(user.id);

      return {
        success: true,
        data: savedSearches,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get a specific saved search
   */
  @Get(':id')
  async getSavedSearch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      const savedSearches = await this.getMockSavedSearches(user.id);
      const search = savedSearches.find(s => s.id === id);

      if (!search) {
        return {
          success: false,
          error: 'Saved search not found',
        };
      }

      return {
        success: true,
        data: search,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a new saved search
   */
  @Post()
  async createSavedSearch(
    @Body() data: {
      name: string;
      query: string;
      filters?: any;
      alertsEnabled?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation - in production, insert into database
      const savedSearch = {
        id: `search-${Date.now()}`,
        userId: user.id,
        name: data.name,
        query: data.query,
        filters: data.filters || {},
        alertsEnabled: data.alertsEnabled || false,
        resultsCount: 0,
        newResultsCount: 0,
        lastChecked: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: savedSearch,
        message: 'Saved search created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update a saved search
   */
  @Put(':id')
  async updateSavedSearch(
    @Param('id') id: string,
    @Body() data: Partial<{
      name: string;
      query: string;
      filters: any;
      alertsEnabled: boolean;
    }>,
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      return {
        success: true,
        message: 'Saved search updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a saved search
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSavedSearch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      // In production: DELETE FROM saved_searches WHERE id = $1 AND user_id = $2
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle alerts for a saved search
   */
  @Put(':id/alerts')
  async toggleAlerts(
    @Param('id') id: string,
    @Body() data: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    try {
      return {
        success: true,
        data: { alertsEnabled: data.enabled },
        message: `Alerts ${data.enabled ? 'enabled' : 'disabled'}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check for new results on a saved search
   */
  @Post(':id/check')
  async checkForNewResults(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      // In production: run the search and compare with previous results
      return {
        success: true,
        data: {
          newResults: 0,
          totalResults: 0,
          lastChecked: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mock data helper (remove in production)
   */
  private async getMockSavedSearches(userId: string) {
    return [
      {
        id: '1',
        userId,
        name: 'Modern Family Homes',
        query: 'modern family home with pool under 500k',
        filters: { maxPrice: 500000, beds: 3, propertyType: 'house' },
        alertsEnabled: true,
        resultsCount: 45,
        newResultsCount: 3,
        lastChecked: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      },
      {
        id: '2',
        userId,
        name: 'Downtown Condos',
        query: 'condo downtown with parking',
        filters: { maxPrice: 400000, beds: 2, propertyType: 'condo' },
        alertsEnabled: false,
        resultsCount: 28,
        newResultsCount: 0,
        lastChecked: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
      },
    ];
  }
}

