import { User } from '@homehistory/database';
import { ReportBuilderService } from './report-builder.service';
import { CreateReportTemplateDto, UpdateReportTemplateDto, ReportTemplateResponseDto, ReportTemplateQueryDto, GenerateReportDto, UpdateReportDto, ReportGenerationResponseDto, ReportGenerationQueryDto, CreateReportScheduleDto, UpdateReportScheduleDto, ReportScheduleResponseDto, ReportScheduleQueryDto } from './dto';
export declare class ReportBuilderController {
    private readonly reportBuilderService;
    constructor(reportBuilderService: ReportBuilderService);
    createReportTemplate(user: User, dto: CreateReportTemplateDto): Promise<ReportTemplateResponseDto>;
    getReportTemplate(user: User, id: string): Promise<ReportTemplateResponseDto>;
    updateReportTemplate(user: User, id: string, dto: UpdateReportTemplateDto): Promise<ReportTemplateResponseDto>;
    deleteReportTemplate(user: User, id: string): Promise<void>;
    getReportTemplates(user: User, query: ReportTemplateQueryDto): Promise<ReportTemplateResponseDto[]>;
    generateReport(user: User, dto: GenerateReportDto): Promise<ReportGenerationResponseDto>;
    getReportGeneration(user: User, id: string): Promise<ReportGenerationResponseDto>;
    updateReportGeneration(user: User, id: string, dto: UpdateReportDto): Promise<ReportGenerationResponseDto>;
    deleteReportGeneration(user: User, id: string): Promise<void>;
    getReportGenerations(user: User, query: ReportGenerationQueryDto): Promise<ReportGenerationResponseDto[]>;
    createReportSchedule(user: User, dto: CreateReportScheduleDto): Promise<ReportScheduleResponseDto>;
    getReportSchedule(user: User, id: string): Promise<ReportScheduleResponseDto>;
    updateReportSchedule(user: User, id: string, dto: UpdateReportScheduleDto): Promise<ReportScheduleResponseDto>;
    deleteReportSchedule(user: User, id: string): Promise<void>;
    getReportSchedules(user: User, query: ReportScheduleQueryDto): Promise<ReportScheduleResponseDto[]>;
}
//# sourceMappingURL=report-builder.controller.d.ts.map
