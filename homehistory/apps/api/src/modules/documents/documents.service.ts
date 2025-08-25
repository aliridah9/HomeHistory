import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { Express } from 'express';
import { 
  CreateDocumentDto, 
  UpdateDocumentDto, 
  DocumentResponseDto,
  UploadDocumentDto,
  DocumentsQueryDto,
  BulkUploadResponseDto
} from './dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async createDocument(userId: string, createDocumentDto: CreateDocumentDto): Promise<DocumentResponseDto> {
    const document = await this.prisma.rawDocument.create({
      data: {
        type: createDocumentDto.fileType || 'document',
        source: 'upload',
        fileUrl: createDocumentDto.fileUrl,
        status: 'pending',
      },
    });

    return this.mapToResponseDto(document);
  }

  async getDocuments(userId: string, page = 1, limit = 20): Promise<DocumentResponseDto[]> {
    const skip = (page - 1) * limit;
    
    const documents = await this.prisma.rawDocument.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(doc => this.mapToResponseDto(doc));
  }

  async getDocument(userId: string, documentId: string): Promise<DocumentResponseDto> {
    const document = await this.prisma.rawDocument.findFirst({
      where: {
        id: documentId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.mapToResponseDto(document);
  }

  async updateDocument(userId: string, documentId: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentResponseDto> {
    const document = await this.prisma.rawDocument.findFirst({
      where: {
        id: documentId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updatedDocument = await this.prisma.rawDocument.update({
      where: { id: documentId },
      data: {
        ...updateDocumentDto,
        status: updateDocumentDto.status as any,
      },
    });

    return this.mapToResponseDto(updatedDocument);
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const document = await this.prisma.rawDocument.findFirst({
      where: {
        id: documentId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.rawDocument.delete({
      where: { id: documentId },
    });
  }

  async uploadDocument(userId: string, file: any, dto: UploadDocumentDto): Promise<DocumentResponseDto> {
    // Implementation for file upload
    const createDto: CreateDocumentDto = {
      title: dto.title || file.originalname,
      description: dto.description,
      fileUrl: file.path, // Assuming file.path contains the uploaded file path
      fileType: file.mimetype,
      fileSize: file.size,
      status: 'PENDING',
      metadata: { originalName: file.originalname, ...dto }
    };

    return this.createDocument(userId, createDto);
  }

  async uploadDocuments(userId: string, files: any[], dto: UploadDocumentDto): Promise<BulkUploadResponseDto> {
    const results = await Promise.allSettled(
      files.map(file => this.uploadDocument(userId, file, dto))
    );

    const successfulUploads = results.filter(r => r.status === 'fulfilled').length;
    const failedUploads = results.filter(r => r.status === 'rejected').length;
    const uploadedDocumentIds = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<DocumentResponseDto>).value.id);
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason.message);

    return {
      totalFiles: files.length,
      successfulUploads,
      failedUploads,
      uploadedDocumentIds,
      errors,
      processingTimeMs: 0 // Would calculate actual time
    };
  }

  async getDocumentStats(userId: string): Promise<any> {
    const totalDocuments = await this.prisma.rawDocument.count();
    const pendingDocuments = await this.prisma.rawDocument.count({ 
      where: { status: 'pending' } 
    });
    const processedDocuments = await this.prisma.rawDocument.count({ 
      where: { status: 'verified' } 
    });

    return {
      totalDocuments,
      pendingDocuments,
      processedDocuments,
      processingRate: totalDocuments > 0 ? (processedDocuments / totalDocuments) * 100 : 0
    };
  }

  async downloadDocument(userId: string, documentId: string, res: any): Promise<void> {
    const document = await this.getDocument(userId, documentId);
    // Implementation for file download
    res.download(document.fileUrl);
  }

  async getDocumentPreview(userId: string, documentId: string, size: string): Promise<any> {
    const document = await this.getDocument(userId, documentId);
    // Implementation for document preview
    return { previewUrl: document.fileUrl, size };
  }

  async generateShareLink(userId: string, documentId: string, dto: any): Promise<any> {
    const document = await this.getDocument(userId, documentId);
    // Implementation for share link generation
    return { shareLink: `https://example.com/share/${documentId}`, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  }

  async addTags(userId: string, documentId: string, tags: string[]): Promise<DocumentResponseDto> {
    const document = await this.getDocument(userId, documentId);
    // RawDocument doesn't support metadata/tags, so we'll just return the document
    return this.mapToResponseDto(document);
  }

  async removeTags(userId: string, documentId: string, tags: string[]): Promise<DocumentResponseDto> {
    const document = await this.getDocument(userId, documentId);
    // RawDocument doesn't support metadata/tags, so we'll just return the document
    return this.mapToResponseDto(document);
  }

  async getPropertyDocuments(userId: string, propertyId: string, query: DocumentsQueryDto): Promise<DocumentResponseDto[]> {
    const documents = await this.prisma.rawDocument.findMany({
      where: { 
        propertyId,
      },
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
      take: query.limit ?? 20,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortOrder ?? 'desc' } as any : { createdAt: 'desc' }
    });

    return documents.map(doc => this.mapToResponseDto(doc));
  }

  async extractText(userId: string, documentId: string): Promise<any> {
    const document = await this.getDocument(userId, documentId);
    // Implementation for text extraction
    return { extractedText: 'Sample extracted text from document' };
  }

  async convertDocument(userId: string, documentId: string, targetFormat: string): Promise<any> {
    const document = await this.getDocument(userId, documentId);
    // Implementation for document conversion
    return { convertedUrl: `https://example.com/converted/${documentId}.${targetFormat}` };
  }

  private mapToResponseDto(document: any): DocumentResponseDto {
    return {
      id: document.id,
      title: document.title,
      description: document.description,
      fileUrl: document.fileUrl,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
