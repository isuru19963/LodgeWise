# tests — Cross-Cutting Test Suites

Repository-level test suites. Fast, code-adjacent unit tests may also live
inside each app/package/service; this folder holds suites that span deployables.

- `unit/` — isolated tests for shared logic and pure domain rules.
- `integration/` — API + database tests against real Postgres/Redis
  (docker-compose), covering tenant isolation, reservation flows, billing.
- `e2e/` — browser-driven end-to-end journeys (Playwright) against a full
  local stack: onboarding → property setup → booking → check-out → invoice.

Conventions:

- Every test is tenant-scoped; cross-tenant leakage tests are mandatory for
  new domains (see [docs/CODING_STANDARDS.md](../docs/CODING_STANDARDS.md)).
- Integration and e2e suites run in CI on every PR; e2e may be tiered
  (smoke on PR, full suite nightly).

> Scaffolding pending.
