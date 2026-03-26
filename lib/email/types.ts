export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}
