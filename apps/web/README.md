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

The web app keeps the implementation split between route wrappers and feature modules. The route files stay thin, while the real page logic, data handling, and UI composition live in `src/modules/`.

### Folder Structure

```text
src/
├── app/                        # App Router route files only
│   ├── (auth)/                 # Auth route group; URLs are unchanged
│   ├── (main)/                 # Protected/main app route group
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Public home page
│   └── globals.css             # Global styles
├── modules/                    # Feature modules and page implementations
├── components/                 # Reusable UI components
├── config/                     # App config and route helpers
├── constants/                  # App constants
├── routes/                     # Route definitions, guards, and helpers
├── types/                      # TypeScript types and interfaces
├── utils/                      # Utility functions
├── hooks/                      # Custom React hooks
├── stores/                     # State management
├── lib/                        # Shared library helpers
└── mockdata/                   # Mock data for development
```

### Core Conventions

- Put page-level business logic in [src/modules/](./src/modules) and keep route files in the App Router as wrappers.
- Use `src/app/(auth)/` for route-grouped pages that should share auth-specific layout or routing behavior without changing the URL.
- Keep reusable UI in [src/components/](./src/components) and shared helpers in [src/lib/](./src/lib), [src/utils/](./src/utils), and [src/hooks/](./src/hooks).
- Centralize API access in feature API modules such as [src/modules/auth-api.ts](./src/modules/auth-api.ts) instead of calling backend endpoints directly from pages.
- Keep app-wide constants, route helpers, and typed config in [src/config/](./src/config), [src/constants/](./src/constants), and [src/shared/](./src/shared).

## Import Paths

Use the aliases defined in `tsconfig.json`.

```ts
import type { User, Document } from "@/types";
import { API_ENDPOINTS } from "@/shared/constants";
import { USER_NAV_ITEMS } from "@/constants/nav.const";
import { APP_CONFIG, ROUTE_PATHS } from "@/config";
import { getRoute, requiresAuth } from "@/config/routes";
import { validateEmail, truncate } from "@/utils";
import { fetchAPI, cn } from "@/lib";
import { login, register } from "@/modules/auth-api";
import { MOCK_DOCUMENTS } from "@/mockdata";
import SearchBar from "@/components/SearchBar";
import "@/modules/user/login/page";
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

1. Create or update the page logic in [src/modules/](./src/modules).
2. Add or update the thin route wrapper in [src/app/(auth)/](<./src/app/(auth)>) or the relevant App Router folder.
3. Add feature API calls under [src/modules/](./src/modules) and shared config in [src/config/](./src/config).
4. Add or update types in [src/types/](./src/types) and utilities in [src/utils/](./src/utils).
5. Keep shared UI in [src/components/](./src/components) and theme usage aligned with [src/app/globals.css](./src/app/globals.css).
6. If the route or guard behavior changes, update [src/routes/README.md](./src/routes/README.md).

This is the Next.js web app for AI Study Hub. It consumes shared design tokens from `@repo/tokens`, keeps feature logic in route modules, and uses the App Router for the public, auth, and protected experience.

## Shared Design Tokens

Use `@repo/tokens` for colors, spacing, radius, typography, and other shared values.

- Keep web-only theme bootstrapping in [src/app/layout.tsx](./src/app/layout.tsx).
- Use the CSS variables exposed by `createWebThemeStyles()` in [src/app/globals.css](./src/app/globals.css) and component styles.
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
