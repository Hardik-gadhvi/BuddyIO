# BuddyIO

A social connection platform — Instagram-familiar interaction patterns, its own identity and
information architecture. Built as a portfolio-grade demonstration of Angular 22 and
.NET 10: polished UI, real-time messaging, secure APIs, and observable Azure operations.

**Current phase: 1 — UI/UX with mocked data.** No backend, database, queues or Azure
resources exist yet, by design.

---

## Prerequisites

| Tool | Required | Why |
|---|---|---|
| **Node.js** | `22.22.3+` or `24.15+` (24 LTS recommended) | Angular 22's engine check is hard. Node 20 is EOL and **will not install** |
| npm | 10+ | |
| .NET SDK | 10.0.4xx | Phase 2 onward; not needed yet |

Check with `node -v`. If it prints 20.x, upgrade before continuing.

## Quick start

```bash
cd "apps/web" && npm install && npm start
```

Open <http://localhost:4200>. The app runs entirely on typed in-memory fixtures.

Look for the **gear button, bottom-right** — the dev panel drives mock latency and failure,
so every loading and error state is reachable without touching code.

## Repository layout

```
apps/web/     Angular 22 client (standalone, zoneless, signal-driven)
services/     .NET 10 modular monolith            (Phase 2)
infra/        Bicep modules and parameter files   (Phase 4)
tests/        Playwright E2E and load tests       (Phase 6)
docs/         Design system, IA, flows, ADRs
```

## Documentation

Start with **[docs/ui-ux.md](docs/ui-ux.md)** — how to run it, where things live, and the
four rules that keep the architecture honest.

| | |
|---|---|
| [00 — Product brief](docs/00-product-brief.md) | Users, scope, assumptions, risks |
| [01 — Information architecture](docs/01-information-architecture.md) | Routes and navigation |
| [02 — Design system](docs/02-design-system.md) | Tokens and rationale |
| [03 — Component inventory](docs/03-component-inventory.md) | Component API and state matrix |
| [04 — User flows](docs/04-user-flows.md) | Happy paths and failure modes |
| [05 — Accessibility & responsive](docs/05-accessibility-and-responsive.md) | Checklist and test matrix |
| [ADRs](docs/adr/) | The decisions worth defending |

## Technology baseline

| Area | Choice |
|---|---|
| Web | Angular 22.1, TypeScript 6.0, standalone, zoneless, signals |
| UI | Custom SCSS token system; Angular CDK for accessibility primitives only |
| Backend | .NET 10 LTS, ASP.NET Core, modular monolith *(Phase 2)* |
| Data | PostgreSQL, Redis, Blob Storage, Service Bus *(Phase 3)* |
| Realtime | SignalR + Azure SignalR Service *(Phase 5)* |
| Hosting | Azure Container Apps, Bicep, Azure DevOps *(Phase 4)* |

Rationale for each choice lives in [docs/adr](docs/adr/).

## Configuration

Copy `.env.example` to `.env` and edit locally. **No secret, connection string, signing key
or Azure credential is ever committed** — `.env` is git-ignored and `.env.example` carries
placeholders only.

## Status

| Phase | State |
|---|---|
| 0 — Discovery, design system | Complete |
| **1 — Frontend prototype** | **In progress** — shell, theme, routes and home feed done; auth, composer, profile, messaging pending |
| 2 — Platform foundation | Not started |
| 3 — Content and media | Not started |
| 4 — Realtime messaging | Not started |
| 5 — Safety and readiness | Not started |
| 6 — Azure delivery | Not started |
| 7 — Mobile readiness | Not started |

A phase advances on a demonstrated user flow, passing tests, and met accessibility and
security criteria — never on "it compiles".
