/**
 * HomeHistory Score™ Engine - The "Carfax for Homes" Scoring System
 * Generates comprehensive property scores based on quality, safety, value, and location
 */
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/database/prisma.service';
import { OpenAIService } from './openai.service';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
export interface ScoringWeights {
    quality: 0.30;
    safety: 0.25;
    value: 0.25;
    location: 0.20;
}
export interface ScoreBreakdown {
    overall: number;
    quality: {
        score: number;
        factors: QualityFactors;
    };
    safety: {
        score: number;
        factors: SafetyFactors;
    };
    value: {
        score: number;
        factors: ValueFactors;
    };
    location: {
        score: number;
        factors: LocationFactors;
    };
    confidence: number;
    dataCompleteness: number;
}
export interface QualityFactors {
    maintenanceHistory: {
        score: number;
        recentMaintenanceCount: number;
        averageMaintenanceCost: number;
        preventiveMaintenanceRatio: number;
        lastMaintenanceDate?: Date;
    };
    permits: {
        score: number;
        validPermitsCount: number;
        expiredPermitsCount: number;
        majorRenovations: number;
        complianceRate: number;
    };
    propertyCondition: {
        score: number;
        structuralIssues: number;
        systemsCondition: number;
        exteriorCondition: number;
        interiorCondition: number;
    };
    age: {
        score: number;
        yearBuilt: number;
        ageAdjustment: number;
        renovationBonus: number;
    };
}
export interface SafetyFactors {
    crimeData: {
        score: number;
        violentCrimeRate: number;
        propertyCrimeRate: number;
        neighborhoodSafetyRating: number;
    };
    structuralSafety: {
        score: number;
        foundationIssues: number;
        roofCondition: number;
        electricalSafety: number;
        plumbingSafety: number;
    };
    environmentalHazards: {
        score: number;
        floodRisk: number;
        earthquakeRisk: number;
        fireRisk: number;
        airQuality: number;
    };
    incidents: {
        score: number;
        insuranceClaims: number;
        emergencyCallouts: number;
        safetyViolations: number;
    };
}
export interface ValueFactors {
    marketAnalysis: {
        score: number;
        pricePerSqft: number;
        marketTrend: number;
        daysOnMarket: number;
        priceHistory: number[];
    };
    investment: {
        score: number;
        estimatedROI: number;
        rentalYield: number;
        appreciationPotential: number;
        marketLiquidity: number;
    };
    comparables: {
        score: number;
        avgComparablePrice: number;
        priceVariance: number;
        marketPosition: number;
    };
    financials: {
        score: number;
        propertyTaxes: number;
        hoaFees: number;
        maintenanceCosts: number;
        totalCostOfOwnership: number;
    };
}
export interface LocationFactors {
    walkability: {
        score: number;
        walkScore: number;
        transitScore: number;
        bikeScore: number;
    };
    schools: {
        score: number;
        elementaryRating: number;
        middleRating: number;
        highSchoolRating: number;
        distanceToSchools: number;
    };
    amenities: {
        score: number;
        shoppingDistance: number;
        restaurantsDistance: number;
        parksDistance: number;
        hospitalDistance: number;
    };
    neighborhood: {
        score: number;
        neighborhoodRating: number;
        futureDevlopment: number;
        gentrificationIndex: number;
        communityEngagement: number;
    };
}
export interface PropertyScore {
    id: string;
    propertyId: string;
    score: number;
    breakdown: ScoreBreakdown;
    explanation: string;
    lastCalculated: Date;
    version: string;
    confidence: number;
    dataCompleteness: number;
}
export interface ScoreHistoryEntry {
    date: Date;
    score: number;
    previousScore?: number;
    changeReason: string;
    breakdown: ScoreBreakdown;
}
export declare class ScoringEngineService {
    private configService;
    private prisma;
    private openaiService;
    private cacheManager;
    private aiDatabase;
    private readonly logger;
    private readonly WEIGHTS;
    private readonly SCORE_CACHE_TTL;
    private readonly EXPLANATION_CACHE_TTL;
    constructor(configService: ConfigService, prisma: PrismaService, openaiService: OpenAIService, cacheManager: CacheManagerService, aiDatabase: AIDatabaseService);
    /**
     * Calculate comprehensive HomeHistory Score™ for a property
     */
    calculateScore(propertyId: string): Promise<PropertyScore>;
    /**
     * Generate human-readable score explanation using GPT-4
     */
    generateScoreExplanation(propertyId: string, breakdown: ScoreBreakdown): Promise<string>;
    /**
     * Bulk recalculate scores for multiple properties (admin operation)
     */
    bulkRecalculateScores(propertyIds: string[], options?: {
        forceRecalculation?: boolean;
        batchSize?: number;
        userId?: string;
    }): Promise<{
        jobId: string;
        totalProperties: number;
        estimatedTime: number;
        status: string;
    }>;
    /**
     * Get score history for a property
     */
    getScoreHistory(propertyId: string, options?: {
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ScoreHistoryEntry[]>;
    /**
     * Invalidate score cache when property data changes
     */
    invalidateScoreCache(propertyId: string, reason: string): Promise<void>;
    private gatherPropertyData;
    private calculateQualityScore;
    private calculateSafetyScore;
    private calculateValueScore;
    private calculateLocationScore;
    private scoreMaintenanceHistory;
    private scorePermitsCompliance;
    private scorePropertyCondition;
    private scorePropertyAge;
    private scoreCrimeData;
    private scoreStructuralSafety;
    private scoreEnvironmentalHazards;
    private scoreIncidents;
    private scoreMarketAnalysis;
    private scoreInvestmentPotential;
    private scoreComparables;
    private scoreFinancials;
    private scoreWalkability;
    private scoreSchools;
    private scoreAmenities;
    private scoreNeighborhood;
    private getMaintenanceRecords;
    private getMarketData;
    private getLocationData;
    private calculateConfidence;
    private calculateDataCompleteness;
    private buildExplanationContext;
    private generateFallbackExplanation;
    private storePropertyScore;
    private processBulkScoring;
    private trackScoringAnalytics;
    private isCacheValid;
    private determineChangeReason;
    private parseStoredBreakdown;
    private generateRequestId;
    private generateScoreId;
    private generateJobId;
    private hashBreakdown;
}
//# sourceMappingURL=scoring-engine.service.d.ts.map
