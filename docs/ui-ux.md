# BuddyIO UI/UX Guide

> The practical entry point. Read this to work on the web client; the numbered
> documents beside it hold the reasoning.
>
> | Doc | Covers |
> |---|---|
> | [00 — Product brief](00-product-brief.md) | Users, MVP scope, assumptions, risks, Phase 1 exit criteria |
> | [01 — Information architecture](01-information-architecture.md) | Route map, navigation, responsive chrome |
> | [02 — Design system](02-design-system.md) | Token rationale, colour, type, motion, logo |
> | [03 — Component inventory](03-component-inventory.md) | Component API and the state matrix |
> | [04 — User flows](04-user-flows.md) | Happy paths and, more importantly, failure modes |
> | [05 — Accessibility & responsive](05-accessibility-and-responsive.md) | The per-component checklist and the test matrix |
> | [ADRs](adr/) | Modular monolith · signals + facades · mock-first data access |

## 1. Running it

```bash
cd "apps/web" && npm install && npm start
```

Then open <http://localhost:4200>. Requires **Node 22.22.3+ or 24.15+** — Angular 22's
engine check is hard, and Node 20 is EOL.

| Command | Does |
|---|---|
| `npm start` | Dev server with HMR |
| `npm run build` | Production build (budgets enforced) |
| `npm test` | Vitest unit tests |
| `npm run format` | Prettier over `src` |

## 2. Where things live

```
apps/web/src/
  styles/                Global layer. Tokens first, then reset, base, type, components, utilities.
    _tokens.scss           EVERY visual value. A colour outside this file is a review failure.
    _mixins.scss           bp(), focus-visible(), truncate(), visually-hidden(). Emits no CSS.
    _components.scss       Only for directive-based primitives that cannot carry scoped styles.
  app/
    core/                Cross-feature singletons. No feature may be imported from here.
      models/              Domain types. These drive the Phase 2 OpenAPI contract, not vice versa.
      config/              Runtime config + MockControlService (the dev panel's backing store).
      mock/                MockTransport (latency + failure) and the fixtures.
      theme/               ThemeService - the ONLY place that touches `data-theme`.
      a11y/                TitleStrategy + route announcer.
      session/             Signed-in user and unread counts.
      layout/              The app shell and the nav definition.
      dev/                 Dev-only mock controls. Renders nothing in production.
    shared/              Product-agnostic. Reusable in any app.
      ui/                  Primitives: icon, button, icon-button, avatar, badge, skeleton, toast.
      patterns/            empty-state, error-state.
      pipes/, directives/
    features/
      feed/
        data-access/       Repository interface + token, mock impl, facade.
        ui/                Presentational components. No injection, no fetching.
        feed-page.*        The route component. The ONLY thing that injects the facade.
        feed.routes.ts     Lazy route + the repository binding.
      placeholder/         Honest "not built yet" page for unimplemented routes.
```

## 3. The four rules

Everything else is detail; these are the ones that break the architecture if ignored.

**1 — Components consume semantic tokens only.**
`var(--bio-text-muted)`, never `var(--bio-neutral-600)` and never `#63605a`. Dark mode is
nothing but a rebinding of the semantic tier, so a component that reaches past it to a
primitive breaks dark mode silently. See [02 §1](02-design-system.md).

**2 — Only a page component may inject a facade.**
Everything below it takes inputs and emits outputs. This is what makes the Phase 3 REST
cutover a one-provider change. See [ADR-0002](adr/0002-angular-state-signals-facades.md).

**3 — Data access goes through an injection token.**
Features declare an abstract repository; `feed.routes.ts` binds the implementation. No
component ever imports a fixture. See [ADR-0003](adr/0003-mock-first-data-access.md).

**4 — Every mutation implements all four states.**
Optimistic apply → confirm on success → **revert and explain** on failure. A silent revert
is a bug, not a shortcut. Implemented once in `FeedFacade.applyMutation`. See
[04 §9](04-user-flows.md).

## 4. Using the design system

```scss
// A component stylesheet
@use 'mixins' as *;          // resolved via stylePreprocessorOptions.includePaths

.thing {
  padding: var(--bio-space-4);
  background: var(--bio-surface-default);
  color: var(--bio-text-primary);
  border-radius: var(--bio-radius-lg);

  @include focus-visible;    // never hand-roll an outline
  @include bp(md) { ... }    // mobile-first, min-width only
}
```

Theme switching is entirely token rebinding: `ThemeService` sets `data-theme` on
`<html>` for an explicit choice and removes it for "system", and `_tokens.scss` binds the
dark palette under both `[data-theme='dark']` and a `prefers-color-scheme` query guarded by
`:not([data-theme='light'])`. **No component contains a theme conditional.** An inline
script in `index.html` applies the stored theme before first paint so there is no flash.

## 5. Route map

Implemented in `app.routes.ts`, mirroring [01 §3](01-information-architecture.md).
Every route resolves to something: unbuilt slices render `PlaceholderPage`, which states
what will live there. **A nav item that goes nowhere is a defect**, so there are none.

`/feed` is the only route with a real feature slice today. `/explore`, `/search`,
`/messages`, `/notifications`, `/create`, `/p/:postId`, `/u/:username`, `/settings` and
`/admin` are placeholders, plus a `**` catch-all.

## 6. Seeing the states

The **dev panel** (gear button, bottom-right, dev builds only) drives `MockTransport`:

- **Latency slider** — raise it to inspect skeletons at leisure.
- **Error rate** — set > 0 and reload to hit the first-page error state.
- **Fail the next request** — prime a failure, then:
  - hit **Load more** to see the *inline* next-page error (existing posts stay on screen), or
  - **like** a post to watch the optimistic update revert with a retryable toast.

This exists because ADR-0003 requires every state in the doc-03 matrix to be reachable in the
running app without editing code.

The seeded fixtures deliberately include the awkward cases: a multi-image post (`p_002`), a
post with **no alt text** (`p_008`), a post with **comments disabled** (`p_006`), a
**removed** post that renders as a tombstone (`p_009`), a `close-friends` post (`p_007`),
and a user with **no avatar** so the initials fallback is never an untested branch.

## 7. What is built vs. what is not

**Built and demonstrable**

- Full token sheet with light/dark/system, no-flash theme bootstrap, reduced-motion support
- App shell: skip link, top bar, sidebar (rail at `md`, full at `lg`), mobile bottom bar with
  centre create action, CDK-backed theme and account menus, toast region, route announcer
- Primitives: icon (38 hand-authored glyphs), button, icon button, avatar with initials
  fallback, badge, skeleton, toast; empty-state and error-state patterns
- Home feed: cursor pagination, prefetch sentinel **plus** an explicit Load more button,
  skeletons, empty state, first-page error, inline next-page error, end-of-feed terminus
- Post card: multi-image pager with keyboard controls, audience indicator, optimistic like
  and save, overflow menu, caption tokenisation, tombstone variant
- Unit tests for the pipes and for the optimistic-mutation contract

**Not built yet** — landing and auth screens, onboarding wizard, composer, post detail,
profile, explore/search, messaging, notification centre, settings, moderation, PWA
service worker, Storybook-style component showcase, Playwright + axe suite.

## 8. Known limitations

- **Nothing has been executed yet.** The workstation had Node 20.19, which cannot run
  Angular 22. Every file is written and statically cross-checked (imports resolve, icon
  names resolve), but no `npm install`, build, test run or browser render has happened.
  First run on Node 24 should be treated as a smoke test, not a formality.
- Inter is loaded from Google Fonts. **Self-host before UAT** (assumption A-09).
- The `index.html` theme script needs a CSP nonce or hash when a strict policy lands (Phase 4).
- `SessionStore` seeds from a fixture, so the fixture is in the initial chunk. It leaves when
  real auth arrives.
- The media pager updates its index from a scroll listener rather than an
  `IntersectionObserver`; fine at this scale, worth revisiting if the feed virtualises.
- Lighthouse and axe numbers are **unmeasured**. The Phase 1 exit criteria in
  [00 §6](00-product-brief.md) are not yet signed off.
