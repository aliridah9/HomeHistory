import { PrismaService } from '../database/prisma.service';
import { PropertyScoreResponseDto, ScoreBreakdownDto } from './dto';
import { Property } from '@homehistory/database';
export declare class ScoringService {
    private prisma;
    constructor(prisma: PrismaService);
    getPropertyScore(userId: string, propertyId: string): Promise<PropertyScoreResponseDto>;
    calculatePropertyScore(property: Property): Promise<any>;
    getScoreBreakdown(userId: string, propertyId: string): Promise<ScoreBreakdownDto>;
    getScoreHistory(userId: string, propertyId: string): Promise<PropertyScoreResponseDto[]>;
    private calculateQualityScore;
    private calculateSafetyScore;
    private calculateValueScore;
    private calculateLocationScore;
    private generateScoreExplanation;
    private gatherScoringData;
    private getExternalData;
    private getCurrentScore;
    private isScoreOutdated;
    private formatScoreDto;
    private verifyPropertyAccess;
    private getQualityFactors;
    private getSafetyFactors;
    private getValueFactors;
    private getLocationFactors;
    createPropertyScore(userId: string, dto: any): Promise<PropertyScoreResponseDto>;
    updatePropertyScore(userId: string, id: string, dto: any): Promise<PropertyScoreResponseDto>;
    deletePropertyScore(userId: string, id: string): Promise<void>;
    getPropertyScores(userId: string, query: any): Promise<PropertyScoreResponseDto[]>;
    createScoringCriteria(userId: string, dto: any): Promise<any>;
    getScoringCriteria(userId: string, id: string): Promise<any>;
    updateScoringCriteria(userId: string, id: string, dto: any): Promise<any>;
    deleteScoringCriteria(userId: string, id: string): Promise<void>;
    createScoreCalculation(userId: string, dto: any): Promise<any>;
    getScoreCalculation(userId: string, id: string): Promise<any>;
    updateScoreCalculation(userId: string, id: string, dto: any): Promise<any>;
    deleteScoreCalculation(userId: string, id: string): Promise<void>;
}
//# sourceMappingURL=scoring.service.d.ts.map
