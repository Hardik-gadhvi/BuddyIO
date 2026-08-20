# infra/ (Phase 4)

Bicep modules and per-environment parameter files.

Planned module structure: shared/global, environment, network, identity, observability,
data, messaging, compute, edge. Parameter files for `dev`, `uat`, `prod`.

**No secrets in parameter files, ever** - Key Vault references and managed identities only.
