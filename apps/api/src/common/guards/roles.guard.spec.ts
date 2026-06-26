import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { createMockExecutionContext } from '../utils/test-utils';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = new Reflector();

  beforeEach(() => {
    guard = new RolesGuard(reflector);
    jest.clearAllMocks();
  });

  function mockContext(userRole: unknown, requiredRoles: unknown[] | null) {
    const { ctx, req } = createMockExecutionContext({
      user: { role: userRole },
    });

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
