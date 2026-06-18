import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

type RefreshTokenRequest = Request & {
  body?: {
    refreshToken?: unknown;
  };
};

const getBearerToken = (authorization?: unknown) => {
  if (typeof authorization !== 'string') {
    return undefined;
  }

  const [scheme, token] = authorization.split(' ');
  return scheme === 'Bearer' ? token : undefined;
};

const getRefreshToken = (request: RefreshTokenRequest) => {
  return (
    request.body?.refreshToken ??
    getBearerToken(request.headers?.authorization) ??
    request.cookies?.['refreshToken'] ??
    request.cookies?.['refresh_token']
  );
};

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RefreshTokenRequest>();
    const refreshToken = getRefreshToken(request);

    if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
      throw new BadRequestException('refreshToken is required');
    }

    return super.canActivate(context);
  }
}
