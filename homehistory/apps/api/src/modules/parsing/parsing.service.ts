import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ParseDocumentDto, ParseBatchDto, ParsingStatusDto } from './dto';
import { RawDocument, ReportStatus } from '@homehistory/database';
import pdfParse from 'pdf-parse';
import { getConfig } from '../../config';

@Injectable()
export class ParsingService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    @InjectQueue('parsing') private parsingQueue: Queue,
  ) {}

  async parseDocument(userId: string, dto: ParseDocumentDto): Promise<ParsingStatusDto> {
    // Verify document access
    const document = await this.verifyDocumentAccess(dto.documentId, userId);

    // Queue parsing job
    const job = await this.parsingQueue.add('parse', {
      documentId: document.id,
      userId,
      options: dto.parseOptions,
    });

    return {
      documentId: document.id,
      status: 'queued',
      jobId: job.id.toString(),
      message: 'Document queued for parsing',
    };
  }

  async parseBatch(userId: string, dto: ParseBatchDto): Promise<ParsingStatusDto[]> {
    const results: ParsingStatusDto[] = [];

    for (const documentId of dto.documentIds) {
      try {
        const result = await this.parseDocument(userId, {
          documentId,
          parseOptions: dto.parseOptions,
        });
        results.push(result);
      } catch (error) {
        results.push({
          documentId,
          status: 'failed',
          jobId: null,
          message: error.message,
        });
      }
    }

    return results;
  }

  async processParsingJob(jobData: any) {
    const { documentId, userId, options } = jobData;

    try {
      const document = await this.prisma.rawDocument.findUnique({
        where: { id: documentId },
        include: { property: true },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Download file from storage
      const fileBuffer = await this.downloadFile(document.fileUrl);

      // Extract text based on file type
      let extractedData: any = {};

      if (document.fileUrl.endsWith('.pdf')) {
        extractedData = await this.parsePdf(fileBuffer, options);
      } else if (document.fileUrl.endsWith('.json')) {
        extractedData = JSON.parse(fileBuffer.toString());
      } else {
        // For other formats, use textract or similar
        extractedData = { text: fileBuffer.toString() };
      }

      // Process extracted data based on document type
      const processedData = await this.processExtractedData(
        document.type,
        extractedData,
        document.property,
      );

      // Update document with extracted data
      await this.prisma.rawDocument.update({
        where: { id: documentId },
        data: {
          extractedText: processedData,
          status: ReportStatus.verified,
          updatedAt: new Date(),
        },
      });

      // Store processed data in appropriate tables
      await this.storeProcessedData(document, processedData);

      // Log audit
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'document_parsed',
          entityType: 'raw_document',
          entityId: documentId,
          metadata: {
            documentType: document.type,
            extractedFields: Object.keys(processedData),
          },
        },
      });

      return processedData;
    } catch (error) {
      // Update document status to failed
      await this.prisma.rawDocument.update({
        where: { id: documentId },
        data: {
          status: ReportStatus.pending,
          extractedText: {
            error: error.message,
            failedAt: new Date(),
          },
        },
      });

      throw error;
    }
  }

  async getParsingStatus(userId: string, documentId: string): Promise<ParsingStatusDto> {
    const document = await this.verifyDocumentAccess(documentId, userId);

    // Check queue status
    const jobs = await this.parsingQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const job = jobs.find(j => j.data.documentId === documentId);

    if (job) {
      return {
        documentId,
        status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : 'processing',
        jobId: job.id.toString(),
        message: job.failedReason || 'Processing',
        progress: job.progress(),
      };
    }

    return {
      documentId,
      status: document.status === 'verified' ? 'completed' : 'not_started',
      jobId: null,
      message: document.status === 'verified' ? 'Parsing completed' : 'Not queued',
    };
  }

  async getParsingQueue(isAdmin: boolean) {
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const jobs = await this.parsingQueue.getJobs(['waiting', 'active']);
    
    return {
      waiting: jobs.filter(j => j.opts.delay === undefined).length,
      active: jobs.filter(j => j.finishedOn === undefined && !j.failedReason).length,
      jobs: jobs.map(job => ({
        id: job.id,
        documentId: job.data.documentId,
        status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : 'processing',
        createdAt: new Date(job.timestamp),
        progress: job.progress(),
      })),
    };
  }

  private async parsePdf(buffer: Buffer, options: any): Promise<any> {
    const data = await pdfParse(buffer);
    
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      extractedAt: new Date(),
    };
  }

  private async processExtractedData(type: string, data: any, property: any): Promise<any> {
    // Process based on document type
    switch (type) {
      case 'permit':
        return this.extractPermitData(data);
      case 'inspection':
        return this.extractInspectionData(data);
      case 'insurance':
        return this.extractInsuranceData(data);
      case 'tax':
        return this.extractTaxData(data);
      case 'zillow':
        return this.extractZillowData(data);
      default:
        return {
          type,
          rawText: data.text || JSON.stringify(data),
          extractedFields: {},
        };
    }
  }

  private extractPermitData(data: any) {
    // Extract permit-specific fields
    const text = data.text || '';
    
    return {
      permitNumber: this.extractPattern(text, /permit\s*#?\s*:?\s*(\w+)/i),
      permitType: this.extractPattern(text, /type\s*:?\s*([^\n]+)/i),
      issuedDate: this.extractDate(text, /issued\s*:?\s*([^\n]+)/i),
      expirationDate: this.extractDate(text, /expires?\s*:?\s*([^\n]+)/i),
      contractor: this.extractPattern(text, /contractor\s*:?\s*([^\n]+)/i),
      workDescription: this.extractPattern(text, /description\s*:?\s*([^\n]+)/i),
      estimatedCost: this.extractCurrency(text, /cost\s*:?\s*\$?([0-9,]+)/i),
      rawText: text,
    };
  }

  private extractInspectionData(data: any) {
    const text = data.text || '';
    
    return {
      inspectionDate: this.extractDate(text, /inspection\s*date\s*:?\s*([^\n]+)/i),
      inspector: this.extractPattern(text, /inspector\s*:?\s*([^\n]+)/i),
      inspectionType: this.extractPattern(text, /type\s*:?\s*([^\n]+)/i),
      result: this.extractPattern(text, /result\s*:?\s*(pass|fail|conditional)/i),
      findings: this.extractList(text, /findings?\s*:?\s*([^\n]+(?:\n\s*-[^\n]+)*)/i),
      recommendations: this.extractList(text, /recommendations?\s*:?\s*([^\n]+(?:\n\s*-[^\n]+)*)/i),
      rawText: text,
    };
  }

  private extractInsuranceData(data: any) {
    const text = data.text || '';
    
    return {
      policyNumber: this.extractPattern(text, /policy\s*#?\s*:?\s*(\w+)/i),
      carrier: this.extractPattern(text, /carrier\s*:?\s*([^\n]+)/i),
      coverageAmount: this.extractCurrency(text, /coverage\s*:?\s*\$?([0-9,]+)/i),
      deductible: this.extractCurrency(text, /deductible\s*:?\s*\$?([0-9,]+)/i),
      effectiveDate: this.extractDate(text, /effective\s*:?\s*([^\n]+)/i),
      expirationDate: this.extractDate(text, /expir\w*\s*:?\s*([^\n]+)/i),
      claims: this.extractList(text, /claims?\s*:?\s*([^\n]+(?:\n\s*-[^\n]+)*)/i),
      rawText: text,
    };
  }

  private extractTaxData(data: any) {
    const text = data.text || '';
    
    return {
      assessedValue: this.extractCurrency(text, /assessed\s*value\s*:?\s*\$?([0-9,]+)/i),
      taxYear: this.extractPattern(text, /tax\s*year\s*:?\s*(\d{4})/i),
      propertyTax: this.extractCurrency(text, /property\s*tax\s*:?\s*\$?([0-9,]+)/i),
      taxRate: this.extractPattern(text, /tax\s*rate\s*:?\s*([\d.]+%?)/i),
      exemptions: this.extractList(text, /exemptions?\s*:?\s*([^\n]+(?:\n\s*-[^\n]+)*)/i),
      rawText: text,
    };
  }

  private extractZillowData(data: any) {
    // Zillow data is usually already structured
    return {
      zestimate: data.zestimate || null,
      rentZestimate: data.rentZestimate || null,
      taxAssessment: data.taxAssessment || null,
      lastSoldDate: data.lastSoldDate || null,
      lastSoldPrice: data.lastSoldPrice || null,
      propertyDetails: data.propertyDetails || {},
      comparables: data.comparables || [],
      rawData: data,
    };
  }

  private async storeProcessedData(document: RawDocument, processedData: any) {
    // Store processed data in appropriate domain tables based on document type
    // This would involve creating or updating records in specific tables
    // For now, we're storing everything in the extractedText JSON field
  }

  private async verifyDocumentAccess(documentId: string, userId: string): Promise<RawDocument> {
    const document = await this.prisma.rawDocument.findUnique({
      where: { id: documentId },
      include: {
        property: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.property && document.property.userId !== userId) {
      // Check if user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'ADMIN') {
        throw new NotFoundException('Document not found');
      }
    }

    return document;
  }

  private async downloadFile(fileUrl: string): Promise<Buffer> {
    // Download file from Supabase storage or external URL
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private extractPattern(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  private extractDate(text: string, pattern: RegExp): Date | null {
    const match = this.extractPattern(text, pattern);
    if (!match) return null;
    
    const date = new Date(match);
    return isNaN(date.getTime()) ? null : date;
  }

  private extractCurrency(text: string, pattern: RegExp): number | null {
    const match = this.extractPattern(text, pattern);
    if (!match) return null;
    
    const value = parseFloat(match.replace(/,/g, ''));
    return isNaN(value) ? null : value;
  }

  private extractList(text: string, pattern: RegExp): string[] {
    const matches = text.match(pattern);
    return matches ? matches.map(match => match.trim()) : [];
  }

  // Additional methods needed by the controller
  async getUserJobs(userId: string, status?: string, page: number = 1, limit: number = 20): Promise<any> {
    // Mock implementation
    return {
      jobs: [
        {
          id: 'job-1',
          documentId: 'doc-1',
          status: 'completed',
          progress: 100,
          createdAt: new Date(),
        },
      ],
      total: 1,
      page,
      limit,
    };
  }

  async cancelJob(userId: string, jobId: string): Promise<any> {
    // Mock implementation
    console.log(`Cancelling job ${jobId} for user ${userId}`);
    return {
      id: jobId,
      status: 'cancelled',
      message: 'Job cancelled successfully',
    };
  }

  async retryJob(userId: string, jobId: string): Promise<any> {
    // Mock implementation
    console.log(`Retrying job ${jobId} for user ${userId}`);
    return {
      id: jobId,
      status: 'queued',
      message: 'Job queued for retry',
    };
  }

  async deleteJob(userId: string, jobId: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting job ${jobId} for user ${userId}`);
  }

  async getParsingStats(userId: string): Promise<any> {
    // Mock implementation
    return {
      totalDocuments: 10,
      parsedDocuments: 8,
      failedDocuments: 2,
      averageProcessingTime: 30,
      successRate: 80,
    };
  }
}
