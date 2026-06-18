import { registerAs } from '@nestjs/config';

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const emailVerificationConfiguration = registerAs(
  'emailVerification',
  () => ({
    codeLength: parsePositiveInt(process.env.EMAIL_VERIFICATION_CODE_LENGTH, 6),
    ttlSeconds: parsePositiveInt(
      process.env.EMAIL_VERIFICATION_TTL_SECONDS,
      10 * 60, // 10 minutes
    ),
    resendCooldownSeconds: parsePositiveInt(
      process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
      60,
    ),
    maxAttempts: parsePositiveInt(
      process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS,
      5,
    ),
  }),
);
