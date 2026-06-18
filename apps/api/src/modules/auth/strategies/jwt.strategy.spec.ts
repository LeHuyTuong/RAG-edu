import { UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtTokenType } from '../../../common/enums/jwt.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({
    secret: 'test-secret',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
  });

  it('allows unverified access tokens so the app can run a limited session', async () => {
    await expect(
      strategy.validate({
        sub: 'user-1',
        role: UserRole.USER,
        status: UserStatus.UNVERIFIED,
        type: JwtTokenType.AccessToken,
        deviceId: 'device-1',
      }),
    ).resolves.toEqual({
      sub: 'user-1',
      role: UserRole.USER,
      status: UserStatus.UNVERIFIED,
      type: JwtTokenType.AccessToken,
      deviceId: 'device-1',
    });
  });

  it('rejects access tokens without a device id', async () => {
    await expect(
      strategy.validate({
        sub: 'user-1',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        type: JwtTokenType.AccessToken,
        deviceId: '',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
