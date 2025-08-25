import { 
  Controller, 
  Get, 
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
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { 
  UserResponseDto, 
  UserProfileDto,
} from './dto';
import { User } from '@homehistory/database';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserResponseDto })
  async getCurrentUserProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.getUserProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserResponseDto })
  async updateCurrentUserProfile(
    @CurrentUser() user: User,
    @Body() dto: Partial<UserProfileDto>,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateUserProfile(user.id, dto);
    return {
      id: updated.id,
      email: updated.email || '',
      firstName: (updated as any).firstName || undefined,
      lastName: (updated as any).lastName || undefined,
      role: String((updated as any).role || 'USER'),
      avatarUrl: (updated as any).avatarUrl || undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  async deleteCurrentUser(@CurrentUser() user: User): Promise<void> {
    await this.usersService.deleteUser(user.id);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get current user activity log' })
  @ApiResponse({ status: 200, description: 'User activity retrieved' })
  async getCurrentUserActivity(
    @CurrentUser() user: User,
    @Query() query: { page?: number; limit?: number; action?: string },
  ) {
    return this.usersService.getUserActivity(user.id, query);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved' })
  async getUserPreferences(@CurrentUser() user: User) {
    return this.usersService.getUserPreferences(user.id);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updateUserPreferences(
    @CurrentUser() user: User,
    @Body() dto: { preferences: any },
  ) {
    return this.usersService.updateUserPreferences(user.id, dto.preferences);
  }

  // Admin-only endpoints
  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @CurrentUser() user: User,
    @Query() query: any,
  ) {
    return this.usersService.getAllUsers(query);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved' })
  async getUserStats(@CurrentUser() user: User): Promise<any> {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })
  async getUserById(
    @CurrentUser() currentUser: User,
    @Param('id') userId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.getUserProfile(userId);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  async updateUserById(
    @CurrentUser() currentUser: User,
    @Param('id') userId: string,
    @Body() dto: Partial<UserProfileDto> & { role?: 'USER' | 'ADMIN' },
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateUserProfile(userId, dto, true);
    return {
      id: updated.id,
      email: updated.email || '',
      firstName: (updated as any).firstName || undefined,
      lastName: (updated as any).lastName || undefined,
      role: String((updated as any).role || 'USER'),
      avatarUrl: (updated as any).avatarUrl || undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async deleteUserById(
    @CurrentUser() currentUser: User,
    @Param('id') userId: string,
  ): Promise<void> {
    await this.usersService.deleteUser(userId);
  }

  @Put(':id/suspend')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Suspend user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  async suspendUser(
    @CurrentUser() currentUser: User,
    @Param('id') userId: string,
    @Body() dto: { reason?: string; duration?: number },
  ) {
    return this.usersService.suspendUser(userId, dto);
  }

  @Put(':id/unsuspend')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Unsuspend user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'User unsuspended successfully' })
  async unsuspendUser(
    @CurrentUser() currentUser: User,
    @Param('id') userId: string,
  ) {
    return this.usersService.unsuspendUser(userId);
  }

  @Get(':id/activity')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user activity log (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activity retrieved' })
  async getUserActivity(
    @CurrentUser() currentUser: User,
    @Param('id') userId: string,
    @Query() query: { page?: number; limit?: number; action?: string },
  ) {
    return this.usersService.getUserActivity(userId, query);
  }
}
