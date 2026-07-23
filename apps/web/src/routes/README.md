# Route Management

This folder centralizes route constants and access metadata. App Router pages
remain the source of URL handling; these modules are used by navigation and
feature guards.

## Structure

```text
src/routes/
├── router.const.ts          # ROUTE_PATHS and getRoutePath
├── ProtectedRoute.tsx       # Compatibility re-export of the auth feature guard
├── GuestRoute.tsx           # Redirects signed-in users away from auth pages
├── public/                  # Public route metadata
├── user/                    # Authentication and protected-user metadata
├── library/                 # Library route metadata
├── admin/                   # Admin route metadata
└── guards/role.guard.ts     # Compatibility re-export of role helpers
```

## Route categories

### Public

Public routes include `/`, `/library`, `/about`, `/terms`, and `/privacy`.
Browsing a library item is public; protected actions remain feature-specific.

### Authentication

The backend currently supports only these auth routes:

- `/login`
- `/register`

`GuestRoute` redirects an authenticated user from either route to `/home`.
Password reset, email verification, and third-party sign-in are not exposed
until their backend endpoints exist.

### Protected user routes

User routes include `/home`, `/profile`, `/settings`, `/uploads`,
`/favorites`, `/my-documents`, and `/my-uploads`. They require a valid session.

### Role routes

Admin and moderator routes require the matching role returned by `/api/v1/auth/me`.

## Access guards

`ProtectedRoute` is implemented by `src/features/auth/guards/ProtectedRoute`.
It gets the current account through the React Query-backed `useAuth()` hook and
uses Zustand only for the persisted access token. It waits for the current-user
query before deciding whether to render or redirect.

```tsx
import { ProtectedRoute } from "@/routes";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

## Route helpers

Use `ROUTE_PATHS` instead of repeating known paths. Use `getRoutePath` only for
templates that include a parameter.

```ts
import { getRoutePath, ROUTE_PATHS } from "@/routes";

router.push(ROUTE_PATHS.AUTH_ROUTES.LOGIN);

const documentPath = getRoutePath(ROUTE_PATHS.LIBRARY_DETAIL, { id: "123" });
// /library/123
```

## Adding routes

1. Add the path to `ROUTE_PATHS` in `router.const.ts`.
2. Add metadata to the matching category (`public`, `user`, `library`, or `admin`).
3. Add a thin App Router wrapper in `src/app`.
4. Keep data fetching and feature-specific authorization inside the owning feature.
5. Update this document when access behavior changes.
