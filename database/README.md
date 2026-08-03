# database — Migrations & Seeds

- `migrations/` — versioned, forward-only schema migrations (Alembic).
  Never edit a merged migration; add a new one.
- `seeds/` — seed data for local development and demos (sample tenants,
  properties of each type, reservations). Never run against production.

Schema strategy and entity model: [docs/DATABASE_DESIGN.md](../docs/DATABASE_DESIGN.md).
