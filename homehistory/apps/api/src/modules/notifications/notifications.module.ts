import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './services/email.service';
import { PushNotificationService } from './services/push-notification.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationsGateway,
    EmailService,
    PushNotificationService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
