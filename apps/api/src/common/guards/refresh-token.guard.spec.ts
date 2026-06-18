import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { RefreshTokenGuard } from './refresh-token.guard';

describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;

  beforeEach(() => {
    jest.restoreAllMocks();
    guard = new RefreshTokenGuard();
  });

  function mockContext({
    body = {},
    cookies = {},
    headers = {},
  }: {
    body?: Record<string, unknown>;
    cookies?: Record<string, unknown>;
    headers?: Record<string, unknown>;
  } = {}) {
    const req = { body, cookies, headers };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext;
  }

  it('throws bad request when refreshToken is missing from body', () => {
    expect(() => guard.canActivate(mockContext())).toThrow(BadRequestException);
  });

  it('throws bad request when refreshToken is blank', () => {
    expect(() =>
      guard.canActivate(mockContext({ body: { refreshToken: '   ' } })),
    ).toThrow(BadRequestException);
  });

  it('throws bad request when refreshToken is not a string', () => {
    expect(() =>
      guard.canActivate(mockContext({ body: { refreshToken: 123 } })),
    ).toThrow(BadRequestException);
  });

  it('delegates to passport guard when refreshToken is present', () => {
    const passportCanActivate = jest
      .spyOn(Object.getPrototypeOf(RefreshTokenGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    const ctx = mockContext({ body: { refreshToken: 'refresh-token' } });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(passportCanActivate).toHaveBeenCalledWith(ctx);
  });

  it('delegates to passport guard when refreshToken cookie is present', () => {
    const passportCanActivate = jest
      .spyOn(Object.getPrototypeOf(RefreshTokenGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    const ctx = mockContext({ cookies: { refreshToken: 'refresh-cookie' } });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(passportCanActivate).toHaveBeenCalledWith(ctx);
  });
});
