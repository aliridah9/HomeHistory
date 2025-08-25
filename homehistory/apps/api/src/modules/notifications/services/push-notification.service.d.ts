export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}
export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: Record<string, any>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
}
export declare class PushNotificationService {
    private readonly logger;
    private subscriptions;
    subscribeToPush(userId: string, subscription: PushSubscription): Promise<boolean>;
    unsubscribeFromPush(userId: string, endpoint: string): Promise<boolean>;
    sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<boolean>;
    sendBulkPushNotification(userIds: string[], payload: PushNotificationPayload): Promise<{
        success: number;
        failed: number;
    }>;
    sendPushNotificationToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean>;
    subscribeToTopic(userId: string, topic: string): Promise<boolean>;
    unsubscribeFromTopic(userId: string, topic: string): Promise<boolean>;
    getPushStats(): Promise<{
        totalSubscriptions: number;
        activeSubscriptions: number;
        sentToday: number;
        sentThisWeek: number;
        sentThisMonth: number;
    }>;
    validateSubscription(subscription: PushSubscription): Promise<boolean>;
}
//# sourceMappingURL=push-notification.service.d.ts.map
