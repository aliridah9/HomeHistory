import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ValidateDocumentDto, BulkValidationDto, PendingDocumentsQueryDto } from './dto';
import { RawDocument, ReportStatus } from '@homehistory/database';

@Injectable()
export class ValidationService {
  constructor(private prisma: PrismaService) {}

  async getPendingDocuments(query: PendingDocumentsQueryDto) {
    const { page = 1, limit = 20, source, type, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: ReportStatus.pending,
    };

    if (source) {
      whereClause.source = source;
    }

    if (type) {
      whereClause.type = type;
    }

    const [documents, total] = await Promise.all([
      this.prisma.rawDocument.findMany({
        where: whereClause,
        include: {
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              state: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.rawDocument.count({ where: whereClause }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDocumentForValidation(documentId: string) {
    const document = await this.prisma.rawDocument.findUnique({
      where: { id: documentId },
      include: {
        property: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Get validation history for this document
    const validationHistory = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'raw_document',
        entityId: documentId,
        action: { in: ['document_approved', 'document_rejected', 'document_validated'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      document,
      validationHistory,
    };
  }

  async approveDocument(adminId: string, documentId: string, dto: ValidateDocumentDto) {
    const document = await this.getDocumentById(documentId);

    // Update document status
    const updatedDocument = await this.prisma.rawDocument.update({
      where: { id: documentId },
      data: {
        status: ReportStatus.verified,
        updatedAt: new Date(),
      },
    });

    // Log the approval
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'document_approved',
        entityType: 'raw_document',
        entityId: documentId,
        metadata: {
          notes: dto.notes,
          previousStatus: document.status,
          propertyId: document.propertyId,
        },
      },
    });

    // Trigger parsing if not already parsed
    if (!document.extractedText) {
      // Queue for parsing
      // This would integrate with the parsing module
    }

    return {
      document: updatedDocument,
      message: 'Document approved successfully',
    };
  }

  async rejectDocument(adminId: string, documentId: string, dto: ValidateDocumentDto) {
    const document = await this.getDocumentById(documentId);

    // Update document status
    const updatedDocument = await this.prisma.rawDocument.update({
      where: { id: documentId },
      data: {
        status: ReportStatus.pending, // Keep as pending or create a 'rejected' status
        extractedText: {
          // ...document.extractedText,
          rejectionReason: dto.notes,
          rejectedAt: new Date(),
          rejectedBy: adminId,
        },
        updatedAt: new Date(),
      },
    });

    // Log the rejection
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'document_rejected',
        entityType: 'raw_document',
        entityId: documentId,
        metadata: {
          notes: dto.notes,
          previousStatus: document.status,
          propertyId: document.propertyId,
          reason: dto.rejectionReason,
        },
      },
    });

    return {
      document: updatedDocument,
      message: 'Document rejected',
    };
  }

  async bulkValidation(adminId: string, dto: BulkValidationDto) {
    const results = [];

    for (const documentId of dto.documentIds) {
      try {
        let result;
        if (dto.action === 'approve') {
          result = await this.approveDocument(adminId, documentId, {
            notes: dto.notes || 'Bulk approval',
          });
        } else if (dto.action === 'reject') {
          result = await this.rejectDocument(adminId, documentId, {
            notes: dto.notes || 'Bulk rejection',
            rejectionReason: dto.rejectionReason,
          });
        }
        
        results.push({
          documentId,
          status: 'success',
          result,
        });
      } catch (error) {
        results.push({
          documentId,
          status: 'error',
          error: error.message,
        });
      }
    }

    // Log bulk action
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'bulk_validation',
        entityType: 'raw_document',
        entityId: 'bulk',
        metadata: {
          action: dto.action,
          documentCount: dto.documentIds.length,
          successCount: results.filter(r => r.status === 'success').length,
          errorCount: results.filter(r => r.status === 'error').length,
          notes: dto.notes,
        },
      },
    });

    return {
      results,
      summary: {
        total: dto.documentIds.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
      },
    };
  }

  async getValidationStats() {
    const [pending, verified, totalToday, avgProcessingTime] = await Promise.all([
      // Pending documents count
      this.prisma.rawDocument.count({
        where: { status: ReportStatus.pending },
      }),

      // Verified documents count (last 30 days)
      this.prisma.rawDocument.count({
        where: {
          status: ReportStatus.verified,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Documents processed today
      this.prisma.auditLog.count({
        where: {
          action: { in: ['document_approved', 'document_rejected'] },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Average processing time (simplified calculation)
      this.calculateAverageProcessingTime(),
    ]);

    // Get queue breakdown by source
    const queueBySource = await this.prisma.rawDocument.groupBy({
      by: ['source'],
      where: { status: ReportStatus.pending },
      _count: { source: true },
    });

    // Get queue breakdown by type
    const queueByType = await this.prisma.rawDocument.groupBy({
      by: ['type'],
      where: { status: ReportStatus.pending },
      _count: { type: true },
    });

    return {
      counts: {
        pending,
        verified,
        processedToday: totalToday,
      },
      averageProcessingTimeHours: avgProcessingTime,
      queueBreakdown: {
        bySource: queueBySource.map(item => ({
          source: item.source,
          count: item._count.source,
        })),
        byType: queueByType.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
      },
    };
  }

  private async getDocumentById(documentId: string): Promise<RawDocument> {
    const document = await this.prisma.rawDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private async calculateAverageProcessingTime(): Promise<number> {
    // Simplified calculation - in production you'd want more sophisticated metrics
    const recentValidations = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['document_approved', 'document_rejected'] },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      take: 100,
    });

    if (recentValidations.length === 0) return 0;

    // This is a simplified calculation
    // In practice, you'd track when documents entered the queue vs when they were validated
    return 24; // Placeholder: 24 hours average
  }
}
