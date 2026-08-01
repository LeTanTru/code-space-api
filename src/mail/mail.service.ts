import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

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
        'SMTP_HOST not configured — OTP emails will be logged to the server console instead of sent.'
      );
    }
  }

  private get fromAddress(): string {
    return this.configService.get<string>('SMTP_FROM', 'CodeSpace <no-reply@codespace.dev>');
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

  private async deliver(to: string, subject: string, text: string) {
    if (!this.transporter) {
      this.logger.warn(`[DEV EMAIL — NOT SENT] To: ${to} | Subject: ${subject}\n${text}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
    });
  }

  async sendVerificationEmail(email: string, code: string) {
    await this.deliver(
      email,
      'CodeSpace — Verify your email',
      `Your CodeSpace email verification code is: ${code}\n\nThis code expires in 15 minutes. If you did not create a CodeSpace account, you can safely ignore this email.`
    );
    this.logger.log(`Verification email dispatched to ${email}`);
  }

  async sendPasswordResetEmail(email: string, code: string) {
    await this.deliver(
      email,
      'CodeSpace — Password reset code',
      `Your CodeSpace password reset code is: ${code}\n\nThis code expires in 15 minutes. If you did not request a password reset, you can safely ignore this email.`
    );
    this.logger.log(`Password reset email dispatched to ${email}`);
  }
}
