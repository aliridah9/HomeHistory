import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ValidationService } from './validation.service';
import { ValidateDocumentDto, BulkValidationDto, PendingDocumentsQueryDto } from './dto';
import { User } from '@homehistory/database';

@ApiTags('validation')
@Controller('validation')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List pending documents for validation' })
  async getPendingDocuments(
    @CurrentUser() user: User,
    @Query() query: PendingDocumentsQueryDto,
  ) {
    return this.validationService.getPendingDocuments(query);
  }

  @Get('document/:id')
  @ApiOperation({ summary: 'Get document details for validation' })
  async getDocumentForValidation(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
  ) {
    return this.validationService.getDocumentForValidation(documentId);
  }

  @Post('approve/:id')
  @ApiOperation({ summary: 'Approve a document' })
  async approveDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Body() dto: ValidateDocumentDto,
  ) {
    return this.validationService.approveDocument(user.id, documentId, dto);
  }

  @Post('reject/:id')
  @ApiOperation({ summary: 'Reject a document' })
  async rejectDocument(
    @CurrentUser() user: User,
    @Param('id') documentId: string,
    @Body() dto: ValidateDocumentDto,
  ) {
    return this.validationService.rejectDocument(user.id, documentId, dto);
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk validation actions' })
  async bulkValidation(
    @CurrentUser() user: User,
    @Body() dto: BulkValidationDto,
  ) {
    return this.validationService.bulkValidation(user.id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get validation queue statistics' })
  async getValidationStats(@CurrentUser() user: User) {
    return this.validationService.getValidationStats();
  }
}
