import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { mailConfiguration } from '../../config';
import { accounts } from '@prisma/client';
import { NodeEnv } from '../../common/enums';

type VerificationEmailAccount = Pick<accounts, 'email' | 'name'>;
type PasswordResetEmailAccount = Pick<accounts, 'email' | 'name'>;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(
    @Inject(mailConfiguration.KEY)
    private readonly mailConfig: ConfigType<typeof mailConfiguration>,
  ) {
    this.transporter = this.createTransporter();
  }

  async sendVerificationCode(account: VerificationEmailAccount, token: string) {
    const verificationUrl = this.buildVerificationUrl(token);

    if (!this.transporter) {
      this.logger.log(
        process.env.NODE_ENV === NodeEnv.Development
          ? `Email verification link for ${account.email}: ${verificationUrl}`
          : 'Email transporter is not configured. Skipping sending verification email.',
      );
      return;
    }

    await this.transporter.sendMail({
      from: `"${this.mailConfig.fromName}" <${this.mailConfig.fromEmail}>`,
      to: account.email,
      subject: 'Verify your AI Study Hub email',
      text: [
        `Hi ${account.name},`,
        '',
        `Click the link below to verify your email address and complete your registration:`,
        verificationUrl,
        '',
        'If you did not create an account, please ignore this email.',
        '',
        'Best regards,',
        'The AI Study Hub Team',
      ].join('\n'),
    });
  }

  async sendPasswordResetLink(
    account: PasswordResetEmailAccount,
    token: string,
    ttlSeconds: number,
  ) {
    const resetUrl = this.buildPasswordResetUrl(token);
    const ttlMinutes = Math.max(1, Math.ceil(ttlSeconds / 60));

    if (!this.transporter) {
      this.logger.log(
        process.env.NODE_ENV === NodeEnv.Development
          ? `Password reset link for ${account.email}: ${resetUrl}`
          : 'Email transporter is not configured. Skipping sending password reset email.',
      );
      return;
    }

    await this.transporter.sendMail({
      from: `"${this.mailConfig.fromName}" <${this.mailConfig.fromEmail}>`,
      to: account.email,
      subject: 'Reset your AI Study Hub password',
      text: [
        `Hi ${account.name},`,
        '',
        'Click the link below to reset your AI Study Hub password:',
        resetUrl,
        '',
        `This link expires in ${ttlMinutes} minutes and can only be used once.`,
        '',
        'If you did not request a password reset, please ignore this email.',
        '',
        'Best regards,',
        'The AI Study Hub Team',
      ].join('\n'),
    });
  }

  private createTransporter() {
    if (!this.mailConfig.smtpUsername || !this.mailConfig.smtpPassword) {
      return null;
    }

    return nodemailer.createTransport({
      host: this.mailConfig.smtpHost,
      port: this.mailConfig.smtpPort,
      secure: this.mailConfig.smtpSecure,
      auth: {
        user: this.mailConfig.smtpUsername,
        pass: this.mailConfig.smtpPassword,
      },
    });
  }

  private buildVerificationUrl(token: string) {
    return new URL(`/verify-email/${token}`, this.mailConfig.frontendUrl)
      .toString()
      .replace(/\/$/, '');
  }

  private buildPasswordResetUrl(token: string) {
    return new URL(`/reset-password/${token}`, this.mailConfig.frontendUrl)
      .toString()
      .replace(/\/$/, '');
  }
}
