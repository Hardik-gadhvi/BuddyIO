# ADR-0001 — Modular monolith first, microservice-ready

- **Status:** Accepted
- **Date:** 2026-08-20
- **Phase:** applies from Phase 2; recorded now because it constrains Phase 1 module naming

## Context

BuddyIO has nine identifiable bounded contexts (Identity, Profiles & Social Graph, Content,
Engagement, Feed, Messaging, Notifications, Moderation, Media Processing). The obvious
resume-driven choice is nine services. The obvious pragmatic choice is one project with nine
folders and no real boundaries. Both are wrong for different reasons.

## Decision

One deployable **.NET solution** composed of modules with **enforced** boundaries:

- Each module owns its schema (PostgreSQL schema-per-module, one database).
- Cross-module reads go through a published contract (an interface in a `*.Contracts`
  project), never a direct `DbContext` or entity reference.
- Cross-module writes are **asynchronous**, via the transactional outbox — even though both
  ends are in the same process today. This is the constraint that makes later extraction
  mechanical instead of archaeological.
- An **architecture test** (NetArchTest or equivalent) fails the build if module A references
  module B's internals. The rule is executable, not documentary.

## Consequences

**Positive** — one `dotnet run`, one debugger, local transactions where they are correct,
no distributed-systems tax before there is distributed-systems value. Extraction later is a
project move plus a transport swap, because the call was already async and contract-based.

**Negative** — boundaries are only as strong as the architecture test; a determined shortcut
can still be merged. Modules cannot scale independently, so a hot module scales the whole
API. Accepted: Container Apps scales the monolith horizontally, which is sufficient well past
MVP traffic.

**Extraction trigger** (decided now, so it is not decided under pressure): extract a module
when it needs an independent deploy cadence, has a genuinely different scaling profile
(Messaging and Media Processing are the two candidates), or gains a separate owning team.
Load alone is not a trigger.

## Alternatives rejected

- **Microservices from day one** — premature; multiplies local dev, debugging and
  operational cost before the boundaries are even validated.
- **Unstructured monolith** — cheapest to start, and the boundaries would be gone within
  three sprints. The whole value of the choice is the enforcement.
