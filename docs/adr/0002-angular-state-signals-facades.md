# ADR-0002 — Signals + feature facades; no NgRx yet

- **Status:** Accepted
- **Date:** 2026-08-20

## Context

Angular 22 ships signals, `resource()`, and zoneless change detection as defaults. NgRx is
still the reflexive choice for "a real app", and a social feed with optimistic mutations,
cross-feature cache invalidation and realtime updates is genuinely the kind of app that
*can* justify it. The question is whether it justifies it **now**.

## Decision

**Signals for state, RxJS for streams, one facade per feature. No global store in Phase 1.**

- **Signals** own all synchronous state: UI state, form state, feature view models, and the
  entity caches inside a facade. `computed()` derives; `linkedSignal()` handles
  reset-on-input; nothing is a `BehaviorSubject` that could be a `signal`.
- **RxJS** owns what is genuinely a stream over time: HTTP with cancellation, SignalR events,
  debounced typeahead, `IntersectionObserver`. These convert to signals at the component
  boundary via `toSignal`.
- **A facade per feature** (`FeedFacade`, `MessagesFacade`, …) is the only thing a page
  component injects. It exposes readonly signals plus intent methods (`like(postId)`), and
  owns the four-state mutation lifecycle from doc 04 §9.
- **Cross-feature state** that genuinely must be shared (session, theme, unread counts,
  connection status) lives in a small set of root-provided signal stores in `core/state`.

### When NgRx gets reconsidered

Explicitly, so the decision is evidence-based rather than aesthetic — when **two or more**
of these are true:

1. The same entity is optimistically mutated from three or more unrelated features and the
   caches drift.
2. We need time-travel debugging or action replay to diagnose a real, recurring bug class.
3. Realtime + optimistic + offline reconciliation in Messaging outgrows what a facade can
   express readably.
4. More than one team edits the same state, and a shared vocabulary of actions becomes worth
   its ceremony.

Until then, NgRx would add indirection, boilerplate and a learning surface with no
corresponding benefit — and the migration path from facades to a store is straightforward
precisely because pages already depend on an interface rather than on concrete state.

## Consequences

**Positive** — very little boilerplate, excellent zoneless performance, state that is
readable in one file per feature, and no framework-shaped constraints on the domain.

**Negative** — no free devtools; cross-feature invalidation is manual and must be
deliberate; discipline substitutes for enforcement, so facade conventions belong in the code
review checklist.
