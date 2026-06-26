import { User, getUserFromContext } from './user.decorator';
import { createMockExecutionContext } from '../utils/test-utils';

describe('User decorator', () => {
  function mockContext(user?: unknown) {
    const { ctx } = createMockExecutionContext(
      user !== undefined ? { user } : {},
    );
    return ctx;
  }

  it('returns full user when no data provided', () => {
    const user = { sub: 'u1', email: 'a@b', role: 'ADMIN' };
    const ctx = mockContext(user);

    const res = getUserFromContext(undefined, ctx);

    expect(res).toEqual(user);
  });

  it('returns undefined when request has no user', () => {
    const ctx = mockContext(undefined);

    const res = getUserFromContext(undefined, ctx);

    expect(res).toBeUndefined();
  });
});
