import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsBoolean } from 'class-validator';

export enum NotificationType {
  PROPERTY_UPDATE = 'property_update',
  DOCUMENT_PROCESSED = 'document_processed',
  SEARCH_RESULT = 'search_result',
  SYSTEM_ALERT = 'system_alert',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to send notification to' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.MEDIUM;

  @ApiProperty({ description: 'Additional data for the notification', required: false })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Related entity ID', required: false })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiProperty({ description: 'Related entity type', required: false })
  @IsString()
  @IsOptional()
  entityType?: string;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Whether notification has been read', required: false })
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @ApiProperty({ description: 'Whether notification has been dismissed', required: false })
  @IsBoolean()
  @IsOptional()
  dismissed?: boolean;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiProperty({ description: 'Whether notification has been read' })
  read: boolean;

  @ApiProperty({ description: 'Whether notification has been dismissed' })
  dismissed: boolean;

  @ApiProperty({ description: 'Additional data for the notification' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Related entity ID' })
  entityId?: string;

  @ApiProperty({ description: 'Related entity type' })
  entityType?: string;

  @ApiProperty({ description: 'Notification creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Notification read date', required: false })
  readAt?: Date;
}

export class NotificationQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ description: 'Filter by read status', required: false })
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @ApiProperty({ description: 'Filter by notification type', enum: NotificationType, required: false })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({ description: 'Filter by priority', enum: NotificationPriority, required: false })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;
}
