import { NodeEnv } from '../enums';

export const APP_DEFAULTS = {
  NODE_ENV: NodeEnv.Development,
  APP_NAME: 'AI Study Hub',
  APP_PORT: 8080,
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
};
