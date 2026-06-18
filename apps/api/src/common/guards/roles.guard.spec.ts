import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = new Reflector();

  beforeEach(() => {
    guard = new RolesGuard(reflector as any);
    jest.clearAllMocks();
  });

  function mockContext(userRole: any, requiredRoles: any[] | null) {
    const req: any = { user: { role: userRole } };
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

    return { ctx, req };
  }

  it('allows when no roles required', () => {
    const { ctx } = mockContext(undefined, null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when user has required role', () => {
    const { ctx } = mockContext('ADMIN', ['ADMIN']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws when user lacks role', () => {
    const { ctx } = mockContext('USER', ['ADMIN']);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
