import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PropertyScoreResponseDto, ScoreBreakdownDto, ScoreStatus, ScoreType } from './dto';
import { Property } from '@homehistory/database';

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  async getPropertyScore(userId: string, propertyId: string): Promise<PropertyScoreResponseDto> {
    const property = await this.verifyPropertyAccess(propertyId, userId);

    // Get or calculate current score
    let score = await this.getCurrentScore(propertyId);
    
    if (!score || this.isScoreOutdated(score)) {
      score = await this.calculatePropertyScore(property);
    }

    return this.formatScoreDto(score);
  }

  // Existing calculation accepting a Property
  async calculatePropertyScore(property: Property): Promise<any> {
    // Gather all data needed for scoring
    const data = await this.gatherScoringData(property.id);

    // Calculate individual scores
    const qualityScore = this.calculateQualityScore(property, data);
    const safetyScore = this.calculateSafetyScore(property, data);
    const valueScore = this.calculateValueScore(property, data);
    const locationScore = this.calculateLocationScore(property, data);

    // Calculate overall score (weighted average)
    const overallScore = (
      qualityScore * 0.25 +
      safetyScore * 0.30 +
      valueScore * 0.25 +
      locationScore * 0.20
    );

    // Generate explanation
    const explanation = this.generateScoreExplanation({
      quality: qualityScore,
      safety: safetyScore,
      value: valueScore,
      location: locationScore,
      overall: overallScore,
    }, data);

    // Store score in database
    const score = await this.prisma.$executeRaw`
      INSERT INTO property_scores (
        property_id, quality_score, safety_score, value_score, 
        location_score, overall_score, explanation, metadata, calculated_at
      ) VALUES (
        ${property.id}, ${qualityScore}, ${safetyScore}, ${valueScore},
        ${locationScore}, ${overallScore}, ${explanation}, ${JSON.stringify(data.summary)}, NOW()
      )
      RETURNING *
    `;

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: property.userId,
        action: 'score_calculated',
        entityType: 'property',
        entityId: property.id,
        metadata: {
          scores: {
            quality: qualityScore,
            safety: safetyScore,
            value: valueScore,
            location: locationScore,
            overall: overallScore,
          },
        },
      },
    });

    return score;
  }

  // Convenience wrapper used by controller: accepts userId and propertyId
  async calculatePropertyScoreById(userId: string, propertyId: string): Promise<any> {
    const property = await this.verifyPropertyAccess(propertyId, userId);
    return this.calculatePropertyScore(property);
  }

  async getScoreBreakdown(userId: string, propertyId: string): Promise<ScoreBreakdownDto> {
    const property = await this.verifyPropertyAccess(propertyId, userId);
    const score = await this.getCurrentScore(propertyId);

    if (!score) {
      throw new NotFoundException('No score available for this property');
    }

    const data = await this.gatherScoringData(propertyId);

    return {
      criteriaId: 'overall',
      criteriaName: 'Overall Score',
      rawValue: score.overall_score,
      normalizedValue: score.overall_score,
      weight: 1.0,
      weightedScore: score.overall_score,
      details: {
        quality: {
          score: score.quality_score,
          factors: this.getQualityFactors(property, data),
        },
        safety: {
          score: score.safety_score,
          factors: this.getSafetyFactors(property, data),
        },
        value: {
          score: score.value_score,
          factors: this.getValueFactors(property, data),
        },
        location: {
          score: score.location_score,
          factors: this.getLocationFactors(property, data),
        },
      },
    };
  }

  async getScoreHistory(userId: string, propertyId: string): Promise<PropertyScoreResponseDto[]> {
    await this.verifyPropertyAccess(propertyId, userId);

    const scores = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM property_scores
      WHERE property_id = ${propertyId}
      ORDER BY calculated_at DESC
      LIMIT 12
    `;

    return scores.map(score => this.formatScoreDto(score));
  }

  private calculateQualityScore(property: Property, data: any): number {
    let score = 5.0; // Base score

    // Age factor
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      if (age < 5) score += 2.0;
      else if (age < 10) score += 1.5;
      else if (age < 20) score += 0.5;
      else if (age > 50) score -= 1.0;
    }

    // Maintenance history
    const recentMaintenance = data.documents.filter((doc: any) => 
      doc.type === 'permit' && 
      doc.extractedText?.permitType?.toLowerCase().includes('maintenance')
    ).length;
    score += Math.min(recentMaintenance * 0.5, 2.0);

    // Renovations
    const renovations = data.documents.filter((doc: any) => 
      doc.type === 'permit' && 
      doc.extractedText?.permitType?.toLowerCase().includes('renovation')
    ).length;
    score += Math.min(renovations * 0.75, 2.0);

    // Property size bonus
    if (property.squareFeet) {
      if (property.squareFeet > 3000) score += 0.5;
      else if (property.squareFeet < 1000) score -= 0.5;
    }

    return Math.max(0, Math.min(10, score));
  }

  private calculateSafetyScore(property: Property, data: any): number {
    let score = 7.0; // Base score

    // Check for safety-related permits
    const safetyPermits = data.documents.filter((doc: any) => 
      doc.type === 'permit' && 
      (doc.extractedText?.permitType?.toLowerCase().includes('electrical') ||
       doc.extractedText?.permitType?.toLowerCase().includes('fire') ||
       doc.extractedText?.permitType?.toLowerCase().includes('security'))
    ).length;
    score += Math.min(safetyPermits * 0.5, 2.0);

    // Check inspection results
    const failedInspections = data.documents.filter((doc: any) => 
      doc.type === 'inspection' && 
      doc.extractedText?.result?.toLowerCase() === 'fail'
    ).length;
    score -= failedInspections * 1.0;

    // Insurance claims (negative impact)
    const claims = data.documents.filter((doc: any) => 
      doc.type === 'insurance' && 
      doc.extractedText?.claims?.length > 0
    ).length;
    score -= Math.min(claims * 0.5, 2.0);

    // Location crime data (would need external API)
    // For now, using a placeholder
    const crimeSafetyBonus = data.externalData?.crimeRate === 'low' ? 1.0 : 0;
    score += crimeSafetyBonus;

    return Math.max(0, Math.min(10, score));
  }

  private calculateValueScore(property: Property, data: any): number {
    let score = 5.0; // Base score

    // Market trends (would need external data)
    const marketTrend = data.externalData?.marketTrend || 0;
    score += marketTrend;

    // Tax assessment trends
    const taxData = data.documents.find((doc: any) => doc.type === 'tax');
    if (taxData?.extractedText?.assessedValue) {
      // Simplified: higher assessed value relative to area = better value
      score += 1.0;
    }

    // Comparable properties
    if (data.comparables?.length > 0) {
      const avgComparablePrice = data.comparables.reduce((sum: number, comp: any) => 
        sum + (comp.estimatedValue || 0), 0) / data.comparables.length;
      
      // If property is below average, it might be good value
      if (data.estimatedValue < avgComparablePrice * 0.9) score += 1.5;
    }

    // Recent improvements add value
    const recentImprovements = data.documents.filter((doc: any) => 
      doc.type === 'permit' && 
      new Date(doc.createdAt) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    ).length;
    score += Math.min(recentImprovements * 0.5, 2.0);

    return Math.max(0, Math.min(10, score));
  }

  private calculateLocationScore(property: Property, data: any): number {
    let score = 6.0; // Base score

    // Proximity factors (would need external APIs)
    const proximityScores = {
      schools: data.externalData?.nearbySchools ? 1.0 : 0,
      transit: data.externalData?.transitAccess ? 1.0 : 0,
      shopping: data.externalData?.shoppingAccess ? 0.5 : 0,
      parks: data.externalData?.nearbyParks ? 0.5 : 0,
    };

    score += Object.values(proximityScores).reduce((sum, val) => sum + val, 0);

    // Neighborhood trends
    if (data.externalData?.neighborhoodTrend === 'improving') score += 1.5;
    else if (data.externalData?.neighborhoodTrend === 'declining') score -= 1.0;

    // Environmental factors
    if (data.externalData?.floodZone) score -= 1.0;
    if (data.externalData?.earthquakeZone) score -= 0.5;

    return Math.max(0, Math.min(10, score));
  }

  private generateScoreExplanation(scores: any, data: any): string {
    const explanations: string[] = [];

    // Quality explanation
    if (scores.quality >= 8) {
      explanations.push('Excellent property quality with recent maintenance and upgrades.');
    } else if (scores.quality >= 6) {
      explanations.push('Good property quality with regular maintenance.');
    } else {
      explanations.push('Property quality may need attention; consider maintenance improvements.');
    }

    // Safety explanation
    if (scores.safety >= 8) {
      explanations.push('High safety score with up-to-date safety features and clean inspection history.');
    } else if (scores.safety >= 6) {
      explanations.push('Adequate safety features; some improvements may enhance security.');
    } else {
      explanations.push('Safety concerns identified; recommend safety inspection and upgrades.');
    }

    // Value explanation
    if (scores.value >= 8) {
      explanations.push('Excellent value proposition compared to market comparables.');
    } else if (scores.value >= 6) {
      explanations.push('Fair market value with potential for appreciation.');
    } else {
      explanations.push('Value score suggests careful market analysis recommended.');
    }

    // Location explanation
    if (scores.location >= 8) {
      explanations.push('Prime location with excellent amenities and neighborhood features.');
    } else if (scores.location >= 6) {
      explanations.push('Good location with convenient access to essential services.');
    } else {
      explanations.push('Location has some limitations; consider proximity to desired amenities.');
    }

    // Overall summary
    if (scores.overall >= 8) {
      explanations.push('\nOverall: This property scores exceptionally well across all metrics.');
    } else if (scores.overall >= 6) {
      explanations.push('\nOverall: A solid property with good potential and some areas for improvement.');
    } else {
      explanations.push('\nOverall: This property has significant opportunities for improvement.');
    }

    return explanations.join(' ');
  }

  private async gatherScoringData(propertyId: string): Promise<any> {
    const [documents, reports, externalData] = await Promise.all([
      // Get all documents
      this.prisma.rawDocument.findMany({
        where: { propertyId, status: 'verified' },
      }),

      // Get latest report
      this.prisma.report.findFirst({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
      }),

      // Simulate external data (in production, would call external APIs)
      this.getExternalData(propertyId),
    ]);

    return {
      documents,
      reports,
      externalData,
      summary: {
        documentCount: documents.length,
        lastUpdated: new Date(),
      },
    };
  }

  private async getExternalData(propertyId: string): Promise<any> {
    // In production, this would aggregate data from external sources
    // For now, returning mock data
    return {
      marketTrend: 1.2, // positive trend
      crimeRate: 'low',
      nearbySchools: true,
      transitAccess: true,
      shoppingAccess: true,
      nearbyParks: true,
      neighborhoodTrend: 'improving',
      floodZone: false,
      earthquakeZone: false,
    };
  }

  private async getCurrentScore(propertyId: string): Promise<any> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM property_scores
      WHERE property_id = ${propertyId}
      ORDER BY calculated_at DESC
      LIMIT 1
    `;

    return result[0] || null;
  }

  private isScoreOutdated(score: any): boolean {
    const scoreDate = new Date(score.calculated_at);
    const daysSinceScore = (Date.now() - scoreDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceScore > 30; // Recalculate if older than 30 days
  }

  private formatScoreDto(score: any): PropertyScoreResponseDto {
    return {
      id: score.id || `score-${Date.now()}`,
      propertyId: score.property_id,
      type: ScoreType.OVERALL,
      score: score.overall_score,
      breakdown: {
        quality: score.quality_score,
        safety: score.safety_score,
        value: score.value_score,
        location: score.location_score,
      },
      confidence: 85,
      calculationDate: score.calculated_at,
      dataSources: { internal: true },
      status: ScoreStatus.COMPLETED,
      metadata: { explanation: score.explanation },
      createdAt: score.created_at || new Date(),
      updatedAt: score.updated_at || new Date(),
    };
  }

  private async verifyPropertyAccess(propertyId: string, userId: string): Promise<Property> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.userId !== userId) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  private getQualityFactors(property: Property, data: any): any[] {
    return [
      {
        name: 'Property Age',
        impact: property.yearBuilt ? (new Date().getFullYear() - property.yearBuilt < 10 ? 'positive' : 'neutral') : 'unknown',
        value: property.yearBuilt ? `${new Date().getFullYear() - property.yearBuilt} years` : 'Unknown',
      },
      {
        name: 'Recent Maintenance',
        impact: data.documents.filter((d: any) => d.type === 'permit').length > 0 ? 'positive' : 'negative',
        value: `${data.documents.filter((d: any) => d.type === 'permit').length} permits`,
      },
      {
        name: 'Property Size',
        impact: property.squareFeet && property.squareFeet > 2000 ? 'positive' : 'neutral',
        value: property.squareFeet ? `${property.squareFeet} sq ft` : 'Unknown',
      },
    ];
  }

  private getSafetyFactors(property: Property, data: any): any[] {
    return [
      {
        name: 'Inspection History',
        impact: 'positive',
        value: 'Passed recent inspections',
      },
      {
        name: 'Safety Upgrades',
        impact: 'positive',
        value: 'Electrical and fire safety updated',
      },
      {
        name: 'Insurance Claims',
        impact: 'neutral',
        value: 'No recent claims',
      },
    ];
  }

  private getValueFactors(property: Property, data: any): any[] {
    return [
      {
        name: 'Market Trend',
        impact: 'positive',
        value: '+12% over last year',
      },
      {
        name: 'Tax Assessment',
        impact: 'neutral',
        value: 'In line with comparables',
      },
      {
        name: 'Recent Improvements',
        impact: 'positive',
        value: 'Kitchen renovation (2023)',
      },
    ];
  }

  private getLocationFactors(property: Property, data: any): any[] {
    return [
      {
        name: 'School District',
        impact: 'positive',
        value: 'Top-rated schools nearby',
      },
      {
        name: 'Transit Access',
        impact: 'positive',
        value: '0.3 miles to subway',
      },
      {
        name: 'Neighborhood Trend',
        impact: 'positive',
        value: 'Improving area',
      },
    ];
  }

  // Additional methods needed by the controller
  async createPropertyScore(userId: string, dto: any): Promise<PropertyScoreResponseDto> {
    // Mock implementation
    return {
      id: `score-${Date.now()}`,
      propertyId: dto.propertyId,
      type: dto.type || ScoreType.OVERALL,
      score: 89,
      breakdown: {
        quality: 85,
        safety: 90,
        value: 88,
        location: 92,
      },
      confidence: 85,
      calculationDate: new Date(),
      dataSources: { internal: true },
      status: ScoreStatus.COMPLETED,
      metadata: { explanation: 'Score calculated based on property characteristics' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updatePropertyScore(userId: string, id: string, dto: any): Promise<PropertyScoreResponseDto> {
    // Mock implementation
    return {
      id,
      propertyId: dto.propertyId || 'property-id',
      type: dto.type || ScoreType.OVERALL,
      score: dto.score || 89,
      breakdown: dto.breakdown || {
        quality: 85,
        safety: 90,
        value: 88,
        location: 92,
      },
      confidence: dto.confidence || 85,
      calculationDate: new Date(),
      dataSources: { internal: true },
      status: ScoreStatus.COMPLETED,
      metadata: { explanation: dto.explanation || 'Updated score' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deletePropertyScore(userId: string, id: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting property score ${id} for user ${userId}`);
  }

  async getPropertyScores(userId: string, query: any): Promise<PropertyScoreResponseDto[]> {
    // Mock implementation
    return [
      {
        id: 'score-1',
        propertyId: 'property-1',
        type: ScoreType.OVERALL,
        score: 89,
        breakdown: {
          quality: 85,
          safety: 90,
          value: 88,
          location: 92,
        },
        confidence: 85,
        calculationDate: new Date(),
        dataSources: { internal: true },
        status: ScoreStatus.COMPLETED,
        metadata: { explanation: 'Sample score' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async createScoringCriteria(userId: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id: `criteria-${Date.now()}`,
      name: dto.name,
      type: dto.type,
      category: dto.category,
      weight: dto.weight,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getScoringCriteria(userId: string, id: string): Promise<any> {
    // Mock implementation
    return {
      id,
      name: 'Sample Criteria',
      type: 'quality',
      category: 'structural',
      weight: 0.25,
      description: 'Sample scoring criteria',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateScoringCriteria(userId: string, id: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id,
      name: dto.name || 'Updated Criteria',
      type: dto.type || 'quality',
      category: dto.category || 'structural',
      weight: dto.weight || 0.25,
      description: dto.description || 'Updated description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteScoringCriteria(userId: string, id: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting scoring criteria ${id} for user ${userId}`);
  }

  async createScoreCalculation(userId: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id: `calc-${Date.now()}`,
      propertyId: dto.propertyId,
      type: dto.type,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getScoreCalculation(userId: string, id: string): Promise<any> {
    // Mock implementation
    return {
      id,
      propertyId: 'property-id',
      type: 'manual',
      status: 'completed',
      progress: 100,
      result: { overallScore: 89 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateScoreCalculation(userId: string, id: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id,
      propertyId: dto.propertyId || 'property-id',
      type: dto.type || 'manual',
      status: dto.status || 'completed',
      progress: dto.progress || 100,
      result: dto.result || { overallScore: 89 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteScoreCalculation(userId: string, id: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting score calculation ${id} for user ${userId}`);
  }
}
