# @repo/tokens

Shared design tokens for AI Study Hub.

## What to import

```ts
import { semanticColors, spacing, radius, typography } from "@repo/tokens";
```

For web CSS variables:

```ts
import { createWebThemeStyles } from "@repo/tokens/web";
```

## Guidance

- Use semantic aliases for app code, not raw hex values.
- Keep platform-only values in app-local adapters.
- Treat this package as the source of truth for shared design values.
