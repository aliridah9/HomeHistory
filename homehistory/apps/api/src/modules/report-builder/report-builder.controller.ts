import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@homehistory/database';
import { ReportBuilderService } from './report-builder.service';
import {
  CreateReportTemplateDto,
  UpdateReportTemplateDto,
  ReportTemplateResponseDto,
  ReportTemplateQueryDto,
  GenerateReportDto,
  UpdateReportDto,
  ReportGenerationResponseDto,
  ReportGenerationQueryDto,
  CreateReportScheduleDto,
  UpdateReportScheduleDto,
  ReportScheduleResponseDto,
  ReportScheduleQueryDto,
} from './dto';

@ApiTags('report-builder')
@Controller('report-builder')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportBuilderController {
  constructor(private readonly reportBuilderService: ReportBuilderService) {}

  @Post('templates')
  @ApiOperation({ summary: 'Create report template' })
  @ApiResponse({ status: 201, description: 'Report template created', type: ReportTemplateResponseDto })
  async createReportTemplate(
    @CurrentUser() user: User,
    @Body() dto: CreateReportTemplateDto,
  ): Promise<ReportTemplateResponseDto> {
    return this.reportBuilderService.createReportTemplate(user.id, dto);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get report template' })
  @ApiResponse({ status: 200, description: 'Report template retrieved', type: ReportTemplateResponseDto })
  async getReportTemplate(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ReportTemplateResponseDto> {
    return this.reportBuilderService.getReportTemplate(user.id, id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update report template' })
  @ApiResponse({ status: 200, description: 'Report template updated', type: ReportTemplateResponseDto })
  async updateReportTemplate(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateReportTemplateDto,
  ): Promise<ReportTemplateResponseDto> {
    return this.reportBuilderService.updateReportTemplate(user.id, id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete report template' })
  @ApiResponse({ status: 200, description: 'Report template deleted' })
  async deleteReportTemplate(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.reportBuilderService.deleteReportTemplate(user.id, id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get report templates' })
  @ApiResponse({ status: 200, description: 'Report templates retrieved', type: [ReportTemplateResponseDto] })
  async getReportTemplates(
    @CurrentUser() user: User,
    @Query() query: ReportTemplateQueryDto,
  ): Promise<ReportTemplateResponseDto[]> {
    return this.reportBuilderService.getReportTemplates(user.id, query);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate report' })
  @ApiResponse({ status: 201, description: 'Report generated', type: ReportGenerationResponseDto })
  async generateReport(
    @CurrentUser() user: User,
    @Body() dto: GenerateReportDto,
  ): Promise<any> {
    // Service expects (userId, propertyId, dto)
    return this.reportBuilderService.generateReport(user.id, (dto as any).propertyId, dto) as any;
  }

  @Get('generations/:id')
  @ApiOperation({ summary: 'Get report generation' })
  @ApiResponse({ status: 200, description: 'Report generation retrieved', type: ReportGenerationResponseDto })
  async getReportGeneration(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ReportGenerationResponseDto> {
    return this.reportBuilderService.getReportGeneration(user.id, id);
  }

  @Put('generations/:id')
  @ApiOperation({ summary: 'Update report generation' })
  @ApiResponse({ status: 200, description: 'Report generation updated', type: ReportGenerationResponseDto })
  async updateReportGeneration(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
  ): Promise<ReportGenerationResponseDto> {
    return this.reportBuilderService.updateReportGeneration(user.id, id, dto);
  }

  @Delete('generations/:id')
  @ApiOperation({ summary: 'Delete report generation' })
  @ApiResponse({ status: 200, description: 'Report generation deleted' })
  async deleteReportGeneration(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.reportBuilderService.deleteReportGeneration(user.id, id);
  }

  @Get('generations')
  @ApiOperation({ summary: 'Get report generations' })
  @ApiResponse({ status: 200, description: 'Report generations retrieved', type: [ReportGenerationResponseDto] })
  async getReportGenerations(
    @CurrentUser() user: User,
    @Query() query: ReportGenerationQueryDto,
  ): Promise<ReportGenerationResponseDto[]> {
    return this.reportBuilderService.getReportGenerations(user.id, query);
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Create report schedule' })
  @ApiResponse({ status: 201, description: 'Report schedule created', type: ReportScheduleResponseDto })
  async createReportSchedule(
    @CurrentUser() user: User,
    @Body() dto: CreateReportScheduleDto,
  ): Promise<ReportScheduleResponseDto> {
    return this.reportBuilderService.createReportSchedule(user.id, dto);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get report schedule' })
  @ApiResponse({ status: 200, description: 'Report schedule retrieved', type: ReportScheduleResponseDto })
  async getReportSchedule(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ReportScheduleResponseDto> {
    return this.reportBuilderService.getReportSchedule(user.id, id);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: 'Update report schedule' })
  @ApiResponse({ status: 200, description: 'Report schedule updated', type: ReportScheduleResponseDto })
  async updateReportSchedule(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateReportScheduleDto,
  ): Promise<ReportScheduleResponseDto> {
    return this.reportBuilderService.updateReportSchedule(user.id, id, dto);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Delete report schedule' })
  @ApiResponse({ status: 200, description: 'Report schedule deleted' })
  async deleteReportSchedule(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.reportBuilderService.deleteReportSchedule(user.id, id);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Get report schedules' })
  @ApiResponse({ status: 200, description: 'Report schedules retrieved', type: [ReportScheduleResponseDto] })
  async getReportSchedules(
    @CurrentUser() user: User,
    @Query() query: ReportScheduleQueryDto,
  ): Promise<ReportScheduleResponseDto[]> {
    return this.reportBuilderService.getReportSchedules(user.id, query);
  }
}
