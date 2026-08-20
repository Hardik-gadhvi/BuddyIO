# 01 — Information Architecture, Route Map & Navigation

> Status: **Phase 0/1** · Companion to `00-product-brief.md`

## 1. Shape of the product

BuddyIO has exactly **two shells**. Everything lives in one of them, and the boundary
between them is the authentication guard.

```
┌─ PUBLIC SHELL ───────────────┐      ┌─ APP SHELL ──────────────────────────┐
│  marketing header + footer   │      │  sidebar (lg) / bottom nav (sm)      │
│  landing, auth, legal        │ ───▶ │  top bar, global create, search      │
│  no user data               │ auth │  every authenticated surface         │
└──────────────────────────────┘      └──────────────────────────────────────┘
```

A third, deliberately separate surface — **`/admin`** — is a guarded placeholder in Phase 1.
It is not a tab inside the app shell, because moderator context and member context must never
be visually confusable.

## 2. Primary navigation — five destinations, one action

Navigation is capped at five destinations. This is a hard constraint, not a starting point:
a mobile bottom bar degrades badly past five, and every "just one more tab" request should
be answered inside an existing destination instead.

| # | Destination | Route | Icon | Why it earns a slot |
|---|---|---|---|---|
| 1 | **Home** | `/feed` | house | The default surface; where the session starts |
| 2 | **Explore** | `/explore` | compass | Discovery + search entry on mobile |
| 3 | **Create** | `/create` (modal route) | plus | The *action*, not a destination — see below |
| 4 | **Messages** | `/messages` | chat bubble | Real-time; needs a persistent unread badge |
| 5 | **Notifications** | `/notifications` | bell | Real-time; needs a persistent unread badge |
| — | **Profile** | `/u/:username` | avatar | Reached from the avatar, not a nav slot |

**Create is an action, not a tab.** On desktop it is a distinct filled button in the sidebar;
on mobile it is the centre bottom-bar item rendered as an elevated action. It opens a
**modal route** (`/create`) layered over the current page so context is preserved and
`Esc` / back closes it. On viewports below `md` the modal presents as a full-screen sheet.

Profile deliberately does **not** occupy a nav slot. It is reached from the avatar in the
top bar (desktop) or the bottom-bar avatar (mobile), which keeps the five slots for things
users move *between* rather than things they own.

## 3. Route map

Legend: 🔓 public · 🔐 authenticated · ⚙️ role-guarded · ▣ modal/overlay route · ⏳ Phase 1 placeholder

```
/                                🔓  Landing (marketing) — redirects to /feed when authenticated
/sign-in                         🔓  Sign in
/sign-up                         🔓  Sign up
/forgot-password                 🔓  Request reset link
/reset-password                  🔓  Set new password (tokenised link)
/legal/terms                     🔓  ⏳
/legal/privacy                   🔓  ⏳

/onboarding                      🔐  Wizard shell (own layout, no app chrome)
  /onboarding/photo                    Step 1 — avatar
  /onboarding/identity                 Step 2 — display name + username
  /onboarding/interests                Step 3 — interest picker
  /onboarding/follows                  Step 4 — suggested accounts
  /onboarding/privacy                  Step 5 — public or private default

/feed                            🔐  Home feed                          ◀── default authed route
/explore                         🔐  Explore grid
/search                          🔐  Search results (q, tab: people|tags|posts)
/p/:postId                       🔐  Post detail (full page)
/p/:postId                       🔐  ▣ Post detail (dialog, when opened from a grid)
/create                          🔐  ▣ Composer (sheet on mobile, dialog on desktop)

/u/:username                     🔐  Profile — own and other-user variants
  /u/:username/posts                   Grid tab (default)
  /u/:username/saved                   Saved tab (own profile only)
  /u/:username/tagged                  Tagged tab
/u/:username/followers           🔐  ▣ Follower list
/u/:username/following           🔐  ▣ Following list

/messages                        🔐  Conversation list (list-only on sm, split on md+)
/messages/:conversationId        🔐  Thread (full screen on sm, right pane on md+)
/messages/new                    🔐  ▣ New-message recipient picker

/notifications                   🔐  Grouped notification centre

/settings                        🔐  Settings shell
  /settings/account                    Email, password, sessions/devices
  /settings/profile                    Display name, bio, links
  /settings/appearance                 Theme, reduced motion, text size
  /settings/privacy                    Account visibility, presence, tagging
  /settings/safety                     Blocked and muted accounts
  /settings/notifications              Per-category delivery preferences
  /settings/data                       Export / delete request  ⏳

/admin                           ⚙️  Moderation shell (role: moderator|admin)
  /admin/queue                         Report queue  ⏳
  /admin/reports/:reportId             Report detail  ⏳
  /admin/audit                         Action audit trail  ⏳

/offline                         🔓  PWA offline fallback
**                               —   404 Not found
```

### Route-level rules

- **Lazy by feature.** Every top-level feature is a `loadChildren`/`loadComponent` boundary.
  Only the shell, theme and design system are in the initial chunk.
- **Modal routes are real routes.** `/p/:postId` opened from the explore grid renders in a
  dialog over the grid; opened directly (deep link, refresh, new tab) it renders full-page.
  Same component, two presentations, one URL. Sharing a link never produces a broken view.
- **Guards are functional** (`CanActivateFn`): `authGuard`, `guestGuard` (bounces signed-in
  users off `/sign-in`), `onboardingGuard` (forces incomplete profiles into the wizard),
  `roleGuard('moderator')`.
- **Search state lives in query params** (`/search?q=...&tab=people`) so results are
  shareable and the back button behaves.

## 4. Responsive navigation behaviour

Breakpoints are defined once in `_tokens.scss` and consumed through the `bp()` mixin.

| Range | Token | Chrome | Feed layout |
|---|---|---|---|
| 360–767 | `sm` and below | **Bottom nav** (5 slots, 56 px + safe-area inset). Compact top bar: wordmark left, search + notifications right. Composer is a full-screen sheet. | Single column, edge-to-edge media |
| 768–1023 | `md` | **Rail sidebar** — 88 px, icons only with tooltips. No bottom nav. | Single centred column, max 600 px |
| 1024–1279 | `lg` | **Full sidebar** — 240 px, icon + label. Top bar collapses into the sidebar. | Centred 600 px column |
| 1280+ | `xl` | Full sidebar + **contextual right rail** (320 px): own-account card, suggested follows, footer links | Centred 600 px column, rail floats right |

Additional rules:

- **No hover-only affordances.** Post-card overflow menus, message actions and hover
  reveals all have a persistent tap target below `md`.
- **The bottom nav hides on scroll-down and returns on scroll-up** in the feed only, and
  never in the message thread (where the composer is anchored). Disabled entirely under
  `prefers-reduced-motion`.
- **Thumb zone.** Below `md`, primary actions live in the bottom third. Destructive actions
  never sit adjacent to primary ones in a sheet.
- **Safe areas.** The bottom nav and message composer use `env(safe-area-inset-bottom)`.
- **The feed column never exceeds 600 px** at any width. Wide screens gain a rail, not
  wider text lines.

## 5. Global chrome

**Top bar (all sizes, content varies):**
skip-to-content link (first tab stop) · wordmark → `/feed` · search field (`md`+) or search
icon (`sm`) · notification bell with unread badge · avatar menu (profile, settings, theme,
sign out).

**Sidebar (`md`+):** the five destinations, then a filled **Create** button, then the
account block pinned to the bottom.

**Persistent overlays:** toast region (`aria-live="polite"`, bottom-centre on mobile,
bottom-right on desktop) · offline banner (`role="status"`, below the top bar) · realtime
reconnect banner in messages.

## 6. URL and title conventions

- Lowercase, hyphenated, no trailing slash.
- Short, human-readable prefixes: `/u/` for users, `/p/` for posts — short enough to be
  pleasant to share, explicit enough to stay unambiguous.
- Every route sets a document title via a `TitleStrategy`: `"Feed · BuddyIO"`,
  `"@maya · BuddyIO"`, `"Messages (3) · BuddyIO"`.
- Route changes move focus to the main landmark and announce the new title to screen
  readers (see doc 05).
