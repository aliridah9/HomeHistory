import { User } from '@homehistory/database';
import { ScoringService } from './scoring.service';
import { CreatePropertyScoreDto, UpdatePropertyScoreDto, PropertyScoreResponseDto, PropertyScoreQueryDto, CreateScoringCriteriaDto, UpdateScoringCriteriaDto, ScoringCriteriaResponseDto, CreateScoreCalculationDto, UpdateScoreCalculationDto, ScoreCalculationResponseDto } from './dto';
export declare class ScoringController {
    private readonly scoringService;
    constructor(scoringService: ScoringService);
    createPropertyScore(user: User, dto: CreatePropertyScoreDto): Promise<PropertyScoreResponseDto>;
    getPropertyScore(user: User, propertyId: string): Promise<PropertyScoreResponseDto>;
    updatePropertyScore(user: User, id: string, dto: UpdatePropertyScoreDto): Promise<PropertyScoreResponseDto>;
    deletePropertyScore(user: User, id: string): Promise<void>;
    getPropertyScores(user: User, query: PropertyScoreQueryDto): Promise<PropertyScoreResponseDto[]>;
    createScoringCriteria(user: User, dto: CreateScoringCriteriaDto): Promise<ScoringCriteriaResponseDto>;
    getScoringCriteria(user: User, id: string): Promise<ScoringCriteriaResponseDto>;
    updateScoringCriteria(user: User, id: string, dto: UpdateScoringCriteriaDto): Promise<ScoringCriteriaResponseDto>;
    deleteScoringCriteria(user: User, id: string): Promise<void>;
    createScoreCalculation(user: User, dto: CreateScoreCalculationDto): Promise<ScoreCalculationResponseDto>;
    getScoreCalculation(user: User, id: string): Promise<ScoreCalculationResponseDto>;
    updateScoreCalculation(user: User, id: string, dto: UpdateScoreCalculationDto): Promise<ScoreCalculationResponseDto>;
    deleteScoreCalculation(user: User, id: string): Promise<void>;
    calculatePropertyScore(user: User, propertyId: string): Promise<any>;
}
//# sourceMappingURL=scoring.controller.d.ts.map
