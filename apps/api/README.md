# apps/api — FastAPI Backend

The core PMS system of record: tenancy, properties, inventory, reservations,
rates, guests, operations, and billing.

- Framework: FastAPI (Python 3.12+), async SQLAlchemy, Pydantic
- Database: PostgreSQL with row-level tenant isolation (see
  [docs/DATABASE_DESIGN.md](../../docs/DATABASE_DESIGN.md))
- API conventions: [docs/API_SPECIFICATION.md](../../docs/API_SPECIFICATION.md)

> Scaffolding pending — see [docs/DEVELOPMENT_ROADMAP.md](../../docs/DEVELOPMENT_ROADMAP.md) Phase 0.
