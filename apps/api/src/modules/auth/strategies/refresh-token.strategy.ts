import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { jwtConfiguration } from '../../../config';
import { TokenPayload } from '../../../common/interfaces/auth.interface';
import { JwtTokenType } from '../../../common/enums/jwt.enum';
import type { Request } from 'express';
import { UserStatus } from '@prisma/client';

type RefreshTokenRequest = Request & {
  body?: {
    refreshToken?: string;
  };
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: RefreshTokenRequest) => request.body?.refreshToken,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: RefreshTokenRequest) =>
          request.cookies?.['refreshToken'] ??
          request.cookies?.['refresh_token'],
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: TokenPayload) {
    if (payload.type !== JwtTokenType.RefreshToken) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.deviceId || typeof payload.deviceId !== 'string') {
      throw new UnauthorizedException('Invalid token: missing deviceId');
    }

    if (!payload.status || payload.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid token: user is not active');
    }

    return {
      sub: payload.sub,
      role: payload.role,
      status: payload.status,
      type: payload.type,
      deviceId: payload.deviceId,
    };
  }
}
