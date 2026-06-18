import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { QueueService } from '../../common/queue/queue.service';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { RedisService } from '../../common/redis/redis.service';
import { MailService } from './mail.service';
import {
  MAIL_JOB_NAMES,
  type MailJobData,
  type PasswordResetEmailJobData,
  type VerificationEmailJobData,
} from './mail-queue.types';

@Injectable()
export class MailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailProcessor.name);
  private worker: Worker<MailJobData> | null = null;

  constructor(
    private readonly mailService: MailService,
    private readonly redisService?: RedisService,
    private readonly queueService?: QueueService,
  ) {}

  onModuleInit() {
    if (!this.redisService) {
      return;
    }

    this.worker = new Worker<MailJobData>(
      QUEUE_NAMES.mail,
      (job) => this.process(job),
      {
        connection: this.redisService.getBullMqConnectionOptions(),
        prefix: this.redisService.getBullMqPrefix(),
      },
    );
    this.worker.on('completed', (job) => this.logCompleted(job));
    this.worker.on('failed', (job, error) => this.logFailed(job, error));

    if (this.queueService) {
      this.queueService.getQueue(QUEUE_NAMES.mail);
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  async process(job: Pick<Job<MailJobData>, 'id' | 'name' | 'data'>) {
    switch (job.data.type) {
      case MAIL_JOB_NAMES.verifyEmail:
        await this.processVerificationEmail(job.data);
        return;
      case MAIL_JOB_NAMES.passwordReset:
        await this.processPasswordResetEmail(job.data);
        return;
    }
  }

  logCompleted(job: Pick<Job<MailJobData>, 'id' | 'name'>) {
    this.logger.log(`Completed mail job ${job.name} with id ${job.id}`);
  }

  logFailed(
    job:
      | Pick<Job<MailJobData>, 'id' | 'name' | 'data' | 'attemptsMade'>
      | undefined,
    error: Error,
  ) {
    this.logger.error(
      `Failed mail job ${job?.name ?? 'unknown'} with id ${
        job?.id ?? 'unknown'
      } after ${job?.attemptsMade ?? 0} attempts: ${error.message}`,
      error.stack,
    );
  }

  private async processVerificationEmail(jobData: VerificationEmailJobData) {
    await this.mailService.sendVerificationCode(jobData.account, jobData.token);
  }

  private async processPasswordResetEmail(jobData: PasswordResetEmailJobData) {
    await this.mailService.sendPasswordResetLink(
      jobData.account,
      jobData.token,
      jobData.ttlSeconds,
    );
  }
}
