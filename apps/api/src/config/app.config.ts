import { registerAs } from '@nestjs/config';

/**
 * Get CORS origins based on environment
 * - Development: Allow all origins (true)
 * - Production: Parse comma-separated CORS_ORIGINS env var (required)
 */
const getCorsOrigins = (): boolean | string[] => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'development') {
    // Allow all origins in development
    return true;
  }

  // Production: require CORS_ORIGINS env var
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  if (!corsOriginsEnv) {
    throw new Error(
      'CORS_ORIGINS environment variable is required in production. ' +
        'Set it as a comma-separated list of allowed origins, e.g., ' +
        'https://example.com,https://mobile.example.com',
    );
  }

  return corsOriginsEnv.split(',').map((origin) => origin.trim());
};

export const getAppConfig = () => ({
  appName: process.env.APP_NAME || 'Snap Chef API',
  appPort: +(process.env.APP_PORT as string) || 8080,
  corsOrigins: getCorsOrigins(),
});

export const appConfiguration = registerAs('app', getAppConfig);
