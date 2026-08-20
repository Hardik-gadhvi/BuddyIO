# 04 — Key User Flows

> Status: **Phase 1** · Each flow lists the happy path, the states that must exist, and the
> failure modes we commit to handling. Failure modes are the deliverable here — happy paths
> are the easy half.

## 1. Onboarding (visitor → useful feed)

```
Landing ─▶ Sign up ─▶ Verify ─▶ Photo ─▶ Identity ─▶ Interests ─▶ Follows ─▶ Privacy ─▶ Feed
   🔓         🔓        🔓       ①        ②           ③           ④          ⑤        🔐
```

Progress is shown as "Step 3 of 5" (text, not just a bar). Every step except Identity is
skippable; skipping is a visible, unpunished choice. Steps ① ② ⑤ are individually
re-editable later from Settings, and the wizard says so.

**Must exist:** username availability check — debounced 350 ms, three states
(checking / available / taken with suggestions) · interests require ≥ 3 before Continue
enables, with the requirement stated *before* the user tries · suggested follows show a
*reason* ("Popular in Photography") · the privacy step explains the actual consequence of
private mode in one sentence, not a link.

**Failure modes:** email already registered → sign-in with prefilled email, never "account
exists" enumeration on a public form · verification link expired → one-tap resend with a
cooldown · user abandons at step 3 and returns → `onboardingGuard` resumes at step 3, no
data lost · avatar upload fails → step continues, retry offered later.

## 2. Home feed

**Load:** skeleton of 3 post cards (matching real geometry) → content. Cursor pagination;
the sentinel prefetches one page ahead, and an explicit **Load more** button is always
present for keyboard/SR users.

**Must exist:** empty feed (new account, follows nobody) → "Your feed is quiet" + suggested
accounts inline, *not* a dead end · end of feed → an explicit terminus, never an infinite
spinner · new-posts-available pill appears on top without shifting the scroll position ·
scroll position restored on back-navigation from post detail.

**Failure modes:** page 1 fails → full error state with retry · page N fails → inline error
*below existing content*; what loaded stays on screen · a single post's media fails → that
card degrades to a placeholder with alt text; the feed does not break · offline → banner +
last-fetched content stays readable, actions queue or disable with an honest reason.

**Interactions:** like is optimistic with a spring, reverts with a toast on failure · save is
optimistic and silent · overflow menu = Save, Copy link, Mute author, Unfollow, Report ·
double-tap-to-like is *additive*, never the only way to like.

## 3. Composer

```
Pick media ─▶ Arrange / preview ─▶ Alt text ─▶ Caption + hashtags ─▶ Audience ─▶ Publish
```

**Must exist:** drag-drop, file picker and paste all work; the picker is never the only route ·
per-file upload progress with cancel and retry · client-side validation of type/size/count
*before* upload starts, with the limits stated up front rather than as an error · alt text has
a visible nudge, is skippable, and never blocks publishing · audience selector shows the
consequence in plain words · **draft persistence** — closing the sheet offers Save draft, and
a crash or refresh restores it.

**Failure modes:** one file of five fails → the other four survive; only the failed one
retries · publish succeeds but the feed refresh fails → the post is confirmed published, the
feed retries quietly · network drops mid-upload → resumes or fails cleanly with the file
still queued · user hits Back / `Esc` with unsaved work → confirm dialog, focus on the safe
action.

## 4. Post detail and comments

Desktop opened from a grid → dialog over context. Direct/deep link → full page.
Both are `/p/:postId` (see doc 01 §3).

**Must exist:** comments paginate with "View more comments" · optimistic comment append,
pending style, failed state with retry · own-comment delete with confirm · comment on a
post whose author blocked you → the action is unavailable with a reason, discovered from the
server, not guessed by the client · deleted post → tombstone, not a 404 blank.

## 5. Profile

**Must exist, as distinct rendered states:** own profile (Edit profile, Saved tab) · other
public · other private + not following ("This account is private" — header, counts and bio
visible, grid withheld, Request to follow) · other private + request pending ("Requested") ·
blocked-by-you (content hidden, Unblock offered) · account deleted/suspended (tombstone) ·
empty grid (own → "Share your first photo" with a create CTA; other → neutral copy).

**Failure modes:** follow action fails → button reverts, toast explains · rate-limited
follow → specific message with a retry-after.

## 6. Messaging

The flow with the most failure surface. Design order is deliberately inverted here: the
**failure modes drive the component API**, not the happy path.

```
Conversation list ─▶ Thread ─▶ Type ─▶ Send ─▶ pending ─▶ sent ─▶ delivered ─▶ read
                                              └─ failed ─▶ retry / delete
```

**Must exist:** optimistic bubble with a client-generated idempotency key, present from the
first keystroke of `Send` · five honest status states (pending, sent, delivered, read,
failed) — `delivered` means the server persisted it, and nothing weaker may be shown as
`delivered` · typing indicator, rate-limited, ephemeral, with a text equivalent · presence
respecting the user's opt-out (doc 00 A-06) · date separators, sticky · unread divider that
persists until the user leaves · reconnect banner ("Reconnecting…" → "Back online") ·
attachment chip with progress and cancel.

**Failure modes:** send fails → bubble stays visible in `failed` state with Retry and Delete.
**A user mutation is never silently lost** · connection drops mid-session → banner, composer
stays usable, messages queue as `pending` · reconnect → REST cursor resync reconciles by
message id, so nothing is duplicated or missed; the SignalR stream is an accelerator, never
the source of truth · duplicate server event → deduplicated by message id · message from a
blocked user → never rendered · very long thread → virtualised, with correct scroll anchoring
so incoming messages do not yank the viewport while the user reads history.

## 7. Search and explore

**Must exist:** recent searches (local, clearable) · typeahead debounced 250 ms with request
cancellation, so a fast typist never sees stale results land · three result tabs
(People / Tags / Posts) with per-tab empty states · no-results copy that suggests a next
action · a search that returns only blocked/private content shows the *same* empty state as a
genuine no-match — no information leaks through result counts.

**Failure modes:** typeahead fails → the field stays usable, the dropdown shows an inline
retry, and typing is never blocked · slow response → the previous results stay until the new
ones arrive; no flicker to empty.

## 8. Notifications

Grouped by actor and target ("Maya and 3 others liked your photo"). Unread has a rail plus a
text cue, never colour alone. Each item deep-links to the exact target — a comment
notification scrolls to and highlights that comment. Mark-all-read is optimistic and
reversible via toast for 5 seconds.

**Must exist:** grouped and single variants · unread/read · empty ("You're all caught up") ·
per-category preference switches that state what they control · a notification whose target
was deleted → item explains it rather than deep-linking to a 404.

## 9. Cross-cutting: the four states of every mutation

Every mutating action in BuddyIO — like, save, follow, comment, send, publish, block, report —
implements the same lifecycle. This is the single most repeated pattern in the app, so it is
specified once here and implemented once in the facade layer:

| State | UI contract |
|---|---|
| `idle` | Control reflects server truth |
| `pending` | Optimistic result shown immediately; control disabled only if a double-submit would be harmful |
| `success` | Optimistic result confirmed; no flicker, no re-render jump |
| `failure` | Optimistic result **reverted**, cause stated in a toast, retry offered. Never a silent revert |
