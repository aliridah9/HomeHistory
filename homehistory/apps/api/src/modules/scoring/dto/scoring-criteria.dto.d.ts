export declare enum CriteriaType {
    NUMERIC = "numeric",
    BOOLEAN = "boolean",
    CATEGORICAL = "categorical",
    TEXT = "text",
    DATE = "date"
}
export declare enum CriteriaCategory {
    LOCATION = "location",
    PROPERTY_FEATURES = "property_features",
    MARKET_CONDITIONS = "market_conditions",
    FINANCIAL = "financial",
    LEGAL = "legal",
    ENVIRONMENTAL = "environmental",
    INFRASTRUCTURE = "infrastructure",
    DEMOGRAPHICS = "demographics"
}
export declare class CreateScoringCriteriaDto {
    name: string;
    description: string;
    category: CriteriaCategory;
    type: CriteriaType;
    weight: number;
    minValue?: number;
    maxValue?: number;
    targetValue?: number;
    acceptableValues?: string[];
    formula?: string;
    isActive?: boolean;
    config?: Record<string, any>;
}
export declare class UpdateScoringCriteriaDto {
    name?: string;
    description?: string;
    category?: CriteriaCategory;
    type?: CriteriaType;
    weight?: number;
    minValue?: number;
    maxValue?: number;
    targetValue?: number;
    acceptableValues?: string[];
    formula?: string;
    isActive?: boolean;
    config?: Record<string, any>;
}
export declare class ScoringCriteriaResponseDto {
    id: string;
    name: string;
    description: string;
    category: CriteriaCategory;
    type: CriteriaType;
    weight: number;
    minValue?: number;
    maxValue?: number;
    targetValue?: number;
    acceptableValues?: string[];
    formula?: string;
    isActive: boolean;
    config?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ScoringCriteriaQueryDto {
    name?: string;
    category?: CriteriaCategory;
    type?: CriteriaType;
    isActive?: boolean;
    minWeight?: number;
    maxWeight?: number;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=scoring-criteria.dto.d.ts.map
