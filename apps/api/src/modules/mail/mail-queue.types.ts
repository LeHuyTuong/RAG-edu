import type { accounts } from '@prisma/client';

export const MAIL_JOB_NAMES = {
  verifyEmail: 'mail.verify-email',
  passwordReset: 'mail.password-reset',
} as const;

export type MailJobName = (typeof MAIL_JOB_NAMES)[keyof typeof MAIL_JOB_NAMES];
export type MailJobAccount = Pick<accounts, 'email' | 'name'>;

export type VerificationEmailJobData = {
  type: typeof MAIL_JOB_NAMES.verifyEmail;
  account: MailJobAccount;
  token: string;
};

export type PasswordResetEmailJobData = {
  type: typeof MAIL_JOB_NAMES.passwordReset;
  account: MailJobAccount;
  token: string;
  ttlSeconds: number;
};

export type MailJobData = VerificationEmailJobData | PasswordResetEmailJobData;
