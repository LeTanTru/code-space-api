import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import { renderVerificationEmail, renderPasswordResetEmail, renderWelcomeEmail } from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get<string>('SMTP_USER', ''),
          pass: this.configService.get<string>('SMTP_PASS', ''),
        },
      });
      this.logger.log(`MailService initialized with SMTP host: ${host}`);
      void this.verifyConnection();
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP_HOST not configured — emails will be logged to the server console instead of sent.'
      );
    }
  }

  private get fromAddress(): string {
    return this.configService.get<string>('SMTP_FROM', 'CodeSpace <no-reply@codespace.dev>');
  }

  private get logoPath(): string {
    const distPath = path.join(__dirname, '../../assets/images/logo.png');
    const srcPath = path.join(process.cwd(), 'src/assets/images/logo.png');
    if (fs.existsSync(distPath)) return distPath;
    return srcPath;
  }

  /**
   * Verify SMTP connectivity. Called automatically on startup when SMTP_HOST is set.
   * Logs success or failure — does not throw.
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('SMTP not configured — skipping connection check.');
      return false;
    }
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully.');
      return true;
    } catch (err) {
      this.logger.error(`SMTP connection failed: ${(err as Error).message}`);
      return false;
    }
  }

  private async deliver(to: string, subject: string, text: string, html?: string) {
    if (!this.transporter) {
      this.logger.warn(`[DEV EMAIL — NOT SENT] To: ${to} | Subject: ${subject}\n${text}`);
      return;
    }

    const attachments = fs.existsSync(this.logoPath)
      ? [
          {
            filename: 'logo.png',
            path: this.logoPath,
            cid: 'logo@codespace.dev',
            contentDisposition: 'inline' as const,
          },
        ]
      : [];

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
      html,
      attachments,
    });
  }

  /**
   * Send email address verification OTP email with responsive HTML styling.
   */
  async sendVerificationEmail(email: string, code: string, name?: string) {
    const template = renderVerificationEmail({ email, code, name });
    await this.deliver(email, template.subject, template.text, template.html);
    this.logger.log(`Verification email dispatched to ${email}`);
  }

  /**
   * Send password reset code email with security-focused HTML styling.
   */
  async sendPasswordResetEmail(email: string, code: string, name?: string) {
    const template = renderPasswordResetEmail({ email, code, name });
    await this.deliver(email, template.subject, template.text, template.html);
    this.logger.log(`Password reset email dispatched to ${email}`);
  }

  /**
   * Send onboarding welcome email to new users with feature highlights.
   */
  async sendWelcomeEmail(email: string, name: string) {
    const template = renderWelcomeEmail({ email, name });
    await this.deliver(email, template.subject, template.text, template.html);
    this.logger.log(`Welcome email dispatched to ${email}`);
  }
}
