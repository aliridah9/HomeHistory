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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MaintenanceService } from './maintenance.service';
import { 
  CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  MaintenanceTaskQueryDto,
  MaintenanceTaskResponseDto 
} from './dto';
import { User } from '@homehistory/database';

@ApiTags('maintenance')
@Controller('maintenance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create maintenance record' })
  @ApiResponse({ status: 201, description: 'Maintenance record created', type: MaintenanceTaskResponseDto })
  async createMaintenance(
    @CurrentUser() user: User,
    @Body() dto: CreateMaintenanceTaskDto,
  ): Promise<MaintenanceTaskResponseDto> {
    return this.maintenanceService.createMaintenance(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get maintenance records with filtering' })
  @ApiResponse({ status: 200, description: 'Maintenance records retrieved' })
  async getMaintenance(
    @CurrentUser() user: User,
    @Query() query: MaintenanceTaskQueryDto,
  ) {
    return this.maintenanceService.getMaintenance(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get maintenance statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved', type: Object })
  async getMaintenanceStats(@CurrentUser() user: User): Promise<any> {
    return this.maintenanceService.getMaintenanceStats(user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming maintenance tasks' })
  @ApiResponse({ status: 200, description: 'Upcoming maintenance retrieved' })
  async getUpcomingMaintenance(@CurrentUser() user: User) {
    return this.maintenanceService.getUpcomingMaintenance(user.id);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue maintenance tasks' })
  @ApiResponse({ status: 200, description: 'Overdue maintenance retrieved' })
  async getOverdueMaintenance(@CurrentUser() user: User) {
    return this.maintenanceService.getOverdueMaintenance(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance record by ID' })
  @ApiResponse({ status: 200, description: 'Maintenance record retrieved', type: MaintenanceTaskResponseDto })
  async getMaintenanceById(
    @CurrentUser() user: User,
    @Param('id') maintenanceId: string,
  ): Promise<MaintenanceTaskResponseDto> {
    return this.maintenanceService.getMaintenanceById(user.id, maintenanceId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update maintenance record' })
  @ApiResponse({ status: 200, description: 'Maintenance record updated', type: MaintenanceTaskResponseDto })
  async updateMaintenance(
    @CurrentUser() user: User,
    @Param('id') maintenanceId: string,
    @Body() dto: UpdateMaintenanceTaskDto,
  ): Promise<MaintenanceTaskResponseDto> {
    return this.maintenanceService.updateMaintenance(user.id, maintenanceId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete maintenance record' })
  @ApiResponse({ status: 204, description: 'Maintenance record deleted' })
  async deleteMaintenance(
    @CurrentUser() user: User,
    @Param('id') maintenanceId: string,
  ): Promise<void> {
    await this.maintenanceService.deleteMaintenance(user.id, maintenanceId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark maintenance as completed' })
  @ApiResponse({ status: 200, description: 'Maintenance marked as completed' })
  async completeMaintenance(
    @CurrentUser() user: User,
    @Param('id') maintenanceId: string,
    @Body() dto: { notes?: string; cost?: number; completedBy?: string },
  ) {
    return this.maintenanceService.completeMaintenance(user.id, maintenanceId, dto);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule maintenance task' })
  @ApiResponse({ status: 200, description: 'Maintenance scheduled' })
  async scheduleMaintenance(
    @CurrentUser() user: User,
    @Param('id') maintenanceId: string,
    @Body() dto: { scheduledDate: Date; notes?: string },
  ) {
    return this.maintenanceService.scheduleMaintenance(user.id, maintenanceId, dto);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get maintenance records for specific property' })
  @ApiResponse({ status: 200, description: 'Property maintenance records retrieved' })
  async getPropertyMaintenance(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Query() query: MaintenanceTaskQueryDto,
  ) {
    return this.maintenanceService.getPropertyMaintenance(user.id, propertyId, query);
  }

  @Post('bulk-schedule')
  @ApiOperation({ summary: 'Schedule recurring maintenance for multiple properties' })
  @ApiResponse({ status: 200, description: 'Bulk maintenance scheduled' })
  async bulkScheduleMaintenance(
    @CurrentUser() user: User,
    @Body() dto: { 
      propertyIds: string[]; 
      maintenanceType: string;
      frequency: 'monthly' | 'quarterly' | 'annually';
      startDate: Date;
    },
  ) {
    return this.maintenanceService.bulkScheduleMaintenance(user.id, dto);
  }
}
