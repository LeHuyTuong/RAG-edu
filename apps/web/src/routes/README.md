# Routes Management System

Centralized route and guard management for the AI Study Hub application.

## Overview

This folder manages:

- **Route definitions** organized by permission level
- **Route guards** for authentication and role-based access control
- **Route helpers** for dynamic route generation

## Folder Structure

```
src/routes/
├── routes.const.ts        # ROUTE_PATHS constant with all routes
├── ProtectedRoute.tsx     # Client-side route protection component
├── index.ts               # Central export point
├── USAGE.md               # Examples and usage patterns
├── README.md              # This file
├── public/
│   └── public.routes.ts   # Public routes (no auth required)
├── user/
│   ├── user.routes.ts     # Protected user routes
│   └── user.auth.routes.ts # Authentication routes (login, register, etc)
├── library/
│   └── library.routes.ts  # Library-specific routes
├── admin/
│   └── admin.routes.ts    # Admin routes (admin role required)
└── guards/
    ├── auth.guard.ts      # Authentication checks
    └── role.guard.ts      # Role-based access control
```

## Route Categories

### 1. Public Routes (`public/`)

Routes accessible to everyone **without** authentication:

- HOME (`/`)
- LIBRARY (`/library`)
- ABOUT (`/about`)
- TERMS (`/terms`)
- PRIVACY (`/privacy`)

### 2. Authentication Routes (`user/user.auth.routes.ts`)

Routes for user authentication:

- LOGIN (`/login`)
- REGISTER (`/register`)
- FORGOT_PASSWORD (`/forgot-password`)
- RESET_PASSWORD (`/reset-password/:token`)
- VERIFY_EMAIL (`/verify-email/:token`)

**Behavior**: Should redirect to home if user is already authenticated, except
`VERIFY_EMAIL`. The verify-email route must stay reachable from a signed-in
`UNVERIFIED` session so it can post the verification token, receive the fresh
`ACTIVE` access token, and replace the stale auth state before the user
continues.

### 3. Protected User Routes (`user/user.routes.ts`)

Routes requiring user authentication:

- PROFILE (`/profile`)
- SETTINGS (`/settings`)
- FAVORITES (`/favorites`)
- MY_DOCUMENTS (`/my-documents`)
- MY_UPLOADS (`/my-uploads`)
- CHANGE_PASSWORD (`/change-password`)

**Behavior**: Require valid auth token. Redirect to login if not authenticated.

### 4. Library Routes (`library/`)

Library-specific routes:

- LIBRARY (`/library`)
- LIBRARY_DETAIL (`/library/:id`)

**Behavior**: Public for browsing, but save/upload features are protected.

### 5. Admin Routes (`admin/`)

Administrative routes (requires `admin` role):

- DASHBOARD (`/admin/dashboard`)
- USERS (`/admin/users`)
- DOCUMENTS (`/admin/documents`)
- CATEGORIES (`/admin/categories`)
- REPORTS (`/admin/reports`)
- SETTINGS (`/admin/settings`)

**Behavior**: Only users with `role: 'admin'` can access. Redirect non-admin users.

## Usage Examples

### Basic Route Path

```typescript
import { ROUTE_PATHS } from "@/routes";

// Navigate to home
router.push(ROUTE_PATHS.HOME);

// Navigate to library
router.push(ROUTE_PATHS.LIBRARY);

// Navigate to login
router.push(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
```

### Dynamic Routes with Parameters

```typescript
import { getRoutePath } from "@/routes";

// Generate library detail route with ID
const detailPath = getRoutePath(ROUTE_PATHS.LIBRARY_DETAIL, { id: "123" });
// Result: '/library/123'

// Generate reset password route with token
const resetPath = getRoutePath(ROUTE_PATHS.AUTH_ROUTES.RESET_PASSWORD, {
  token: "abc123",
});
// Result: '/reset-password/abc123'
```

### Protecting Routes with Component (Client-side)

```typescript
// For public routes, no wrapper needed
export default function HomePage() {
  return <div>Welcome</div>;
}

// For protected user routes
import { ProtectedRoute } from '@/routes';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

// For admin-only routes
export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### Checking Route Access

```typescript
import { canAccessRoute, getAuthToken, getAuthUser } from "@/routes";

const token = getAuthToken();
const user = getAuthUser();

const hasAccess = canAccessRoute({
  pathname: "/profile",
  isAuthenticated: !!token && !!user,
  userRole: user?.role || "guest",
});

if (!hasAccess) {
  // Redirect to login
}
```

### Checking User Role

```typescript
import { hasRoleAccess, getRequiredRoleForRoute } from "@/routes";

const requiredRole = getRequiredRoleForRoute("/admin/dashboard");
// Returns: 'admin'

const canAccess = hasRoleAccess({
  pathname: "/admin/dashboard",
  userRole: "student",
  requiredRoles: [requiredRole],
});
// Returns: false
```

### Building Conditional Navigation

```typescript
import { getAuthUser, userRouterConfig, adminRouterConfig } from '@/routes';

function Navigation() {
  const user = getAuthUser();

  const navItems = [];

  if (!user) {
    // Show login link if not authenticated
    Object.entries(authRouterConfig).forEach(([_, route]) => {
      navItems.push(route);
    });
  } else {
    // Show user routes if authenticated
    Object.entries(userRouterConfig).forEach(([_, route]) => {
      navItems.push(route);
    });

    // Show admin routes if admin
    if (user.role === 'admin') {
      Object.entries(adminRouterConfig).forEach(([_, route]) => {
        navItems.push(route);
      });
    }
  }

  return (
    <nav>
      {navItems.map(route => (
        <Link key={route.path} href={route.path}>{route.title}</Link>
      ))}
    </nav>
  );
}
```

## Guards

### Authentication Guard (`auth.guard.ts`)

Checks if user is authenticated.

```typescript
import { canAccessRoute, getAuthRedirect } from "@/routes";

// Check if user can access route
const access = canAccessRoute({
  pathname: "/profile",
  isAuthenticated: true,
  userRole: "student",
});

// Get redirect path if access denied
const redirect = getAuthRedirect("/profile", false);
// Returns: '/login?redirect=/profile'
```

### Role Guard (`role.guard.ts`)

Checks user role for route access.

```typescript
import { hasRoleAccess, getRoleRedirect } from "@/routes";

// Check if user has required role
const access = hasRoleAccess({
  pathname: "/admin/dashboard",
  userRole: "admin",
  requiredRoles: ["admin"],
});

// Get redirect for unauthorized role
const redirect = getRoleRedirect("student");
// Returns: '/dashboard'
```

## Flow Diagram

```
Request to Route
    ↓
[Is Public Route?] → YES → Allow access
    ↓ NO
[Is Auth Route?] → YES → [Is Authenticated?] → NO → Allow (show login/register)
    ↓                                     ↓ YES
   NO                                   Redirect to home
    ↓
[Is Protected Route?] → NO → Allow access
    ↓ YES
[Is Authenticated?] → NO → Redirect to login with redirect param
    ↓ YES
[Check Role?] → NO → Allow access
    ↓ YES
[Has Required Role?] → YES → Allow access
    ↓ NO
    Redirect to role-based home (admin → /admin/dashboard, student → /dashboard)
```

## Implementation Notes

### Token Storage

- Auth token is stored in localStorage as `auth_token`
- User info is stored as `user_info` (JSON string)

### Redirect Behavior

- Unauthenticated users accessing protected routes → redirect to `/login?redirect={original-path}`
- Authenticated users accessing auth routes → redirect to `/`
- Non-admin users accessing admin routes → redirect to home based on role

### Route Guards Placement

There are multiple ways to implement guards:

1. **Component Wrapper (Recommended for Simple Cases)**

   ```typescript
   <ProtectedRoute requiredRole="admin">
     <AdminPage />
   </ProtectedRoute>
   ```

2. **Server-side Middleware (Recommended for Production)**
   See [USAGE.md](./USAGE.md) for middleware.ts example

3. **Hook-based (Recommended for Complex Logic)**
   See [USAGE.md](./USAGE.md) for useRouteAccess hook example

## Route Configuration Objects

Each route category exports a configuration object with metadata:

```typescript
export const publicRouterConfig = {
  HOME: {
    path: "/",
    title: "Trang chủ",
    public: true,
    requiresAuth: false,
  },
  LIBRARY: {
    path: "/library",
    title: "Thư viện",
    public: true,
    requiresAuth: false,
  },
} as const;
```

These can be used to:

- Build navigation menus dynamically
- Display route titles
- Check route requirements programmatically

## Adding New Routes

### To Add a Public Route

1. Add to `ROUTE_PATHS` in `routes.const.ts`
2. Add to `PUBLIC_ROUTES` array in `public/public.routes.ts`
3. Add config to `publicRouterConfig`
4. Export from `index.ts` (if using new file)

### To Add a Protected Route

1. Add to `ROUTE_PATHS.PROTECTED_ROUTES` in `routes.const.ts`
2. Add to `USER_PROTECTED_ROUTES` in `user/user.routes.ts`
3. Add config to `userRouterConfig`
4. Create page in `src/modules/`
5. Wrap with `<ProtectedRoute>` or implement in middleware

### To Add an Admin Route

1. Add to `ROUTE_PATHS.ADMIN_ROUTES` in `routes.const.ts`
2. Add to `ADMIN_ROUTES` in `admin/admin.routes.ts`
3. Add config to `adminRouterConfig`
4. Wrap with `<ProtectedRoute requiredRole="admin">`

## Testing Routes

```typescript
// Test if route is public
import { PUBLIC_ROUTES } from "@/routes";
expect(PUBLIC_ROUTES).toContain("/");

// Test if route is protected
import { USER_PROTECTED_ROUTES } from "@/routes";
expect(USER_PROTECTED_ROUTES).toContain("/profile");

// Test guard logic
import { canAccessRoute } from "@/routes";
expect(
  canAccessRoute({
    pathname: "/profile",
    isAuthenticated: false,
  }),
).toBe(false);
```

## Related Files

- `src/types/index.ts` - User type definitions
- `src/config/index.ts` - App configuration
- `src/modules/` - Page components
- `middleware.ts` - Server-side route protection (if implemented)

## Future Enhancements

- [ ] Permission-based guards (not just role-based)
- [ ] Multi-level role hierarchy (super-admin, moderator, etc.)
- [ ] Route breadcrumb generation
- [ ] Route-based feature flags
- [ ] Analytics tracking for route navigation
