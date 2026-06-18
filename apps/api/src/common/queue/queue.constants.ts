export const QUEUE_NAMES = {
  mail: 'mail',
} as const;

export const DEFAULT_QUEUE_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
} as const;
