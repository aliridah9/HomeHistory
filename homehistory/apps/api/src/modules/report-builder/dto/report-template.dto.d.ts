export declare enum ReportType {
    PROPERTY_ANALYSIS = "property_analysis",
    MARKET_REPORT = "market_report",
    INVESTMENT_ANALYSIS = "investment_analysis",
    COMPARATIVE_ANALYSIS = "comparative_analysis",
    CUSTOM_REPORT = "custom_report"
}
export declare enum ReportFormat {
    PDF = "pdf",
    HTML = "html",
    DOCX = "docx",
    JSON = "json"
}
export declare class CreateReportTemplateDto {
    name: string;
    description: string;
    type: ReportType;
    format: ReportFormat;
    content: string;
    schema?: Record<string, any>;
    isActive?: boolean;
    tags?: string[];
}
export declare class UpdateReportTemplateDto {
    name?: string;
    description?: string;
    type?: ReportType;
    format?: ReportFormat;
    content?: string;
    schema?: Record<string, any>;
    isActive?: boolean;
    tags?: string[];
}
export declare class ReportTemplateResponseDto {
    id: string;
    name: string;
    description: string;
    type: ReportType;
    format: ReportFormat;
    content: string;
    schema?: Record<string, any>;
    isActive: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class ReportTemplateQueryDto {
    name?: string;
    type?: ReportType;
    format?: ReportFormat;
    isActive?: boolean;
    tags?: string[];
}
//# sourceMappingURL=report-template.dto.d.ts.map
