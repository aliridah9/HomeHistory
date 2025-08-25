import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/dto';

export interface DocumentIngestionResult {
  success: boolean;
  documentId: string;
  message: string;
  errors?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentProcessingOptions {
  extractText?: boolean;
  generateEmbeddings?: boolean;
  analyzeContent?: boolean;
  validateFormat?: boolean;
  notifyUser?: boolean;
}

@Injectable()
export class DocumentIngestionService {
  private readonly logger = new Logger(DocumentIngestionService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async ingestDocument(
    fileUrl: string,
    fileType: string,
    userId: string,
    propertyId?: string,
    options: DocumentProcessingOptions = {},
  ): Promise<DocumentIngestionResult> {
    try {
      this.logger.log(`Starting document ingestion for file: ${fileUrl}`);

      // Validate file type
      if (!this.isValidFileType(fileType)) {
        throw new BadRequestException(`Unsupported file type: ${fileType}`);
      }

      // Create document record
      const document = await this.prisma.rawDocument.create({
        data: {
          type: fileType,
          source: 'upload',
          fileUrl,
          status: 'pending',
          propertyId,
        },
      });

      // Process document based on options
      const processingResults = await this.processDocument(document.id, options);

      // Update document status
      const finalStatus = processingResults.success ? 'verified' : 'pending';
      await this.prisma.rawDocument.update({
        where: { id: document.id },
        data: { status: finalStatus },
      });

      // Send notification if requested
      if (options.notifyUser) {
        await this.notificationsService.createNotification({
          userId,
          type: NotificationType.DOCUMENT_PROCESSED,
          title: 'Document Processed',
          message: `Your document has been ${processingResults.success ? 'successfully processed' : 'processed with issues'}`,
          entityId: document.id,
          entityType: 'document',
          metadata: {
            success: processingResults.success,
            errors: processingResults.errors,
          },
        });
      }

      return {
        success: processingResults.success,
        documentId: document.id,
        message: processingResults.success ? 'Document ingested successfully' : 'Document ingested with issues',
        errors: processingResults.errors,
        metadata: processingResults.metadata,
      };

    } catch (error) {
      this.logger.error(`Document ingestion failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processDocument(
    documentId: string,
    options: DocumentProcessingOptions,
  ): Promise<{ success: boolean; errors?: string[]; metadata?: Record<string, any> }> {
    const errors: string[] = [];
    const metadata: Record<string, any> = {};

    try {
      // Get document
      const document = await this.prisma.rawDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Extract text if requested
      if (options.extractText) {
        try {
          const extractedText = await this.extractTextFromDocument(document.fileUrl, document.type);
          metadata.extractedText = extractedText;
          metadata.textLength = extractedText.length;
        } catch (error) {
          errors.push(`Text extraction failed: ${error.message}`);
        }
      }

      // Generate embeddings if requested
      if (options.generateEmbeddings && metadata.extractedText) {
        try {
          const embeddings = await this.generateEmbeddings(metadata.extractedText);
          metadata.embeddingsGenerated = true;
          metadata.embeddingDimensions = embeddings.length;
        } catch (error) {
          errors.push(`Embedding generation failed: ${error.message}`);
        }
      }

      // Analyze content if requested
      if (options.analyzeContent && metadata.extractedText) {
        try {
          const analysis = await this.analyzeDocumentContent(metadata.extractedText);
          metadata.contentAnalysis = analysis;
        } catch (error) {
          errors.push(`Content analysis failed: ${error.message}`);
        }
      }

      // Validate format if requested
      if (options.validateFormat) {
        try {
          const validation = await this.validateDocumentFormat(document.fileUrl, document.type);
          metadata.formatValidation = validation;
        } catch (error) {
          errors.push(`Format validation failed: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        metadata,
      };

    } catch (error) {
      this.logger.error(`Document processing failed: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async bulkIngestDocuments(
    files: Array<{ fileUrl: string; fileType: string; propertyId?: string }>,
    userId: string,
    options: DocumentProcessingOptions = {},
  ): Promise<DocumentIngestionResult[]> {
    this.logger.log(`Starting bulk document ingestion for ${files.length} files`);

    const results: DocumentIngestionResult[] = [];

    for (const file of files) {
      try {
        const result = await this.ingestDocument(
          file.fileUrl,
          file.fileType,
          userId,
          file.propertyId,
          options,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to ingest file ${file.fileUrl}: ${error.message}`);
        results.push({
          success: false,
          documentId: '',
          message: `Failed to ingest file: ${error.message}`,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  async getIngestionStatus(documentId: string): Promise<{
    status: string;
    progress: number;
    message: string;
    metadata?: Record<string, any>;
  }> {
    const document = await this.prisma.rawDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

          return {
        status: document.status,
        progress: this.calculateProgress(document.status),
        message: this.getStatusMessage(document.status),
        // metadata: document.metadata as Record<string, any>, // Removed - metadata field doesn't exist
      };
  }

  private isValidFileType(fileType: string): boolean {
    const supportedTypes = [
      'pdf', 'doc', 'docx', 'txt', 'rtf',
      'jpg', 'jpeg', 'png', 'gif', 'bmp',
      'csv', 'xls', 'xlsx', 'json', 'xml',
    ];
    return supportedTypes.includes(fileType.toLowerCase());
  }

  private async extractTextFromDocument(fileUrl: string, fileType: string): Promise<string> {
    // Mock implementation - in production, this would use OCR or text extraction libraries
    this.logger.log(`Extracting text from ${fileType} document: ${fileUrl}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `Extracted text from ${fileType} document. This is a mock implementation.`;
  }

  private async generateEmbeddings(text: string): Promise<number[]> {
    // Mock implementation - in production, this would use OpenAI embeddings or similar
    this.logger.log('Generating embeddings for text');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock embeddings (1536 dimensions like OpenAI)
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }

  private async analyzeDocumentContent(text: string): Promise<Record<string, any>> {
    // Mock implementation - in production, this would use AI analysis
    this.logger.log('Analyzing document content');
    
    return {
      wordCount: text.split(' ').length,
      characterCount: text.length,
      estimatedReadingTime: Math.ceil(text.length / 200), // 200 chars per minute
      language: 'en',
      sentiment: 'neutral',
      keyTopics: ['document', 'analysis', 'mock'],
    };
  }

  private async validateDocumentFormat(fileUrl: string, fileType: string): Promise<Record<string, any>> {
    // Mock implementation - in production, this would validate file format
    this.logger.log(`Validating format for ${fileType} document`);
    
    return {
      isValid: true,
      format: fileType,
      size: Math.random() * 1000000, // Mock file size
      checksum: 'mock-checksum',
    };
  }

  private calculateProgress(status: string): number {
    const progressMap: Record<string, number> = {
      pending: 0,
      processing: 50,
      verified: 100,
      published: 100,
    };
    return progressMap[status] || 0;
  }

  private getStatusMessage(status: string): string {
    const messageMap: Record<string, string> = {
      pending: 'Document is pending processing',
      processing: 'Document is being processed',
      verified: 'Document has been verified and processed',
      published: 'Document has been published',
    };
    return messageMap[status] || 'Unknown status';
  }
}
