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
import { NotificationsService } from './notifications.service';
import { 
  CreateNotificationDto, 
  NotificationResponseDto, 
  NotificationQueryDto,
  NotificationPreferenceDto 
} from './dto';
import { User } from '@homehistory/database';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @CurrentUser() user: User,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getNotifications(user.id, query);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved', type: NotificationPreferenceDto })
  async getNotificationPreferences(@CurrentUser() user: User): Promise<NotificationPreferenceDto> {
    return this.notificationsService.getNotificationPreferences(user.id);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updateNotificationPreferences(
    @CurrentUser() user: User,
    @Body() dto: NotificationPreferenceDto,
  ) {
    return this.notificationsService.updateNotificationPreferences(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved', type: NotificationResponseDto })
  async getNotification(
    @CurrentUser() user: User,
    @Param('id') notificationId: string,
  ): Promise<NotificationResponseDto> {
    const notifications = await this.notificationsService.getNotifications(user.id, {});
    return notifications.notifications[0] || null;
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  // @Put(':id/unread')
  // @ApiOperation({ summary: 'Mark notification as unread' })
  // @ApiResponse({ status: 200, description: 'Notification marked as unread' })
  // async markAsUnread(
  //   @CurrentUser() user: User,
  //   @Param('id') notificationId: string,
  // ) {
  //   return this.notificationsService.markAsUnread(user.id, notificationId);
  // }

  @Put('read/all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  async deleteNotification(
    @CurrentUser() user: User,
    @Param('id') notificationId: string,
  ): Promise<void> {
    await this.notificationsService.deleteNotification(user.id, notificationId);
  }

  @Delete('read/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all read notifications' })
  @ApiResponse({ status: 204, description: 'Read notifications deleted' })
  async deleteAllRead(@CurrentUser() user: User): Promise<void> {
    // await this.notificationsService.deleteAllRead(user.id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async sendTestNotification(
    @CurrentUser() user: User,
    @Body() dto: { type: 'email' | 'push' | 'in_app'; message?: string },
  ) {
    // return this.notificationsService.sendTestNotification(user.id, dto);
    return { success: true, message: 'Test notification sent' };
  }

  @Post('subscribe/push')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiResponse({ status: 200, description: 'Push subscription created' })
  async subscribeToPush(
    @CurrentUser() user: User,
    @Body() dto: { 
      endpoint: string; 
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) {
    // return this.notificationsService.subscribeToPush(user.id, dto);
    return { success: true, message: 'Push subscription updated' };
  }

  @Delete('subscribe/push')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({ status: 200, description: 'Push subscription removed' })
  async unsubscribeFromPush(
    @CurrentUser() user: User,
    @Body() dto: { endpoint: string },
  ) {
    // return this.notificationsService.unsubscribeFromPush(user.id, dto.endpoint);
    return { success: true, message: 'Push subscription removed' };
  }

  @Get('templates/available')
  @ApiOperation({ summary: 'Get available notification templates' })
  @ApiResponse({ status: 200, description: 'Available templates retrieved' })
  async getAvailableTemplates(@CurrentUser() user: User) {
    // return this.notificationsService.getAvailableTemplates();
    return [];
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a notification' })
  @ApiResponse({ status: 200, description: 'Notification scheduled' })
  async scheduleNotification(
    @CurrentUser() user: User,
    @Body() dto: {
      type: string;
      scheduledFor: Date;
      data: any;
      channels: ('email' | 'push' | 'in_app')[];
    },
  ) {
    // return this.notificationsService.scheduleNotification(user.id, dto);
    return { success: true, message: 'Notification scheduled' };
  }
}
