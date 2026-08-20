# 03 — Component Inventory & State Matrix

> Status: **Phase 1** · A component is not "done" until every applicable column is implemented.

## 1. Layering

```
shared/ui/*        Primitives. No feature imports, no data access, no router.
                   Inputs in, outputs out. Reusable in any product.
shared/patterns/*  Composed, still product-agnostic (empty state, error state, infinite list).
features/*/ui/*    Product components. Know BuddyIO domain models, still presentational —
                   they receive data and emit intent; they never fetch.
features/*/pages/* Route components. Own a facade, orchestrate state, render the above.
```

The rule that keeps this honest: **only a page component may inject a facade.** Everything
below it is driven by inputs. That is what makes the mock→REST swap in Phase 3 a
one-provider change instead of a rewrite.

## 2. Primitives (`shared/ui`)

| Component | Selector | Key API | Notes |
|---|---|---|---|
| Button | `[bioButton]` **(directive)** | `variant: primary\|accent\|neutral\|ghost\|danger`, `size: sm\|md\|lg`, `loading`, `fullWidth`, `disabled` | Applied to a **native** `<button>` or `<a>`. A wrapper component would either nest a button inside a custom element (two focus stops, broken `form` association) or re-implement `type`/`disabled`/`form`/keyboard activation by hand — so the native element keeps doing all of that and the directive only adds appearance. Icons are projected as children. `loading` keeps the button's width and sets `aria-busy` |
| Icon button | `bio-icon-button` | `icon`, `label` (**required**), `variant`, `iconSize`, `boxSize`, `pressed`, `disabled`; emits `(action)` | A component, because it renders the glyph and enforces the label. Pads to 44×44 min. **Bind `(action)`, never `(click)`** — the hit-area padding extends past the inner `<button>` and would still fire while disabled |
| Icon | `bio-icon` | `name`, `size: 16\|20\|24\|32` | Inline SVG registry, `currentColor`, `aria-hidden` unless labelled |
| Avatar | `bio-avatar` | `user`, `size: xs\|sm\|md\|lg\|xl`, `ring: none\|default\|accent` | Initials fallback, deterministic hue, `loading="lazy"`, fixed box (no CLS) |
| Badge | `bio-badge` | `variant`, `count`, `dot`, `max=99` | Count > max renders `99+`; announced as "N unread" |
| Chip | `bio-chip` | `selected`, `removable`, `interactive` | Hashtags, interests, attachment chips |
| Card | `bio-card` | `elevation`, `interactive`, `padding` | Interactive cards get a single focusable primary link, not a click-anywhere div |
| Tabs | `bio-tabs` | `tabs`, `activeId`, `(change)` | CDK-free; roving tabindex, arrow-key nav, `role="tablist"` |
| Text field | `bio-text-field` | `label`, `hint`, `error`, `prefix/suffix`, `charLimit` | Label always rendered (never placeholder-as-label). `aria-describedby` wires hint+error |
| Textarea | `bio-textarea` | as above + `autoGrow`, `maxRows` | Caption and message composition |
| Select | `bio-select` | `options`, `label` | Native `<select>` styled — the accessible default beats a custom listbox |
| Switch | `bio-switch` | `label`, `description` | `role="switch"`, `aria-checked` |
| Menu | `bio-menu` | `trigger`, `items` | **CDK Menu** — focus trap, typeahead, `Esc`, arrow keys |
| Dialog / Sheet | `bio-dialog` | `title`, `size`, `dismissible` | **CDK Dialog**. Below `md` presents as a bottom sheet with drag-to-dismiss |
| Toast | `bio-toast` | service-driven | `aria-live="polite"`; destructive confirmations use `assertive` |
| Tooltip | `bio-tooltip` | directive | **`md`+ only** — never the sole carrier of information |
| Skeleton | `bio-skeleton` | `variant: text\|circle\|rect`, `lines` | Matches the real content box exactly so nothing shifts on resolve |
| Spinner | `bio-spinner` | `size`, `label` | For in-place waits under ~400 ms only; longer waits get skeletons |

## 3. Patterns (`shared/patterns`)

| Component | Purpose |
|---|---|
| Empty state | Icon + title + explanation + optional primary action. Never a bare "No data" |
| Error state | Human cause + **Retry** + a correlation id shown small. Never a raw stack or status code |
| Offline banner | `role="status"`, sticky under the top bar, auto-dismisses on reconnect |
| Infinite list | Cursor-driven, sentinel via `IntersectionObserver`, **plus an explicit "Load more" button** for keyboard and screen-reader users |
| Confirm dialog | Destructive confirmations; focus defaults to the *safe* action |
| Section header | Title + optional action, consistent rhythm |
| Page header | Back affordance, title, actions; collapses on mobile |

## 4. Product components (`features/*/ui`)

| Component | Feature | Notes |
|---|---|---|
| Post card | feed | Header (avatar, username, audience, time, overflow) · media frame · action bar · like/comment counts · caption with hashtag/mention linkification · comment preview |
| Media frame | feed | Aspect-locked, letterboxed, multi-image with dot pager and swipe; alt text always applied |
| Post action bar | feed | Like (optimistic + spring), comment, share, save. Each has an `aria-pressed`/`aria-label` that states the *result* of the action |
| Comment item | post | Avatar, author, body, time, like, reply-mention, overflow |
| Comment composer | post | Auto-grow textarea, submit on `Ctrl/⌘+Enter`, optimistic append |
| Profile header | profile | Avatar, counts, bio, links, follow/message actions; private/blocked variants |
| Post grid tile | profile / explore | Square crop, multi-image and comment-count overlays, opens modal route |
| Conversation list item | messages | Avatar + presence dot, name, snippet, time, unread badge, muted icon |
| Message bubble | messages | Own/other alignment, tail, status ticks (pending/sent/delivered/read/failed), retry affordance |
| Message date separator | messages | Sticky, "Today" / "Yesterday" / date |
| Typing indicator | messages | Three-dot animation **plus** the text "Maya is typing" for reduced-motion and SR users |
| Notification item | notifications | Grouped actors ("Maya and 3 others"), unread rail, deep-link target |
| Follow button | social | Follow / Requested / Following / Unfollow-confirm state machine |
| Interest picker | onboarding | Multi-select chip grid with a minimum-selection rule |
| Upload dropzone | composer | Drag-drop (pointer), file picker (always), paste; per-file progress, cancel, retry |
| Suggested account card | feed rail / onboarding | Avatar, name, reason ("Followed by Dev"), follow action |

## 5. State matrix

Legend: ● required · ○ if applicable · — not applicable

| Component | default | hover | focus-visible | active | selected | disabled | loading | empty | error | offline |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Button | ● | ● | ● | ● | — | ● | ● | — | — | ○ |
| Icon button | ● | ● | ● | ● | ○ | ● | ● | — | — | ○ |
| Text field / Textarea | ● | ● | ● | — | — | ● | ○ | — | ● | — |
| Select / Switch | ● | ● | ● | ● | ● | ● | — | — | ● | — |
| Chip | ● | ● | ● | ● | ● | ● | — | — | — | — |
| Tabs | ● | ● | ● | ● | ● | ● | ○ | — | — | — |
| Menu item | ● | ● | ● | ● | ○ | ● | — | ○ | — | — |
| Dialog / Sheet | ● | — | ● | — | — | — | ○ | — | ○ | — |
| Avatar | ● | ○ | ○ | — | — | — | ● | ● | ● | — |
| Post card | ● | ● | ● | ● | — | — | ● | — | ● | ● |
| Media frame | ● | ○ | ● | — | ○ | — | ● | — | ● | ● |
| Post action bar | ● | ● | ● | ● | ● | ● | ● | — | ● | ● |
| Comment composer | ● | ● | ● | — | — | ● | ● | — | ● | ● |
| Feed page | ● | — | ● | — | — | — | ● | ● | ● | ● |
| Explore / Search | ● | — | ● | — | ● | — | ● | ● | ● | ● |
| Profile | ● | — | ● | — | ● | — | ● | ● | ● | ● |
| Conversation list | ● | ● | ● | ● | ● | — | ● | ● | ● | ● |
| Message thread | ● | ● | ● | — | — | — | ● | ● | ● | ● |
| Message bubble | ● | ● | ● | — | ○ | — | ● | — | ● | ○ |
| Notification list | ● | ● | ● | ● | ● | — | ● | ● | ● | ● |
| Upload dropzone | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Follow button | ● | ● | ● | ● | ● | ● | ● | — | ● | ● |

Beyond the grid, these product states are **required** and easy to forget:

- **Private account** — profile visible, content withheld, request-to-follow path clear
- **Blocked / blocked-by** — asymmetric, and must not leak that a block exists
- **Muted** — content hidden, relationship intact
- **Pending follow request** — "Requested", cancellable
- **Own vs other** — every profile and post surface has both
- **Deleted / removed by moderation** — a tombstone, never a silent disappearance
- **Optimistic pending** and **failed with retry** — every mutation (like, comment, send, follow)
- **Rate-limited** — a specific, honest message, not a generic error

## 6. Per-component completion criteria

A component is done when: every applicable state above is implemented and reachable in the
showcase · keyboard operation and focus-visible are correct · `aria-*` matches the state ·
touch target ≥ 44 px · it consumes tier-2 tokens only · it has no hard-coded copy that
bypasses the i18n boundary · it works at 360 px · reduced-motion is honoured · it has a unit
test for its state logic.
