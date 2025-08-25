/**
 * HomeHistory Recommendation Controller - "Similar Properties" API
 * RESTful endpoints for AI-powered property recommendations
 */
import { RecommendationService } from '../services/recommendation.service';
import { User, PropertyType } from '@homehistory/database';
export declare class RecommendationController {
    private readonly recommendationService;
    constructor(recommendationService: RecommendationService);
    getSimilarProperties(user: User, propertyId: string, limit?: number, maxDistance?: number, priceRangePercent?: number, propertyTypes?: string, minSimilarityScore?: number): Promise<{
        sourceProperty: {
            id: string;
            address: string;
            city: string;
            state: string;
            propertyType: string;
            bedrooms: number;
            bathrooms: number;
            squareFeet: number;
            price: number;
        };
        recommendations: {
            thumbnailUrl: string;
            property: import("@homehistory/database").Property & {
                embedding?: import("@homehistory/database").PropertyEmbedding;
            };
            similarityScore: number;
            explanation: string;
            keyMatchingFeatures: string[];
            priceDifference: number;
            distanceKm: number;
        }[];
        metadata: {
            totalFound: number;
            searchRadius: number;
            priceRange: {
                min: null;
                max: null;
            } | {
                min: number;
                max: number;
            };
            averageSimilarity: number;
            searchTime: number;
            cached: boolean;
        };
    }>;
    getDetailedSimilarProperties(user: User, propertyId: string, limit?: number): Promise<{
        sourceProperty: {
            id: string;
            address: string;
            city: string;
            state: string;
            propertyType: string;
            bedrooms: number;
            bathrooms: number;
            squareFeet: number;
            price: number;
        };
        recommendations: {
            detailedSimilarity: import("../services/recommendation.service").SimilarityMetrics;
            pros: string[];
            cons: string[];
            thumbnailUrl: string;
            property: import("@homehistory/database").Property & {
                embedding?: import("@homehistory/database").PropertyEmbedding;
            };
            similarityScore: number;
            explanation: string;
            keyMatchingFeatures: string[];
            priceDifference: number;
            distanceKm: number;
        }[];
    }>;
    submitRecommendationFeedback(user: User, propertyId: string, feedback: {
        recommendedPropertyId: string;
        rating: number;
        helpful: boolean;
        comments?: string;
        issues?: string[];
    }): Promise<{
        message: string;
        feedbackId: string;
    }>;
    getTrendingProperties(user: User, limit?: number, timeframe?: 'week' | 'month' | 'quarter', city?: string, state?: string): Promise<{
        trending: {
            property: {
                id: string;
                address: string;
                city: string;
                state: string;
                propertyType: string;
                bedrooms: number;
                bathrooms: number;
                squareFeet: number;
                price: number;
            };
            trendingScore: number;
            recommendationCount: number;
            averageSimilarityScore: number;
            uniqueSourceProperties: number;
            thumbnailUrl: string;
        }[];
        metadata: {
            timeframe: "week" | "month" | "quarter" | undefined;
            totalProperties: number;
            filters: {
                city: string | undefined;
                state: string | undefined;
            };
        };
    }>;
    batchUpdateEmbeddings(user: User, body: {
        propertyIds?: string[];
        filters?: {
            city?: string;
            state?: string;
            propertyType?: PropertyType;
            updatedBefore?: string;
        };
        batchSize?: number;
    }): Promise<{
        jobId: string;
        totalProperties: number;
        estimatedTime: number;
        status: string;
    }>;
    getRecommendationAnalytics(user: User, timeframe: 'week' | 'month' | 'quarter'): Promise<{
        overview: {
            totalRecommendations: number;
            averageSimilarityScore: number;
            cacheHitRate: number;
            averageResponseTime: number;
        };
        performance: {
            embeddingCoverage: number;
            recommendationAccuracy: number;
            userSatisfaction: number;
        };
        insights: {
            type: string;
            description: string;
            impact: string;
            recommendation: string;
        }[];
    }>;
    private getSourcePropertySummary;
    private calculatePriceRange;
    private generateThumbnailUrl;
    private generatePros;
    private generateCons;
    private getPropertiesByFilters;
}
//# sourceMappingURL=recommendation.controller.d.ts.map
