import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@homehistory/database';
import { ScoringService } from './scoring.service';
import {
  CreatePropertyScoreDto,
  UpdatePropertyScoreDto,
  PropertyScoreResponseDto,
  PropertyScoreQueryDto,
  CreateScoringCriteriaDto,
  UpdateScoringCriteriaDto,
  ScoringCriteriaResponseDto,
  CreateScoreCalculationDto,
  UpdateScoreCalculationDto,
  ScoreCalculationResponseDto,
} from './dto';

@ApiTags('scoring')
@Controller('scoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('property-scores')
  @ApiOperation({ summary: 'Create property score' })
  @ApiResponse({ status: 201, description: 'Property score created', type: PropertyScoreResponseDto })
  async createPropertyScore(
    @CurrentUser() user: User,
    @Body() dto: CreatePropertyScoreDto,
  ): Promise<PropertyScoreResponseDto> {
    return this.scoringService.createPropertyScore(user.id, dto);
  }

  @Get('property-scores/:propertyId')
  @ApiOperation({ summary: 'Get property score' })
  @ApiResponse({ status: 200, description: 'Property score retrieved', type: PropertyScoreResponseDto })
  async getPropertyScore(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ): Promise<PropertyScoreResponseDto> {
    return this.scoringService.getPropertyScore(user.id, propertyId);
  }

  @Put('property-scores/:id')
  @ApiOperation({ summary: 'Update property score' })
  @ApiResponse({ status: 200, description: 'Property score updated', type: PropertyScoreResponseDto })
  async updatePropertyScore(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyScoreDto,
  ): Promise<PropertyScoreResponseDto> {
    return this.scoringService.updatePropertyScore(user.id, id, dto);
  }

  @Delete('property-scores/:id')
  @ApiOperation({ summary: 'Delete property score' })
  @ApiResponse({ status: 200, description: 'Property score deleted' })
  async deletePropertyScore(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.scoringService.deletePropertyScore(user.id, id);
  }

  @Get('property-scores')
  @ApiOperation({ summary: 'Get property scores' })
  @ApiResponse({ status: 200, description: 'Property scores retrieved', type: [PropertyScoreResponseDto] })
  async getPropertyScores(
    @CurrentUser() user: User,
    @Query() query: PropertyScoreQueryDto,
  ): Promise<PropertyScoreResponseDto[]> {
    return this.scoringService.getPropertyScores(user.id, query);
  }

  @Post('criteria')
  @ApiOperation({ summary: 'Create scoring criteria' })
  @ApiResponse({ status: 201, description: 'Scoring criteria created', type: ScoringCriteriaResponseDto })
  async createScoringCriteria(
    @CurrentUser() user: User,
    @Body() dto: CreateScoringCriteriaDto,
  ): Promise<ScoringCriteriaResponseDto> {
    return this.scoringService.createScoringCriteria(user.id, dto);
  }

  @Get('criteria/:id')
  @ApiOperation({ summary: 'Get scoring criteria' })
  @ApiResponse({ status: 200, description: 'Scoring criteria retrieved', type: ScoringCriteriaResponseDto })
  async getScoringCriteria(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ScoringCriteriaResponseDto> {
    return this.scoringService.getScoringCriteria(user.id, id);
  }

  @Put('criteria/:id')
  @ApiOperation({ summary: 'Update scoring criteria' })
  @ApiResponse({ status: 200, description: 'Scoring criteria updated', type: ScoringCriteriaResponseDto })
  async updateScoringCriteria(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateScoringCriteriaDto,
  ): Promise<ScoringCriteriaResponseDto> {
    return this.scoringService.updateScoringCriteria(user.id, id, dto);
  }

  @Delete('criteria/:id')
  @ApiOperation({ summary: 'Delete scoring criteria' })
  @ApiResponse({ status: 200, description: 'Scoring criteria deleted' })
  async deleteScoringCriteria(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.scoringService.deleteScoringCriteria(user.id, id);
  }

  @Post('calculations')
  @ApiOperation({ summary: 'Create score calculation' })
  @ApiResponse({ status: 201, description: 'Score calculation created', type: ScoreCalculationResponseDto })
  async createScoreCalculation(
    @CurrentUser() user: User,
    @Body() dto: CreateScoreCalculationDto,
  ): Promise<ScoreCalculationResponseDto> {
    return this.scoringService.createScoreCalculation(user.id, dto);
  }

  @Get('calculations/:id')
  @ApiOperation({ summary: 'Get score calculation' })
  @ApiResponse({ status: 200, description: 'Score calculation retrieved', type: ScoreCalculationResponseDto })
  async getScoreCalculation(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<ScoreCalculationResponseDto> {
    return this.scoringService.getScoreCalculation(user.id, id);
  }

  @Put('calculations/:id')
  @ApiOperation({ summary: 'Update score calculation' })
  @ApiResponse({ status: 200, description: 'Score calculation updated', type: ScoreCalculationResponseDto })
  async updateScoreCalculation(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateScoreCalculationDto,
  ): Promise<ScoreCalculationResponseDto> {
    return this.scoringService.updateScoreCalculation(user.id, id, dto);
  }

  @Delete('calculations/:id')
  @ApiOperation({ summary: 'Delete score calculation' })
  @ApiResponse({ status: 200, description: 'Score calculation deleted' })
  async deleteScoreCalculation(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.scoringService.deleteScoreCalculation(user.id, id);
  }

  @Post('calculate/:propertyId')
  @ApiOperation({ summary: 'Calculate property score' })
  @ApiResponse({ status: 200, description: 'Property score calculated' })
  async calculatePropertyScore(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
  ): Promise<any> {
    return this.scoringService.calculatePropertyScoreById(user.id, propertyId);
  }
}
