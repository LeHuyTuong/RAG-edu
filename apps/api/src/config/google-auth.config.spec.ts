import { googleAuthConfiguration } from './google-auth.config';

describe('googleAuthConfiguration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_OAUTH_STATE_TTL_SECONDS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses default state TTL when env value is missing or invalid', () => {
    expect(googleAuthConfiguration().stateTtlSeconds).toBe(600);

    for (const value of ['not-a-number', '0', '-1', '1.5']) {
      process.env.GOOGLE_OAUTH_STATE_TTL_SECONDS = value;

      expect(googleAuthConfiguration().stateTtlSeconds).toBe(600);
    }
  });

  it('uses configured state TTL when env value is a positive integer', () => {
    process.env.GOOGLE_OAUTH_STATE_TTL_SECONDS = '900';

    expect(googleAuthConfiguration().stateTtlSeconds).toBe(900);
  });
});
