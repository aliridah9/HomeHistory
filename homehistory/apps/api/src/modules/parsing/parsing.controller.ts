import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@homehistory/database';
import { ParsingService } from './parsing.service';
import { ParsingProcessor } from './parsing.processor';
import {
  ParseDocumentDto,
  ParseBatchDto,
  ParsingStatusDto,
} from './dto';

@ApiTags('Parsing')
@Controller('parsing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParsingController {
  constructor(
    private readonly parsingService: ParsingService,
    private readonly parsingProcessor: ParsingProcessor,
  ) {}

  @Post('parse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse a single document' })
  @ApiResponse({
    status: 200,
    description: 'Document parsing initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document data',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async parseDocument(
    @CurrentUser() user: User,
    @Body() parseDocumentDto: ParseDocumentDto,
  ) {
    return this.parsingService.parseDocument(user.id, parseDocumentDto);
  }

  @Post('parse/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse multiple documents in batch' })
  @ApiResponse({
    status: 200,
    description: 'Batch parsing initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid batch data',
  })
  async parseBatch(
    @CurrentUser() user: User,
    @Body() parseBatchDto: ParseBatchDto,
  ) {
    return this.parsingService.parseBatch(user.id, parseBatchDto);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Get parsing job status' })
  @ApiResponse({
    status: 200,
    description: 'Parsing status retrieved successfully',
    type: ParsingStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Parsing job not found',
  })
  async getParsingStatus(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ) {
    return this.parsingService.getParsingStatus(user.id, jobId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get user parsing jobs' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by job status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Parsing jobs retrieved successfully',
  })
  async getUserJobs(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.parsingService.getUserJobs(user.id, status, page, limit);
  }

  @Put('jobs/:jobId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a parsing job' })
  @ApiResponse({
    status: 200,
    description: 'Parsing job cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Parsing job not found',
  })
  async cancelJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ) {
    return this.parsingService.cancelJob(user.id, jobId);
  }

  @Put('jobs/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed parsing job' })
  @ApiResponse({
    status: 200,
    description: 'Parsing job retry initiated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Parsing job not found',
  })
  async retryJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ) {
    return this.parsingService.retryJob(user.id, jobId);
  }

  @Delete('jobs/:jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a parsing job' })
  @ApiResponse({
    status: 204,
    description: 'Parsing job deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Parsing job not found',
  })
  async deleteJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ) {
    await this.parsingService.deleteJob(user.id, jobId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get parsing statistics' })
  @ApiResponse({
    status: 200,
    description: 'Parsing statistics retrieved successfully',
  })
  async getParsingStats(@CurrentUser() user: User) {
    return this.parsingService.getParsingStats(user.id);
  }

  @Post('processor/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the parsing processor' })
  @ApiResponse({
    status: 200,
    description: 'Parsing processor started successfully',
  })
  async startProcessor() {
    return this.parsingProcessor.start();
  }

  @Post('processor/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop the parsing processor' })
  @ApiResponse({
    status: 200,
    description: 'Parsing processor stopped successfully',
  })
  async stopProcessor() {
    return this.parsingProcessor.stop();
  }

  @Get('processor/status')
  @ApiOperation({ summary: 'Get parsing processor status' })
  @ApiResponse({
    status: 200,
    description: 'Processor status retrieved successfully',
  })
  async getProcessorStatus() {
    return this.parsingProcessor.getStatus();
  }

  @Post('processor/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check parsing processor health' })
  @ApiResponse({
    status: 200,
    description: 'Processor health check completed',
  })
  async healthCheck() {
    return this.parsingProcessor.healthCheck();
  }
}
