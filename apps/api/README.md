# apps/api — FastAPI Backend

The core PMS system of record: tenancy, properties, inventory, bookings,
rates, guests, operations, and billing.

- **Stack**: Python 3.13, FastAPI, SQLAlchemy 2.0 (async) + asyncpg,
  Alembic, Pydantic v2
- **Database strategy**: [docs/DATABASE_DESIGN.md](../../docs/DATABASE_DESIGN.md)
- **API conventions**: [docs/API_SPECIFICATION.md](../../docs/API_SPECIFICATION.md)
- **Decisions**: [docs/ARCHITECTURE_DECISIONS.md](../../docs/ARCHITECTURE_DECISIONS.md)

## Layout

```
app/
├── main.py          # App factory, middleware, router mounting, error mapping
├── core/
│   ├── config.py    # Pydantic settings (environment-driven)
│   ├── security.py  # Password hashing (argon2) + JWT issue/verify
│   └── exceptions.py# Domain exceptions mapped to HTTP in one place
├── database/
│   ├── base.py      # Declarative Base, naming conventions, mixins
│   └── session.py   # Async engine, session factory, get_db dependency
├── models/          # SQLAlchemy models (Organization, User, …)
├── modules/         # Domain modules: router / service / schemas per domain
│   ├── auth/        # register, login, refresh + auth/tenant dependencies
│   ├── organizations/
│   └── users/
├── schemas/         # Cross-domain Pydantic models (health, …)
├── routers/         # Unversioned infrastructure routes (health)
├── services/        # Reserved for cross-domain application services
└── utils/           # Small shared helpers (slugify, …)
tests/               # pytest (async, httpx client)
alembic/             # Migration environment (async)
```

**Dependency rule** (clean architecture): `router → service → models`
inside each module; `core` and `database` are infrastructure used by all
layers. Modules never import another module's router.

## Auth & tenancy

- `POST /api/v1/auth/register` creates an organization + OWNER, returns a
  JWT pair; `/auth/login` and `/auth/refresh` complete the flow.
- Roles: `OWNER > ADMIN > MANAGER > STAFF`; guard routes with
  `require_role(UserRole.ADMIN)`.
- Tenant context is resolved from the verified JWT via `CurrentTenant`;
  `TenantDB` yields a session with `app.tenant_id` set for the RLS policies
  that ship with the first tenant-owned domain tables.

## Getting started

Requires Python 3.13+ and a running PostgreSQL (see the repo-root
`docker-compose.yml` for local Postgres + Redis).

```bash
cd apps/api
cp .env.example .env

# with uv (recommended)
uv sync

# run the API
uv run uvicorn app.main:app --reload
```

- Health check: `GET http://localhost:8000/health` → `{"status": "ok"}`
- OpenAPI docs: `http://localhost:8000/api/v1/docs`

## Configuration

All configuration comes from environment variables (`.env` honored in
development only):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Async PostgreSQL DSN (`postgresql+asyncpg://…`) |
| `REDIS_URL` | Redis connection (cache/queues — wired in a later phase) |
| `SECRET_KEY` | Cryptographic secret; must be strong outside development |
| `ENVIRONMENT` | `development` \| `test` \| `staging` \| `production` |

## Migrations

```bash
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
```

Rules: forward-only, never edit a merged migration, and any migration creating
a tenant-owned table must add `tenant_id` + RLS policy in the same revision
(see [docs/DATABASE_DESIGN.md § 6](../../docs/DATABASE_DESIGN.md)).

## Tests

```bash
uv run pytest
```
