import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationResponseDto, NotificationQueryDto, NotificationPreferenceDto, UpdateNotificationPreferenceDto, CreateNotificationTemplateDto, UpdateNotificationTemplateDto, NotificationTemplateDto } from './dto';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createNotification(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto>;
    getNotifications(userId: string, query: NotificationQueryDto): Promise<{
        notifications: NotificationResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getNotificationById(userId: string, notificationId: string): Promise<NotificationResponseDto>;
    updateNotification(userId: string, notificationId: string, updateNotificationDto: UpdateNotificationDto): Promise<NotificationResponseDto>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(userId: string, notificationId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    getNotificationPreferences(userId: string): Promise<NotificationPreferenceDto>;
    updateNotificationPreferences(userId: string, updatePreferenceDto: UpdateNotificationPreferenceDto): Promise<NotificationPreferenceDto>;
    createNotificationTemplate(createTemplateDto: CreateNotificationTemplateDto): Promise<NotificationTemplateDto>;
    getNotificationTemplates(): Promise<NotificationTemplateDto[]>;
    getNotificationTemplateById(templateId: string): Promise<NotificationTemplateDto>;
    updateNotificationTemplate(templateId: string, updateTemplateDto: UpdateNotificationTemplateDto): Promise<NotificationTemplateDto>;
    deleteNotificationTemplate(templateId: string): Promise<void>;
    sendBulkNotification(userIds: string[], createNotificationDto: Omit<CreateNotificationDto, 'userId'>): Promise<NotificationResponseDto[]>;
    private mapToResponseDto;
    private mapToPreferenceDto;
    private mapToTemplateDto;
}
//# sourceMappingURL=notifications.service.d.ts.map
