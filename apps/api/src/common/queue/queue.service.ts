import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { DEFAULT_QUEUE_JOB_OPTIONS } from './queue.constants';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly redisService: RedisService) {}

  getQueue(name: string) {
    const existingQueue = this.queues.get(name);

    if (existingQueue) {
      return existingQueue;
    }

    const queue = new Queue(name, {
      connection: this.redisService.getBullMqConnectionOptions(),
      prefix: this.redisService.getBullMqPrefix(),
      defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
    });
    this.queues.set(name, queue);

    return queue;
  }

  async onModuleDestroy() {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    this.queues.clear();
  }
}
