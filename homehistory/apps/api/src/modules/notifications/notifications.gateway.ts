// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   OnGatewayInit,
//   MessageBody,
//   ConnectedSocket,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

// Mock interfaces for now
interface Server {}
interface Socket {
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  disconnect: () => void;
}
import { Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto, NotificationQueryDto } from './dto';

// @WebSocketGateway({
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   },
//   namespace: '/notifications',
// })
// @UseGuards(JwtAuthGuard)
export class NotificationsGateway {
  // @WebSocketServer()
  server: Server = {} as Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, Socket>();

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract user ID from the socket handshake auth
      const userId = this.extractUserIdFromSocket(client);
      
      if (!userId) {
        this.logger.warn('Unauthorized WebSocket connection attempt');
        client.disconnect();
        return;
      }

      // Store the connection
      this.connectedUsers.set(userId, client);
      
      // Join user to their personal room
      await client.join(`user:${userId}`);
      
      this.logger.log(`User ${userId} connected to notifications`);
      
      // Send unread count immediately
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });
      
    } catch (error) {
      this.logger.error('Error handling WebSocket connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userId = this.extractUserIdFromSocket(client);
      
      if (userId) {
        this.connectedUsers.delete(userId);
        this.logger.log(`User ${userId} disconnected from notifications`);
      }
    } catch (error) {
      this.logger.error('Error handling WebSocket disconnection:', error);
    }
  }

  // @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    // @MessageBody() query: NotificationQueryDto,
    // @ConnectedSocket() client: Socket,
    query: NotificationQueryDto,
    client: Socket,
  ) {
    try {
      const userId = this.extractUserIdFromSocket(client);
      
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const result = await this.notificationsService.getNotifications(userId, query);
      client.emit('notifications', result);
      
    } catch (error) {
      this.logger.error('Error getting notifications:', error);
      client.emit('error', { message: 'Failed to get notifications' });
    }
  }

  // @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    // @MessageBody() data: { notificationId: string },
    // @ConnectedSocket() client: Socket,
    data: { notificationId: string },
    client: Socket,
  ) {
    try {
      const userId = this.extractUserIdFromSocket(client);
      
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const notification = await this.notificationsService.updateNotification(
        userId,
        data.notificationId,
        { read: true }
      );

      // Update unread count for the user
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });
      
      // Emit the updated notification
      client.emit('notificationUpdated', notification);
      
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  // @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(/* @ConnectedSocket() */ client: Socket) {
    try {
      const userId = this.extractUserIdFromSocket(client);
      
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      await this.notificationsService.markAllAsRead(userId);
      
      // Update unread count for the user
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });
      
      client.emit('allNotificationsRead', {});
      
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      client.emit('error', { message: 'Failed to mark all notifications as read' });
    }
  }

  // @SubscribeMessage('dismissNotification')
  async handleDismissNotification(
    // @MessageBody() data: { notificationId: string },
    // @ConnectedSocket() client: Socket,
    data: { notificationId: string },
    client: Socket,
  ) {
    try {
      const userId = this.extractUserIdFromSocket(client);
      
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const notification = await this.notificationsService.updateNotification(
        userId,
        data.notificationId,
        { dismissed: true }
      );

      client.emit('notificationDismissed', notification);
      
    } catch (error) {
      this.logger.error('Error dismissing notification:', error);
      client.emit('error', { message: 'Failed to dismiss notification' });
    }
  }

  // @SubscribeMessage('getPreferences')
  async handleGetPreferences(/* @ConnectedSocket() */ client: Socket) {
    try {
      const userId = this.extractUserIdFromSocket(client);
      
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const preferences = await this.notificationsService.getNotificationPreferences(userId);
      client.emit('preferences', preferences);
      
    } catch (error) {
      this.logger.error('Error getting preferences:', error);
      client.emit('error', { message: 'Failed to get preferences' });
    }
  }

  // Method to send notification to a specific user
  async sendNotificationToUser(userId: string, notification: NotificationResponseDto) {
    const userSocket = this.connectedUsers.get(userId);
    
    if (userSocket) {
      userSocket.emit('newNotification', notification);
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      userSocket.emit('unreadCount', { count: unreadCount });
    }
  }

  // Method to send notification to multiple users
  async sendNotificationToUsers(userIds: string[], notification: NotificationResponseDto) {
    for (const userId of userIds) {
      await this.sendNotificationToUser(userId, notification);
    }
  }

  // Method to broadcast system notification to all connected users
  async broadcastSystemNotification(notification: NotificationResponseDto) {
    // this.server.emit('systemNotification', notification);
  }

  // Method to send notification to users in a specific room
  async sendNotificationToRoom(room: string, notification: NotificationResponseDto) {
    // this.server.to(room).emit('roomNotification', notification);
  }

  private extractUserIdFromSocket(client: Socket): string | null {
    try {
      // Try to get user ID from handshake auth
      // const auth = client.handshake.auth;
      // if (auth && auth.userId) {
      //   return auth.userId;
      // }

      // Try to get from query parameters
      // const query = client.handshake.query;
      // if (query && query.userId) {
      //   return query.userId as string;
      // }

      // Try to get from headers
      // const headers = client.handshake.headers;
      // if (headers && headers['user-id']) {
      //   return headers['user-id'] as string;
      // }

      return null;
    } catch (error) {
      this.logger.error('Error extracting user ID from socket:', error);
      return null;
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get list of connected user IDs
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if a user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
