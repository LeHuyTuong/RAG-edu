# OWE-14 Mail Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move auth verification and password-reset email delivery from inline request handling to BullMQ-backed Redis jobs.

**Architecture:** Auth token generation remains synchronous so API responses and token validity stay unchanged. `AuthService` enqueues typed mail jobs through a `MailQueueService`, while a mail worker consumes those jobs and delegates delivery to the existing Nodemailer-backed `MailService`.

**Tech Stack:** NestJS, BullMQ, Redis/ioredis, Jest, Nodemailer.

---

### Task 1: Queue Contracts and Auth Service Tests

**Files:**

- Create: `apps/api/src/modules/mail/mail-queue.types.ts`
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.module.ts`

- [ ] Write failing tests that expect signup, resend verification, and forgot password to call `MailQueueService` instead of `MailService`.
- [ ] Run `pnpm --filter api test -- --runInBand auth.service.spec.ts` and verify the new expectations fail.
- [ ] Add `MailQueueService` injection to `AuthService` and replace inline mail sends with enqueue calls.
- [ ] Run the focused auth service test again and verify it passes.

### Task 2: BullMQ Queue Infrastructure

**Files:**

- Create: `apps/api/src/common/queue/queue.constants.ts`
- Create: `apps/api/src/common/queue/queue.module.ts`
- Create: `apps/api/src/common/queue/queue.service.ts`
- Modify: `apps/api/src/common/redis/redis.service.ts`
- Modify: `apps/api/src/modules/mail/mail.module.ts`

- [ ] Add BullMQ to the API workspace.
- [ ] Write failing tests for queue creation/job options or mail queue enqueue behavior.
- [ ] Expose an ioredis connection suitable for BullMQ (`maxRetriesPerRequest: null`).
- [ ] Add a queue service that owns named BullMQ queues and closes them on module destroy.
- [ ] Run focused tests and verify they pass.

### Task 3: Mail Queue and Processor

**Files:**

- Create: `apps/api/src/modules/mail/mail-queue.service.ts`
- Create: `apps/api/src/modules/mail/mail.processor.ts`
- Create: `apps/api/src/modules/mail/mail-queue.service.spec.ts`
- Create: `apps/api/src/modules/mail/mail.processor.spec.ts`
- Modify: `apps/api/src/modules/mail/mail.module.ts`

- [ ] Write failing tests proving mail jobs are enqueued with attempts/backoff and the processor calls `MailService`.
- [ ] Implement `MailQueueService` for `mail.verify-email` and `mail.password-reset`.
- [ ] Implement `MailProcessor` with completed and failed job logging.
- [ ] Run focused mail tests and verify they pass.

### Task 4: Documentation and Verification

**Files:**

- Modify: `apps/docs/implementation-notes.md`
- Modify: `apps/api/README.md`

- [ ] Document that auth mail is now queued through BullMQ and requires Redis plus an in-process worker.
- [ ] Run `pnpm --filter api test -- --runInBand auth.service.spec.ts mail.service.spec.ts mail-queue.service.spec.ts mail.processor.spec.ts queue.service.spec.ts redis.service.spec.ts`.
- [ ] Run `pnpm --filter api check-types`.
- [ ] Run `pnpm --filter api lint`.
