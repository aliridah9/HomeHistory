export declare enum ScoreType {
    OVERALL = "overall",
    MARKET_VALUE = "market_value",
    INVESTMENT_POTENTIAL = "investment_potential",
    LOCATION_QUALITY = "location_quality",
    PROPERTY_CONDITION = "property_condition",
    RENTAL_POTENTIAL = "rental_potential",
    TAX_EFFICIENCY = "tax_efficiency",
    APPRECIATION_POTENTIAL = "appreciation_potential"
}
export declare enum ScoreStatus {
    PENDING = "pending",
    CALCULATING = "calculating",
    COMPLETED = "completed",
    FAILED = "failed",
    OUTDATED = "outdated"
}
export declare class CreatePropertyScoreDto {
    propertyId: string;
    type: ScoreType;
    score: number;
    breakdown: Record<string, number>;
    confidence?: number;
    calculationDate?: string;
    dataSources?: Record<string, any>;
    metadata?: Record<string, any>;
}
export declare class UpdatePropertyScoreDto {
    score?: number;
    breakdown?: Record<string, number>;
    confidence?: number;
    calculationDate?: string;
    dataSources?: Record<string, any>;
    metadata?: Record<string, any>;
}
export declare class PropertyScoreResponseDto {
    id: string;
    propertyId: string;
    type: ScoreType;
    score: number;
    breakdown: Record<string, number>;
    confidence?: number;
    calculationDate: Date;
    dataSources?: Record<string, any>;
    status: ScoreStatus;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PropertyScoreQueryDto {
    propertyId?: string;
    type?: ScoreType;
    minScore?: number;
    maxScore?: number;
    status?: ScoreStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=property-score.dto.d.ts.map
