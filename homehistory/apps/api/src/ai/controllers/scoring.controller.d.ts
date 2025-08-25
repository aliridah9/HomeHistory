/**
 * HomeHistory Score™ Controller - Property Scoring Endpoints
 * The "Carfax for Homes" scoring system API
 */
import { ScoringEngineService, PropertyScore, ScoreHistoryEntry } from '../services/scoring-engine.service';
import { User } from '@homehistory/database';
export declare class ScoringController {
    private readonly scoringEngine;
    constructor(scoringEngine: ScoringEngineService);
    getPropertyScore(user: User, propertyId: string): Promise<PropertyScore>;
    recalculatePropertyScore(user: User, propertyId: string): Promise<{
        message: string;
        score: number;
        previousScore?: number;
        calculationTime: number;
        changes: string[];
    }>;
    getScoreHistory(user: User, propertyId: string, limit?: number, startDate?: string, endDate?: string): Promise<{
        propertyId: string;
        history: ScoreHistoryEntry[];
        summary: {
            totalEntries: number;
            scoreRange: {
                min: number;
                max: number;
                current: number;
            };
            trend: 'improving' | 'declining' | 'stable';
            lastUpdated: Date;
        };
    }>;
    getScoreBreakdown(user: User, propertyId: string): Promise<{
        propertyId: string;
        overallScore: number;
        categories: {
            quality: {
                score: number;
                weight: number;
                contribution: number;
                factors: import("../services/scoring-engine.service").QualityFactors;
            };
            safety: {
                score: number;
                weight: number;
                contribution: number;
                factors: import("../services/scoring-engine.service").SafetyFactors;
            };
            value: {
                score: number;
                weight: number;
                contribution: number;
                factors: import("../services/scoring-engine.service").ValueFactors;
            };
            location: {
                score: number;
                weight: number;
                contribution: number;
                factors: import("../services/scoring-engine.service").LocationFactors;
            };
        };
        insights: any[];
        metadata: {
            confidence: number;
            dataCompleteness: number;
            lastCalculated: Date;
            version: string;
        };
    }>;
    bulkUpdateScores(user: User, body: {
        propertyIds?: string[];
        filters?: {
            city?: string;
            state?: string;
            propertyType?: string;
            scoreRange?: {
                min: number;
                max: number;
            };
            lastCalculatedBefore?: string;
        };
        forceRecalculation?: boolean;
        batchSize?: number;
    }): Promise<{
        jobId: string;
        totalProperties: number;
        estimatedTime: number;
        status: string;
    }>;
    getBulkUpdateStatus(user: User, jobId: string): Promise<{
        jobId: string;
        status: string;
        progress: number;
        totalProperties: number;
        processedProperties: number;
        successCount: number;
        errorCount: number;
        startedAt: Date;
        estimatedTimeRemaining: number;
        errors: never[];
    }>;
    getScoreAnalytics(user: User, timeframe: 'week' | 'month' | 'quarter' | 'year', groupBy?: 'city' | 'state' | 'propertyType' | 'scoreRange'): Promise<{
        overview: {
            totalProperties: number;
            averageScore: number;
            scoreDistribution: {
                '90-100': number;
                '80-89': number;
                '70-79': number;
                '60-69': number;
                '50-59': number;
                'below-50': number;
            };
            lastUpdated: Date;
        };
        trends: {
            scoreChanges: {
                date: string;
                avgScore: number;
            }[];
            categoryTrends: {
                quality: {
                    trend: string;
                    change: string;
                };
                safety: {
                    trend: string;
                    change: string;
                };
                value: {
                    trend: string;
                    change: string;
                };
                location: {
                    trend: string;
                    change: string;
                };
            };
            regionalVariations: {
                CA: {
                    avgScore: number;
                    trend: string;
                };
                TX: {
                    avgScore: number;
                    trend: string;
                };
                NY: {
                    avgScore: number;
                    trend: string;
                };
            };
        };
        insights: {
            type: string;
            description: string;
            impact: string;
            recommendation: string;
        }[];
    }>;
    private identifyScoreChanges;
    private calculateTrend;
    private generateInsights;
    private getPropertiesByFilters;
}
//# sourceMappingURL=scoring.controller.d.ts.map
