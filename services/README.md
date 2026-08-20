# services/ (Phase 2)

The .NET 10 modular monolith lands here after the UI/UX phase is reviewed and accepted.

Planned module boundaries (see `docs/adr/0001-modular-monolith-first.md`):
Identity & Access, Profiles & Social Graph, Content, Engagement, Feed, Messaging,
Notifications, Moderation, Media Processing.

Nothing here yet, deliberately: the spec's phase gate is that backend work does not begin
until the UI phase is accepted. The domain models in `apps/web/src/app/core/models` are the
reviewed input to the OpenAPI 3.1 contract, so the API is designed against a UI that already
exists rather than the reverse.
