export declare enum ReportStatus {
    PENDING = "pending",
    GENERATING = "generating",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare class GenerateReportDto {
    templateId: string;
    propertyId?: string;
    parameters: Record<string, any>;
    format?: string;
    options?: Record<string, any>;
}
export declare class UpdateReportDto {
    status?: ReportStatus;
    content?: string;
    fileUrl?: string;
    progress?: number;
    errorMessage?: string;
    metadata?: Record<string, any>;
}
export declare class ReportGenerationResponseDto {
    id: string;
    templateId: string;
    propertyId?: string;
    status: ReportStatus;
    progress: number;
    content?: string;
    fileUrl?: string;
    errorMessage?: string;
    parameters: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class ReportGenerationQueryDto {
    status?: ReportStatus;
    templateId?: string;
    propertyId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=report-generation.dto.d.ts.map
