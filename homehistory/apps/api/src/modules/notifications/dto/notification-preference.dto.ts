import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from './notification.dto';

export class NotificationPreferenceDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Email notifications enabled' })
  @IsBoolean()
  emailEnabled: boolean;

  @ApiProperty({ description: 'Push notifications enabled' })
  @IsBoolean()
  pushEnabled: boolean;

  @ApiProperty({ description: 'SMS notifications enabled' })
  @IsBoolean()
  smsEnabled: boolean;

  @ApiProperty({ description: 'Property update notifications enabled' })
  @IsBoolean()
  propertyUpdates: boolean;

  @ApiProperty({ description: 'Document processing notifications enabled' })
  @IsBoolean()
  documentProcessing: boolean;

  @ApiProperty({ description: 'Search result notifications enabled' })
  @IsBoolean()
  searchResults: boolean;

  @ApiProperty({ description: 'System alert notifications enabled' })
  @IsBoolean()
  systemAlerts: boolean;

  @ApiProperty({ description: 'Maintenance reminder notifications enabled' })
  @IsBoolean()
  maintenanceReminders: boolean;

  @ApiProperty({ description: 'Daily digest enabled' })
  @IsBoolean()
  dailyDigest: boolean;

  @ApiProperty({ description: 'Weekly summary enabled' })
  @IsBoolean()
  weeklySummary: boolean;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ description: 'Email notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiProperty({ description: 'Push notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiProperty({ description: 'SMS notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiProperty({ description: 'Property update notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  propertyUpdates?: boolean;

  @ApiProperty({ description: 'Document processing notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  documentProcessing?: boolean;

  @ApiProperty({ description: 'Search result notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  searchResults?: boolean;

  @ApiProperty({ description: 'System alert notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  systemAlerts?: boolean;

  @ApiProperty({ description: 'Maintenance reminder notifications enabled', required: false })
  @IsBoolean()
  @IsOptional()
  maintenanceReminders?: boolean;

  @ApiProperty({ description: 'Daily digest enabled', required: false })
  @IsBoolean()
  @IsOptional()
  dailyDigest?: boolean;

  @ApiProperty({ description: 'Weekly summary enabled', required: false })
  @IsBoolean()
  @IsOptional()
  weeklySummary?: boolean;
}
