# packages/sdk — API Client SDK

Typed client SDK for the Lodgwise API, used by `apps/web` and available to
future consumers (partner integrations, internal tools).

- Generated from the FastAPI OpenAPI schema — endpoints and models stay in
  lockstep with `apps/api`; do not hand-write request/response code.
- Wraps auth (token refresh), idempotency keys, retries, and error mapping
  so consumers don't reimplement API conventions.

> Scaffolding pending.
