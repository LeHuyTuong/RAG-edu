import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../common/queue/queue.service';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { MAIL_JOB_NAMES, type MailJobAccount } from './mail-queue.types';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(private readonly queueService: QueueService) {}

  async enqueueVerificationEmail(account: MailJobAccount, token: string) {
    await this.queueService
      .getQueue(QUEUE_NAMES.mail)
      .add(MAIL_JOB_NAMES.verifyEmail, {
        account: {
          email: account.email,
          name: account.name,
        },
        token,
        type: MAIL_JOB_NAMES.verifyEmail,
      });
    this.logger.log(`Enqueued verification email for ${account.email}`);
  }

  async enqueuePasswordResetEmail(
    account: MailJobAccount,
    token: string,
    ttlSeconds: number,
  ) {
    await this.queueService
      .getQueue(QUEUE_NAMES.mail)
      .add(MAIL_JOB_NAMES.passwordReset, {
        account: {
          email: account.email,
          name: account.name,
        },
        token,
        ttlSeconds,
        type: MAIL_JOB_NAMES.passwordReset,
      });
    this.logger.log(`Enqueued password reset email for ${account.email}`);
  }
}
