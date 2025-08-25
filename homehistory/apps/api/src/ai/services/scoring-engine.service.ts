/**
 * HomeHistory Score™ Engine - The "Carfax for Homes" Scoring System
 * Generates comprehensive property scores based on quality, safety, value, and location
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../modules/database/prisma.service';
import { OpenAIService } from './openai.service';
import { CacheManagerService } from './cache-manager.service';
import { AIDatabaseService } from './ai-database.service';
import { createHash } from 'crypto';

// Scoring interfaces
export interface ScoringWeights {
  quality: 0.30;    // Maintenance records, permits, renovations
  safety: 0.25;     // Crime data, structural issues, incidents
  value: 0.25;      // Market analysis, price trends, ROI
  location: 0.20;   // Walkability, schools, amenities
}

export interface ScoreBreakdown {
  overall: number;          // 0-100 composite score
  quality: {
    score: number;          // 0-100
    factors: QualityFactors;
  };
  safety: {
    score: number;          // 0-100
    factors: SafetyFactors;
  };
  value: {
    score: number;          // 0-100
    factors: ValueFactors;
  };
  location: {
    score: number;          // 0-100
    factors: LocationFactors;
  };
  confidence: number;       // 0-1 confidence in scoring
  dataCompleteness: number; // 0-1 how much data we have
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
    systemsCondition: number; // HVAC, plumbing, electrical
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
    marketTrend: number; // -1 to 1 (declining to appreciating)
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
    marketPosition: number; // percentile in market
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

@Injectable()
export class ScoringEngineService {
  private readonly logger = new Logger(ScoringEngineService.name);

  // Scoring weights (must sum to 1.0)
  private readonly WEIGHTS: ScoringWeights = {
    quality: 0.30,
    safety: 0.25,
    value: 0.25,
    location: 0.20,
  };

  // Cache configuration
  private readonly SCORE_CACHE_TTL = 86400; // 24 hours
  private readonly EXPLANATION_CACHE_TTL = 604800; // 7 days

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private openaiService: OpenAIService,
    private cacheManager: CacheManagerService,
    private aiDatabase: AIDatabaseService,
  ) {}

  /**
   * Calculate comprehensive HomeHistory Score™ for a property
   */
  async calculateScore(propertyId: string): Promise<PropertyScore> {
    const requestId = this.generateRequestId();
    const cacheKey = `property_score:${propertyId}`;

    try {
      this.logger.log(`Calculating HomeHistory Score™ for property: ${propertyId}`);

      // Check cache first
      const cached = await this.cacheManager.get<PropertyScore>(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        this.logger.debug(`Cache hit for property score: ${propertyId}`);
        return cached;
      }

      const startTime = Date.now();

      // Gather all property data
      const propertyData = await this.gatherPropertyData(propertyId);
      
      if (!propertyData) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Calculate individual category scores
      const qualityScore = await this.calculateQualityScore(propertyData);
      const safetyScore = await this.calculateSafetyScore(propertyData);
      const valueScore = await this.calculateValueScore(propertyData);
      const locationScore = await this.calculateLocationScore(propertyData);

      // Calculate weighted composite score
      const overallScore = Math.round(
        qualityScore.score * this.WEIGHTS.quality +
        safetyScore.score * this.WEIGHTS.safety +
        valueScore.score * this.WEIGHTS.value +
        locationScore.score * this.WEIGHTS.location
      );

      // Build score breakdown
      const breakdown: ScoreBreakdown = {
        overall: overallScore,
        quality: qualityScore,
        safety: safetyScore,
        value: valueScore,
        location: locationScore,
        confidence: this.calculateConfidence([qualityScore, safetyScore, valueScore, locationScore]),
        dataCompleteness: this.calculateDataCompleteness(propertyData),
      };

      // Generate AI explanation
      const explanation = await this.generateScoreExplanation(propertyId, breakdown);

      const calculationTime = Date.now() - startTime;

      // Create property score object
      const propertyScore: PropertyScore = {
        id: this.generateScoreId(),
        propertyId,
        score: overallScore,
        breakdown,
        explanation,
        lastCalculated: new Date(),
        version: '1.0',
        confidence: breakdown.confidence,
        dataCompleteness: breakdown.dataCompleteness,
      };

      // Store in database
      await this.storePropertyScore(propertyScore);

      // Cache the result
      await this.cacheManager.set(cacheKey, propertyScore, {
        ttl: this.SCORE_CACHE_TTL,
        tags: ['property_score', propertyId],
      });

      // Track scoring analytics
      await this.trackScoringAnalytics({
        requestId,
        propertyId,
        score: overallScore,
        calculationTime,
        confidence: breakdown.confidence,
        dataCompleteness: breakdown.dataCompleteness,
      });

      this.logger.log(`HomeHistory Score™ calculated: ${overallScore}/100 for property ${propertyId} (${calculationTime}ms)`);

      return propertyScore;

    } catch (error) {
      this.logger.error(`Failed to calculate score for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Generate human-readable score explanation using GPT-4
   */
  async generateScoreExplanation(propertyId: string, breakdown: ScoreBreakdown): Promise<string> {
    const cacheKey = `score_explanation:${this.hashBreakdown(breakdown)}`;

    try {
      // Check cache first
      const cached = await this.cacheManager.get<string>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build context for GPT-4
      const context = this.buildExplanationContext(breakdown);

      const prompt = `As a friendly, knowledgeable real estate expert, explain this HomeHistory Score™ in 150-200 words. 
      Use a warm, professional tone like a trusted realtor would use. Focus on the most important factors affecting the score.
      
      Property Score: ${breakdown.overall}/100
      
      Category Breakdown:
      - Quality: ${breakdown.quality.score}/100 (${(this.WEIGHTS.quality * 100).toFixed(0)}% weight)
      - Safety: ${breakdown.safety.score}/100 (${(this.WEIGHTS.safety * 100).toFixed(0)}% weight)  
      - Value: ${breakdown.value.score}/100 (${(this.WEIGHTS.value * 100).toFixed(0)}% weight)
      - Location: ${breakdown.location.score}/100 (${(this.WEIGHTS.location * 100).toFixed(0)}% weight)
      
      Key Factors:
      ${context}
      
      Confidence: ${(breakdown.confidence * 100).toFixed(0)}%
      Data Completeness: ${(breakdown.dataCompleteness * 100).toFixed(0)}%
      
      Write a friendly explanation that helps buyers understand what makes this property special or what to watch out for.`;

      const completion = await this.openaiService.generateCompletion(prompt, {
        model: 'gpt-4',
        maxTokens: 300,
        temperature: 0.3,
        systemPrompt: `You are a trusted real estate expert creating HomeHistory Score™ explanations. 
        Be warm, professional, and focus on actionable insights. Avoid jargon and speak like you're helping a friend buy a home.`,
      });

      const explanation = completion.content.trim();

      // Cache the explanation
      await this.cacheManager.set(cacheKey, explanation, {
        ttl: this.EXPLANATION_CACHE_TTL,
        tags: ['score_explanation'],
      });

      return explanation;

    } catch (error) {
      this.logger.error(`Failed to generate score explanation for property ${propertyId}:`, error);
      
      // Return fallback explanation
      return this.generateFallbackExplanation(breakdown);
    }
  }

  /**
   * Bulk recalculate scores for multiple properties (admin operation)
   */
  async bulkRecalculateScores(
    propertyIds: string[],
    options: {
      forceRecalculation?: boolean;
      batchSize?: number;
      userId?: string;
    } = {}
  ): Promise<{
    jobId: string;
    totalProperties: number;
    estimatedTime: number;
    status: string;
  }> {
    const { forceRecalculation = false, batchSize = 50, userId } = options;
    const jobId = this.generateJobId();

    try {
      this.logger.log(`Starting bulk score recalculation: ${propertyIds.length} properties`);

      // Create batch job
      const job = {
        jobId,
        type: 'analysis' as const,
        status: 'processing' as const,
        items: propertyIds,
        results: [],
        progress: 0,
        startedAt: new Date(),
      };

      await this.aiDatabase.createBatchJob(job, userId);

      // Process in background
      this.processBulkScoring(job, { forceRecalculation, batchSize });

      const estimatedTime = Math.ceil((propertyIds.length / batchSize) * 30); // ~30 seconds per batch

      return {
        jobId,
        totalProperties: propertyIds.length,
        estimatedTime,
        status: 'processing',
      };

    } catch (error) {
      this.logger.error('Failed to start bulk score recalculation:', error);
      throw error;
    }
  }

  /**
   * Get score history for a property
   */
  async getScoreHistory(
    propertyId: string,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<ScoreHistoryEntry[]> {
    const { limit = 50, startDate, endDate } = options;

    try {
      const whereClause: any = { propertyId };

      if (startDate || endDate) {
        whereClause.lastAnalyzedAt = {};
        if (startDate) whereClause.lastAnalyzedAt.gte = startDate;
        if (endDate) whereClause.lastAnalyzedAt.lte = endDate;
      }

      const scores = await this.prisma.propertyAIScore.findMany({
        where: whereClause,
        orderBy: { lastAnalyzedAt: 'desc' },
        take: limit,
      });

      const history: ScoreHistoryEntry[] = [];
      
      for (let i = 0; i < scores.length; i++) {
        const current = scores[i];
        const previous = i < scores.length - 1 ? scores[i + 1] : null;

        history.push({
          date: current.lastAnalyzedAt ?? new Date(),
          score: current.overallScore,
          previousScore: previous?.overallScore,
          changeReason: this.determineChangeReason(current, previous),
          breakdown: this.parseStoredBreakdown(current),
        });
      }

      return history;

    } catch (error) {
      this.logger.error(`Failed to get score history for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate score cache when property data changes
   */
  async invalidateScoreCache(propertyId: string, reason: string): Promise<void> {
    try {
      const cacheKey = `property_score:${propertyId}`;
      await this.cacheManager.delete(cacheKey);
      
      this.logger.debug(`Invalidated score cache for property ${propertyId}: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate score cache for property ${propertyId}:`, error);
    }
  }

  // Private helper methods

  private async gatherPropertyData(propertyId: string): Promise<any> {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          rawDocuments: {
            where: { status: 'verified' },
            orderBy: { createdAt: 'desc' },
          },
          reports: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          embedding: true,
          aiScore: true,
        },
      });

      if (!property) return null;

      // Get maintenance records (would be from maintenance module)
      const maintenanceRecords = await this.getMaintenanceRecords(propertyId);
      
      // Get market data
      const marketData = await this.getMarketData(property);
      
      // Get location data
      const locationData = await this.getLocationData(property);

      return {
        property,
        maintenanceRecords,
        marketData,
        locationData,
        documents: property.rawDocuments,
        reports: property.reports,
      };

    } catch (error) {
      this.logger.error(`Failed to gather property data for ${propertyId}:`, error);
      throw error;
    }
  }

  private async calculateQualityScore(data: any): Promise<{ score: number; factors: QualityFactors }> {
    const property = data.property;
    const maintenance = data.maintenanceRecords || [];
    const documents = data.documents || [];

    // Maintenance history scoring
    const maintenanceScore = this.scoreMaintenanceHistory(maintenance);
    
    // Permits and compliance scoring
    const permitsScore = this.scorePermitsCompliance(documents);
    
    // Property condition scoring
    const conditionScore = this.scorePropertyCondition(property, documents);
    
    // Age and renovation scoring
    const ageScore = this.scorePropertyAge(property);

    // Weighted quality score
    const qualityScore = Math.round(
      maintenanceScore.score * 0.35 +
      permitsScore.score * 0.25 +
      conditionScore.score * 0.25 +
      ageScore.score * 0.15
    );

    return {
      score: qualityScore,
      factors: {
        maintenanceHistory: maintenanceScore,
        permits: permitsScore,
        propertyCondition: conditionScore,
        age: ageScore,
      },
    };
  }

  private async calculateSafetyScore(data: any): Promise<{ score: number; factors: SafetyFactors }> {
    const property = data.property;
    const locationData = data.locationData || {};

    // Crime data scoring
    const crimeScore = this.scoreCrimeData(locationData);
    
    // Structural safety scoring
    const structuralScore = this.scoreStructuralSafety(property, data.documents);
    
    // Environmental hazards scoring
    const environmentalScore = this.scoreEnvironmentalHazards(property, locationData);
    
    // Incidents and claims scoring
    const incidentsScore = this.scoreIncidents(data.documents);

    // Weighted safety score
    const safetyScore = Math.round(
      crimeScore.score * 0.30 +
      structuralScore.score * 0.30 +
      environmentalScore.score * 0.25 +
      incidentsScore.score * 0.15
    );

    return {
      score: safetyScore,
      factors: {
        crimeData: crimeScore,
        structuralSafety: structuralScore,
        environmentalHazards: environmentalScore,
        incidents: incidentsScore,
      },
    };
  }

  private async calculateValueScore(data: any): Promise<{ score: number; factors: ValueFactors }> {
    const property = data.property;
    const marketData = data.marketData || {};

    // Market analysis scoring
    const marketScore = this.scoreMarketAnalysis(property, marketData);
    
    // Investment potential scoring
    const investmentScore = this.scoreInvestmentPotential(property, marketData);
    
    // Comparables scoring
    const comparablesScore = this.scoreComparables(property, marketData);
    
    // Financial factors scoring
    const financialsScore = this.scoreFinancials(property);

    // Weighted value score
    const valueScore = Math.round(
      marketScore.score * 0.30 +
      investmentScore.score * 0.25 +
      comparablesScore.score * 0.25 +
      financialsScore.score * 0.20
    );

    return {
      score: valueScore,
      factors: {
        marketAnalysis: marketScore,
        investment: investmentScore,
        comparables: comparablesScore,
        financials: financialsScore,
      },
    };
  }

  private async calculateLocationScore(data: any): Promise<{ score: number; factors: LocationFactors }> {
    const property = data.property;
    const locationData = data.locationData || {};

    // Walkability scoring
    const walkabilityScore = this.scoreWalkability(locationData);
    
    // Schools scoring
    const schoolsScore = this.scoreSchools(locationData);
    
    // Amenities scoring
    const amenitiesScore = this.scoreAmenities(locationData);
    
    // Neighborhood scoring
    const neighborhoodScore = this.scoreNeighborhood(locationData);

    // Weighted location score
    const locationScore = Math.round(
      walkabilityScore.score * 0.25 +
      schoolsScore.score * 0.30 +
      amenitiesScore.score * 0.25 +
      neighborhoodScore.score * 0.20
    );

    return {
      score: locationScore,
      factors: {
        walkability: walkabilityScore,
        schools: schoolsScore,
        amenities: amenitiesScore,
        neighborhood: neighborhoodScore,
      },
    };
  }

  // Scoring helper methods (simplified implementations)
  
  private scoreMaintenanceHistory(maintenance: any[]): any {
    const recentCount = maintenance.filter(m => 
      new Date(m.createdAt) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    ).length;
    
    const avgCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0) / maintenance.length || 0;
    const preventiveRatio = maintenance.filter(m => m.type === 'preventive').length / maintenance.length || 0;
    
    // Score based on maintenance activity and cost reasonableness
    let score = 70; // Base score
    if (recentCount > 2) score += 15; // Regular maintenance
    if (preventiveRatio > 0.3) score += 10; // Preventive maintenance
    if (avgCost < 5000) score += 5; // Reasonable costs
    
    return {
      score: Math.min(100, score),
      recentMaintenanceCount: recentCount,
      averageMaintenanceCost: avgCost,
      preventiveMaintenanceRatio: preventiveRatio,
      lastMaintenanceDate: maintenance[0]?.createdAt,
    };
  }

  private scorePermitsCompliance(documents: any[]): any {
    const permits = documents.filter(d => d.type === 'permit');
    const validPermits = permits.filter(p => p.status === 'verified').length;
    const expiredPermits = permits.filter(p => p.status === 'expired').length;
    
    let score = 80; // Base score
    if (validPermits > expiredPermits) score += 15;
    if (expiredPermits === 0) score += 5;
    
    return {
      score: Math.min(100, score),
      validPermitsCount: validPermits,
      expiredPermitsCount: expiredPermits,
      majorRenovations: permits.filter(p => p.type?.includes('major')).length,
      complianceRate: validPermits / (permits.length || 1),
    };
  }

  private scorePropertyCondition(property: any, documents: any[]): any {
    const inspections = documents.filter(d => d.type === 'inspection');
    const issues = inspections.reduce((sum, i) => sum + (i.issues?.length || 0), 0);
    
    let score = 85; // Base score for average condition
    if (issues === 0) score += 10;
    if (issues > 5) score -= 20;
    
    return {
      score: Math.max(0, Math.min(100, score)),
      structuralIssues: issues,
      systemsCondition: 85, // Would calculate from inspection data
      exteriorCondition: 80,
      interiorCondition: 85,
    };
  }

  private scorePropertyAge(property: any): any {
    const currentYear = new Date().getFullYear();
    const age = currentYear - (property.yearBuilt || currentYear);
    
    let score = 100;
    if (age > 50) score -= 30;
    else if (age > 25) score -= 15;
    else if (age > 10) score -= 5;
    
    return {
      score: Math.max(0, score),
      yearBuilt: property.yearBuilt,
      ageAdjustment: age,
      renovationBonus: 0, // Would calculate from renovation records
    };
  }

  private scoreCrimeData(locationData: any): any {
    // Mock crime scoring - would integrate with real crime data APIs
    const baseSafetyScore = 75;
    
    return {
      score: baseSafetyScore,
      violentCrimeRate: 2.5, // per 1000 residents
      propertyCrimeRate: 15.2,
      neighborhoodSafetyRating: 7.5,
    };
  }

  private scoreStructuralSafety(property: any, documents: any[]): any {
    const structuralDocs = documents.filter(d => 
      d.type === 'inspection' || d.type === 'structural_report'
    );
    
    const score = 80; // Base structural safety score
    // Would analyze inspection reports for structural issues
    
    return {
      score,
      foundationIssues: 0,
      roofCondition: 85,
      electricalSafety: 90,
      plumbingSafety: 85,
    };
  }

  private scoreEnvironmentalHazards(property: any, locationData: any): any {
    // Mock environmental scoring - would integrate with FEMA, EPA data
    return {
      score: 85,
      floodRisk: 0.1, // 10-year flood probability
      earthquakeRisk: 0.05,
      fireRisk: 0.02,
      airQuality: 85,
    };
  }

  private scoreIncidents(documents: any[]): any {
    const claims = documents.filter(d => d.type === 'insurance_claim');
    const emergencies = documents.filter(d => d.type === 'emergency_report');
    
    let score = 90;
    if (claims.length > 2) score -= 20;
    if (emergencies.length > 1) score -= 15;
    
    return {
      score: Math.max(0, score),
      insuranceClaims: claims.length,
      emergencyCallouts: emergencies.length,
      safetyViolations: 0,
    };
  }

  private scoreMarketAnalysis(property: any, marketData: any): any {
    // Mock market analysis - would integrate with real market data
    return {
      score: 75,
      pricePerSqft: (property.price || 0) / (property.squareFeet || 1),
      marketTrend: 0.15, // 15% appreciation trend
      daysOnMarket: 30,
      priceHistory: [],
    };
  }

  private scoreInvestmentPotential(property: any, marketData: any): any {
    return {
      score: 70,
      estimatedROI: 8.5,
      rentalYield: 6.2,
      appreciationPotential: 7.8,
      marketLiquidity: 8.0,
    };
  }

  private scoreComparables(property: any, marketData: any): any {
    return {
      score: 80,
      avgComparablePrice: property.price * 1.05,
      priceVariance: 0.12,
      marketPosition: 0.65, // 65th percentile
    };
  }

  private scoreFinancials(property: any): any {
    return {
      score: 75,
      propertyTaxes: (property.price || 0) * 0.012, // 1.2% tax rate
      hoaFees: 0,
      maintenanceCosts: (property.price || 0) * 0.01, // 1% of value annually
      totalCostOfOwnership: 0,
    };
  }

  private scoreWalkability(locationData: any): any {
    return {
      score: 70,
      walkScore: 70,
      transitScore: 65,
      bikeScore: 60,
    };
  }

  private scoreSchools(locationData: any): any {
    return {
      score: 85,
      elementaryRating: 8.5,
      middleRating: 7.8,
      highSchoolRating: 8.2,
      distanceToSchools: 0.5, // miles
    };
  }

  private scoreAmenities(locationData: any): any {
    return {
      score: 75,
      shoppingDistance: 2.1,
      restaurantsDistance: 1.5,
      parksDistance: 0.8,
      hospitalDistance: 5.2,
    };
  }

  private scoreNeighborhood(locationData: any): any {
    return {
      score: 80,
      neighborhoodRating: 8.0,
      futureDevlopment: 7.5,
      gentrificationIndex: 0.3,
      communityEngagement: 7.2,
    };
  }

  // Additional helper methods

  private async getMaintenanceRecords(propertyId: string): Promise<any[]> {
    // Would integrate with maintenance module
    return [];
  }

  private async getMarketData(property: any): Promise<any> {
    // Would integrate with market data APIs
    return {};
  }

  private async getLocationData(property: any): Promise<any> {
    // Would integrate with location APIs (Walk Score, crime data, etc.)
    return {};
  }

  private calculateConfidence(categoryScores: any[]): number {
    // Calculate confidence based on data availability and consistency
    return 0.85; // Mock confidence
  }

  private calculateDataCompleteness(data: any): number {
    // Calculate how much data we have vs. ideal dataset
    return 0.75; // Mock completeness
  }

  private buildExplanationContext(breakdown: ScoreBreakdown): string {
    const context = [];
    
    if (breakdown.quality.score >= 80) {
      context.push(`Excellent maintenance history and property condition`);
    } else if (breakdown.quality.score >= 60) {
      context.push(`Good overall property condition with some maintenance needs`);
    } else {
      context.push(`Property may need significant maintenance attention`);
    }

    if (breakdown.safety.score >= 80) {
      context.push(`Low safety risks and good neighborhood security`);
    } else if (breakdown.safety.score >= 60) {
      context.push(`Moderate safety considerations to be aware of`);
    } else {
      context.push(`Several safety factors require careful evaluation`);
    }

    if (breakdown.value.score >= 80) {
      context.push(`Strong investment potential and market position`);
    } else if (breakdown.value.score >= 60) {
      context.push(`Fair market value with reasonable investment prospects`);
    } else {
      context.push(`Value concerns that may affect future appreciation`);
    }

    if (breakdown.location.score >= 80) {
      context.push(`Excellent location with great amenities and schools`);
    } else if (breakdown.location.score >= 60) {
      context.push(`Good location with decent access to amenities`);
    } else {
      context.push(`Location has limited amenities and convenience factors`);
    }

    return context.join('. ');
  }

  private generateFallbackExplanation(breakdown: ScoreBreakdown): string {
    return `This property has a HomeHistory Score™ of ${breakdown.overall}/100. The score reflects the property's quality (${breakdown.quality.score}/100), safety (${breakdown.safety.score}/100), value (${breakdown.value.score}/100), and location (${breakdown.location.score}/100). Our analysis is based on available maintenance records, safety data, market trends, and location amenities to give you a comprehensive view of this property's overall condition and potential.`;
  }

  private async storePropertyScore(score: PropertyScore): Promise<void> {
    try {
      await this.aiDatabase.storePropertyScores(score.propertyId, {
        overallScore: score.score,
        qualityScore: score.breakdown.quality.score,
        safetyScore: score.breakdown.safety.score,
        valueScore: score.breakdown.value.score,
        locationScore: score.breakdown.location.score,
        investmentScore: score.breakdown.value.factors.investment.score,
        confidence: score.confidence,
        model: 'homehistory-score-v1.0',
        methodology: { weights: this.WEIGHTS, version: '1.0' },
        factors: score.breakdown,
      });
    } catch (error) {
      this.logger.error(`Failed to store property score for ${score.propertyId}:`, error);
    }
  }

  private async processBulkScoring(job: any, options: any): Promise<void> {
    // Background processing implementation
    // Would process properties in batches and update job status
  }

  private async trackScoringAnalytics(analytics: any): Promise<void> {
    // Track scoring performance and usage
  }

  private isCacheValid(cached: PropertyScore): boolean {
    const age = Date.now() - cached.lastCalculated.getTime();
    return age < this.SCORE_CACHE_TTL * 1000;
  }

  private determineChangeReason(current: any, previous: any): string {
    if (!previous) return 'Initial calculation';
    
    const scoreDiff = current.overallScore - previous.overallScore;
    if (Math.abs(scoreDiff) < 2) return 'Minor data update';
    if (scoreDiff > 5) return 'Property improvements detected';
    if (scoreDiff < -5) return 'New issues or market changes detected';
    
    return 'Data refresh';
  }

  private parseStoredBreakdown(score: any): ScoreBreakdown {
    // Parse stored breakdown from database
    return score.factors as ScoreBreakdown;
  }

  private generateRequestId(): string {
    return `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScoreId(): string {
    return `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashBreakdown(breakdown: ScoreBreakdown): string {
    return createHash('sha256').update(JSON.stringify(breakdown)).digest('hex').substr(0, 16);
  }
}
