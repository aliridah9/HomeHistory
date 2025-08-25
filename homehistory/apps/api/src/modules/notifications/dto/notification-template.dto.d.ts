import { NotificationType } from './notification.dto';
export declare class NotificationTemplateDto {
    id: string;
    name: string;
    description: string;
    type: NotificationType;
    emailSubject: string;
    emailBody: string;
    pushTitle: string;
    pushBody: string;
    smsMessage: string;
    variables: string[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreateNotificationTemplateDto {
    name: string;
    description: string;
    type: NotificationType;
    emailSubject: string;
    emailBody: string;
    pushTitle: string;
    pushBody: string;
    smsMessage: string;
    variables: string[];
    active?: boolean;
}
export declare class UpdateNotificationTemplateDto {
    name?: string;
    description?: string;
    type?: NotificationType;
    emailSubject?: string;
    emailBody?: string;
    pushTitle?: string;
    pushBody?: string;
    smsMessage?: string;
    variables?: string[];
    active?: boolean;
}
//# sourceMappingURL=notification-template.dto.d.ts.map
