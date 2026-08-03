# database — Migrations & Seeds

- `migrations/` — versioned, forward-only schema migrations (Alembic).
  Never edit a merged migration; add a new one.
- `seeds/` — seed data for local development and demos (sample tenants,
  properties of each type, reservations). Never run against production.
- `diagrams/` — entity-relationship diagrams and schema visuals, kept in
  sync with the migrations they describe (prefer text-based sources such as
  Mermaid/dbml so diffs are reviewable).

Schema strategy and entity model: [docs/DATABASE_DESIGN.md](../docs/DATABASE_DESIGN.md).
