import { registerAs } from '@nestjs/config';

export const getCookieConfig = () => ({
  accessTokenMaxAge:
    +(process.env.COOKIE_ACCESS_TOKEN_MAX_AGE as string) || 1000 * 60 * 60 * 24, // 1 day
  refreshTokenMaxAge:
    +(process.env.COOKIE_REFRESH_TOKEN_MAX_AGE as string) ||
    7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
  secure: process.env.COOKIE_SECURE !== 'false',
  sameSite:
    (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
});

export const cookieConfiguration = registerAs('cookie', getCookieConfig);
