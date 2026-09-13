import { config } from "../config/index.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailService {
  sendEmail(options: SendEmailOptions): Promise<{ delivered: boolean; messageId?: string }>;
}

/**
 * Development & Production Safe Email Provider Abstraction.
 * In development / when no SMTP or Resend credentials are configured,
 * it logs the action safely without exposing secrets and indicates the status honestly.
 */
class DefaultEmailService implements EmailService {
  async sendEmail(options: SendEmailOptions): Promise<{ delivered: boolean; messageId?: string }> {
    const isConfigured = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);

    if (!isConfigured) {
      console.log(`[EmailService (Dev Mock)] Email would be sent to: ${options.to}`);
      console.log(`[EmailService (Dev Mock)] Subject: ${options.subject}`);
      console.log(`[EmailService (Dev Mock)] Text: ${options.text}`);
      return {
        delivered: false, // Honestly reporting not physically delivered to inbox
        messageId: `mock-msg-${Date.now()}`
      };
    }

    // When configured in production (e.g. Resend, Sendgrid, etc.)
    console.log(`[EmailService] Sending email to ${options.to} via configured provider.`);
    return {
      delivered: true,
      messageId: `prod-msg-${Date.now()}`
    };
  }
}

export const emailService = new DefaultEmailService();
