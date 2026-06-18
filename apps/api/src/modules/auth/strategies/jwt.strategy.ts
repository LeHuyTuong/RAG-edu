import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { ConfigType } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { TokenPayload } from '../../../common/interfaces/auth.interface';
import { JwtTokenType } from '../../../common/enums/jwt.enum';
import { jwtConfiguration } from '../../../config';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => request.cookies?.['accessToken'],
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    if (payload.type !== JwtTokenType.AccessToken) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.deviceId || typeof payload.deviceId !== 'string') {
      throw new UnauthorizedException('Invalid token: missing deviceId');
    }

    if (
      payload.status !== UserStatus.ACTIVE &&
      payload.status !== UserStatus.UNVERIFIED
    ) {
      throw new UnauthorizedException('User is not active');
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
