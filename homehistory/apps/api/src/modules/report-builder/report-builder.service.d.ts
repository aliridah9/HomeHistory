import { PrismaService } from '../database/prisma.service';
import { OpenAIService } from './openai.service';
import { GenerateReportDto, UpdateReportDto } from './dto';
import { Report } from '@homehistory/database';
export declare class ReportBuilderService {
    private prisma;
    private openAI;
    constructor(prisma: PrismaService, openAI: OpenAIService);
    generateReport(userId: string, propertyId: string, dto: GenerateReportDto): Promise<Report>;
    getReport(userId: string, reportId: string): Promise<Report>;
    getPropertyReports(userId: string, propertyId: string): Promise<Report[]>;
    updateReport(userId: string, reportId: string, dto: UpdateReportDto): Promise<Report>;
    publishReport(userId: string, reportId: string): Promise<Report>;
    generatePDF(userId: string, reportId: string): Promise<Buffer>;
    private gatherPropertyData;
    private extractIncidents;
    private extractInsurance;
    private verifyPropertyOwnership;
    createReportTemplate(userId: string, dto: any): Promise<any>;
    getReportTemplate(userId: string, id: string): Promise<any>;
    updateReportTemplate(userId: string, id: string, dto: any): Promise<any>;
    deleteReportTemplate(userId: string, id: string): Promise<void>;
    getReportTemplates(userId: string, query: any): Promise<any[]>;
    getReportGeneration(userId: string, id: string): Promise<any>;
    updateReportGeneration(userId: string, id: string, dto: any): Promise<any>;
    deleteReportGeneration(userId: string, id: string): Promise<void>;
    getReportGenerations(userId: string, query: any): Promise<any[]>;
    createReportSchedule(userId: string, dto: any): Promise<any>;
    getReportSchedule(userId: string, id: string): Promise<any>;
    updateReportSchedule(userId: string, id: string, dto: any): Promise<any>;
    deleteReportSchedule(userId: string, id: string): Promise<void>;
    getReportSchedules(userId: string, query: any): Promise<any[]>;
}
//# sourceMappingURL=report-builder.service.d.ts.map
