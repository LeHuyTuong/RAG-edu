## Getting Started

Run the development server from the workspace root:

```bash
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Useful scripts:

```bash
pnpm --filter web lint
pnpm --filter web test
pnpm --filter web check-types
```

## Architecture Overview

The web app keeps Next.js route files thin. Feature-owned UI, API functions, and server-state hooks live together, while shared infrastructure stays outside of features.

### Feature boundaries

- `src/features/<feature>` owns feature API functions, React Query hooks, local UI components, and feature-only types.
- `src/shared` contains cross-feature HTTP infrastructure, endpoint constants, providers, and system-wide utilities.
- React Query owns server state. Zustand owns client/session state such as the access token and UI-only flags.
- `src/app` keeps Next.js route wrappers thin; routes do not fetch feature data directly.

`src/features/auth` is the reference slice for this convention.

### Folder Structure

```text
src/
├── app/                        # App Router route files only
│   ├── (auth)/                 # Auth route group; URLs are unchanged
│   ├── (main)/                 # Protected/main app route group
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Public home page
├── features/                   # Vertical slices (auth is the reference)
│   └── auth/                   # API, query hooks, views, guards, types
├── shared/                     # Shared API client, providers, constants
├── styles/                     # Global styles
│   └── globals.css
├── modules/                    # Existing feature/page implementations being migrated
├── components/                 # Reusable UI components
├── config/                     # App config and route helpers
├── constants/                  # App constants
├── routes/                     # Route definitions, guards, and helpers
├── types/                      # TypeScript types and interfaces
├── utils/                      # Utility functions
├── hooks/                      # Cross-feature client hooks
├── stores/                     # Compatibility exports / client state
├── lib/                        # Compatibility helpers
└── mockdata/                   # Mock data for development
```

### Core Conventions

- Put new feature business logic in [src/features/](./src/features) and keep route files in the App Router as wrappers.
- Use `src/app/(auth)/` for route-grouped pages that should share auth-specific layout or routing behavior without changing the URL.
- Keep reusable UI in [src/components/](./src/components), cross-feature hooks in [src/hooks/](./src/hooks), and shared utilities in [src/shared/](./src/shared) or [src/utils/](./src/utils).
- Centralize backend calls in each feature's `api/` folder. Views consume feature hooks instead of calling endpoints directly.
- Keep app-wide constants, providers, and API infrastructure in [src/shared/](./src/shared); keep global CSS in [src/styles/](./src/styles).

## Import Paths

Use the aliases defined in `tsconfig.json`.

```ts
import type { User, Document } from "@/types";
import { API_ENDPOINTS } from "@/shared/constants";
import { USER_NAV_ITEMS } from "@/constants/nav.const";
import { APP_CONFIG, ROUTE_PATHS } from "@/config";
import { validateEmail, truncate } from "@/utils";
import { useAuth, useLogin } from "@/features/auth";
import { apiClient } from "@/shared/api/api-client";
import { MOCK_DOCUMENTS } from "@/mockdata";
import SearchBar from "@/components/SearchBar";
```

## Routes and Access Control

Route definitions, guards, and helpers live in [src/routes/](./src/routes). Keep navigation logic there rather than scattering route strings across features.

- Public routes are accessible without auth.
- User-protected routes require a valid auth token.
- Admin routes require the `admin` role.
- Use the route helpers from [src/routes/README.md](./src/routes/README.md) for path generation, protection, and access checks.

### Common usage

```ts
import { ROUTE_PATHS, getRoutePath, ProtectedRoute } from "@/routes";

router.push(ROUTE_PATHS.HOME);
router.push(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
const detailPath = getRoutePath(ROUTE_PATHS.LIBRARY_DETAIL, { id: "123" });
```

## Development Workflow

1. Create or update the feature API, hooks, and UI in [src/features/](./src/features).
2. Add or update the thin route wrapper in [src/app/(auth)/](<./src/app/(auth)>) or the relevant App Router folder.
3. Add shared cross-feature infrastructure under [src/shared/](./src/shared) only when it has more than one consumer.
4. Add or update types in [src/types/](./src/types) and utilities in [src/utils/](./src/utils).
5. Keep shared UI in [src/components/](./src/components) and theme usage aligned with [src/styles/globals.css](./src/styles/globals.css).
6. If the route or guard behavior changes, update [src/routes/README.md](./src/routes/README.md).

This is the Next.js web app for AI Study Hub. It consumes shared design tokens from `@repo/tokens`, keeps feature logic in route modules, and uses the App Router for the public, auth, and protected experience.

## Shared Design Tokens

Use `@repo/tokens` for colors, spacing, radius, typography, and other shared values.

- Keep web-only theme bootstrapping in [src/app/layout.tsx](./src/app/layout.tsx).
- Use the CSS variables exposed by `createWebThemeStyles()` in [src/styles/globals.css](./src/styles/globals.css) and component styles.
- Prefer shared tokens over app-local magic numbers so the web app stays aligned with the rest of the workspace.

Example:

```ts
import { createWebThemeStyles } from "@repo/tokens/web";
```

## Related Docs

- [Project overview](../docs/PROJECT_OVERVIEW.md)
- [Design system](../docs/DESIGN.md)
- [Shared tokens](../docs/SHARED_TOKENS.md)
- [Route management](./src/routes/README.md)
- [Page development guide](../docs/PAGE_DEVELOPMENT_GUIDE.md)
