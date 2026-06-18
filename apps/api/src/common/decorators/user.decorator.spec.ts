import { User, getUserFromContext } from './user.decorator';

describe('User decorator', () => {
  function mockContext(user?: any) {
    const req: any = { user };
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as any;

    return ctx;
  }

  it('returns full user when no data provided', () => {
    const user = { sub: 'u1', email: 'a@b', role: 'ADMIN' };
    const ctx = mockContext(user);

    const res = getUserFromContext(undefined, ctx as any);

    expect(res).toEqual(user);
  });

  it('returns undefined when request has no user', () => {
    const ctx = mockContext(undefined);

    const res = getUserFromContext(undefined, ctx as any);

    expect(res).toBeUndefined();
  });
});
