import { registerAs } from '@nestjs/config';

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === 'true';
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const mailConfiguration = registerAs('mail', () => ({
  smtpHost: process.env.MAILTRAP_SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  smtpPort: parsePositiveInt(process.env.MAILTRAP_SMTP_PORT, 2525),
  smtpUsername: process.env.MAILTRAP_SMTP_USERNAME || '',
  smtpPassword: process.env.MAILTRAP_SMTP_PASSWORD || '',
  smtpSecure: parseBoolean(process.env.MAILTRAP_SMTP_SECURE, false),
  fromEmail: process.env.MAILTRAP_FROM_EMAIL || 'noreply@ai-study-hub.local',
  fromName: process.env.MAILTRAP_FROM_NAME || 'AI Study Hub',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
