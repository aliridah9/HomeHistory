export declare enum NotificationType {
    PROPERTY_UPDATE = "property_update",
    DOCUMENT_PROCESSED = "document_processed",
    SEARCH_RESULT = "search_result",
    SYSTEM_ALERT = "system_alert",
    MAINTENANCE_REMINDER = "maintenance_reminder"
}
export declare enum NotificationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
    entityId?: string;
    entityType?: string;
}
export declare class UpdateNotificationDto {
    read?: boolean;
    dismissed?: boolean;
}
export declare class NotificationResponseDto {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    read: boolean;
    dismissed: boolean;
    metadata?: Record<string, any>;
    entityId?: string;
    entityType?: string;
    createdAt: Date;
    readAt?: Date;
}
export declare class NotificationQueryDto {
    page?: number;
    limit?: number;
    read?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
}
//# sourceMappingURL=notification.dto.d.ts.map
