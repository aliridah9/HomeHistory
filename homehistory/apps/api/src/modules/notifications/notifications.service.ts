import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  NotificationResponseDto, 
  NotificationQueryDto,
  NotificationType,
  NotificationPriority,
  NotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  NotificationTemplateDto
} from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.logger.log(`Creating notification for user ${createNotificationDto.userId}`);

    const notification = await this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        priority: (createNotificationDto.priority as any) || (NotificationPriority.MEDIUM as any),
        metadata: createNotificationDto.metadata as any,
        entityId: createNotificationDto.entityId,
        entityType: createNotificationDto.entityType,
        read: false,
        dismissed: false,
      },
    });

    return this.mapToResponseDto(notification);
  }

  async getNotifications(userId: string, query: NotificationQueryDto): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, read, type, priority } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };

    if (read !== undefined) {
      whereClause.read = read;
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: whereClause }),
    ]);

    return {
      notifications: notifications.map(this.mapToResponseDto),
      total,
      page,
      limit,
    };
  }

  async getNotificationById(userId: string, notificationId: string): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.mapToResponseDto(notification);
  }

  async updateNotification(
    userId: string, 
    notificationId: string, 
    updateNotificationDto: UpdateNotificationDto
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updateData: any = {};

    if (updateNotificationDto.read !== undefined) {
      updateData.read = updateNotificationDto.read;
      if (updateNotificationDto.read) {
        updateData.readAt = new Date();
      }
    }

    if (updateNotificationDto.dismissed !== undefined) {
      updateData.dismissed = updateNotificationDto.dismissed;
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
    });

    return this.mapToResponseDto(updatedNotification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferenceDto> {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await this.prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          propertyUpdates: true,
          documentProcessing: true,
          searchResults: false,
          systemAlerts: true,
          maintenanceReminders: true,
          dailyDigest: false,
          weeklySummary: true,
        },
      });
    }

    return this.mapToPreferenceDto(preferences);
  }

  async updateNotificationPreferences(
    userId: string, 
    updatePreferenceDto: UpdateNotificationPreferenceDto
  ): Promise<NotificationPreferenceDto> {
    const preferences = await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: updatePreferenceDto,
      create: {
        userId,
        ...updatePreferenceDto,
        emailEnabled: updatePreferenceDto.emailEnabled ?? true,
        pushEnabled: updatePreferenceDto.pushEnabled ?? true,
        smsEnabled: updatePreferenceDto.smsEnabled ?? false,
        propertyUpdates: updatePreferenceDto.propertyUpdates ?? true,
        documentProcessing: updatePreferenceDto.documentProcessing ?? true,
        searchResults: updatePreferenceDto.searchResults ?? false,
        systemAlerts: updatePreferenceDto.systemAlerts ?? true,
        maintenanceReminders: updatePreferenceDto.maintenanceReminders ?? true,
        dailyDigest: updatePreferenceDto.dailyDigest ?? false,
        weeklySummary: updatePreferenceDto.weeklySummary ?? true,
      },
    });

    return this.mapToPreferenceDto(preferences);
  }

  async createNotificationTemplate(createTemplateDto: CreateNotificationTemplateDto): Promise<NotificationTemplateDto> {
    const template = await this.prisma.notificationTemplate.create({
      data: {
        name: createTemplateDto.name,
        description: createTemplateDto.description,
        type: createTemplateDto.type,
        emailSubject: createTemplateDto.emailSubject,
        emailBody: createTemplateDto.emailBody,
        pushTitle: createTemplateDto.pushTitle,
        pushBody: createTemplateDto.pushBody,
        smsMessage: createTemplateDto.smsMessage,
        variables: createTemplateDto.variables as any,
        active: createTemplateDto.active ?? true,
      },
    });

    return this.mapToTemplateDto(template);
  }

  async getNotificationTemplates(): Promise<NotificationTemplateDto[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return templates.map(this.mapToTemplateDto);
  }

  async getNotificationTemplateById(templateId: string): Promise<NotificationTemplateDto> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    return this.mapToTemplateDto(template);
  }

  async updateNotificationTemplate(
    templateId: string, 
    updateTemplateDto: UpdateNotificationTemplateDto
  ): Promise<NotificationTemplateDto> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    const updatedTemplate = await this.prisma.notificationTemplate.update({
      where: { id: templateId },
      data: updateTemplateDto,
    });

    return this.mapToTemplateDto(updatedTemplate);
  }

  async deleteNotificationTemplate(templateId: string): Promise<void> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    await this.prisma.notificationTemplate.delete({
      where: { id: templateId },
    });
  }

  async sendBulkNotification(
    userIds: string[], 
    createNotificationDto: Omit<CreateNotificationDto, 'userId'>
  ): Promise<NotificationResponseDto[]> {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.createNotification({
          ...createNotificationDto,
          userId,
        })
      )
    );

    return notifications;
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: notification.read,
      dismissed: notification.dismissed,
      metadata: notification.metadata,
      entityId: notification.entityId,
      entityType: notification.entityType,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  }

  private mapToPreferenceDto(preferences: any): NotificationPreferenceDto {
    return {
      userId: preferences.userId,
      emailEnabled: preferences.emailEnabled,
      pushEnabled: preferences.pushEnabled,
      smsEnabled: preferences.smsEnabled,
      propertyUpdates: preferences.propertyUpdates,
      documentProcessing: preferences.documentProcessing,
      searchResults: preferences.searchResults,
      systemAlerts: preferences.systemAlerts,
      maintenanceReminders: preferences.maintenanceReminders,
      dailyDigest: preferences.dailyDigest,
      weeklySummary: preferences.weeklySummary,
    };
  }

  private mapToTemplateDto(template: any): NotificationTemplateDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      pushTitle: template.pushTitle,
      pushBody: template.pushBody,
      smsMessage: template.smsMessage,
      variables: template.variables,
      active: template.active,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
