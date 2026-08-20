# 05 — Accessibility Checklist & Responsive Rules

> Target: **WCAG 2.2 level AA** · Lighthouse a11y ≥ 90 on the landing page and the feed.
> These are completion criteria, not an audit performed later.

## 1. The per-component checklist

Every component in doc 03 must pass all of these before it is considered done.

### Semantics
- [ ] Native element first. A `<button>` beats `role="button"` every time. A custom control
      exists only where no native element can do the job.
- [ ] One `<h1>` per route; heading levels never skip.
- [ ] Landmarks present and unique: `header`, `nav` (labelled when there is more than one),
      `main`, `aside`, `footer`.
- [ ] Lists of things are real lists (`ul`/`li`) — the feed, comments, conversations,
      notifications. Screen readers announce "list, 12 items", which is genuinely useful.
- [ ] Icon-only controls have an `aria-label` describing the **action**, not the icon
      ("Like this post", not "heart").
- [ ] Decorative SVG is `aria-hidden="true"` and `focusable="false"`.

### Keyboard
- [ ] Everything interactive is reachable and operable by keyboard alone.
- [ ] Tab order follows visual order; no positive `tabindex`.
- [ ] **Skip to content** is the first tab stop on every page.
- [ ] `Esc` closes dialogs, sheets, menus and typeahead — and returns focus to the trigger.
- [ ] Dialogs and sheets trap focus (CDK `FocusTrap`); nothing behind them is tabbable.
- [ ] Arrow keys work inside composite widgets (tabs, menus, image pager) with a roving
      tabindex — one tab stop per widget, not one per item.
- [ ] No keyboard trap anywhere, including the infinite feed (hence the explicit
      **Load more** button — a sentinel-only list is a keyboard dead end).

### Focus (WCAG 2.2 additions)
- [ ] `:focus-visible` ring on every interactive element: 2 px, 2 px offset, ≥ 3:1 against
      **both** the control and its background (SC 1.4.11, 2.4.11 *Focus Not Obscured*).
- [ ] Sticky headers, the bottom nav and the message composer must never obscure the focused
      element — anchored elements carry `scroll-margin` to compensate (SC 2.4.11).
- [ ] Focus is never removed without being placed somewhere sensible.
- [ ] On route change, focus moves to the `<main>` landmark and the new page title is
      announced by a polite live region.

### Colour and contrast
- [ ] Body text ≥ 4.5:1; large text (≥ 18.66 px bold / 24 px) and UI boundaries ≥ 3:1.
- [ ] Colour is never the only carrier of meaning — unread state has a rail *and* text,
      message status has ticks *and* an accessible label, errors have an icon *and* text.
- [ ] Verified in both themes. Dark mode is checked independently, not assumed.
- [ ] Usable at 200% browser zoom and at 320 px equivalent width without loss of function
      (SC 1.4.4, 1.4.10).

### Forms
- [ ] Every input has a persistent visible `<label>`. Placeholders are never labels.
- [ ] Errors are text next to the field, wired with `aria-describedby` and
      `aria-invalid="true"` — never colour alone, never only a toast.
- [ ] Error summaries on submit move focus to the first invalid field.
- [ ] Autocomplete tokens on personal fields (SC 1.3.5).
- [ ] **Redundant entry** — the onboarding wizard never asks twice for what it already has
      (SC 3.3.7).
- [ ] **Accessible authentication** — no cognitive-function test; paste into password and
      OTP fields is allowed (SC 3.3.8).

### Motion and time
- [ ] `prefers-reduced-motion: reduce` collapses durations, disables the shimmer, the
      bottom-nav hide-on-scroll, and the like overshoot.
- [ ] No auto-playing motion longer than 5 s without a control.
- [ ] No content that expires on a timer without extension.

### Live regions
- [ ] Toasts → `aria-live="polite"`; destructive confirmations → `assertive`.
- [ ] Loading regions carry `aria-busy="true"` and announce completion.
- [ ] New messages arriving in an open thread announce politely, and are rate-limited so a
      burst does not flood the screen reader.
- [ ] Unread counts announce as "3 unread notifications", not "3".

### Touch (SC 2.5.8)
- [ ] Interactive targets ≥ 44 × 44 px, or ≥ 24 × 24 px with sufficient spacing.
- [ ] Every hover-revealed action has a persistent alternative below `md`.
- [ ] Drag interactions (image pager, sheet dismiss) have a non-drag equivalent (SC 2.5.7).

## 2. Testing

| Layer | Tool | When |
|---|---|---|
| Static | ESLint `@angular-eslint/template/accessibility` rules | Every PR |
| Unit | Testing Library queries by **role and name** — a component that cannot be queried by role is failing a11y | Every component |
| Automated audit | `axe-core` via Playwright on every primary route | CI |
| Lighthouse | Landing + feed, budget ≥ 90 | CI, blocking |
| Manual | Keyboard-only traversal of every flow in doc 04 | Per feature slice |
| Screen reader | NVDA + Firefox (primary), VoiceOver + Safari (secondary) | Per phase gate |
| Zoom | 200% and 400% reflow | Per phase gate |

Automated tooling catches roughly a third of real issues. The keyboard-only pass is the one
that actually finds them, and it is not optional.

## 3. Responsive rules

### Test matrix — every screen, every increment

`360` (floor) · `390` (typical phone) · `768` (tablet portrait) · `1024` (small laptop) ·
`1280` (desktop) · `1440` (large desktop). Plus 200% zoom at 1280 (≈ 640 effective).

### Non-negotiables

- **No horizontal page overflow at any width.** Long usernames, long hashtags and unbroken
  URLs are the usual culprits: text uses `overflow-wrap: anywhere` and `min-width: 0` on
  flex children.
- **Mobile-first, `min-width` only.** One direction of query, no ranges to reason about.
- **Container-relative where the component is reused across layouts** — the post card
  appears in a 600 px column and a 320 px rail, so it responds to its container, not the
  viewport.
- **The feed column is capped at 600 px forever.** Extra width becomes a rail.
- **Media never causes layout shift.** Every image has intrinsic dimensions or an
  `aspect-ratio` wrapper.
- **`100dvh`, never `100vh`** for full-height surfaces — mobile browser chrome makes `vh`
  wrong on exactly the surfaces where it matters (the message thread).
- **Safe-area insets** on the bottom nav and the message composer.
- **No hover-only affordances** below `md`.
- **Type scales, layout reflows.** Text size does not shrink on small screens; the layout
  changes instead. 16 px stays the body floor everywhere.

### Layout transitions

| Screen | `sm` (360–767) | `md` (768–1023) | `lg`+ (1024+) |
|---|---|---|---|
| Shell | Bottom nav + compact top bar | 88 px icon rail | 240 px sidebar (+ 320 px rail at `xl`) |
| Feed | 1 column, edge-to-edge media, radius 0 | 1 column, 600 px, radius `lg` | as `md` + rail at `xl` |
| Explore | 3-column grid, 2 px gutter | 3-column, 8 px gutter | 4-column |
| Profile | Stacked header, tabs full width | Side-by-side header | as `md`, wider |
| Messages | List **or** thread (full screen, navigation between) | Split 320 / flex | Split 360 / flex |
| Composer | Full-screen sheet | Centred dialog 640 px | Centred dialog 720 px |
| Settings | Menu → detail (drill-in) | Split menu / detail | Split, wider detail |
| Post detail | Full page, media above content | Dialog: media left, comments right | Dialog, larger |

## 4. Performance rules that are also accessibility rules

- Route-level code splitting; the initial chunk carries shell + tokens only.
- `@defer` for below-the-fold and interaction-triggered blocks (right rail, comment sheets).
- Images: `loading="lazy"` + `decoding="async"` below the fold, explicit dimensions,
  responsive `srcset` once real media exists.
- `OnPush` everywhere; signals for local state — fewer wasted change-detection cycles is
  directly less jank on low-end Android, which is where the accessibility floor really sits.
- Budgets enforced in `angular.json`: **500 kB warning / 1 MB error** on the initial bundle.
