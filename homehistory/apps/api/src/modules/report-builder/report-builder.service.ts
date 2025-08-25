import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OpenAIService } from './openai.service';
import { GenerateReportDto, UpdateReportDto } from './dto';
import { Report, ReportStatus, Property } from '@homehistory/database';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportBuilderService {
  constructor(
    private prisma: PrismaService,
    private openAI: OpenAIService,
  ) {}

  async generateReport(userId: string, propertyId: string, dto: GenerateReportDto): Promise<Report> {
    // Verify property ownership
    const property = await this.verifyPropertyOwnership(propertyId, userId);

    // Gather all data for the property
    const propertyData = await this.gatherPropertyData(propertyId);

    // Generate AI summary
    const aiSummary = await this.openAI.generatePropertySummary(property, propertyData);

    // Extract incidents and insurance data
    const incidents = this.extractIncidents(propertyData);
    const insurance = this.extractInsurance(propertyData);

    // Generate AI insights
    const aiInsights = await this.openAI.generateInsightsForReport(property, propertyData, incidents, insurance);

    // Create report
    const report = await this.prisma.report.create({
      data: {
        propertyId,
        summary: aiSummary,
        incidentsJson: incidents,
        insuranceJson: insurance,
        aiInsights,
        status: ReportStatus.pending,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'report_generated',
        entityType: 'report',
        entityId: report.id,
        metadata: {
          propertyId,
          // reportType: dto.reportType,
        },
      },
    });

    return report;
  }

  async getReport(userId: string, reportId: string): Promise<Report> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { property: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Verify access
    if (report.property.userId !== userId) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async getPropertyReports(userId: string, propertyId: string): Promise<Report[]> {
    await this.verifyPropertyOwnership(propertyId, userId);

    return this.prisma.report.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReport(userId: string, reportId: string, dto: UpdateReportDto): Promise<Report> {
    const report = await this.getReport(userId, reportId);

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        // summary: dto.summary || report.summary,
        // incidentsJson: dto.incidentsJson || report.incidentsJson,
        // insuranceJson: dto.insuranceJson || report.insuranceJson,
        // aiInsights: dto.aiInsights || report.aiInsights,
        updatedAt: new Date(),
      },
    });
  }

  async publishReport(userId: string, reportId: string): Promise<Report> {
    const report = await this.getReport(userId, reportId);

    if (report.status === ReportStatus.published) {
      return report;
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.published,
        publishedAt: new Date(),
      },
    });
  }

  async generatePDF(userId: string, reportId: string): Promise<Buffer> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        property: {
          include: { user: true },
        },
      },
    });

    if (!report || report.property.userId !== userId) {
      throw new NotFoundException('Report not found');
    }

    // Create PDF document
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Add content to PDF
    doc.fontSize(20).text('HomeHistory Report', { align: 'center' });
    doc.moveDown();

    // Property information
    doc.fontSize(16).text('Property Information');
    doc.fontSize(12);
    doc.text(`Address: ${report.property.address}`);
    doc.text(`City: ${report.property.city}, ${report.property.state} ${report.property.zipCode}`);
    doc.text(`Year Built: ${report.property.yearBuilt || 'Unknown'}`);
    doc.text(`Square Feet: ${report.property.squareFeet || 'Unknown'}`);
    doc.moveDown();

    // Summary
    doc.fontSize(16).text('Executive Summary');
    doc.fontSize(12).text(report.summary);
    doc.moveDown();

    // Incidents
    if (report.incidentsJson) {
      doc.fontSize(16).text('Incident History');
      doc.fontSize(12);
      const incidents = report.incidentsJson as any;
      if (incidents.incidents && Array.isArray(incidents.incidents)) {
        incidents.incidents.forEach((incident: any) => {
          doc.text(`• ${incident.date}: ${incident.type} - ${incident.description}`);
        });
      }
      doc.moveDown();
    }

    // Insurance
    if (report.insuranceJson) {
      doc.fontSize(16).text('Insurance Information');
      doc.fontSize(12);
      const insurance = report.insuranceJson as any;
      if (insurance.coverage) {
        doc.text(`Dwelling Coverage: $${insurance.coverage.dwelling?.toLocaleString() || 'N/A'}`);
        doc.text(`Personal Property: $${insurance.coverage.personal_property?.toLocaleString() || 'N/A'}`);
        doc.text(`Liability: $${insurance.coverage.liability?.toLocaleString() || 'N/A'}`);
      }
      doc.moveDown();
    }

    // AI Insights
    if (report.aiInsights) {
      doc.fontSize(16).text('AI Analysis & Recommendations');
      doc.fontSize(12);
      const insights = report.aiInsights as any;
      if (insights.recommendations && Array.isArray(insights.recommendations)) {
        insights.recommendations.forEach((rec: string) => {
          doc.text(`• ${rec}`);
        });
      }
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.text('© HomeHistory - Confidential Property Report', { align: 'center' });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  private async gatherPropertyData(propertyId: string) {
    // Gather all relevant data for report generation
    const [documents, scores, comparables] = await Promise.all([
      // Get all verified documents
      this.prisma.rawDocument.findMany({
        where: {
          propertyId,
          status: ReportStatus.verified,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Get latest scores (if available)
      this.prisma.$queryRaw`
        SELECT * FROM property_scores 
        WHERE property_id = ${propertyId} 
        ORDER BY calculated_at DESC 
        LIMIT 1
      `,

      // Get comparable properties (simplified for now)
      this.prisma.property.findMany({
        where: {
          city: { equals: propertyId }, // This would be more sophisticated
          NOT: { id: propertyId },
        },
        take: 5,
      }),
    ]);

    return {
      documents,
      scores,
      comparables,
    };
  }

  private extractIncidents(propertyData: any): any {
    const incidents: any[] = [];

    // Extract incidents from parsed documents
    propertyData.documents.forEach((doc: any) => {
      if (doc.type === 'inspection' && doc.extractedText) {
        const data = doc.extractedText as any;
        if (data.findings) {
          data.findings.forEach((finding: string) => {
            incidents.push({
              date: data.inspectionDate || doc.createdAt,
              type: 'inspection_finding',
              description: finding,
              resolved: false,
              source: 'inspection_report',
            });
          });
        }
      }

      if (doc.type === 'insurance' && doc.extractedText) {
        const data = doc.extractedText as any;
        if (data.claims && Array.isArray(data.claims)) {
          data.claims.forEach((claim: any) => {
            incidents.push({
              date: claim.date,
              type: 'insurance_claim',
              description: claim.description || 'Insurance claim',
              resolved: claim.status === 'closed',
              amount: claim.amount,
              source: 'insurance_records',
            });
          });
        }
      }
    });

    return { incidents };
  }

  private extractInsurance(propertyData: any): any {
    const insuranceDoc = propertyData.documents.find((doc: any) => doc.type === 'insurance');
    
    if (!insuranceDoc || !insuranceDoc.extractedText) {
      return null;
    }

    const data = insuranceDoc.extractedText as any;
    
    return {
      carrier: data.carrier,
      policyNumber: data.policyNumber,
      coverage: {
        dwelling: data.coverageAmount,
        personal_property: data.coverageAmount ? data.coverageAmount * 0.5 : null,
        liability: data.coverageAmount ? data.coverageAmount * 0.6 : null,
      },
      deductible: data.deductible,
      effectiveDate: data.effectiveDate,
      expirationDate: data.expirationDate,
      claims: data.claims || [],
    };
  }

  private async verifyPropertyOwnership(propertyId: string, userId: string): Promise<Property> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.userId !== userId) {
      throw new NotFoundException('Property not found or access denied');
    }

    return property;
  }

  // Additional methods needed by the controller
  async createReportTemplate(userId: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id: `template-${Date.now()}`,
      name: dto.name,
      type: dto.type,
      format: dto.format,
      content: dto.content,
      isActive: dto.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getReportTemplate(userId: string, id: string): Promise<any> {
    // Mock implementation
    return {
      id,
      name: 'Sample Template',
      type: 'property_report',
      format: 'pdf',
      content: 'Sample template content',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateReportTemplate(userId: string, id: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id,
      name: dto.name || 'Updated Template',
      type: dto.type || 'property_report',
      format: dto.format || 'pdf',
      content: dto.content || 'Updated content',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteReportTemplate(userId: string, id: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting report template ${id} for user ${userId}`);
  }

  async getReportTemplates(userId: string, query: any): Promise<any[]> {
    // Mock implementation
    return [
      {
        id: 'template-1',
        name: 'Sample Template',
        type: 'property_report',
        format: 'pdf',
        content: 'Sample template content',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async getReportGeneration(userId: string, id: string): Promise<any> {
    // Mock implementation
    return {
      id,
      propertyId: 'property-id',
      templateId: 'template-id',
      status: 'completed',
      result: 'Sample report content',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateReportGeneration(userId: string, id: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id,
      propertyId: dto.propertyId || 'property-id',
      templateId: dto.templateId || 'template-id',
      status: dto.status || 'completed',
      result: dto.result || 'Updated report content',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteReportGeneration(userId: string, id: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting report generation ${id} for user ${userId}`);
  }

  async getReportGenerations(userId: string, query: any): Promise<any[]> {
    // Mock implementation
    return [
      {
        id: 'gen-1',
        propertyId: 'property-1',
        templateId: 'template-1',
        status: 'completed',
        result: 'Sample report content',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async createReportSchedule(userId: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id: `schedule-${Date.now()}`,
      propertyId: dto.propertyId,
      templateId: dto.templateId,
      frequency: dto.frequency,
      nextRun: dto.nextRun,
      isActive: dto.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getReportSchedule(userId: string, id: string): Promise<any> {
    // Mock implementation
    return {
      id,
      propertyId: 'property-id',
      templateId: 'template-id',
      frequency: 'monthly',
      nextRun: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateReportSchedule(userId: string, id: string, dto: any): Promise<any> {
    // Mock implementation
    return {
      id,
      propertyId: dto.propertyId || 'property-id',
      templateId: dto.templateId || 'template-id',
      frequency: dto.frequency || 'monthly',
      nextRun: dto.nextRun || new Date(),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteReportSchedule(userId: string, id: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting report schedule ${id} for user ${userId}`);
  }

  async getReportSchedules(userId: string, query: any): Promise<any[]> {
    // Mock implementation
    return [
      {
        id: 'schedule-1',
        propertyId: 'property-1',
        templateId: 'template-1',
        frequency: 'monthly',
        nextRun: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
