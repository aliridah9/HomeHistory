import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { NotificationType } from './notification.dto';

export class NotificationTemplateDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Email subject template' })
  @IsString()
  emailSubject: string;

  @ApiProperty({ description: 'Email body template' })
  @IsString()
  emailBody: string;

  @ApiProperty({ description: 'Push notification title template' })
  @IsString()
  pushTitle: string;

  @ApiProperty({ description: 'Push notification body template' })
  @IsString()
  pushBody: string;

  @ApiProperty({ description: 'SMS message template' })
  @IsString()
  smsMessage: string;

  @ApiProperty({ description: 'Template variables' })
  variables: string[];

  @ApiProperty({ description: 'Whether template is active' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ description: 'Template creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Template last update date' })
  updatedAt: Date;
}

export class CreateNotificationTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Email subject template' })
  @IsString()
  emailSubject: string;

  @ApiProperty({ description: 'Email body template' })
  @IsString()
  emailBody: string;

  @ApiProperty({ description: 'Push notification title template' })
  @IsString()
  pushTitle: string;

  @ApiProperty({ description: 'Push notification body template' })
  @IsString()
  pushBody: string;

  @ApiProperty({ description: 'SMS message template' })
  @IsString()
  smsMessage: string;

  @ApiProperty({ description: 'Template variables', type: [String] })
  variables: string[];

  @ApiProperty({ description: 'Whether template is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}

export class UpdateNotificationTemplateDto {
  @ApiProperty({ description: 'Template name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Template description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType, required: false })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({ description: 'Email subject template', required: false })
  @IsString()
  @IsOptional()
  emailSubject?: string;

  @ApiProperty({ description: 'Email body template', required: false })
  @IsString()
  @IsOptional()
  emailBody?: string;

  @ApiProperty({ description: 'Push notification title template', required: false })
  @IsString()
  @IsOptional()
  pushTitle?: string;

  @ApiProperty({ description: 'Push notification body template', required: false })
  @IsString()
  @IsOptional()
  pushBody?: string;

  @ApiProperty({ description: 'SMS message template', required: false })
  @IsString()
  @IsOptional()
  smsMessage?: string;

  @ApiProperty({ description: 'Template variables', type: [String], required: false })
  @IsOptional()
  variables?: string[];

  @ApiProperty({ description: 'Whether template is active', required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
