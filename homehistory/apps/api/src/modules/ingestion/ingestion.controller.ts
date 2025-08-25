import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IngestionService } from './ingestion.service';
import { TriggerIngestionDto, IngestionStatusDto } from './dto';
import { User } from '@homehistory/database';

@ApiTags('ingestion')
@Controller('ingestion')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger data ingestion for a property' })
  async triggerIngestion(
    @CurrentUser() user: User,
    @Body() dto: TriggerIngestionDto,
  ): Promise<IngestionStatusDto> {
    return this.ingestionService.triggerIngestion(user.id, dto);
  }

  @Post('trigger/:propertyId')
  @ApiOperation({ summary: 'Trigger all data sources for a property' })
  async triggerAllSources(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ): Promise<IngestionStatusDto[]> {
    return this.ingestionService.triggerAllSourcesForProperty(user.id, propertyId);
  }

  @Get('status/:propertyId')
  @ApiOperation({ summary: 'Get ingestion status for a property' })
  async getIngestionStatus(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ): Promise<IngestionStatusDto[]> {
    return this.ingestionService.getIngestionStatus(user.id, propertyId);
  }

  @Get('history/:propertyId')
  @ApiOperation({ summary: 'Get ingestion history for a property' })
  async getIngestionHistory(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ) {
    return this.ingestionService.getIngestionHistory(user.id, propertyId);
  }
}
