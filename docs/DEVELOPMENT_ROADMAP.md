# Development Roadmap — Lodgwise AI

> Status: Draft — phases are scoped for iterative delivery; dates intentionally omitted
> until team capacity is fixed.

## Phase 0 — Foundations (current)

- [x] Monorepo structure and documentation skeleton
- [ ] Tooling: package manager workspaces, lint/format/type-check, pre-commit hooks
- [ ] CI pipeline (lint → test → build) in GitHub Actions
- [ ] Local dev environment via docker-compose (Postgres, Redis, api, web)
- [ ] Base FastAPI app with health checks, settings, and migration wiring
- [ ] Base Next.js app with design-system shell (`packages/ui`)

## Phase 1 — Core PMS (MVP)

**Goal: a single property can run its daily operations end-to-end.**

- Tenancy: organizations, users, RBAC, invitations
- Property setup: property types, unit types, units (rooms / beds / whole units)
- Reservations: create/modify/cancel, availability calendar, check-in/out
- Rates: rate plans, seasonal rates, restrictions
- Guests: profiles and stay history
- Billing: folios, charges, taxes, Stripe payments, invoices
- Housekeeping: room status + task board
- Baseline reports: occupancy, ADR, RevPAR

## Phase 2 — Multi-Property & Distribution

**Goal: operators with portfolios; inventory sold on OTAs.**

- Multi-property dashboards and cross-property guest profiles
- Channel manager integration (availability/rate/reservation sync)
- Webhooks and public API hardening (idempotency, rate limits)
- Background job platform maturity (retries, DLQ, observability)
- Audit logs and GDPR tooling (export/erasure)

## Phase 3 — AI Layer

**Goal: the "AI-powered" differentiators.**

- Guest messaging assistant (drafts + review queue)
- Dynamic pricing suggestions with explanations
- Occupancy/demand forecasting dashboards
- Natural-language analytics (read-only)

## Phase 4 — Scale & Enterprise

**Goal: 1000+ properties comfortably; enterprise buyers.**

- Performance: read replicas, caching strategy, hot-table partitioning
- RLS hardening + per-tenant escape hatch (dedicated schema/DB)
- SSO (SAML/OIDC), advanced RBAC, IP allowlists
- SLA-grade observability, status page, error budgets
- Marketplace integrations (door locks, POS, accounting exports)

## Release & Quality Gates

Every phase exit requires:

1. Automated test coverage for new domains (unit + API integration tests).
2. Load-test evidence for the phase's hottest endpoints.
3. Security review of new surface area.
4. Updated documentation in `docs/`.
