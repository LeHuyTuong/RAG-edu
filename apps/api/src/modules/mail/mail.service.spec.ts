import { Logger } from '@nestjs/common';
import type { accounts } from '@prisma/client';
import nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn();

  return {
    __esModule: true,
    default: {
      createTransport: jest.fn().mockImplementation(() => ({
        sendMail: mockSendMail,
      })),
    },
    mockSendMail,
  };
});

describe('MailService', () => {
  const mockSendMail = jest.requireMock('nodemailer').mockSendMail as jest.Mock;
  const mockCreateTransport = nodemailer.createTransport as jest.Mock;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('sends verification code through Mailtrap SMTP when configured', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'email-1' });
    const service = new MailService({
      smtpHost: 'sandbox.smtp.mailtrap.io',
      smtpPort: 2525,
      smtpUsername: 'smtp-user',
      smtpPassword: 'smtp-password',
      smtpSecure: false,
      fromEmail: 'noreply@example.com',
      fromName: 'AI Study Hub',
      frontendUrl: 'http://localhost:3000',
    });

    await service.sendVerificationCode(
      {
        email: 'new-user@example.com',
        name: 'New User',
      } as accounts,
      '123456',
    );

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      secure: false,
      auth: {
        user: 'smtp-user',
        pass: 'smtp-password',
      },
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"AI Study Hub" <noreply@example.com>',
        to: 'new-user@example.com',
        subject: 'Verify your AI Study Hub email',
        text: expect.stringContaining(
          'http://localhost:3000/verify-email/123456',
        ),
      }),
    );
  });

  it('logs verification link in development when Mailtrap SMTP credentials are not configured', async () => {
    process.env.NODE_ENV = 'development';
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const service = new MailService({
      smtpHost: 'sandbox.smtp.mailtrap.io',
      smtpPort: 2525,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: false,
      fromEmail: 'noreply@example.com',
      fromName: 'AI Study Hub',
      frontendUrl: 'http://localhost:3000',
    });

    await service.sendVerificationCode(
      {
        email: 'new-user@example.com',
        name: 'New User',
      } as accounts,
      '123456',
    );

    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      'Email verification link for new-user@example.com: http://localhost:3000/verify-email/123456',
    );

    logSpy.mockRestore();
  });

  it('logs skipped delivery outside development when Mailtrap SMTP credentials are not configured', async () => {
    process.env.NODE_ENV = 'test';
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const service = new MailService({
      smtpHost: 'sandbox.smtp.mailtrap.io',
      smtpPort: 2525,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: false,
      fromEmail: 'noreply@example.com',
      fromName: 'AI Study Hub',
      frontendUrl: 'http://localhost:3000',
    });

    await service.sendVerificationCode(
      {
        email: 'new-user@example.com',
        name: 'New User',
      } as accounts,
      '123456',
    );

    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      'Email transporter is not configured. Skipping sending verification email.',
    );

    logSpy.mockRestore();
  });

  it('sends password reset link through Mailtrap SMTP when configured', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'email-1' });
    const service = new MailService({
      smtpHost: 'sandbox.smtp.mailtrap.io',
      smtpPort: 2525,
      smtpUsername: 'smtp-user',
      smtpPassword: 'smtp-password',
      smtpSecure: false,
      fromEmail: 'noreply@example.com',
      fromName: 'AI Study Hub',
      frontendUrl: 'http://localhost:3000',
    });

    await service.sendPasswordResetLink(
      {
        email: 'new-user@example.com',
        name: 'New User',
      } as accounts,
      'reset-token',
      600,
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"AI Study Hub" <noreply@example.com>',
        to: 'new-user@example.com',
        subject: 'Reset your AI Study Hub password',
        text: expect.stringContaining(
          'http://localhost:3000/reset-password/reset-token',
        ),
      }),
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          'This link expires in 10 minutes and can only be used once.',
        ),
      }),
    );
  });

  it('logs password reset link in development when Mailtrap SMTP credentials are not configured', async () => {
    process.env.NODE_ENV = 'development';
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const service = new MailService({
      smtpHost: 'sandbox.smtp.mailtrap.io',
      smtpPort: 2525,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: false,
      fromEmail: 'noreply@example.com',
      fromName: 'AI Study Hub',
      frontendUrl: 'http://localhost:3000',
    });

    await service.sendPasswordResetLink(
      {
        email: 'new-user@example.com',
        name: 'New User',
      } as accounts,
      'reset-token',
      600,
    );

    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      'Password reset link for new-user@example.com: http://localhost:3000/reset-password/reset-token',
    );

    logSpy.mockRestore();
  });

  it('logs skipped password reset delivery outside development when Mailtrap SMTP credentials are not configured', async () => {
    process.env.NODE_ENV = 'test';
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const service = new MailService({
      smtpHost: 'sandbox.smtp.mailtrap.io',
      smtpPort: 2525,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: false,
      fromEmail: 'noreply@example.com',
      fromName: 'AI Study Hub',
      frontendUrl: 'http://localhost:3000',
    });

    await service.sendPasswordResetLink(
      {
        email: 'new-user@example.com',
        name: 'New User',
      } as accounts,
      'reset-token',
      600,
    );

    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      'Email transporter is not configured. Skipping sending password reset email.',
    );

    logSpy.mockRestore();
  });
});
