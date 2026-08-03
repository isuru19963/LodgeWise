# System Architecture — Lodgwise AI

> Status: Draft — reflects the intended target architecture. Details will evolve
> as implementation begins.

## 1. Architecture Style

A **modular monorepo** with a small number of deployable services. We start close to a
"majestic monolith + workers" shape and split services only when scale demands it.

```
                        ┌─────────────────────────────┐
                        │        nginx / CDN          │
                        └──────────┬──────────────────┘
              ┌────────────────────┼─────────────────────┐
              ▼                                          ▼
   ┌─────────────────────┐                   ┌─────────────────────┐
   │  apps/web (Next.js) │ ──── REST/JSON ──▶│  apps/api (FastAPI) │
   └─────────────────────┘                   └────────┬────────────┘
                                                      │
                     ┌────────────────┬───────────────┼────────────────┐
                     ▼                ▼               ▼                ▼
             ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐
             │ services/ai  │ │services/worker│ │ PostgreSQL │ │     Redis     │
             │ (LLM, ML)    │ │ (jobs, sync)  │ │ (primary)  │ │ (cache/queue) │
             └──────────────┘ └──────────────┘ └────────────┘ └───────────────┘
```

## 2. Components

### apps/web — Next.js Frontend
- App Router, server components where beneficial.
- Consumes the API via a typed client generated from the OpenAPI spec.
- Uses shared packages: `packages/ui`, `packages/types`, `packages/config`.

### apps/api — FastAPI Backend
- The system of record for all core PMS domains: tenancy, inventory,
  reservations, rates, guests, operations, billing.
- Async SQLAlchemy + PostgreSQL; Pydantic models at the boundary.
- Publishes domain events (reservation.created, rate.updated, …) to the queue.

### services/ai — AI Services
- Hosts LLM workflows (guest messaging, NL analytics) and ML pipelines
  (dynamic pricing, forecasting). See [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md).
- Called by the API synchronously (low-latency inference) or via the queue
  (batch scoring, retraining).

### services/worker — Background Jobs
- Queue consumers for email/SMS, OTA channel sync, report generation,
  scheduled tasks (night audit, rate pushes), and webhook fan-out.
- Idempotent handlers; retry with exponential backoff and dead-letter queues.

### Shared Packages
- `packages/types` — TypeScript types shared between web and other TS packages;
  generated where possible from the API's OpenAPI schema.
- `packages/ui` — design-system components (buttons, tables, calendar widgets).
- `packages/config` — shared lint/TS/format configs and environment schemas.

## 3. Multi-Tenancy Model

- **Single database, shared schema, row-level isolation** via a `tenant_id`
  (organization) column on every tenant-owned table.
- PostgreSQL **Row-Level Security (RLS)** policies enforce isolation at the
  database layer as defense in depth; the application layer also scopes every query.
- Tenant context is resolved from the authenticated session/JWT and injected
  per-request; no query may run without a tenant context except platform-admin paths.
- Escape hatch for future scale: largest tenants can be migrated to dedicated
  schemas or databases without API changes.

## 4. Data & Messaging

| Concern | Technology |
|---------|------------|
| Primary datastore | PostgreSQL 16+ |
| Cache / sessions / rate limiting | Redis |
| Job queue | Redis-backed queue initially (e.g. Celery/arq); Kafka/SQS if needed later |
| File storage | S3-compatible object storage |
| Search (later) | PostgreSQL FTS first; OpenSearch if needed |

## 5. Cross-Cutting Concerns

- **AuthN/AuthZ**: JWT access + refresh tokens; RBAC evaluated per org/property.
- **Observability**: structured JSON logs, OpenTelemetry traces, Prometheus metrics.
- **Configuration**: 12-factor, environment-driven; `.env` only for local dev.
- **API versioning**: URL-prefixed (`/api/v1`).
- **Idempotency**: idempotency keys on all mutating booking/payment endpoints.

## 6. Deployment

- All services are containerized (see `infra/docker/` and root `docker-compose.yml`
  for local development).
- nginx (`infra/nginx/`) terminates TLS and routes to web/api in
  self-hosted environments; a managed load balancer replaces it in cloud deployments.
- CI/CD via GitHub Actions (`.github/workflows/`): lint → test → build →
  image publish → deploy.
- Target runtime: Kubernetes or a managed container platform; horizontal scaling
  of api/worker pods, single-writer Postgres with read replicas.

## 7. Scaling Path to 1000+ Properties

1. Stateless api/web/worker → horizontal autoscaling.
2. Read replicas + Redis caching for availability/calendar reads.
3. Partition hot tables (reservations, availability) by tenant/date if required.
4. Extract channel-sync and AI inference into independently scaled deployments.
5. Per-tenant database sharding only as a last resort for outlier tenants.
