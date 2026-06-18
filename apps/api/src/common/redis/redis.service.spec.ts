import Redis from 'ioredis';
import { RedisService } from './redis.service';

const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => jest.fn().mockImplementation(() => redisMock));

describe('RedisService', () => {
  let service: RedisService;

  const redisConfig = {
    url: 'redis://localhost:6379',
    keyPrefix: 'test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RedisService(redisConfig);
  });

  it('creates a Redis client with app configuration', () => {
    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', {
      keyPrefix: 'test:',
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  });

  it('returns BullMQ-compatible Redis options and prefix', () => {
    expect(service.getBullMqConnectionOptions()).toEqual({
      host: 'localhost',
      port: 6379,
      username: undefined,
      password: undefined,
      db: undefined,
      tls: undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    expect(service.getBullMqPrefix()).toBe('test');
  });

  it('throws contextual errors for invalid BullMQ Redis URLs', () => {
    const invalidService = new RedisService({
      url: 'not a redis url',
      keyPrefix: 'test',
    });

    expect(() => invalidService.getBullMqConnectionOptions()).toThrow(
      'Invalid Redis connection configuration for BullMQ: unable to parse REDIS_URL',
    );
  });

  it('throws contextual errors for invalid BullMQ Redis database paths', () => {
    const invalidService = new RedisService({
      url: 'redis://localhost:6379/not-a-number',
      keyPrefix: 'test',
    });

    expect(() => invalidService.getBullMqConnectionOptions()).toThrow(
      'Invalid Redis connection configuration for BullMQ: Redis database must be a number',
    );
  });

  it('gets and sets plain values', async () => {
    redisMock.get.mockResolvedValue('value');
    redisMock.set.mockResolvedValue('OK');

    await expect(service.get('key')).resolves.toBe('value');
    await expect(service.set('key', 'value', 60)).resolves.toBe('OK');

    expect(redisMock.get).toHaveBeenCalledWith('key');
    expect(redisMock.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
  });

  it('sets plain values without TTL', async () => {
    redisMock.set.mockResolvedValue('OK');

    await expect(service.set('key', 'value')).resolves.toBe('OK');

    expect(redisMock.set).toHaveBeenCalledWith('key', 'value');
  });

  it('gets and sets JSON values', async () => {
    const value = { accountId: 'user-1', attempts: 1 };

    redisMock.get.mockResolvedValue(JSON.stringify(value));
    redisMock.set.mockResolvedValue('OK');

    await expect(
      service.getJson<typeof value>('verification:user-1'),
    ).resolves.toEqual(value);
    await expect(
      service.setJson('verification:user-1', value, 600),
    ).resolves.toBe('OK');

    expect(redisMock.set).toHaveBeenCalledWith(
      'verification:user-1',
      JSON.stringify(value),
      'EX',
      600,
    );
  });

  it('returns null when JSON value is missing', async () => {
    redisMock.get.mockResolvedValue(null);

    await expect(service.getJson('missing')).resolves.toBeNull();
  });

  it('deletes keys, reads TTL, and quits on destroy', async () => {
    redisMock.del.mockResolvedValue(1);
    redisMock.ttl.mockResolvedValue(300);
    redisMock.quit.mockResolvedValue('OK');

    await expect(service.del('key')).resolves.toBe(1);
    await expect(service.ttl('key')).resolves.toBe(300);
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();

    expect(redisMock.del).toHaveBeenCalledWith('key');
    expect(redisMock.ttl).toHaveBeenCalledWith('key');
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
