# packages/validators — Shared Validation Schemas

Shared validation schemas (zod) for domain values used across frontend apps
and packages: dates and stay ranges, currency/price bounds, email/phone,
property and unit constraints.

- Single source of truth for client-side validation rules; the API remains
  the authoritative validator at the boundary (Pydantic).
- Consumed by `apps/web`, `packages/ui` forms, and `packages/sdk`.

> Scaffolding pending.
