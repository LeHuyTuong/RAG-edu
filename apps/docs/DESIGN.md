@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@import "tailwindcss";

@theme {
--color-surface: #faf8ff;
--color-surface-container-high: #e7e7f3;
--color-primary: #004ac6;
--color-surface-variant: #e1e2ed;
--color-outline: #737686;
--color-on-background: #191b23;
--color-on-tertiary-fixed: #360f00;
--color-error: #ba1a1a;
--color-primary-fixed-dim: #b4c5ff;
--color-on-secondary-fixed: #001d35;
--color-error-container: #ffdad6;
--color-on-primary-fixed: #00174b;
--color-surface-container-lowest: #ffffff;
--color-on-tertiary: #ffffff;
--color-background: #faf8ff;
--color-primary-container: #2563eb;
--color-outline-variant: #c3c6d7;
--color-on-primary-fixed-variant: #003ea8;
--color-inverse-primary: #b4c5ff;
--color-on-tertiary-container: #ffede6;
--color-surface-dim: #d9d9e5;
--color-on-secondary-container: #145283;
--color-tertiary-fixed: #ffdbcd;
--color-surface-tint: #0053db;
--color-surface-container-highest: #e1e2ed;
--color-secondary-container: #93c5fd;
--color-on-surface-variant: #434655;
--color-on-primary-container: #eeefff;
--color-tertiary: #943700;
--color-on-error: #ffffff;
--color-on-tertiary-fixed-variant: #7d2d00;
--color-surface-container-low: #f3f3fe;
--color-secondary: #2b6193;
--color-inverse-on-surface: #f0f0fb;
--color-primary-fixed: #dbe1ff;
--color-on-primary: #ffffff;
--color-surface-bright: #faf8ff;
--color-on-secondary: #ffffff;
--color-secondary-fixed-dim: #9ccaff;
--color-on-surface: #191b23;
--color-inverse-surface: #2e3039;
--color-secondary-fixed: #d0e4ff;
--color-on-error-container: #93000a;
--color-on-secondary-fixed-variant: #03497a;
--color-tertiary-container: #bc4800;
--color-tertiary-fixed-dim: #ffb596;
--color-surface-container: #ededf9;

--spacing-margin-mobile: 16px;
--spacing-container-max: 1280px;
--spacing-base: 8px;
--spacing-gutter: 24px;
--spacing-margin-desktop: 40px;

--radius-lg: 0.25rem;
--radius-xl: 0.5rem;
--radius-2xl: 1rem;
--radius-full: 0.75rem;

--font-body-md: "Inter", sans-serif;
--font-headline-lg: "Inter", sans-serif;
--font-label-md: "Inter", sans-serif;
--font-headline-md: "Inter", sans-serif;
--font-headline-lg-mobile: "Inter", sans-serif;
--font-label-sm: "Inter", sans-serif;
--font-display: "Inter", sans-serif;
--font-body-lg: "Inter", sans-serif;

--text-body-md: 16px;
--text-body-md--line-height: 1.6;
--text-body-md--font-weight: 400;

--text-headline-lg: 32px;
--text-headline-lg--line-height: 1.2;
--text-headline-lg--letter-spacing: -0.01em;
--text-headline-lg--font-weight: 700;

--text-label-md: 14px;
--text-label-md--line-height: 1.4;
--text-label-md--letter-spacing: 0.01em;
--text-label-md--font-weight: 600;

--text-headline-md: 24px;
--text-headline-md--line-height: 1.3;
--text-headline-md--font-weight: 600;

--text-headline-lg-mobile: 24px;
--text-headline-lg-mobile--line-height: 1.2;
--text-headline-lg-mobile--font-weight: 700;

--text-label-sm: 12px;
--text-label-sm--line-height: 1.4;
--text-label-sm--font-weight: 500;

--text-display: 48px;
--text-display--line-height: 1.1;
--text-display--letter-spacing: -0.02em;
--text-display--font-weight: 700;

--text-body-lg: 18px;
--text-body-lg--line-height: 1.6;
--text-body-lg--font-weight: 400;
}

body {
background: var(--color-surface);
color: var(--color-on-surface);
font-family: var(--font-body-md);
}

.material-symbols-outlined {
font-variation-settings:
"FILL" 0,
"wght" 400,
"GRAD" 0,
"opsz" 24;
}

## Brand & Style

This design system is built for a focused, high-productivity learning environment. It targets students and educators who require a low-distraction, yet modern interface for managing academic resources and AI interactions.

## Token Source Of Truth

Shared design tokens live in `packages/tokens`.

- Use that package for primitives and semantic aliases shared by web and mobile.
- Keep app-local files focused on platform adapters, not duplicate token definitions.
- Mobile-specific adaptation happens in `apps/mobile/src/constants/theme.ts`.
- Web token exposure happens in `apps/web/app/layout.tsx` and `apps/web/app/globals.css`.
- For import examples, see [SHARED_TOKENS.md](SHARED_TOKENS.md).

The visual style is **Corporate Modern with Glassmorphic influences**. It balances a deep, immersive dark theme with vibrant accents to maintain high energy without causing eye strain. The interface should feel intelligent, premium, and seamless, utilizing subtle transparency and soft glow effects to guide the user's attention toward active tasks.

## Colors

The color palette is dominated by "Deep Space" tones to provide maximum contrast for white typography and vibrant action elements.

- **Primary:** A vibrant electric purple used for primary buttons, active states, and highlights.
- **Secondary:** A rich navy-purple used for card surfaces and navigation elements to differentiate them from the background.
- **Background:** A near-black navy that serves as the foundation for the dark mode experience.
- **Success/Neutral:** Pure white for high-readability text, with soft greys for secondary information.

Use gradients sparingly, primarily for large surface areas or specific "AI" states, moving from the primary purple into deeper violet tones.

## Typography

The design system utilizes **Plus Jakarta Sans** to maintain a friendly, contemporary, and highly legible feel across all mobile touchpoints.

Headlines are bold and authoritative, using tighter tracking. Body text maintains a generous line height to ensure readability during long study sessions. Labels use uppercase or semi-bold weights to clearly distinguish metadata from primary content. On mobile, headlines scale down slightly to ensure headers do not consume excessive vertical real estate.

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for mobile constraints.

- **Margins:** Standard 16px (1rem) side margins for all screen edges.
- **Rhythm:** A 4px/8px incremental system governs all vertical stacks.
- **Safe Areas:** Ensure interactive elements (buttons, inputs) are at least 44px in height for touch accessibility.
- **Mobile Reflow:** For the transition from desktop to mobile, the sidebar navigation collapses into a bottom navigation bar or a condensed "hamburger" menu. Content cards occupy the full width of the available space minus the standard margins.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and subtle **Backdrop Blurs**.

1.  **Level 0 (Background):** The deepest navy (`#0C0B14`).
2.  **Level 1 (Surfaces):** Cards and navigation bars use a slightly lighter navy (`#1E192B`) with a very thin (1px) low-opacity border to define edges.
3.  **Level 2 (Overlays/Modals):** These use glassmorphism—80% opacity of the surface color with a 15px backdrop blur.
4.  **Shadows:** Shadows are avoided in favor of tonal separation. When used, they are "Ambient Glows" where the shadow color matches the primary purple but at 10-15% opacity to simulate a light-emitting element.

## Shapes

The design system utilizes a **Rounded** shape language to feel approachable and modern.

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Containers:** Cards and modal containers use a 1rem (16px) radius to create a distinct soft frame.
- **Interactive Indicators:** Small indicators (like active state pills) may use a fully rounded "pill" shape (2rem+) to stand out.

## Components

- **Buttons:** Primary buttons are solid purple (`#7C5DFA`) with white text. Secondary buttons use a ghost style with a purple outline or a subtle grey-purple fill.
- **Input Fields:** Dark-filled backgrounds (`#16121F`) with a 1px border that glows purple on focus. Labels sit clearly above the field in a smaller, semi-bold font.
- **Cards:** Used for document previews and AI chat bubbles. These feature high-contrast icons and 16px internal padding.
- **Chips:** Small, low-profile badges for tagging subjects or file types, using a subtle background tint and high-contrast text.
- **Lists:** Clean rows with 16px vertical padding, separated by 1px dark dividers or simple spacing.
- **AI Chat Interface:** User bubbles should be distinct from the background (using a deep violet surface), while the AI responses utilize the secondary surface color to signify "system" status.
