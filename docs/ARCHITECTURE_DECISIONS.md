# Architecture Decisions — Lodgwise AI

> Status: Living document. Each section records a decision, its rationale, and its
> consequences. Material changes to these decisions require a PR updating this
> document with the reasoning for the change.
>
> Related: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) (how the system is
> built), [DATABASE_DESIGN.md](./DATABASE_DESIGN.md), [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md).

---

## 1. Project Overview

**Lodgwise AI** is an AI-powered Property Management System (PMS) delivered as a
multi-tenant SaaS platform for hospitality businesses. It manages the full
operational lifecycle of a property — inventory, reservations, rates, guests,
housekeeping, and billing — and differentiates through embedded AI for dynamic
pricing, demand forecasting, and guest communication.

**Target users.** Owners and general managers, front desk and reservations
staff, housekeeping teams, accountants, and multi-property operators across
seven property types: hotels, villas, resorts, cabanas, hostels, guest houses,
and apartments. A single domain model serves all seven by treating inventory
granularity (room, bed, whole unit) as configuration rather than code.

**Multi-tenant SaaS approach.** One deployment serves all customers. The tenant
root is the *organization*, which owns one or more properties. Tenancy is
enforced at every layer — request context, application queries, and database
row-level security — with a design target of 1000+ properties on shared
infrastructure. Per-tenant dedicated schemas or databases remain available as an
escape hatch for outlier customers, without API changes.

**Decision.** Build one multi-tenant platform, not per-customer deployments.
**Rationale.** Operational cost, upgrade velocity, and cross-property features
(portfolio dashboards, benchmarking) all favor shared infrastructure; isolation
is achievable with discipline and database-level enforcement.

---

## 2. Architecture Style

**Decision.** Start with a **modular monolith** (`apps/api`) plus a small number
of supporting deployables (`services/worker`, `services/ai`,
`services/integrations`), all in one monorepo.

**Why not microservices from day one.**

1. **Domain boundaries are not yet proven.** Reservations, rates, and billing
   are deeply transactional and consistent with each other; splitting them
   prematurely turns local transactions into distributed ones.
2. **Team size.** Microservices trade development-time coupling for
   operational complexity (service discovery, versioned contracts, distributed
   tracing debugging). A small team pays that tax without the payoff.
3. **Iteration speed.** A single deployable with modular internals allows
   refactoring domain boundaries in one PR instead of coordinated releases.
4. **Scale math.** A stateless FastAPI monolith behind a load balancer with
   read replicas and caching comfortably serves the 1000-property target;
   scale pressure arrives first at the database, not the application tier.

**Internal structure.** The monolith is modular by construction: one package
per domain (tenancy, inventory, reservations, rates, guests, billing,
operations), each with its own service layer and router, communicating through
explicit interfaces and domain events — never by reaching into another module's
tables.

**Future extraction strategy.** Modules become services only when a measured
constraint demands it (independent scaling, isolation of a noisy workload,
team ownership boundaries). The extraction path is pre-paved:

1. Domain events already flow through a transactional outbox and queue, so
   consumers do not care where the producer runs.
2. Candidate first extractions are **channel sync** (bursty, third-party
   latency-bound) and **AI inference** (GPU/cost profile differs) — which is
   why `services/integrations` and `services/ai` are separate deployables
   from the start.
3. Extraction procedure: freeze the module's public interface → move it behind
   the existing internal HTTP/queue contract → deploy separately → remove from
   the monolith. No big-bang rewrites.

---

## 3. Frontend Decisions

| Decision | Choice |
|----------|--------|
| Framework | **Next.js** (App Router) |
| Language | **TypeScript**, strict mode |
| Styling | **Tailwind CSS** |
| Component sharing | Monorepo packages (`packages/ui`, `packages/types`, `packages/sdk`, `packages/validators`) |

**Next.js.** Server components and streaming fit a dashboard-heavy product:
fast first paint for data-dense pages (calendars, reports), file-based routing,
and a single framework for both the operator app and future guest-facing
surfaces (booking engine) without a second stack.

**TypeScript everywhere.** Strict mode, no untyped boundaries. API types are
generated from the backend's OpenAPI schema into `packages/types` and consumed
via the `packages/sdk` client — the compiler catches contract drift between
frontend and backend before CI does.

**Tailwind CSS.** Utility-first styling keeps the design system in
`packages/ui` consistent and reviewable; design tokens (colors, spacing,
typography) live in the shared Tailwind preset so every app renders the same
brand. Component primitives are built once in `packages/ui` and composed in
apps — apps do not hand-roll buttons, tables, or form controls.

**Shared UI packages.** `packages/ui` (components), `packages/validators`
(zod schemas for client-side validation), and `packages/config` (lint/TS
presets) prevent divergence as the number of frontend surfaces grows.

---

## 4. Backend Decisions

| Decision | Choice |
|----------|--------|
| Framework | **FastAPI** |
| Language | **Python 3.12+** |
| ORM / data access | **SQLAlchemy** (async) + Alembic |
| API style | **REST** (JSON, OpenAPI-first) |

**FastAPI.** Async-native performance, first-class OpenAPI generation (which
feeds the typed frontend SDK), and Pydantic validation at every boundary.
Dependency injection makes tenant-context and authorization enforcement
declarative per route.

**Python.** One backend language across the core API, workers, and AI
services means shared domain models, shared tooling (Ruff, mypy, pytest), and
no serialization seams between the PMS and its ML/LLM code — the strongest
practical argument given the AI-centric roadmap.

**SQLAlchemy.** Mature async ORM with explicit control over queries — 
important because every query must be tenant-scoped and hot paths
(availability searches) need hand-tuned SQL. Alembic provides the migration
discipline described in [DATABASE_DESIGN.md](./DATABASE_DESIGN.md).

**REST over GraphQL/RPC.** The PMS domain maps cleanly to resources
(properties, reservations, folios); REST with OpenAPI gives cache-friendly
semantics, simple webhooks and idempotency-key support for booking/payment
mutations, and the lowest integration barrier for future partner APIs.
GraphQL may be added later as a frontend-facing layer if screen-level data
composition demands it; it will not replace the REST contract.

---

## 5. Database Decisions

| Decision | Choice |
|----------|--------|
| Engine | **PostgreSQL 16+**, single primary + read replicas |
| Tenancy model | Shared schema, row-level isolation, Postgres RLS |
| Primary keys | **UUIDv7** |
| Migrations | Alembic, versioned, forward-only |

**PostgreSQL.** One engine covers relational OLTP, JSONB for flexible
per-property settings, `daterange` + GiST exclusion constraints for
double-booking prevention, full-text search, and `pgvector` for AI embeddings —
minimizing infrastructure sprawl until scale proves otherwise.

**Multi-tenant isolation.** Every tenant-owned table carries
`organization_id`. Isolation is enforced twice: the application layer injects
tenant scope into every query, and **Row-Level Security policies** enforce it
at the database as defense in depth. A query without tenant context cannot
return tenant data even if application code regresses. New tenant-owned tables
must ship their RLS policy in the same migration.

**UUIDv7 primary keys.** Globally unique keys make cross-service references,
event payloads, data export/import, and the future sharding escape hatch safe
(no sequence collisions). Version 7's time-ordering avoids the B-tree index
fragmentation that plagued random UUIDv4 keys, keeping insert-heavy tables
(reservations, folio items) performant.

**Migration strategy.** All schema changes flow through versioned Alembic
migrations in `database/migrations/` — never manual DDL. Merged migrations are
immutable; changes require a new migration. Migrations are backward-compatible
with the previous application release (expand → migrate → contract) so deploys
never require downtime. ERDs in `database/diagrams/` are updated alongside the
migrations they describe.

---

## 6. AI Architecture Decisions

Full detail in [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md); the binding
decisions are:

**LLM integration approach.** All LLM access goes through a **provider
abstraction** in `services/ai` — no direct provider SDK calls from the core
API. Models are selected per task (cost/latency/quality), swappable without
touching callers. The core principle is **AI proposes, the core executes**:
model outputs (prices, messages) pass schema validation and flow through the
same validated API endpoints as human actions. No model ever writes to the
database directly.

**Knowledge base.** Each tenant has a scoped knowledge base — property
policies, amenities, rate rules, local guides — ingested from structured PMS
data and operator-provided documents. Knowledge is versioned and tenant-owned;
nothing is shared across tenants.

**RAG architecture.** Retrieval-augmented generation over the tenant knowledge
base using `pgvector` in the primary Postgres (embeddings inherit the same RLS
tenant isolation as all other data). Pipeline: ingestion → chunking →
embedding → retrieval with tenant-scoped filters → grounded generation with
source attribution. Every RAG workflow ships with an offline eval set in
`services/ai/evals/`; regressions block deployment.

**Future AI agent capabilities.** Agentic behavior arrives in phases with
widening autonomy, always bounded:

1. **Draft** — agent proposes, human approves (guest replies, price changes).
2. **Constrained auto** — agent acts within hard bounds set outside the model
   (price floors/ceilings, whitelisted reply intents), per-property opt-in.
3. **Workflows** — multi-step agents (e.g. rebook a cancelled group) that
   operate exclusively through the public API surface with full audit trails,
   budget limits, and human escalation on low confidence.

---

## 7. Security Decisions

**Authentication.** JWT access tokens (short-lived, ~15 min) with rotating
refresh tokens. Email/password at launch with mandatory strong hashing
(argon2); SSO (OIDC/SAML) planned for the enterprise phase. All tokens carry
the organization context; sessions are revocable server-side via refresh-token
invalidation.

**Authorization.** Role-based access control evaluated per organization and
per property: a user's membership defines a role (owner, manager, front desk,
housekeeping, accountant) optionally scoped to specific properties.
Authorization is enforced in the API layer via declarative dependencies on
every route — never in the frontend, which only *reflects* permissions.

**Tenant isolation.** Three enforcement layers: (1) tenant context resolved
from the authenticated token and injected per request — no request executes
without one except platform-admin paths; (2) application-level query scoping,
reviewed as a hard requirement in every PR; (3) PostgreSQL RLS as the backstop.
Cross-tenant isolation tests are mandatory for every new domain
(see `tests/`). AI workloads inherit the same boundaries — prompts,
embeddings, and retrieval are tenant-scoped.

**Audit logging.** Append-only `audit_logs` capture sensitive mutations
(auth events, permission changes, rate changes, reservation/billing
modifications, data exports, AI auto-actions) with actor, tenant, timestamp,
and before/after values where lawful. Audit records are immutable,
tamper-evident, and retained per jurisdiction requirements. Logs never contain
secrets or full PII.

---

## 8. Deployment Decisions

**Docker.** Every deployable (web, api, ai, worker, integrations) ships as a
container built from Dockerfiles in `infra/docker/`. The same images run in
local development (root `docker-compose.yml`), CI, and production — no
environment-specific builds. Configuration is 12-factor: injected via
environment, never baked into images.

**CI/CD.** GitHub Actions (`.github/workflows/`): every PR runs lint,
type-check, unit and integration tests (against real Postgres/Redis), and
image builds; merges to main publish versioned images and deploy through
staging → production with automated migration execution (expand/contract
pattern, § 5). Deploys are rollback-safe because migrations are
backward-compatible with the previous release.

**Cloud deployment strategy.** Cloud-agnostic by design: containers plus
managed PostgreSQL, Redis, and S3-compatible object storage are the only
infrastructure dependencies. Initial target is a managed container platform or
Kubernetes on a single region; the scaling path is horizontal (stateless
api/web/worker autoscaling, database read replicas) before anything exotic.
nginx (`infra/nginx/`) fronts self-hosted/local environments; a managed load
balancer replaces it in cloud deployments. Multi-region is deferred until
customer geography requires it — latency-sensitive assets go through a CDN
first.

---

## 9. Development Principles

**Clean architecture.** Dependencies point inward: routers → services →
domain, with infrastructure (DB, queues, LLM providers) behind interfaces.
Domain modules expose explicit contracts and communicate via events; no module
reads another module's tables. Framework code stays at the edges — the domain
layer must be testable without FastAPI or SQLAlchemy running.

**Documentation first.** Significant designs land in `docs/` before
implementation: this document for decisions, the specialized docs for domain
detail. The OpenAPI schema is the API's source of truth, and generated
artifacts (SDK, types) are never hand-edited. If code and documentation
disagree, fixing the documentation is part of the change.

**Test-driven approach.** New domain logic ships with tests written against
behavior, not implementation. The pyramid: fast unit tests for domain rules,
integration tests against real Postgres/Redis for API and tenancy guarantees,
and a lean e2e suite for critical journeys (booking, check-in/out, invoicing).
Tenant-isolation tests are non-negotiable for every new table and endpoint.
CI green is a merge requirement; flaky tests are fixed or deleted, never
retried into passing.

**Backward compatibility.** Within an API version, changes are additive only —
breaking changes require a new version (`/v2`) with a deprecation window.
Database migrations follow expand → migrate → contract so the previous
application release always runs against the current schema. Events are
versioned; consumers tolerate unknown fields. Feature flags are used for
rollout sequencing, then removed — not kept as permanent configuration.
