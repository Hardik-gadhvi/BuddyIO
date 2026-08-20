# 06 — Backend Foundation (Phase 2)

> Status: **Phase 2, increment 1 — complete and verified end to end.**
> The Identity module is a working vertical slice; the other eight modules are
> not built yet.

## 1. Running it

```bash
cp services/src/BuddyIO.Api/appsettings.Development.json.example services/src/BuddyIO.Api/appsettings.Development.json
```

```bash
docker compose up -d postgres
```

```bash
cd services && dotnet run --project src/BuddyIO.Api --launch-profile https
```

- API: <https://localhost:7055>
- API reference (Scalar, dev only): <https://localhost:7055/scalar/v1>
- OpenAPI document: <https://localhost:7055/openapi/v1.json>
- Health: `/health/live` (no dependencies) and `/health/ready` (checks them)

> **Port 5433, not 5432.** This machine already runs a native PostgreSQL 18
> service on 5432. Pointing at it produces a baffling
> `password authentication failed for user "buddyio"` against a server that has
> none of our schemas, so the container claims its own port.

Migrations:

```bash
cd services && dotnet ef database update --project src/Modules/Identity/BuddyIO.Modules.Identity --startup-project src/BuddyIO.Api
```

Tests (xunit v3 runs on Microsoft.Testing.Platform, so the projects are
executables):

```bash
cd services && dotnet run --project tests/BuddyIO.ArchitectureTests
```

## 2. Structure

```
services/
  Directory.Build.props        net10.0, nullable, warnings-as-errors, NuGet audit
  Directory.Packages.props     Central Package Management - every version, once
  dotnet.config                opts `dotnet test` into Microsoft.Testing.Platform
  src/
    BuddyIO.SharedKernel/            error contract, IClock, module schema names
    BuddyIO.Api/                     the host: composition, middleware, versioning
    Modules/Identity/
      BuddyIO.Modules.Identity.Contracts/   what OTHER modules may reference
      BuddyIO.Modules.Identity/             everything else, all `internal`
  tests/
    BuddyIO.ArchitectureTests/       the module boundaries, as executable rules
    BuddyIO.Modules.Identity.Tests/
```

### The boundary is compiler-enforced, not conventional

A module exposes exactly **two public methods**:

```csharp
services.AddIdentityModule(configuration);   // composition
endpoints.MapIdentityEndpoints();            // routing
```

Everything else — `IdentityModuleDbContext`, `BuddyIoUser`, `AuthService`, the
endpoint handlers — is `internal`. The host physically cannot reach them. Other
modules reach Identity only through `IUserDirectory` in the `.Contracts`
assembly, which carries no EF Core and no entities.

`BuddyIO.ArchitectureTests` asserts six rules and fails the build when one is
crossed: no module referencing another module's implementation, shared kernel
free of module references, modules free of host references, domain types free of
EF Core, contracts free of implementations, and exactly one registration entry
point per module.

> One trap worth recording: NetArchTest matches dependencies by **name prefix**,
> so `BuddyIO.Modules.Identity.Contracts` appears to depend on
> `BuddyIO.Modules.Identity` — it matches itself. Those rules use exact
> `GetReferencedAssemblies()` comparison instead. The first version of the test
> produced a false positive that would have blocked CI.

### One database, one schema per module

Identity maps entirely into the `identity` schema and keeps its **own**
`__migrations` history table inside it. A cross-module join cannot be written by
accident, because it would require adding another module's entity to this
context — a visible, reviewable act.

## 3. The error contract

Every failure is RFC 9457 Problem Details, and every response carries `code` and
`correlationId` — including the ones the framework raises itself (401 challenges,
404s, malformed JSON). Without that last part, a client branching on `code` would
have to special-case exactly the responses it can least predict.

```json
{
  "type": "https://buddyio.dev/errors/validation_failed",
  "title": "Check these values",
  "status": 400,
  "code": "validation_failed",
  "correlationId": "af9d9a87e2ec152640163cdbe4ca77ef",
  "errors": {
    "password": ["Use at least 8 characters."],
    "username": ["Use 3 to 30 lowercase letters, numbers, dots or underscores."]
  }
}
```

The `code` values are **the same set** the Angular client declared in Phase 1
(`core/models/async-state.ts`). The client was written against mocks first, so
the API adopted its vocabulary rather than inventing a parallel one that someone
would then maintain a mapping between.

`correlationId` is the trace id. It is what the web client renders in its error
state, so a screenshot from a user is enough to find the exact request.

Only an `AppException` produces a message the caller sees. Everything else gets
a generic message, because unanticipated exception text routinely contains
connection strings, file paths and SQL.

## 4. Security decisions in this slice

| Decision | Why |
|---|---|
| httpOnly session cookie, no token in any response body | See [ADR-0004](adr/0004-cookie-sessions-over-browser-tokens.md). XSS cannot read the credential |
| Wrong password and unknown email return **identical** responses | Otherwise the endpoint is an account-enumeration oracle. Verified: the two responses differ only in correlation id |
| Password reset always reports success | Same reason |
| Password rules are length-only, no character classes | NIST SP 800-63B. Complexity checklists push people to `Password1!` |
| Passwords hashed by ASP.NET Core Identity | The spec forbids hand-rolled hashing. There is no custom crypto in this solution |
| Lockout after 10 failures, 5 minutes | Returns `rate_limited` with `Retry-After` |
| Auth challenge returns 401 JSON, never a redirect | A redirect hands the SPA HTML where it expected JSON |
| CORS is an explicit origin allow-list | Mandatory with `AllowCredentials`, and it forces deployments to name their front ends |

## 5. Verified end to end

Against the running API and a real PostgreSQL:

- `POST /auth/register` → 200, session cookie issued, `next: "onboarding"`
- `GET /auth/me` with cookie → the real display name and onboarding flag
- `POST /auth/login` wrong password → 401, and byte-identical to unknown email
- `POST /auth/register` invalid → 400 with per-field camelCased errors
- Age gate (12 years old) → 400 on `dateOfBirth`
- Unauthenticated `/auth/me` → 401 carrying `code` and `correlationId`
- Unknown route → 404 in the same shape
- 14 tests passing (6 architecture, 8 identity)

> `/auth/me` originally rebuilt its response from cookie claims, which returned
> the handle as the display name and hard-coded `hasCompletedOnboarding: true`.
> Claims are a snapshot taken at sign-in; that flag decides where the client
> routes on every load. It now reads the account.

## 6. Not built yet

Eight modules (Profiles & Social Graph, Content, Engagement, Feed, Messaging,
Notifications, Moderation, Media), the transactional outbox, integration events,
email verification and password reset delivery, **anti-forgery tokens**,
rate limiting beyond Identity's lockout, refresh/session revocation UI,
Testcontainers integration tests, and the generated Angular API client.

**Anti-forgery is the notable gap.** Cookies are ambient, `SameSite=Lax` blocks
the classic cross-site form POST but is not sufficient alone, and this must land
before any public deployment.
