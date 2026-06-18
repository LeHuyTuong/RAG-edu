# Admin Module Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor admin-only API behavior into a dedicated `AdminModule` while preserving the existing account and subject route contract.

**Architecture:** `AdminModule` owns admin-only controllers and dashboard aggregation. `AccountsService` and `SubjectsService` remain the source of account and subject persistence logic. Existing public subject reads and user self-service account routes stay in their current controllers.

**Tech Stack:** NestJS, Prisma MongoDB, Jest, TypeScript.

---

## File Structure

- Create `apps/api/src/modules/admin/admin.module.ts` to register admin controllers and service.
- Create `apps/api/src/modules/admin/admin.service.ts` for dashboard aggregate counts.
- Create `apps/api/src/modules/admin/admin.service.spec.ts` for dashboard aggregation tests.
- Create `apps/api/src/modules/admin/admin-accounts.controller.ts` for admin account routes using `AccountsService`.
- Create `apps/api/src/modules/admin/admin-accounts.controller.spec.ts` for admin account controller tests.
- Create `apps/api/src/modules/admin/admin-subjects.controller.ts` for admin subject mutation routes using `SubjectsService`.
- Create `apps/api/src/modules/admin/admin-subjects.controller.spec.ts` for admin subject controller tests.
- Modify `apps/api/src/modules/accounts/accounts.controller.ts` so it keeps only user self-service account routes.
- Modify `apps/api/src/modules/accounts/accounts.controller.spec.ts` for the reduced controller surface.
- Modify `apps/api/src/modules/subjects/subjects.controller.ts` so it keeps only public subject read routes.
- Modify `apps/api/src/modules/subjects/subjects.controller.spec.ts` for the reduced controller surface.
- Modify `apps/api/src/app.module.ts` to import `AdminModule`.
- Modify `apps/docs/superpowers/specs/2026-06-12-admin-module-refactor-design.md` to state route compatibility explicitly.
- Modify `implmentation_notes.md` with the implementation decision and tradeoff.

## Tasks

### Task 1: Lock Route Compatibility

- [x] Update the design doc so account admin endpoints remain under `/api/v1/accounts` and subject admin mutations remain under `/api/v1/subjects`.
- [x] Add a note explaining that `AdminModule` owns controller registration, not a new URL namespace for this pass.

### Task 2: Write Red Tests

- [x] Add `AdminService` tests for account, subject, and document aggregate counts.
- [x] Add `AdminAccountsController` tests that call `create`, `findAll`, `findOne`, and `ban` through `AccountsService`.
- [x] Add `AdminSubjectsController` tests that call `create`, `update`, and `remove` through `SubjectsService`.
- [x] Update existing account controller tests to assert only user self-service handlers remain.
- [x] Update existing subject controller tests to assert only public read handlers remain.
- [x] Run focused tests and confirm they fail because the admin module files do not exist yet.

### Task 3: Implement Admin Module

- [x] Add `AdminModule`, import `AccountsModule`, `SubjectsModule`, and `PrismaModule`.
- [x] Add `AdminService.getDashboardStats()`.
- [x] Add `AdminAccountsController` with `@Controller('accounts')`, admin guards, and current route handlers.
- [x] Add `AdminSubjectsController` with `@Controller('subjects')`, admin guards, and current mutation handlers.
- [x] Remove admin handlers from `AccountsController` and `SubjectsController`.
- [x] Import `AdminModule` in `AppModule`.

### Task 4: Verify and Document

- [x] Run focused API tests for admin, accounts, and subjects.
- [x] Run API typecheck.
- [x] Update `implmentation_notes.md` with route compatibility and dashboard aggregation decisions.
