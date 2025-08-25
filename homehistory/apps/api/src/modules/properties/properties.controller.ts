import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import { 
  CreatePropertyDto, 
  UpdatePropertyDto, 
  PropertyResponseDto, 
  PropertiesQueryDto,
  PropertyStatsDto 
} from './dto';
import { User } from '@homehistory/database';

@ApiTags('properties')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully', type: PropertyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid property data' })
  async createProperty(
    @CurrentUser() user: User,
    @Body() dto: CreatePropertyDto,
  ): Promise<PropertyResponseDto> {
    return this.propertiesService.createProperty(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user properties with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Properties retrieved successfully' })
  async getProperties(
    @CurrentUser() user: User,
    @Query() query: PropertiesQueryDto,
  ) {
    return this.propertiesService.getProperties(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get property portfolio statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: PropertyStatsDto })
  async getPropertyStats(@CurrentUser() user: User): Promise<PropertyStatsDto> {
    return this.propertiesService.getPropertyStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  @ApiResponse({ status: 200, description: 'Property retrieved successfully', type: PropertyResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async getProperty(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ): Promise<PropertyResponseDto> {
    return this.propertiesService.getProperty(user.id, propertyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update property' })
  @ApiResponse({ status: 200, description: 'Property updated successfully', type: PropertyResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async updateProperty(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Body() dto: UpdatePropertyDto,
  ): Promise<PropertyResponseDto> {
    return this.propertiesService.updateProperty(user.id, propertyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete property' })
  @ApiResponse({ status: 204, description: 'Property deleted successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async deleteProperty(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ): Promise<void> {
    await this.propertiesService.deleteProperty(user.id, propertyId);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Add property to favorites' })
  @ApiResponse({ status: 200, description: 'Property added to favorites' })
  async addToFavorites(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ) {
    return this.propertiesService.toggleFavorite(user.id, propertyId, true);
  }

  @Delete(':id/favorite')
  @ApiOperation({ summary: 'Remove property from favorites' })
  @ApiResponse({ status: 200, description: 'Property removed from favorites' })
  async removeFromFavorites(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ) {
    return this.propertiesService.toggleFavorite(user.id, propertyId, false);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get property timeline/history' })
  @ApiResponse({ status: 200, description: 'Property timeline retrieved successfully' })
  async getPropertyTimeline(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
  ) {
    return this.propertiesService.getPropertyTimeline(user.id, propertyId);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate shareable link for property' })
  @ApiResponse({ status: 200, description: 'Share link generated successfully' })
  async shareProperty(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Body() dto: { expiresIn?: number; permissions?: string[] },
  ) {
    return this.propertiesService.generateShareLink(user.id, propertyId, dto);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import properties from external source' })
  @ApiResponse({ status: 200, description: 'Properties import initiated' })
  async importProperties(
    @CurrentUser() user: User,
    @Body() dto: { source: string; data: any },
  ) {
    return this.propertiesService.importProperties(user.id, dto.source, dto.data);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export user properties' })
  @ApiResponse({ status: 200, description: 'Properties exported successfully' })
  async exportProperties(
    @CurrentUser() user: User,
    @Body() dto: { format: 'csv' | 'json' | 'pdf'; propertyIds?: string[] },
  ) {
    return this.propertiesService.exportProperties(user.id, dto.format, dto.propertyIds);
  }
}