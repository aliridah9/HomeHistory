interface Server {
}
interface Socket {
    id: string;
    join: (room: string) => void;
    leave: (room: string) => void;
    emit: (event: string, data: any) => void;
    disconnect: () => void;
}
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto, NotificationQueryDto } from './dto';
export declare class NotificationsGateway {
    private readonly notificationsService;
    server: Server;
    private readonly logger;
    private connectedUsers;
    constructor(notificationsService: NotificationsService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleGetNotifications(query: NotificationQueryDto, client: Socket): Promise<void>;
    handleMarkAsRead(data: {
        notificationId: string;
    }, client: Socket): Promise<void>;
    handleMarkAllAsRead(/* @ConnectedSocket() */ client: Socket): Promise<void>;
    handleDismissNotification(data: {
        notificationId: string;
    }, client: Socket): Promise<void>;
    handleGetPreferences(/* @ConnectedSocket() */ client: Socket): Promise<void>;
    sendNotificationToUser(userId: string, notification: NotificationResponseDto): Promise<void>;
    sendNotificationToUsers(userIds: string[], notification: NotificationResponseDto): Promise<void>;
    broadcastSystemNotification(notification: NotificationResponseDto): Promise<void>;
    sendNotificationToRoom(room: string, notification: NotificationResponseDto): Promise<void>;
    private extractUserIdFromSocket;
    getConnectedUsersCount(): number;
    getConnectedUserIds(): string[];
    isUserConnected(userId: string): boolean;
}
export {};
//# sourceMappingURL=notifications.gateway.d.ts.map
