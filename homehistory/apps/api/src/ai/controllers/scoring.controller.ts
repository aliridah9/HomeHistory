/**
 * HomeHistory Score™ Controller - Property Scoring Endpoints
 * The "Carfax for Homes" scoring system API
 */

import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../modules/auth/guards/admin.guard';
import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';
import { ScoringEngineService, PropertyScore, ScoreHistoryEntry } from '../services/scoring-engine.service';
import { User } from '@homehistory/database';

@ApiTags('scoring')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScoringController {
  constructor(private readonly scoringEngine: ScoringEngineService) {}

  @Get(':id/score')
  @ApiOperation({ 
    summary: 'Get HomeHistory Score™',
    description: 'Get the current HomeHistory Score™ for a property with detailed breakdown and AI explanation'
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Property score with detailed breakdown and explanation',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        propertyId: { type: 'string' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            quality: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                factors: { type: 'object' }
              }
            },
            safety: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                factors: { type: 'object' }
              }
            },
            value: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                factors: { type: 'object' }
              }
            },
            location: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                factors: { type: 'object' }
              }
            },
            confidence: { type: 'number' },
            dataCompleteness: { type: 'number' }
          }
        },
        explanation: { 
          type: 'string',
          description: 'AI-generated human-readable explanation (150-200 words)'
        },
        lastCalculated: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
        confidence: { type: 'number' },
        dataCompleteness: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async getPropertyScore(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ): Promise<PropertyScore> {
    return this.scoringEngine.calculateScore(propertyId);
  }

  @Post(':id/recalculate-score')
  @ApiOperation({ 
    summary: 'Recalculate Property Score (Admin)',
    description: 'Force recalculation of HomeHistory Score™ for a property. Admin only.'
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Score recalculated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        score: { type: 'number' },
        previousScore: { type: 'number' },
        calculationTime: { type: 'number' },
        changes: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async recalculatePropertyScore(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ): Promise<{
    message: string;
    score: number;
    previousScore?: number;
    calculationTime: number;
    changes: string[];
  }> {
    const startTime = Date.now();

    // Get current score for comparison
    let previousScore: number | undefined;
    try {
      const current = await this.scoringEngine.calculateScore(propertyId);
      previousScore = current.score;
    } catch (error) {
      // No previous score exists
    }

    // Invalidate cache and recalculate
    await this.scoringEngine.invalidateScoreCache(propertyId, 'Admin recalculation');
    const newScore = await this.scoringEngine.calculateScore(propertyId);

    const calculationTime = Date.now() - startTime;
    const changes = this.identifyScoreChanges(previousScore, newScore.score);

    return {
      message: 'HomeHistory Score™ recalculated successfully',
      score: newScore.score,
      previousScore,
      calculationTime,
      changes,
    };
  }

  @Get(':id/score-history')
  @ApiOperation({ 
    summary: 'Get Score History',
    description: 'Get historical HomeHistory Score™ changes for a property'
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of history entries' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for history (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for history (ISO string)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Score history entries',
    schema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date-time' },
              score: { type: 'number' },
              previousScore: { type: 'number' },
              changeReason: { type: 'string' },
              breakdown: { type: 'object' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalEntries: { type: 'number' },
            scoreRange: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                current: { type: 'number' }
              }
            },
            trend: { type: 'string', enum: ['improving', 'declining', 'stable'] },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getScoreHistory(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    propertyId: string;
    history: ScoreHistoryEntry[];
    summary: {
      totalEntries: number;
      scoreRange: { min: number; max: number; current: number };
      trend: 'improving' | 'declining' | 'stable';
      lastUpdated: Date;
    };
  }> {
    const options: any = { limit };
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const history = await this.scoringEngine.getScoreHistory(propertyId, options);

    // Calculate summary statistics
    const scores = history.map(h => h.score);
    const summary = {
      totalEntries: history.length,
      scoreRange: {
        min: Math.min(...scores),
        max: Math.max(...scores),
        current: scores[0] || 0,
      },
      trend: this.calculateTrend(history),
      lastUpdated: history[0]?.date || new Date(),
    };

    return {
      propertyId,
      history,
      summary,
    };
  }

  @Get(':id/score-breakdown')
  @ApiOperation({ 
    summary: 'Get Detailed Score Breakdown',
    description: 'Get detailed breakdown of all scoring factors for a property'
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed score breakdown with all factors',
    schema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' },
        overallScore: { type: 'number' },
        categories: {
          type: 'object',
          properties: {
            quality: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                weight: { type: 'number' },
                contribution: { type: 'number' },
                factors: {
                  type: 'object',
                  properties: {
                    maintenanceHistory: { type: 'object' },
                    permits: { type: 'object' },
                    propertyCondition: { type: 'object' },
                    age: { type: 'object' }
                  }
                }
              }
            },
            safety: { type: 'object' },
            value: { type: 'object' },
            location: { type: 'object' }
          }
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              impact: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            confidence: { type: 'number' },
            dataCompleteness: { type: 'number' },
            lastCalculated: { type: 'string', format: 'date-time' },
            version: { type: 'string' }
          }
        }
      }
    }
  })
  async getScoreBreakdown(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ) {
    const score = await this.scoringEngine.calculateScore(propertyId);

    const weights = {
      quality: 0.30,
      safety: 0.25,
      value: 0.25,
      location: 0.20,
    };

    return {
      propertyId,
      overallScore: score.score,
      categories: {
        quality: {
          score: score.breakdown.quality.score,
          weight: weights.quality,
          contribution: score.breakdown.quality.score * weights.quality,
          factors: score.breakdown.quality.factors,
        },
        safety: {
          score: score.breakdown.safety.score,
          weight: weights.safety,
          contribution: score.breakdown.safety.score * weights.safety,
          factors: score.breakdown.safety.factors,
        },
        value: {
          score: score.breakdown.value.score,
          weight: weights.value,
          contribution: score.breakdown.value.score * weights.value,
          factors: score.breakdown.value.factors,
        },
        location: {
          score: score.breakdown.location.score,
          weight: weights.location,
          contribution: score.breakdown.location.score * weights.location,
          factors: score.breakdown.location.factors,
        },
      },
      insights: this.generateInsights(score.breakdown),
      metadata: {
        confidence: score.confidence,
        dataCompleteness: score.dataCompleteness,
        lastCalculated: score.lastCalculated,
        version: score.version,
      },
    };
  }

  @Post('bulk-update-scores')
  @ApiOperation({ 
    summary: 'Bulk Update Scores (Admin)',
    description: 'Initiate bulk recalculation of HomeHistory Scores™ for multiple properties. Admin only.'
  })
  @ApiResponse({ 
    status: 202, 
    description: 'Bulk update job started',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        totalProperties: { type: 'number' },
        estimatedTime: { type: 'number' },
        status: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async bulkUpdateScores(
    @CurrentUser() user: User,
    @Body() body: {
      propertyIds?: string[];
      filters?: {
        city?: string;
        state?: string;
        propertyType?: string;
        scoreRange?: { min: number; max: number };
        lastCalculatedBefore?: string;
      };
      forceRecalculation?: boolean;
      batchSize?: number;
    },
  ) {
    let propertyIds = body.propertyIds || [];

    // If no specific IDs provided, get properties based on filters
    if (propertyIds.length === 0 && body.filters) {
      propertyIds = await this.getPropertiesByFilters(body.filters);
    }

    if (propertyIds.length === 0) {
      throw new Error('No properties specified for bulk update');
    }

    return this.scoringEngine.bulkRecalculateScores(propertyIds, {
      forceRecalculation: body.forceRecalculation,
      batchSize: body.batchSize,
      userId: user.id,
    });
  }

  @Get('bulk-update-status/:jobId')
  @ApiOperation({ 
    summary: 'Get Bulk Update Status (Admin)',
    description: 'Get status of a bulk score update job. Admin only.'
  })
  @ApiParam({ name: 'jobId', description: 'Bulk update job ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk update job status',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
        progress: { type: 'number' },
        totalProperties: { type: 'number' },
        processedProperties: { type: 'number' },
        successCount: { type: 'number' },
        errorCount: { type: 'number' },
        startedAt: { type: 'string', format: 'date-time' },
        completedAt: { type: 'string', format: 'date-time' },
        estimatedTimeRemaining: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @UseGuards(AdminGuard)
  async getBulkUpdateStatus(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ) {
    // Would get job status from AI database service
    return {
      jobId,
      status: 'processing',
      progress: 0.65,
      totalProperties: 1000,
      processedProperties: 650,
      successCount: 645,
      errorCount: 5,
      startedAt: new Date(),
      estimatedTimeRemaining: 300, // seconds
      errors: [],
    };
  }

  @Get('score-analytics')
  @ApiOperation({ 
    summary: 'Get Score Analytics (Admin)',
    description: 'Get analytics and insights about HomeHistory Scores™ across the platform. Admin only.'
  })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Analytics timeframe' })
  @ApiQuery({ name: 'groupBy', required: false, description: 'Group analytics by field' })
  @ApiResponse({ 
    status: 200, 
    description: 'Score analytics data',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalProperties: { type: 'number' },
            averageScore: { type: 'number' },
            scoreDistribution: { type: 'object' },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        },
        trends: {
          type: 'object',
          properties: {
            scoreChanges: { type: 'array' },
            categoryTrends: { type: 'object' },
            regionalVariations: { type: 'object' }
          }
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @UseGuards(AdminGuard)
  async getScoreAnalytics(
    @CurrentUser() user: User,
    @Query('timeframe', new DefaultValuePipe('month')) timeframe: 'week' | 'month' | 'quarter' | 'year',
    @Query('groupBy') groupBy?: 'city' | 'state' | 'propertyType' | 'scoreRange',
  ) {
    // Mock analytics data - would implement real analytics
    return {
      overview: {
        totalProperties: 45678,
        averageScore: 76.8,
        scoreDistribution: {
          '90-100': 8.2,
          '80-89': 22.1,
          '70-79': 31.5,
          '60-69': 24.7,
          '50-59': 10.8,
          'below-50': 2.7,
        },
        lastUpdated: new Date(),
      },
      trends: {
        scoreChanges: [
          { date: '2024-01', avgScore: 75.2 },
          { date: '2024-02', avgScore: 76.1 },
          { date: '2024-03', avgScore: 76.8 },
        ],
        categoryTrends: {
          quality: { trend: 'improving', change: '+2.3' },
          safety: { trend: 'stable', change: '+0.1' },
          value: { trend: 'declining', change: '-1.2' },
          location: { trend: 'improving', change: '+1.8' },
        },
        regionalVariations: {
          'CA': { avgScore: 82.1, trend: 'improving' },
          'TX': { avgScore: 78.9, trend: 'stable' },
          'NY': { avgScore: 74.2, trend: 'declining' },
        },
      },
      insights: [
        {
          type: 'trend',
          description: 'Property quality scores have improved by 2.3 points over the last quarter',
          impact: 'positive',
          recommendation: 'Continue monitoring maintenance trends',
        },
        {
          type: 'regional',
          description: 'California properties show consistently higher scores due to newer construction',
          impact: 'neutral',
          recommendation: 'Consider regional adjustments in scoring algorithm',
        },
      ],
    };
  }

  // Private helper methods

  private identifyScoreChanges(previous: number | undefined, current: number): string[] {
    const changes = [];

    if (previous === undefined) {
      changes.push('Initial score calculation');
      return changes;
    }

    const diff = current - previous;

    if (Math.abs(diff) < 2) {
      changes.push('Minor score adjustment');
    } else if (diff > 5) {
      changes.push('Significant score improvement');
      changes.push('Possible property improvements or new positive data');
    } else if (diff < -5) {
      changes.push('Notable score decline');
      changes.push('New issues or negative factors detected');
    } else if (diff > 0) {
      changes.push('Score improved');
    } else {
      changes.push('Score decreased');
    }

    return changes;
  }

  private calculateTrend(history: ScoreHistoryEntry[]): 'improving' | 'declining' | 'stable' {
    if (history.length < 2) return 'stable';

    const recent = history.slice(0, Math.min(5, history.length));
    const scores = recent.map(h => h.score);
    
    const firstScore = scores[scores.length - 1];
    const lastScore = scores[0];
    const diff = lastScore - firstScore;

    if (diff > 3) return 'improving';
    if (diff < -3) return 'declining';
    return 'stable';
  }

  private generateInsights(breakdown: any): any[] {
    const insights = [];

    // Quality insights
    if (breakdown.quality.score >= 90) {
      insights.push({
        category: 'quality',
        impact: 'positive',
        description: 'Excellent property condition and maintenance history',
        recommendation: 'Continue regular maintenance to preserve high quality score',
      });
    } else if (breakdown.quality.score < 60) {
      insights.push({
        category: 'quality',
        impact: 'negative',
        description: 'Property condition needs attention',
        recommendation: 'Consider scheduling maintenance and inspections',
      });
    }

    // Safety insights
    if (breakdown.safety.score >= 85) {
      insights.push({
        category: 'safety',
        impact: 'positive',
        description: 'Low safety risks and good neighborhood security',
        recommendation: 'Maintain current safety measures',
      });
    } else if (breakdown.safety.score < 65) {
      insights.push({
        category: 'safety',
        impact: 'negative',
        description: 'Several safety factors require attention',
        recommendation: 'Review safety reports and consider improvements',
      });
    }

    // Value insights
    if (breakdown.value.score >= 80) {
      insights.push({
        category: 'value',
        impact: 'positive',
        description: 'Strong investment potential and market position',
        recommendation: 'Good time to consider this property for investment',
      });
    } else if (breakdown.value.score < 60) {
      insights.push({
        category: 'value',
        impact: 'negative',
        description: 'Value concerns may affect future appreciation',
        recommendation: 'Carefully evaluate market conditions and pricing',
      });
    }

    // Location insights
    if (breakdown.location.score >= 85) {
      insights.push({
        category: 'location',
        impact: 'positive',
        description: 'Excellent location with great amenities and schools',
        recommendation: 'Location is a strong selling point for this property',
      });
    }

    return insights;
  }

  private async getPropertiesByFilters(filters: any): Promise<string[]> {
    // Would implement property filtering logic
    return [];
  }
}
