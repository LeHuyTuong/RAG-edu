# Shared Tokens

Design tokens for AI Study Hub live in `packages/tokens`. Treat that package as the canonical source for color, spacing, radius, typography, and semantic aliases.

## What the package exports

- `colors` for primitive light and dark palettes
- `semanticColors` for app-facing names such as `text`, `background`, and `backgroundElement`
- `spacing` and `radius` for shared layout values
- `fontFamilies` and `typography` for consistent type scales
- `createWebThemeStyles()` for exposing web CSS variables from the shared token set

## Mobile usage

Import shared tokens from `@repo/tokens` inside mobile code when the value is not platform-specific.

```ts
import { semanticColors, spacing, radius } from "@repo/tokens";
```

Keep platform-only concerns in app-local adapter files such as `apps/mobile/src/constants/theme.ts`:

- safe-area values
- `Platform.select(...)` font fallbacks
- tab inset and other device-specific constants

## Web usage

Expose the shared palette once in `apps/web/app/layout.tsx`:

```ts
import { createWebThemeStyles } from "@repo/tokens/web";
```

Then consume the generated CSS variables from styles in `apps/web/app/globals.css` or component styles:

- `var(--background)`
- `var(--foreground)`
- `var(--surface)`
- `var(--primary)`

## Related docs

- [Design system](DESIGN.md)
- [Project overview](PROJECT_OVERVIEW.md)
- [Mobile app guide](../mobile/README.md)
- [Web app guide](../web/README.md)
