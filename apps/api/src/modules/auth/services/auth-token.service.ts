import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../../../common/redis/redis.service';

type TokenNamespace = {
  tokenPrefix: string;
  subjectPrefix: string;
  cooldownPrefix?: string;
};

type IssueTokenOptions = TokenNamespace & {
  subjectId: string;
  ttlSeconds: number;
};

@Injectable()
export class AuthTokenService {
  constructor(private readonly redisService: RedisService) {}

  hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueToken(options: IssueTokenOptions) {
    const token = uuidv4();
    const hashedToken = this.hashToken(token);

    await this.redisService.set(
      this.tokenKey(options.tokenPrefix, hashedToken),
      options.subjectId,
      options.ttlSeconds,
    );
    await this.redisService.set(
      this.subjectKey(options.subjectPrefix, options.subjectId),
      hashedToken,
      options.ttlSeconds,
    );

    return { token, hashedToken };
  }

  async rotateToken(options: IssueTokenOptions) {
    const oldHashedToken = await this.redisService.get(
      this.subjectKey(options.subjectPrefix, options.subjectId),
    );

    if (oldHashedToken) {
      await this.redisService.del(
        this.tokenKey(options.tokenPrefix, oldHashedToken),
      );
    }

    return this.issueToken(options);
  }

  async getSubjectId(tokenPrefix: string, token: string) {
    return this.redisService.get(
      this.tokenKey(tokenPrefix, this.hashToken(token)),
    );
  }

  async invalidateToken(
    namespace: TokenNamespace,
    subjectId: string,
    token: string,
  ) {
    const hashedToken = this.hashToken(token);

    await this.redisService.del(
      this.tokenKey(namespace.tokenPrefix, hashedToken),
    );
    await this.redisService.del(
      this.subjectKey(namespace.subjectPrefix, subjectId),
    );

    if (namespace.cooldownPrefix) {
      await this.redisService.del(
        this.cooldownKey(namespace.cooldownPrefix, subjectId),
      );
    }
  }

  async assertCooldown(
    cooldownPrefix: string,
    subjectId: string,
    fallbackSeconds: number,
    messageFactory: (waitSeconds: number) => string,
  ) {
    const cooldownKey = this.cooldownKey(cooldownPrefix, subjectId);
    const cooldown = await this.redisService.get(cooldownKey);

    if (!cooldown) {
      return;
    }

    const secondsRemaining = await this.redisService.ttl(cooldownKey);
    const waitSeconds =
      secondsRemaining > 0 ? secondsRemaining : fallbackSeconds;

    throw new HttpException(
      messageFactory(waitSeconds),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  async setCooldown(
    cooldownPrefix: string,
    subjectId: string,
    ttlSeconds: number,
  ) {
    await this.redisService.set(
      this.cooldownKey(cooldownPrefix, subjectId),
      '1',
      ttlSeconds,
    );
  }

  tokenKey(prefix: string, hashedToken: string) {
    return `${prefix}:${hashedToken}`;
  }

  subjectKey(prefix: string, subjectId: string) {
    return `${prefix}:${subjectId}`;
  }

  cooldownKey(prefix: string, subjectId: string) {
    return `${prefix}:${subjectId}`;
  }
}
