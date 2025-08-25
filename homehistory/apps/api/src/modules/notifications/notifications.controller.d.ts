import { NotificationsService } from './notifications.service';
import { NotificationResponseDto, NotificationQueryDto, NotificationPreferenceDto } from './dto';
import { User } from '@homehistory/database';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: User, query: NotificationQueryDto): Promise<{
        notifications: NotificationResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUnreadCount(user: User): Promise<number>;
    getNotificationPreferences(user: User): Promise<NotificationPreferenceDto>;
    updateNotificationPreferences(user: User, dto: NotificationPreferenceDto): Promise<NotificationPreferenceDto>;
    getNotification(user: User, notificationId: string): Promise<NotificationResponseDto>;
    markAsRead(user: User, notificationId: string): Promise<void>;
    markAllAsRead(user: User): Promise<void>;
    deleteNotification(user: User, notificationId: string): Promise<void>;
    deleteAllRead(user: User): Promise<void>;
    sendTestNotification(user: User, dto: {
        type: 'email' | 'push' | 'in_app';
        message?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    subscribeToPush(user: User, dto: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
        userAgent?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    unsubscribeFromPush(user: User, dto: {
        endpoint: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getAvailableTemplates(user: User): Promise<never[]>;
    scheduleNotification(user: User, dto: {
        type: string;
        scheduledFor: Date;
        data: any;
        channels: ('email' | 'push' | 'in_app')[];
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=notifications.controller.d.ts.map
