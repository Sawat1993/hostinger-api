import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.initializeResend();
  }

  private initializeResend(): void {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured');
    }
    this.resend = new Resend(apiKey);
  }

  async sendOtpEmail(
    email: string,
    otp: string,
    name?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const from = this.configService.get<string>(
        'RESEND_FROM_EMAIL',
        'Sawatantra <no-reply@sawatantra.cloud>',
      );

      if (!this.resend) {
        this.initializeResend();
      }

      const response = await this.resend.emails.send({
        from,
        to: email,
        subject: 'Your OTP Code',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif;">
              <h2>Welcome${name ? `, ${name}` : ''}!</h2>
              <p>Your One-Time Password (OTP) is:</p>
              <h1 style="color: #007bff; font-size: 36px; letter-spacing: 5px;">
                ${otp}
              </h1>
              <p>This code expires in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </body>
          </html>
        `,
      });

      if (response.error) {
        this.logger.error(
          `Failed to send OTP email to ${email}:`,
          response.error,
        );
        return {
          success: false,
          error: response.error.message,
        };
      }

      this.logger.log(`OTP email sent successfully to ${email}`);
      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      this.logger.error(
        `Exception while sending OTP email to ${email}:`,
        (error as Error)?.stack ?? error,
      );
      return {
        success: false,
        error: (error as Error)?.message || 'Unknown error occurred',
      };
    }
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const from = this.configService.get<string>(
        'RESEND_FROM_EMAIL',
        'onboarding@resend.dev',
      );

      const response = await this.resend.emails.send({
        from,
        to: email,
        subject: 'Welcome to Hostinger!',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif;">
              <h2>Welcome, ${name}!</h2>
              <p>Your account has been successfully created.</p>
              <p>You can now log in to your account and start using our services.</p>
              <p>If you have any questions, feel free to contact us.</p>
              <br/>
              <p>Best regards,<br/>The Hostinger Team</p>
            </body>
          </html>
        `,
      });

      if (response.error) {
        this.logger.error(
          `Failed to send welcome email to ${email}:`,
          response.error,
        );
        return {
          success: false,
          error: response.error.message,
        };
      }

      this.logger.log(`Welcome email sent successfully to ${email}`);
      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      this.logger.error(
        `Exception while sending welcome email to ${email}:`,
        (error as Error)?.stack ?? error,
      );
      return {
        success: false,
        error: (error as Error)?.message || 'Unknown error occurred',
      };
    }
  }
}
