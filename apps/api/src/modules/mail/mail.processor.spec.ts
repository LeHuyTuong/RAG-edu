import { Logger } from '@nestjs/common';
import { MAIL_JOB_NAMES, type MailJobData } from './mail-queue.types';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

describe('MailProcessor', () => {
  const mailServiceMock = {
    sendVerificationCode: jest.fn(),
    sendPasswordResetLink: jest.fn(),
  } as unknown as MailService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delivers verification email jobs through MailService', async () => {
    const processor = new MailProcessor(mailServiceMock);
    const job = {
      id: 'job-1',
      name: MAIL_JOB_NAMES.verifyEmail,
      data: {
        type: MAIL_JOB_NAMES.verifyEmail,
        account: {
          email: 'new-user@example.com',
          name: 'New User',
        },
        token: 'verification-token',
      },
    };

    await processor.process(job);

    expect(mailServiceMock.sendVerificationCode).toHaveBeenCalledWith(
      {
        email: 'new-user@example.com',
        name: 'New User',
      },
      'verification-token',
    );
  });

  it('delivers password reset email jobs through MailService', async () => {
    const processor = new MailProcessor(mailServiceMock);
    const job = {
      id: 'job-2',
      name: MAIL_JOB_NAMES.passwordReset,
      data: {
        type: MAIL_JOB_NAMES.passwordReset,
        account: {
          email: 'new-user@example.com',
          name: 'New User',
        },
        token: 'reset-token',
        ttlSeconds: 600,
      },
    };

    await processor.process(job);

    expect(mailServiceMock.sendPasswordResetLink).toHaveBeenCalledWith(
      {
        email: 'new-user@example.com',
        name: 'New User',
      },
      'reset-token',
      600,
    );
  });

  it('logs completed and failed job events', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const processor = new MailProcessor(mailServiceMock);

    processor.logCompleted({
      id: 'job-1',
      name: MAIL_JOB_NAMES.verifyEmail,
    });
    processor.logFailed(
      {
        id: 'job-2',
        name: MAIL_JOB_NAMES.passwordReset,
        data: {
          type: MAIL_JOB_NAMES.passwordReset,
        } as MailJobData,
        attemptsMade: 3,
      },
      new Error('SMTP failed'),
    );

    expect(logSpy).toHaveBeenCalledWith(
      'Completed mail job mail.verify-email with id job-1',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed mail job mail.password-reset with id job-2 after 3 attempts: SMTP failed',
      expect.any(String),
    );

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
