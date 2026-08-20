# 00 — Product Brief, Assumptions & Risks

> Status: **Phase 0 (Discovery)** · Last updated: 2026-08-20

## 1. What BuddyIO is

BuddyIO is a social connection platform for sharing moments with people you actually know,
and talking to them in real time. It borrows *interaction patterns* that a billion people
already understand — a feed, a composer, a profile grid, a DM thread — and gives them a
calmer, warmer identity than the attention-maximising incumbents.

**Positioning:** *A social feed that feels like a group of friends, not a stadium.*

### What it is not

- Not a pixel clone of Instagram. Shared interaction grammar, different identity, different IA.
- Not a creator-monetisation platform (no ads, no payouts, no ranking ML in MVP).
- Not an encrypted messenger. TLS in transit is **not** end-to-end encryption and we will
  never label it as such (see risk R-06).

## 2. Target users

| Persona | Goal | What they need from MVP |
|---|---|---|
| **Maya — the sharer** (24, posts 2–3×/week) | Share a photo with a small circle without performing for strangers | Fast composer, audience control, alt text, upload retry that never loses her work |
| **Dev — the lurker** (31, reads daily, posts rarely) | Keep up with ~80 people in a few minutes | Chronological feed, save-for-later, mute without unfollowing, no doom-scroll pressure |
| **Priya — the connector** (27, DMs more than she posts) | Keep conversations alive across the day | Reliable messaging, honest delivery/read state, presence she controls |
| **Sam — the moderator** (internal, Phase 6) | Act on reports quickly and defensibly | Auditable queue, reversible actions, full action trail |

Maya and Dev define the **feed** work. Priya defines the **messaging** work. Sam constrains
the **data and authorization model from day one**, even though his UI lands last.

## 3. Scope

### MVP (must ship)

- Authentication, onboarding, profile setup
- Public/private profiles, follow requests, followers/following
- Image-first posts: caption, hashtags, alt text, audience control, flat comments, likes, saves, share link
- Home feed (chronological), explore/search, post detail, profile
- 1:1 direct messaging: conversation list, optimistic send, delivered/read receipts, typing, reconnect
- Notifications centre and preferences
- Privacy, block / mute / report
- Responsive PWA shell, light / dark / system theme

### Deferred (explicitly out of MVP)

Stories · reels and video editing · live streaming · group chat · E2EE · advertising ·
creator payouts · recommendation ML · multi-region active-active · federation.

**Deliberate omission:** the home feed has **no stories tray**. It is the loudest visual
signal that BuddyIO is not an Instagram clone, and it removes an entire ephemeral-media
subsystem from MVP.

## 4. Assumptions

These are *decisions made to avoid blocking*. Each is cheap to reverse during Phase 1;
those marked 🔒 get expensive after Phase 3.

| # | Assumption | Rationale | Reversal cost |
|---|---|---|---|
| A-01 | Feed is **strictly reverse-chronological** in MVP | Ranking without engagement data is guesswork; chronological is also the honest default | Low |
| A-02 | Comments are **flat**, not threaded | One level of reply is ~80% of the value at ~30% of the data-model cost | 🔒 Medium — changes `comments` schema |
| A-03 | **Images only** in MVP (JPEG/PNG/WebP/AVIF), max 10 per post, 12 MB each | Video needs transcoding, storage tiering and moderation we are not building yet | Low (limits are config) |
| A-04 | Post audience is **Public / Followers / Close Friends**; no per-post custom lists | Three tiers cover the real cases; custom lists are a settings surface of their own | 🔒 Medium |
| A-05 | Usernames: 3–30 chars, `[a-z0-9._]`, case-insensitively unique, immutable for 30 days after a change | Prevents impersonation churn and handle-squatting | Medium |
| A-06 | Presence is **opt-out**; last-seen granularity is coarse (`active now` / `active today` / hidden) | Precise last-seen is a stalking vector | Low |
| A-07 | Locale is **en-US only**, but every UI string routes through an i18n-ready boundary | Real i18n is Phase 8; retrofitting string extraction later is painful | Low if honoured now |
| A-08 | Timestamps are **UTC** end-to-end; the client formats to local | Non-negotiable for message ordering | 🔒 High if broken |
| A-09 | **Inter** is loaded from Google Fonts in dev and must be **self-hosted before UAT** | Unblocks the identity now; hotlinking is a privacy and perf liability in production | Low |
| A-10 | Mock latency defaults to **450 ms** with a togglable error rate | Loading and error states must be lived with, not demoed once | Low |

## 5. Risks and open questions

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R-01 | **Node runtime**: Angular 22 needs Node `^22.22.3 \|\| ^24.15.0 \|\| >=26`; the workstation had Node 20.19 (EOL) | Blocks `npm install` entirely | Decided: upgrade to Node 24 LTS. Pinned via `engines` and `.nvmrc` |
| R-02 | Messaging correctness (ordering, duplicates, missed messages on reconnect) is the hardest part of the product and lands in Phase 5 | Late discovery of a design flaw | Design the message id / sequence / idempotency-key contract **in Phase 1** as part of the typed models, not in Phase 5 |
| R-03 | Modular-monolith boundaries erode under delivery pressure | Loses the microservice-ready property that justified the choice | Enforce with an architecture test (module A may not reference module B internals) from the first backend commit |
| R-04 | Private-account and block semantics leak through feed / search / notification read paths | Privacy breach — the classic social-app bug class | Every read model gets an explicit visibility predicate plus authorization integration tests. Never filter in the client |
| R-05 | Composer: a 12 MB upload on mobile data, then the tab closes | Lost work; the number-one composer complaint | Retryable upload intent plus local draft persistence in the composer |
| R-06 | "Encrypted chat" claimed on the strength of TLS | Trust and legal exposure | Product copy may not use "encrypted" or "private" for message content until a reviewed E2EE design exists |
| R-07 | Accessibility treated as a Phase-6 audit | Rework across every screen | A11y is a completion criterion per component, enforced by the state matrix in doc 03 |
| **Q-01** | Email/SMS notification delivery in MVP, or in-app only? | Adds a provider plus deliverability ops | **Assumed in-app only.** Confirm before Phase 5 |
| **Q-02** | Is Close Friends (A-04) really in MVP, or does audience reduce to Public/Followers? | Removes a settings surface and a list-management UI | **Assumed in MVP** as a data-model tier; the UI may ship in Phase 4 |
| **Q-03** | Minimum age / COPPA posture? | Changes signup, retention and moderation duties | **Assumed 13+ with a self-declared DOB gate.** Needs a real decision before public launch |

## 6. Phase 1 definition of done

Phase 1 is complete when all of the following are demonstrably true:

- [ ] Every screen in the doc-01 route map renders at 360 / 768 / 1024 / 1440 px with no horizontal overflow
- [ ] Every data-bound screen has **loading, empty, error and offline/permission** states reachable in the running app
- [ ] Zero hard-coded colours outside `_tokens.scss`; zero hard-coded mock data inside page components
- [ ] Keyboard-only traversal of feed → post detail → profile → messages works, with visible focus at every stop
- [ ] Lighthouse accessibility ≥ 90 on the landing page and the authenticated feed
- [ ] No console errors, no dead controls, no layout shift from unsized media
- [ ] `docs/ui-ux.md` matches what the code actually does

> Compiling is not a phase gate. Demonstrating the user flow is.
