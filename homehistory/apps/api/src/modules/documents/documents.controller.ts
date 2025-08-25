import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  StreamableFile,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import type { Express, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { 
  UploadDocumentDto, 
  DocumentResponseDto, 
  DocumentsQueryDto,
  BulkUploadResponseDto 
} from './dto';
import { User } from '@homehistory/database';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully', type: DocumentResponseDto })
  async uploadDocument(
    @CurrentUser() user: User,
    @UploadedFile() file: any,
    @Body() dto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(user.id, file, dto);
  }

  @Post('upload/bulk')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple documents' })
  @ApiResponse({ status: 201, description: 'Documents uploaded successfully', type: BulkUploadResponseDto })
  async uploadDocuments(
    @CurrentUser() user: User,
    @UploadedFiles() files: any[],
    @Body() dto: { propertyId?: string; documentType?: string },
  ): Promise<BulkUploadResponseDto> {
    return this.documentsService.uploadDocuments(user.id, files, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get documents with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getDocuments(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.documentsService.getDocuments(user.id, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get document statistics' })
  @ApiResponse({ status: 200, description: 'Document statistics retrieved' })
  async getDocumentStats(@CurrentUser() user: User) {
    return this.documentsService.getDocumentStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully', type: DocumentResponseDto })
  async getDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.getDocument(user.id, documentId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({ status: 200, description: 'Document file downloaded' })
  async downloadDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.documentsService.downloadDocument(user.id, documentId, res);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get document preview/thumbnail' })
  @ApiResponse({ status: 200, description: 'Document preview generated' })
  async getDocumentPreview(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Query('size') size?: 'small' | 'medium' | 'large',
  ) {
    return this.documentsService.getDocumentPreview(user.id, documentId, size ?? 'small');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  async deleteDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
  ): Promise<void> {
    await this.documentsService.deleteDocument(user.id, documentId);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate shareable link for document' })
  @ApiResponse({ status: 200, description: 'Share link generated' })
  async shareDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Body() dto: { expiresIn?: number; password?: string },
  ) {
    return this.documentsService.generateShareLink(user.id, documentId, dto);
  }

  @Post(':id/tag')
  @ApiOperation({ summary: 'Add tags to document' })
  @ApiResponse({ status: 200, description: 'Tags added successfully' })
  async tagDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Body() dto: { tags: string[] },
  ) {
    return this.documentsService.addTags(user.id, documentId, dto.tags);
  }

  @Delete(':id/tag')
  @ApiOperation({ summary: 'Remove tags from document' })
  @ApiResponse({ status: 200, description: 'Tags removed successfully' })
  async untagDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Body() dto: { tags: string[] },
  ) {
    return this.documentsService.removeTags(user.id, documentId, dto.tags);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get documents for specific property' })
  @ApiResponse({ status: 200, description: 'Property documents retrieved' })
  async getPropertyDocuments(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Query() query: DocumentsQueryDto,
  ) {
    return this.documentsService.getPropertyDocuments(user.id, propertyId, query);
  }

  @Post('ocr/:id')
  @ApiOperation({ summary: 'Extract text from document using OCR' })
  @ApiResponse({ status: 200, description: 'OCR processing initiated' })
  async extractText(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
  ) {
    return this.documentsService.extractText(user.id, documentId);
  }

  @Post('convert/:id')
  @ApiOperation({ summary: 'Convert document to different format' })
  @ApiResponse({ status: 200, description: 'Document conversion initiated' })
  async convertDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Body() dto: { targetFormat: 'pdf' | 'png' | 'jpg' | 'docx' },
  ) {
    return this.documentsService.convertDocument(user.id, documentId, dto.targetFormat);
  }
}
