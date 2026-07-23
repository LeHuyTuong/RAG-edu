# Feature-Based Auth Refactor Design

**Date:** 2026-07-23  
**Scope:** Frontend `apps/web`, first vertical slice: `auth` plus shared foundation

## Goal

Refactor the authentication slice into a feature-based structure while preserving the existing login/register UI, route URLs, API behavior, and navigation behavior. Server state must be managed by React Query, client/session state by Zustand or local React state, and components must not call API clients directly.

## Constraints

- Do not change the visual structure, labels, spacing, colors, or responsive behavior of the existing login and register screens.
- Keep `/login` and `/register` route URLs unchanged.
- Use the current Spring Boot API as the source of truth.
- Do not expose frontend features whose backend endpoints do not exist.
- Do not migrate library, document, upload/RAG, admin, or moderator features in this slice; establish conventions that later slices can reuse.
- Preserve the existing Axios response unwrapping and refresh-token behavior.
- Keep the existing access-token persistence behavior for this refactor; a separate security hardening task can revisit storage strategy.

## Current Backend Auth Contract

The first slice supports only the endpoints currently implemented by the backend:

- `POST /api/v1/auth/signin` (login)
- `POST /api/v1/auth/signup` (register)
- `POST /api/v1/auth/refresh` (refresh access token)
- `POST /api/v1/auth/logout` (logout)
- `GET /api/v1/auth/me` (current user)

The frontend must stop presenting or routing to unsupported auth features:

- Google login/register
- Forgot password
- Reset password
- Verify email
- Change password, unless an existing backend endpoint is confirmed before implementation

Removing an unsupported feature includes its visible links/buttons, route wrapper, route configuration entry, endpoint constant, and dead API function where no remaining consumer exists.

## Proposed Architecture

### Feature boundary

Create a new feature root rather than expanding the existing cross-cutting `src/modules` directory:

```text
apps/web/src/features/auth/
├── api/
│   └── auth.api.ts
├── components/
│   ├── LoginView.tsx
│   └── RegisterView.tsx
├── guards/
│   ├── AuthGuard.tsx
│   └── role.guard.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useCurrentUser.ts
│   ├── useLogin.ts
│   └── useRegister.ts
├── lib/
│   ├── auth.mapper.ts
│   └── auth.redirect.ts
├── store/
│   └── auth.store.ts
├── types.ts
└── index.ts
```

The Next.js route files under `src/app/(auth)` remain thin wrappers. The existing `LoginPageClient.tsx` and `RegisterPageClient.tsx` UI will move into feature components without changing their rendered markup. Their form behavior will be delegated to feature hooks.

### State ownership

React Query owns server state:

- `['auth', 'me']` query for the current user
- login and register mutations
- query loading/error state
- cache updates and invalidation after auth transitions

Zustand owns client/session state:

- `accessToken`
- login prompt visibility
- explicit session reset/logout state

The authenticated user will no longer be the authoritative state in Zustand. `useAuth()` will combine the Zustand token/session state with the React Query current-user query so consuming components do not depend on implementation details.

After login:

1. The login mutation calls `auth.api.ts`.
2. The returned access token is stored in the auth store.
3. The current user is fetched from `/me` and written to the `['auth', 'me']` cache.
4. The existing role-based redirect logic is applied.

After register:

1. The register mutation calls `/signup`.
2. The existing auto-login behavior calls `/signin`.
3. The token is stored and `/me` is loaded through the query layer.
4. The existing redirect target is preserved.

After logout:

1. The logout mutation attempts the backend logout with toast suppression.
2. The local auth store is cleared regardless of server response.
3. The `['auth', 'me']` query is removed.

### Shared foundation

Add the minimum cross-cutting infrastructure required by the first slice:

- Add `@tanstack/react-query` to `apps/web/package.json`.
- Add a root `QueryClientProvider` with a stable client instance.
- Keep the existing Axios client as the shared HTTP transport, moving it behind a shared API boundary only where this slice needs it.
- Move the global stylesheet from `src/app/globals.css` to `src/styles/globals.css` without modifying CSS content, then update the root layout import.
- Add the missing Vitest setup file so existing utility tests can collect.

The existing `src/shared` directory remains the home for system-wide endpoint constants, API primitives, common types, and providers. Feature-specific API types, query keys, mappers, and hooks stay inside `src/features/auth`.

## Route and UI Changes

The following UI elements/routes will be removed because their backend behavior is unavailable:

- Google login anchor on the login screen
- Google registration anchor on the register screen
- Forgot-password route and links
- Reset-password route and links
- Verify-email route and links
- Any auth endpoint constants/functions left unused after this removal

Login and register retain their current form fields, validation messages, loading labels, error presentation, buttons, and redirect behavior. No new visual component library or styling system is introduced.

## Error Handling

- API functions normalize backend errors into typed/auth-specific errors where needed.
- Mutation hooks expose `isPending` and `error` to the form views.
- Existing Vietnamese login/register messages remain unchanged.
- Existing Axios interceptor behavior remains responsible for refresh and global non-auth error toasts.
- Login/register errors must remain local to their forms and must not be shown as duplicate global toasts.

## Testing Strategy

Tests are added before implementation for each behavior being moved:

- Pure tests for safe redirect selection and role redirect behavior.
- API mapping tests for backend account data to the frontend `User` type.
- Auth store tests for setting token and clearing session state.
- Hook tests for login/register success and error transitions, using the real hook logic with a mocked transport boundary.
- Component tests verifying existing login/register form behavior and that unsupported Google controls are absent.
- Existing document preview/download/upload utility tests must become collectable through the new Vitest setup.

The slice is accepted only when the targeted tests pass, TypeScript passes for the web app, and the existing lint command does not introduce new errors. UI preservation is checked through component tests and a manual or E2E smoke check of `/login` and `/register` when backend services are available.

## Migration and Compatibility

- Route wrappers remain stable so Next.js URLs do not change.
- Shared imports used by non-auth features are not moved in bulk during this slice.
- If an existing consumer still needs an auth symbol temporarily, `src/modules/auth-api.ts` or the old store path may re-export the feature implementation; those compatibility exports must not contain duplicate logic.
- Each future vertical slice follows the same pattern: feature-local API/hooks/components, shared infrastructure only for genuinely cross-feature concerns, and route wrappers that contain no data-fetching logic.

## Acceptance Criteria

- Login and register render the same interface and preserve current successful/error flows.
- No unsupported auth control or route is exposed.
- Components do not import `apiClient`, Axios, or endpoint constants directly for auth operations.
- Current-user server state is read through React Query.
- Access-token/session state is read and changed through the auth Zustand store.
- Auth route protection uses the feature auth hook/guard rather than directly parsing localStorage in the component.
- Global CSS is loaded from `src/styles/globals.css`.
- Existing Vitest files can be collected instead of failing on a missing setup file.
- No changes are made to the library/document/upload/RAG/admin/moderator UI in this slice.
