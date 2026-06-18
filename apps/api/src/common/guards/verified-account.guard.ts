import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedRequest } from '../interfaces/auth.interface';

@Injectable()
export class VerifiedAccountGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Email verification is required');
    }

    const account = await this.prismaService.accounts.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (account?.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Email verification is required');
    }

    return true;
  }
}
