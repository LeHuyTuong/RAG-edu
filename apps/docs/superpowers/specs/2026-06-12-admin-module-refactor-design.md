# Admin Module Refactor Design

Date: 2026-06-12

## Context

The API currently mixes admin-only actions with public or self-service routes:

- `AccountsController` handles admin account management and user self-service in the same controller.
- `SubjectsController` mixes admin CRUD with public read routes.
- The Web Admin dashboard still needs backend-backed summary data.

The goal of this refactor is to introduce a clearer admin boundary without breaking the existing public routes that the app already uses for subject browsing and document upload.

## Goals

- Add a dedicated `AdminModule` for admin-only API concerns.
- Keep public subject read routes available for user flows such as document upload.
- Keep user self-service account routes separate from admin account operations.
- Put dashboard aggregation logic in `AdminService`.
- Reuse existing domain services instead of duplicating persistence logic.

## Non-Goals

- Do not change the public subject read contract unless a later product decision requires it.
- Do not add new storage tables or audit-log infrastructure for dashboard activity.
- Do not redesign auth or document moderation in this refactor.
- Do not move the existing account and subject admin route paths in this pass.

## Proposed Module Layout

### `AdminModule`

New Nest module under `apps/api/src/modules/admin`.

Dependencies:

- `AccountsModule` for account mutations and reads.
- `SubjectsModule` for subject mutations.
- `PrismaModule` for dashboard aggregation queries.

Exports:

- None required for the first pass.

### Controllers

#### `AdminDashboardController`

Responsibility:

- Serve dashboard summary data for the Admin web UI.

Route shape:

- `GET /api/v1/admin/dashboard`

#### `AdminAccountsController`

Responsibility:

- Handle admin account management actions.
- Delegate to `AccountsService` for create/list/detail/ban.

Route shape:

- `POST /api/v1/accounts`
- `GET /api/v1/accounts`
- `GET /api/v1/accounts/:id`
- `PATCH /api/v1/accounts/:accountId/ban`

#### `AdminSubjectsController`

Responsibility:

- Handle admin subject mutations.
- Delegate to `SubjectsService` for create/update/delete.

Route shape:

- `POST /api/v1/subjects`
- `PATCH /api/v1/subjects/:id`
- `DELETE /api/v1/subjects/:id`

### Existing Controllers After Refactor

#### `AccountsController`

Keep only user self-service routes:

- `PATCH /api/v1/accounts/:id`
- `DELETE /api/v1/accounts/:id`

#### `SubjectsController`

Keep only public read routes used by users and document upload:

- `GET /api/v1/subjects`
- `GET /api/v1/subjects/:id`

This keeps the public read surface stable and moves controller ownership into `AdminModule` without breaking existing Web API clients.

## Dashboard Data Contract

`AdminService` should expose one aggregate method for the dashboard, for example `getDashboardStats()`.

The first version should return backend-backed counts that already exist in current models:

- total accounts excluding deleted and admin accounts
- active accounts
- banned accounts
- unverified accounts
- total subjects
- total documents
- active documents
- pending documents
- rejected documents

Anything that depends on an audit trail or operational telemetry, such as recent admin activity or system health, should stay out of this first pass unless a real backend source already exists.

## Data Flow

1. The Admin web UI calls `GET /api/v1/admin/dashboard`.
2. `AdminDashboardController` delegates to `AdminService`.
3. `AdminService` uses `PrismaService` to compute aggregate counts.
4. `AdminAccountsController` and `AdminSubjectsController` call the existing domain services for mutations.
5. Public and self-service controllers keep their current contracts, so existing user flows do not need to change.

## Route and Guard Model

- Admin controllers should be protected by `JwtAuthGuard`, `RolesGuard`, and `Roles(UserRole.ADMIN)`.
- Public subject reads should remain accessible without admin privilege.
- User self-service account routes should continue to enforce ownership checks in `AccountsService`.

## Tradeoffs

### Why separate admin controllers instead of one mixed controller?

It keeps authorization boundaries obvious. Public read, self-service, and admin-only mutation paths stop sharing a single controller surface.

### Why keep existing account and subject admin route paths?

The current Web Admin client already calls `/api/v1/accounts` for account management and `/api/v1/subjects` for subject mutation workflows. This refactor improves backend ownership without forcing a frontend contract migration in the same pass.

### Why keep public subject reads outside `AdminModule`?

Those routes are already used by the document upload flow. Moving them would add churn with little benefit.

### Why use `AccountsService` and `SubjectsService` directly?

That avoids duplicating validation and persistence logic. The admin layer should orchestrate access, not re-implement the domain.

### Why not include dashboard activity telemetry now?

The repo does not currently have a dedicated audit-log or telemetry source that can back those cards reliably. Adding mock data back into the API would defeat the point of the refactor.

## Testing Plan

- Add unit tests for `AdminService.getDashboardStats()` with representative Prisma results.
- Add controller tests for `AdminDashboardController`, `AdminAccountsController`, and `AdminSubjectsController`.
- Add regression tests proving the public `SubjectsController` GET routes still work.
- Add regression tests proving the user self-service account routes still work after the admin routes move out.

## Migration Steps

1. Create `AdminModule` and the three admin controllers.
2. Move admin account methods out of `AccountsController` into `AdminAccountsController`.
3. Move admin subject mutation methods out of `SubjectsController` into `AdminSubjectsController`.
4. Keep public subject read routes in `SubjectsController`.
5. Keep self-service account routes in `AccountsController`.
6. Import `AdminModule` from `AppModule`.
7. Run targeted API tests and fix any route or guard regressions.

## Open Questions Resolved In This Design

- `AdminService` owns dashboard aggregation.
- `Admin` account banning can reuse `AccountsService`.
- Subject read routes stay public for upload-related flows.
- Admin subject CRUD means the write side lives in `AdminModule`; public read stays where it already is.
