# ADR-0004 — Cookie sessions for the browser, not tokens

- **Status:** Accepted
- **Date:** 2026-08-20
- **Phase:** 2

## Context

The SPA needs an authenticated call to the API. The default reflex is a JWT: the
API returns an access token, the client stores it, and every request carries
`Authorization: Bearer …`. It is well-documented, works with any client, and is
what most tutorials show.

It also requires the browser to hold a credential that JavaScript can read. Once
that is true, any successful XSS — in our code, in a dependency, in a transitive
dependency of a dependency — exfiltrates the token, and the attacker has the
user's session from anywhere until it expires. Shortening the lifetime narrows
the window; it does not close it.

## Decision

**The browser authenticates with an httpOnly, Secure, SameSite=Lax session
cookie.** No token is returned in any response body, and no token is stored in
`localStorage`, `sessionStorage` or a JS variable.

The consequences run through the whole stack, so they are recorded here rather
than rediscovered:

- `AuthResponse` deliberately contains **no token field**. Nothing in the client
  can grow a dependency on reading one, because there is nothing to read.
- The `AuthRepository` interface on the web side was written this way in Phase 1,
  before the API existed. The contract was designed around the constraint rather
  than retrofitted to it.
- The cookie is set by ASP.NET Core Identity's `SignInManager`. The API is the
  BFF; there is no separate token service to secure.
- CORS uses an **explicit origin allow-list with `AllowCredentials`**.
  `AllowAnyOrigin` is invalid alongside credentials, and that restriction is a
  feature: it forces the deployment to name its front ends.
- An auth challenge returns **401 with Problem Details**, never a redirect to a
  login page. A redirect would hand the SPA an HTML body where it expected JSON.
- `SameSite=Lax` rather than `Strict`: `Strict` breaks the flow where a user
  follows a link to a BuddyIO post from another site and arrives signed out.

## Consequences

**Positive** — XSS cannot steal the session, which removes the single highest
impact web vulnerability class from the threat model. There is no refresh-token
rotation scheme to design, implement, and get subtly wrong. Sign-out is genuine
server-side invalidation rather than the client agreeing to forget a token.

**Negative** — cookies are ambient, so **CSRF becomes a real concern**. `Lax`
blocks the classic cross-site form POST, but this is not sufficient on its own
and is tracked as follow-up work: anti-forgery tokens on state-changing
endpoints before any public deployment. Native mobile clients (Phase 8) cannot
use a browser cookie jar the same way and will need a separate, deliberately
designed token flow — the API keeping tokens out of the *browser* contract does
not preclude issuing them to a native client over a different path.

**Cross-origin cost** — the SPA and API are separate origins in development, so
every request is credentialed and preflighted. Co-hosting them behind one origin
in production removes this, and the spec's Front Door topology already does so.

## Alternatives rejected

- **Bearer token in `localStorage`** — the spec forbids it outright, and for the
  reason above.
- **Token in memory + silent refresh via iframe** — keeps the access token out of
  storage, but reintroduces it into JS memory, needs a refresh-token cookie
  anyway, and adds significant machinery to end up in a weaker place than a
  plain session cookie.
- **Entra External ID from day one** — the production intent (see the spec), but
  it requires a tenant, app registrations and redirect URIs before a single
  endpoint can be exercised locally. The cookie session is the "carefully scoped
  dev auth substitute" the spec explicitly permits, and it does not leak into the
  contract: swapping the issuer later changes how the cookie is *established*,
  not how any endpoint is *called*.
