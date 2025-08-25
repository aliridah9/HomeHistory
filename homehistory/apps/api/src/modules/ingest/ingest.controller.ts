import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IngestService } from './ingest.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('ingest')
@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('scraped')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ingest scraped data from JSON files' })
  @ApiResponse({ status: 200, description: 'Data ingested successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async ingestScrapedData() {
    const result = await this.ingestService.ingestAllData();
    return {
      success: true,
      message: 'Data ingestion completed',
      ...result,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ingestion status and statistics' })
  @ApiResponse({ status: 200, description: 'Ingestion status retrieved' })
  async getIngestionStatus() {
    const stats = await this.ingestService.getIngestionStats();
    return {
      success: true,
      stats,
    };
  }
}
