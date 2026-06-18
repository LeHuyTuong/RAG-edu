import { Logger } from '@nestjs/common';
import { QueueService } from '../../common/queue/queue.service';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { MAIL_JOB_NAMES } from './mail-queue.types';
import { MailQueueService } from './mail-queue.service';

describe('MailQueueService', () => {
  let logSpy: jest.SpyInstance;

  const queueMock = {
    add: jest.fn(),
  };
  const queueServiceMock = {
    getQueue: jest.fn(() => queueMock),
  } as unknown as QueueService;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    queueMock.add.mockResolvedValue({ id: 'job-1' });
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('enqueues verification email jobs', async () => {
    const service = new MailQueueService(queueServiceMock);

    await service.enqueueVerificationEmail(
      {
        email: 'new-user@example.com',
        name: 'New User',
      },
      'verification-token',
    );

    expect(queueServiceMock.getQueue).toHaveBeenCalledWith(QUEUE_NAMES.mail);
    expect(queueMock.add).toHaveBeenCalledWith(MAIL_JOB_NAMES.verifyEmail, {
      account: {
        email: 'new-user@example.com',
        name: 'New User',
      },
      token: 'verification-token',
      type: MAIL_JOB_NAMES.verifyEmail,
    });
  });

  it('enqueues password reset email jobs', async () => {
    const service = new MailQueueService(queueServiceMock);

    await service.enqueuePasswordResetEmail(
      {
        email: 'new-user@example.com',
        name: 'New User',
      },
      'reset-token',
      600,
    );

    expect(queueMock.add).toHaveBeenCalledWith(MAIL_JOB_NAMES.passwordReset, {
      account: {
        email: 'new-user@example.com',
        name: 'New User',
      },
      token: 'reset-token',
      ttlSeconds: 600,
      type: MAIL_JOB_NAMES.passwordReset,
    });
  });
});
