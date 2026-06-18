import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { jwtConfiguration } from '../../config';

type AuthenticatedUser = {
  sub: string;
  email: string;
  role?: UserRole;
};

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfiguration.KEY)
    private readonly jwtConfig: ConfigType<typeof jwtConfiguration>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);

    if (!token) {
      return true;
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthenticatedUser>(
        token,
        {
          secret: this.jwtConfig.secret,
        },
      );

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      return request.cookies?.['accessToken'];
    }

    if (!authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const token = authorizationHeader.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return token;
  }
}
