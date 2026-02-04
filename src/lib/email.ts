import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection in production
      if (process.env.NODE_ENV === 'production' && this.transporter) {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.error('Email service connection failed:', error);
          } else {
            logger.info('Email service is ready to send messages');
          }
        });
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email service not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: `"Albitros" <${process.env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html || this.generateTemplate(options.template, options.data),
        text: options.text || this.htmlToText(options.html || this.generateTemplate(options.template, options.data)),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });
      return true;
    } catch (error) {
      logger.error('Failed to send email:', {
        to: options.to,
        subject: options.subject,
        error: error,
      });
      return false;
    }
  }

  private generateTemplate(template?: string, data?: Record<string, any>): string {
    if (!template || !data) return '<p>Email content</p>';

    // Simple template replacement
    let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">`;

    switch (template) {
      case 'welcome':
        html += `
          <h2 style="color: #333;">Welcome to Albitros, ${data.fullName}!</h2>
          <p>Thank you for signing up for Albitros. Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul>
            <li>Access your dashboard</li>
            <li>Submit claims for analysis</li>
            <li>View analytics and reports</li>
          </ul>
          <p>Best regards,<br>The Albitros Team</p>
        `;
        break;
      case 'password-reset':
        html += `
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Albitros account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${data.resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        `;
        break;
      default:
        html += '<p>Email content</p>';
    }

    html += '</div>';
    return html;
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  }

  // Convenience methods
  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Albitros!',
      template: 'welcome',
      data: { fullName }
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Albitros Password',
      template: 'password-reset',
      data: { resetUrl }
    });
  }
}

export const emailService = new EmailService();

// Explicit type export for TypeScript
export type { EmailService, EmailOptions } from './email.d.ts';
