# 02 — BuddyIO Design System

> Status: **Phase 1** · Source of truth in code: `apps/web/src/styles/_tokens.scss`
> This document explains *why*. The SCSS file is *what*. If they disagree, the SCSS wins
> and this document is stale — fix it.

## 1. Token architecture

Three tiers, one rule: **components may only consume tier 2.**

```
tier 1  PRIMITIVE   --bio-indigo-600, --bio-neutral-100, --bio-space-4
                    Raw scale values. Theme-independent. Never referenced by a component.
                              │
tier 2  SEMANTIC    --bio-surface-raised, --bio-text-muted, --bio-action-primary-bg
                    Named by ROLE, not by colour. This is the only tier components use.
                    Light and dark are two different bindings of the same names.
                              │
tier 3  COMPONENT   --bio-postcard-media-radius
                    Introduced only when a component needs to expose a knob. Rare by design.
```

Why this matters: dark mode, a future white-label theme, and a "high contrast" preference
are all just *rebindings of tier 2*. No component CSS changes. If a component reaches past
tier 2 to a primitive, dark mode breaks silently — so that is the one rule the review
checklist always enforces.

Prefix `--bio-` prevents collisions with Angular CDK/Material custom properties.

## 2. Colour

### Personality brief

Warm, confident, social, calm, contemporary. Explicitly rejected: neon gradients,
glassmorphism, heavy shadows, saturated backgrounds, and "AI purple". The surface palette is
a **warm neutral (stone)** rather than a cold grey — it is the single cheapest decision that
separates BuddyIO from every blue-grey SaaS product, and it makes user photography look warmer
without touching the photography.

### Primitive scales

**Indigo — primary.** Trust and focus without corporate coldness.

| Token | Hex | Used for |
|---|---|---|
| `--bio-indigo-50` | `#EEF0FB` | Selected/hover wash, light |
| `--bio-indigo-100` | `#DCE0F7` | Subtle fill |
| `--bio-indigo-200` | `#B9C1EF` | Borders on tinted surfaces |
| `--bio-indigo-300` | `#8F9CE4` | **Primary text/icon in dark mode** (7.2:1 on dark canvas) |
| `--bio-indigo-400` | `#6675D6` | Focus ring, dark-mode fills |
| `--bio-indigo-500` | `#4753C4` | Brand core, focus ring (light) |
| `--bio-indigo-600` | `#3A43A8` | **Primary action fill, light** (8.2:1 with white) |
| `--bio-indigo-700` | `#2F3689` | Pressed |
| `--bio-indigo-800` | `#262C6D` | — |
| `--bio-indigo-900` | `#1E2255` | — |
| `--bio-indigo-950` | `#14163A` | Deep tinted dark surfaces |

**Coral — accent.** Used *sparingly*: the like/heart active state, unread badges, and at most
one call-to-action per view. Coral is the emotional register of the product; spend it and it
stops meaning anything.

| Token | Hex | Note |
|---|---|---|
| `--bio-coral-50` | `#FFF1ED` | |
| `--bio-coral-100` | `#FFE0D6` | |
| `--bio-coral-200` | `#FFC1AD` | |
| `--bio-coral-300` | `#FF9B7D` | **Accent text/icon in dark** (9.2:1 on dark canvas) |
| `--bio-coral-400` | `#FB7551` | Heart fill |
| `--bio-coral-500` | `#ED5732` | Brand coral — **graphical/large text only, 3.5:1 with white** |
| `--bio-coral-600` | `#D0431F` | **Accent fill with white text** (4.7:1) — the safe filled variant |
| `--bio-coral-700` | `#AC3418` | Pressed |
| `--bio-coral-800` | `#8A2C15` | |
| `--bio-coral-900` | `#712715` | |

> ⚠️ `coral-500` fails AA against white for body text. Filled coral controls use
> `coral-600`. This is exactly why tier-2 semantic tokens exist — components ask for
> `--bio-action-accent-bg` and cannot pick the wrong one.

**Neutral — warm stone.** The workhorse: every surface, border and text colour.

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--bio-neutral-0` | `#FFFFFF` | | `--bio-neutral-500` | `#807C74` |
| `--bio-neutral-25` | `#FBFAF9` | | `--bio-neutral-600` | `#63605A` |
| `--bio-neutral-50` | `#F6F5F3` | | `--bio-neutral-700` | `#4A4843` |
| `--bio-neutral-100` | `#EEEDEA` | | `--bio-neutral-800` | `#33322E` |
| `--bio-neutral-200` | `#E2E0DC` | | `--bio-neutral-900` | `#22211F` |
| `--bio-neutral-300` | `#CBC8C2` | | `--bio-neutral-950` | `#171615` |
| `--bio-neutral-400` | `#A6A29A` | | | |

Dark mode uses a slightly **cooler, near-black** ink (`#101014` → `#26262E`) rather than
inverting the warm stone. Warm dark greys read as "muddy brown" on OLED; cool dark greys let
warm coral and user photography sit forward.

**Semantic states.** All verified ≥ 4.5:1 against their own light background token.

| Role | Light fill | Dark fill | Light bg wash |
|---|---|---|---|
| success | `#0E7C58` (5.2:1) | `#5FD6A4` | `#E7F6F0` |
| warning | `#B45309` (5.0:1) | `#FBBF4E` | `#FEF4E2` |
| danger | `#C62A2A` (5.6:1) | `#F98B8B` | `#FDECEC` |
| info | `#0F6FB8` (5.1:1) | `#7CC3F5` | `#E8F2FB` |

### Semantic tokens (tier 2 — the component API)

```
Surfaces        --bio-surface-canvas       page background
                --bio-surface-default      cards, sheets
                --bio-surface-raised       menus, dialogs, popovers
                --bio-surface-sunken       inset wells, media letterbox
                --bio-surface-inverse      tooltips, toasts
                --bio-surface-overlay      scrim behind dialogs

Text            --bio-text-primary         body and headings          (>= 12:1)
                --bio-text-secondary       supporting copy            (>= 7:1)
                --bio-text-muted           timestamps, metadata       (>= 4.5:1)
                --bio-text-disabled        non-interactive only       (>= 3:1)
                --bio-text-inverse         on inverse surfaces
                --bio-text-link            inline links
                --bio-text-accent          coral emphasis

Borders         --bio-border-subtle        card hairlines
                --bio-border-default       inputs, dividers
                --bio-border-strong        selected, focus-adjacent
                --bio-border-inverse

Actions         --bio-action-primary-{bg,bg-hover,bg-active,fg}
                --bio-action-accent-{bg,bg-hover,bg-active,fg}
                --bio-action-neutral-{bg,bg-hover,bg-active,fg}
                --bio-action-ghost-{bg-hover,bg-active,fg}
                --bio-action-danger-{bg,bg-hover,bg-active,fg}
                --bio-action-disabled-{bg,fg}

Feedback        --bio-{success,warning,danger,info}-{fg,bg,border}

Focus           --bio-focus-ring           colour
                --bio-focus-ring-width     2px
                --bio-focus-ring-offset    2px
```

**Contrast floor:** WCAG 2.2 AA — 4.5:1 body text, 3:1 large text and UI component
boundaries, 3:1 for focus indicators against both adjacent colours (2.2 SC 1.4.11 + 2.4.11).
`--bio-text-disabled` is the only token permitted below 4.5:1 and may never carry information
that is not also conveyed elsewhere.

## 3. Typography

**Family:** `Inter` (variable), falling back to `system-ui, -apple-system, "Segoe UI Variable
Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Inter is loaded from Google
Fonts in development (assumption A-09) and **must be self-hosted before UAT** — the fallback
stack is chosen so the layout barely shifts if it never loads.

**Scale** — a tuned minor third, floored at 16 px body per the spec.

| Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `--bio-type-display` | 40 / 44 | 700 | −0.02em | Landing hero only |
| `--bio-type-h1` | 32 / 38 | 700 | −0.02em | Page titles |
| `--bio-type-h2` | 26 / 32 | 650 | −0.01em | Section headings |
| `--bio-type-h3` | 21 / 28 | 600 | −0.01em | Card and dialog titles |
| `--bio-type-h4` | 18 / 26 | 600 | 0 | Sub-headings |
| `--bio-type-body-lg` | 17 / 26 | 400 | 0 | Post captions, message bubbles |
| `--bio-type-body` | **16 / 24** | 400 | 0 | Default |
| `--bio-type-body-sm` | 14 / 20 | 400 | 0 | Secondary rows, comments |
| `--bio-type-caption` | 13 / 18 | 400 | 0.005em | Timestamps, counts |
| `--bio-type-overline` | 12 / 16 | 600 | 0.08em, uppercase | Section labels |

Rules: never below 13 px for anything a user must read · usernames are 600 weight and
captions 400, so the two never compete · line length capped at ~68ch (the 600 px feed column
lands at ~62ch at body size) · sizes are `rem` so browser text-zoom works.

## 4. Spacing, radii, elevation

**Spacing** — 4 px base. `space-0 … space-24` = 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
Component internals use 1–4; component separation 4–6; section rhythm 8–12; page-level 12–20.
No arbitrary pixel values in feature SCSS.

**Radii** — `xs 4 · sm 6 · md 10 · lg 14 · xl 20 · 2xl 28 · pill 999 · circle 50%`.
Convention: inputs and buttons `md`, cards `lg`, sheets and dialogs `xl`, avatars `circle`,
badges and chips `pill`. Post media uses `lg` on desktop and **0 on mobile** where media is
edge-to-edge — rounded corners against a screen edge look like a rendering bug.

**Elevation** — five steps, each a two-shadow pair (tight contact shadow + soft ambient).

| Token | Use |
|---|---|
| `--bio-elevation-0` | Flat — feed cards on mobile (separated by borders, not shadows) |
| `--bio-elevation-1` | Feed cards on desktop, sticky top bar |
| `--bio-elevation-2` | Menus, popovers, hovering cards |
| `--bio-elevation-3` | Dialogs, bottom sheets |
| `--bio-elevation-4` | Toasts, drag previews |

In dark mode shadows are nearly invisible, so elevation is additionally communicated by a
**lighter surface** and a 1 px `--bio-border-subtle` hairline. Both mechanisms are baked into
the tokens; components do not special-case the theme.

## 5. Breakpoints, layout, z-index

**Breakpoints:** `xs 360 · sm 480 · md 768 · lg 1024 · xl 1280 · 2xl 1440`.
Mobile-first; only `min-width` queries; always via the `bp()` mixin so the values exist once.

**Layout tokens:** sidebar `240` / rail `88` · top bar `56` (sm) / `64` (md+) · bottom nav `56`
+ safe-area · feed column `600` · right rail `320` · page max `1280` · content gutter `16`
(sm) / `24` (md+).

**Z-index — a closed ordinal list.** Any `z-index` in a component that is not one of these
tokens is a review failure.

| Token | Value | Layer |
|---|---|---|
| `--bio-z-base` | 0 | Document flow |
| `--bio-z-raised` | 10 | Cards lifting on hover |
| `--bio-z-sticky` | 100 | Sticky sub-headers, date separators |
| `--bio-z-nav` | 200 | Top bar, sidebar, bottom nav |
| `--bio-z-drawer` | 300 | Slide-over panels |
| `--bio-z-overlay` | 400 | Dialog scrim |
| `--bio-z-dialog` | 500 | Dialogs, bottom sheets |
| `--bio-z-popover` | 600 | Menus, typeahead, popovers |
| `--bio-z-toast` | 700 | Toasts |
| `--bio-z-tooltip` | 800 | Tooltips |
| `--bio-z-skip-link` | 900 | Skip-to-content — must beat everything |

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--bio-duration-fast` | 120 ms | Hover, focus, colour changes |
| `--bio-duration-base` | 180 ms | Most transitions |
| `--bio-duration-slow` | 240 ms | Sheets, dialogs, route transitions |
| `--bio-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default |
| `--bio-ease-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Entering |
| `--bio-ease-accelerate` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Exiting |
| `--bio-ease-spring` | `cubic-bezier(0.2, 1.3, 0.4, 1)` | The like animation, and nothing else |

All within the 150–250 ms band the brief asks for. Rules: **no information is ever conveyed
by motion alone**; skeletons shimmer but also announce via `aria-busy`; the like animation
overshoots but the filled heart is the actual state.

`prefers-reduced-motion: reduce` collapses every duration token to `0.01ms` and disables the
shimmer, the bottom-nav hide-on-scroll, and the like overshoot — implemented **once** by
rebinding the duration tokens in a media query, not per component.

## 7. Iconography

24 × 24 grid · 1.75 px stroke · round caps and joins · `currentColor` fill or stroke ·
optical alignment over mathematical centring. Icons ship as inline SVG through a single
`<bio-icon>` component so they inherit colour, scale with text, and never cost a network
request. Every icon-only control carries an `aria-label`; icons inside labelled controls are
`aria-hidden="true"`.

Sizes: `16` (inline with `body-sm`) · `20` (default UI) · `24` (nav, post actions) ·
`32` (empty states). Minimum touch target is **44 × 44 px** regardless of icon size — the
icon button pads out to it.

## 8. Logo

**Wordmark:** `buddy` in 700 weight `--bio-text-primary` + `IO` in 700 weight
`--bio-text-accent`, tracking −0.03em, all lowercase except `IO`.

**Mark:** three overlapping circles — two `indigo-500`, one `coral-500` at the intersection —
drawn as pure SVG geometry, expressing "connected people". No sourced or trademark-adjacent
artwork.

Rules: clear space = 0.5 × mark height on all sides · minimum mark size 20 px, minimum
wordmark 72 px · permitted on `surface-canvas`, `surface-default` and `indigo-900` only ·
never recoloured, rotated, outlined, or shadowed. **This is an explicit placeholder** —
`public/brand/` is designed to be swapped wholesale without touching component code.

## 9. Imagery

All placeholder media is **locally generated SVG** in `public/media/` — soft geometric
compositions drawn from the token palette. Nothing is hotlinked, nothing is licensed from a
third party, and there is no attribution burden. Avatars are generated from initials with a
hue derived deterministically from the user id, so the same person is always the same colour.

Every image element declares intrinsic `width`/`height` (or a wrapper with `aspect-ratio`) so
CLS is structurally impossible. Post media is capped at a 4:5 portrait aspect and letterboxed
onto `--bio-surface-sunken` rather than cropped, so a user's composition is never silently
destroyed.
