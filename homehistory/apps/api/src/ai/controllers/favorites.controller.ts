/**
 * Favorites Controller
 * Manages user's favorite properties
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('api/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all favorites for current user
   */
  @Get()
  async getFavorites(
    @CurrentUser() user: any,
    @Query('tags') tags?: string,
  ) {
    try {
      // Mock implementation - in production, query from database
      const favorites = await this.getMockFavorites(user.id);

      // Filter by tags if provided
      let filtered = favorites;
      if (tags) {
        const tagArray = tags.split(',');
        filtered = favorites.filter(fav =>
          tagArray.some(tag => fav.tags.includes(tag))
        );
      }

      return {
        success: true,
        data: filtered,
        count: filtered.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get a specific favorite
   */
  @Get(':id')
  async getFavorite(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const favorites = await this.getMockFavorites(user.id);
      const favorite = favorites.find(f => f.id === id);

      if (!favorite) {
        return {
          success: false,
          error: 'Favorite not found',
        };
      }

      return {
        success: true,
        data: favorite,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add property to favorites
   */
  @Post()
  async addFavorite(
    @Body() data: {
      propertyId: string;
      notes?: string;
      tags?: string[];
    },
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      const favorite = {
        id: `fav-${Date.now()}`,
        userId: user.id,
        propertyId: data.propertyId,
        notes: data.notes || null,
        tags: data.tags || [],
        savedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: favorite,
        message: 'Property added to favorites',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update favorite notes/tags
   */
  @Put(':id')
  async updateFavorite(
    @Param('id') id: string,
    @Body() data: {
      notes?: string;
      tags?: string[];
    },
    @CurrentUser() user: any,
  ) {
    try {
      return {
        success: true,
        message: 'Favorite updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remove property from favorites
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      // Mock implementation
      // In production: DELETE FROM favorites WHERE id = $1 AND user_id = $2
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if property is favorited
   */
  @Get('check/:propertyId')
  async checkFavorite(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const favorites = await this.getMockFavorites(user.id);
      const isFavorited = favorites.some(f => f.propertyId === propertyId);

      return {
        success: true,
        data: {
          isFavorited,
          favoriteId: isFavorited 
            ? favorites.find(f => f.propertyId === propertyId)?.id 
            : null,
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
   * Get all unique tags from user's favorites
   */
  @Get('tags/list')
  async getFavoriteTags(@CurrentUser() user: any) {
    try {
      const favorites = await this.getMockFavorites(user.id);
      const allTags = favorites.flatMap(f => f.tags);
      const uniqueTags = Array.from(new Set(allTags));

      return {
        success: true,
        data: uniqueTags,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Export favorites
   */
  @Get('export/csv')
  async exportFavorites(@CurrentUser() user: any) {
    try {
      const favorites = await this.getMockFavorites(user.id);
      
      // Generate CSV
      const headers = ['Address', 'City', 'State', 'Price', 'Beds', 'Baths', 'Sqft', 'Score', 'Notes', 'Tags'];
      const rows = favorites.map(f => [
        f.address,
        f.city,
        f.state,
        f.price,
        f.beds,
        f.baths,
        f.sqft,
        f.homeHistoryScore,
        f.notes || '',
        f.tags.join(', '),
      ]);

      const csv = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');

      return {
        success: true,
        data: csv,
        filename: `favorites-${Date.now()}.csv`,
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
  private async getMockFavorites(userId: string) {
    return [
      {
        id: '1',
        userId,
        propertyId: 'prop-1',
        address: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        price: 1200000,
        beds: 3,
        baths: 2,
        sqft: 1800,
        propertyType: 'Single Family',
        image: '/images/property-1.jpg',
        homeHistoryScore: 87,
        notes: 'Love the kitchen and backyard!',
        tags: ['top-choice', 'great-location'],
        savedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        priceChange: {
          amount: -50000,
          direction: 'down',
          date: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        },
      },
      {
        id: '2',
        userId,
        propertyId: 'prop-2',
        address: '456 Oak Avenue',
        city: 'Oakland',
        state: 'CA',
        zipCode: '94601',
        price: 850000,
        beds: 2,
        baths: 2,
        sqft: 1200,
        propertyType: 'Condo',
        image: '/images/property-2.jpg',
        homeHistoryScore: 82,
        notes: null,
        tags: ['backup-option'],
        savedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      },
    ];
  }
}

