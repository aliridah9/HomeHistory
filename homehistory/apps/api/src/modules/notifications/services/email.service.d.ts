export interface EmailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        contentType?: string;
    }>;
}
export declare class EmailService {
    private readonly logger;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendBulkEmail(emails: EmailOptions[]): Promise<{
        success: number;
        failed: number;
    }>;
    sendTemplateEmail(to: string, templateName: string, templateData: Record<string, any>, options?: Partial<EmailOptions>): Promise<boolean>;
    private renderTemplate;
    validateEmail(email: string): Promise<boolean>;
    getEmailStats(): Promise<{
        sent: number;
        delivered: number;
        bounced: number;
        opened: number;
        clicked: number;
    }>;
}
//# sourceMappingURL=email.service.d.ts.map
