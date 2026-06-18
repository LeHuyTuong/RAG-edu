import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  const reflector = new Reflector();
  const jwtService = { verifyAsync: jest.fn() } as unknown as JwtService;
  const jwtConfig = { secret: 'secret' };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(jwtService, jwtConfig as any, reflector as any);
  });

  function mockContext(
    headers: Record<string, string | undefined>,
    isPublic = false,
    cookies: Record<string, string | undefined> = {},
  ) {
    const req: any = { headers, cookies };
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    if (isPublic) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    } else {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    }

    return { ctx, req };
  }

  it('allows when route is public', async () => {
    const { ctx } = mockContext({}, true);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws when missing authorization header', async () => {
    const { ctx } = mockContext({}, false);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('verifies token and attaches user', async () => {
    const token = 'valid-token';
    jwtService.verifyAsync = jest
      .fn()
      .mockResolvedValue({ sub: 'u1', email: 'a@b' });

    const { ctx, req } = mockContext(
      { authorization: `Bearer ${token}` },
      false,
    );

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
      secret: jwtConfig.secret,
    });
    expect(req.user).toEqual({ sub: 'u1', email: 'a@b' });
  });

  it('falls back to access token cookie for web requests', async () => {
    const token = 'cookie-token';
    jwtService.verifyAsync = jest
      .fn()
      .mockResolvedValue({ sub: 'u1', email: 'a@b' });

    const { ctx, req } = mockContext({}, false, { accessToken: token });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
      secret: jwtConfig.secret,
    });
    expect(req.user).toEqual({ sub: 'u1', email: 'a@b' });
  });

  it('throws on invalid token', async () => {
    const token = 'bad-token';
    jwtService.verifyAsync = jest.fn().mockRejectedValue(new Error('invalid'));

    const { ctx } = mockContext({ authorization: `Bearer ${token}` }, false);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
