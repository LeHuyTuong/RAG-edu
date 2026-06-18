import { registerAs } from '@nestjs/config';

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const passwordRecoveryConfiguration = registerAs(
  'passwordRecovery',
  () => ({
    ttlSeconds: parsePositiveInt(
      process.env.PASSWORD_RECOVERY_TTL_SECONDS,
      10 * 60,
    ),
    resendCooldownSeconds: parsePositiveInt(
      process.env.PASSWORD_RECOVERY_RESEND_COOLDOWN_SECONDS,
      60,
    ),
  }),
);
