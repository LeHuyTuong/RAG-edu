import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConfiguration } from '../../config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    @Inject(redisConfiguration.KEY)
    private readonly redisConfig: ConfigType<typeof redisConfiguration>,
  ) {
    this.client = new Redis(this.redisConfig.url, {
      keyPrefix: `${this.redisConfig.keyPrefix}:`,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  get(key: string) {
    return this.client.get(key);
  }

  set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds === undefined) {
      return this.client.set(key, value);
    }

    return this.client.set(key, value, 'EX', ttlSeconds);
  }

  del(key: string) {
    return this.client.del(key);
  }

  ttl(key: string) {
    return this.client.ttl(key);
  }

  getBullMqConnectionOptions() {
    let redisUrl: URL;

    try {
      redisUrl = new URL(this.redisConfig.url);
    } catch (error) {
      throw new Error(
        `Invalid Redis connection configuration for BullMQ: unable to parse REDIS_URL (${(error as Error).message})`,
      );
    }

    const database = redisUrl.pathname.replace('/', '');
    const db = database ? Number(database) : undefined;

    if (db !== undefined && !Number.isInteger(db)) {
      throw new Error(
        `Invalid Redis connection configuration for BullMQ: Redis database must be a number, received "${database}"`,
      );
    }

    return {
      host: redisUrl.hostname,
      port: redisUrl.port ? Number(redisUrl.port) : 6379,
      username: redisUrl.username
        ? decodeURIComponent(redisUrl.username)
        : undefined,
      password: redisUrl.password
        ? decodeURIComponent(redisUrl.password)
        : undefined,
      db,
      tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    };
  }

  getBullMqPrefix() {
    return this.redisConfig.keyPrefix;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);

    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number) {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
