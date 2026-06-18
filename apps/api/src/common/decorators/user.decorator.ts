import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export const getUserFromContext = (
  data: keyof AuthenticatedRequest['user'] | undefined,
  ctx: ExecutionContext,
) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (data) {
    return request.user?.[data];
  }
  return request.user;
};

export const User = createParamDecorator(getUserFromContext);
