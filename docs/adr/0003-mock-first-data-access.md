# ADR-0003 — Mock-first data access behind an injection-token adapter

- **Status:** Accepted
- **Date:** 2026-08-20

## Context

Phase 1 builds the entire UI before any API exists. The usual outcome is mock data hard-coded
inside page components, followed by a painful rewrite when the API lands — and a UI that was
never honest about latency or failure, because mocks resolve instantly and always succeed.

## Decision

**Every feature declares an abstract repository; the implementation is bound by an
`InjectionToken` at bootstrap.**

```ts
export const FEED_REPOSITORY = new InjectionToken<FeedRepository>('FEED_REPOSITORY');

export interface FeedRepository {
  getHomeFeed(cursor: string | null, limit: number): Observable<CursorPage<Post>>;
  setLike(postId: PostId, liked: boolean): Observable<PostEngagement>;
  // ...
}
```

Phase 1 binds `MockFeedRepository`. Phase 3 binds `HttpFeedRepository`, generated from the
OpenAPI 3.1 contract. **Not one line of component code changes.**

Four rules make this real rather than decorative:

1. **Mocks are typed against the same domain models the API will return.** The models are
   the contract, authored in Phase 1 and used to *drive* the OpenAPI spec in Phase 2 — not
   the other way round.
2. **Mocks simulate latency** (`BUDDYIO_MOCK_LATENCY_MS`, default 450 ms). Skeletons that are
   never seen are skeletons that are never correct.
3. **Mocks simulate failure** (`BUDDYIO_MOCK_ERROR_RATE`, and a dev panel to force a failure
   on the next call). Every error state in doc 03's matrix must be reachable in the running
   app without editing code.
4. **Mocks are stateful within a session.** Liking a post, sending a message and following an
   account persist in the in-memory store, so optimistic updates and their reverts behave
   the way they will against a real server.

Cursor pagination is used by the mocks from day one, so the UI never learns offset habits it
would have to unlearn (see the spec's "avoid offset pagination for feed/history at scale").

## Consequences

**Positive** — the UI is fully demonstrable and testable before any backend exists; unit
tests inject a deterministic fake with zero latency; the Phase 3 cutover is a provider swap;
and the domain models become the reviewed input to the API contract rather than an
afterthought.

**Negative** — mocks are real code that must be maintained, and they can drift from the
eventual API. Mitigation: once the OpenAPI contract exists, generate the models from it and
make the mocks implement the generated interfaces, so drift becomes a compile error.
