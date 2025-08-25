export declare enum CalculationStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum CalculationType {
    MANUAL = "manual",
    SCHEDULED = "scheduled",
    TRIGGERED = "triggered",
    BATCH = "batch"
}
export declare class CreateScoreCalculationDto {
    propertyId: string;
    type: CalculationType;
    criteriaIds: string[];
    parameters?: Record<string, any>;
    priority?: number;
    scheduledAt?: string;
    options?: Record<string, any>;
}
export declare class UpdateScoreCalculationDto {
    status?: CalculationStatus;
    progress?: number;
    result?: Record<string, any>;
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
    metadata?: Record<string, any>;
}
export declare class ScoreCalculationResponseDto {
    id: string;
    propertyId: string;
    type: CalculationType;
    criteriaIds: string[];
    status: CalculationStatus;
    progress: number;
    parameters?: Record<string, any>;
    result?: Record<string, any>;
    errorMessage?: string;
    priority: number;
    scheduledAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    options?: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ScoreCalculationQueryDto {
    propertyId?: string;
    type?: CalculationType;
    status?: CalculationStatus;
    minPriority?: number;
    maxPriority?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
export declare class ScoreBreakdownDto {
    criteriaId: string;
    criteriaName: string;
    rawValue: any;
    normalizedValue: number;
    weight: number;
    weightedScore: number;
    details?: Record<string, any>;
}
//# sourceMappingURL=score-calculation.dto.d.ts.map
