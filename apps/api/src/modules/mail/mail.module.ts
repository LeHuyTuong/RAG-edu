import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '../../common/queue/queue.module';
import { RedisModule } from '../../common/redis/redis.module';
import { MailProcessor } from './mail.processor';
import { MailQueueService } from './mail-queue.service';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule, QueueModule, RedisModule],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailService, MailQueueService],
})
export class MailModule {}
