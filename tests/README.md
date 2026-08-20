# tests/ (Phase 6)

Cross-cutting test suites that are not unit tests:

- Playwright E2E for the primary journeys in `docs/04-user-flows.md`
- `axe-core` accessibility audits on every route
- k6 load scenarios for feed, publish, search and concurrent chat connections

Unit and component tests live beside the code they test, in `apps/web/src` (Vitest).
