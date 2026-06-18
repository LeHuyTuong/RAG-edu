import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QUEUE_NAMES } from './queue.constants';
import { QueueService } from './queue.service';

const queueCloseMock = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    close: queueCloseMock,
  })),
}));

describe('QueueService', () => {
  const redisConnection = {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  };
  const redisServiceMock = {
    getBullMqConnectionOptions: jest.fn(() => redisConnection),
    getBullMqPrefix: jest.fn(() => 'test'),
  } as unknown as RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates named queues with retry and backoff defaults', () => {
    const service = new QueueService(redisServiceMock);

    const queue = service.getQueue(QUEUE_NAMES.mail);

    expect(queue).toEqual({ close: queueCloseMock });
    expect(Queue).toHaveBeenCalledWith(QUEUE_NAMES.mail, {
      connection: redisConnection,
      prefix: 'test',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  });

  it('reuses queue instances and closes them on destroy', async () => {
    queueCloseMock.mockResolvedValue(undefined);
    const service = new QueueService(redisServiceMock);

    expect(service.getQueue(QUEUE_NAMES.mail)).toBe(
      service.getQueue(QUEUE_NAMES.mail),
    );

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();

    expect(Queue).toHaveBeenCalledTimes(1);
    expect(queueCloseMock).toHaveBeenCalledTimes(1);
  });
});
