# Coding Standards — Lodgwise AI

> Applies to all code in this monorepo. CI enforces what tools can enforce;
> reviews enforce the rest.

## 1. General

- Small, focused pull requests; one logical change per PR.
- Every PR: passing CI, at least one review, updated docs/tests when behavior changes.
- No secrets in the repository — use `.env` locally (see `.env.example`) and a
  secret manager in deployed environments.
- Feature branches: `feat/<scope>-<summary>`, `fix/…`, `chore/…`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org)
  (`feat(api): add reservation cancellation policy`).

## 2. TypeScript (apps/web, packages/*)

- **Strict mode always** (`"strict": true`); no `any` without an inline justification.
- Formatting/linting: Prettier + ESLint with shared config from `packages/config`.
- Naming: `camelCase` variables/functions, `PascalCase` components/types,
  `kebab-case` file names (React components may use `PascalCase.tsx`).
- Components: function components + hooks; server components by default in
  Next.js, client components only when interactivity requires it.
- Shared types live in `packages/types` — never duplicate API types by hand;
  generate from the OpenAPI schema where possible.
- State: prefer server state via query library; avoid global client stores
  unless justified.
- Tests: Vitest + React Testing Library; test user-visible behavior, not internals.

## 3. Python (apps/api, services/*)

- Python 3.12+; formatting and linting with **Ruff** (format + lint), type
  checking with **mypy** (strict on new code).
- Naming: `snake_case` functions/variables, `PascalCase` classes,
  modules short and lowercase.
- FastAPI conventions:
  - Pydantic models at every boundary; never return ORM objects directly.
  - Routers per domain (`reservations.py`, `rates.py`), thin routes,
    logic in service layer.
  - All DB access is async; every query is tenant-scoped — reviews must reject
    any query missing an organization filter.
- Errors: raise domain exceptions; map to RFC 9457 problem responses in one place.
- Tests: pytest; API tests against a real Postgres (via test containers),
  not mocks of the ORM.

## 4. Database

- Schema changes only via migrations in `database/migrations`; never edit a
  merged migration — add a new one.
- Every migration is reversible or explicitly documents why not.
- Table/column names: `snake_case`, plural table names, `*_id` foreign keys,
  `*_at` timestamps (UTC, `timestamptz`).
- New tenant-owned tables must include `organization_id` + RLS policy in the
  same migration.

## 5. API Design

- Follow the conventions in [API_SPECIFICATION.md](./API_SPECIFICATION.md).
- Additive changes only within a version; breaking changes require `/v2`.
- Mutating booking/payment endpoints must accept an `Idempotency-Key`.

## 6. Security

- Validate at boundaries; trust internal calls.
- All user-facing input validated by Pydantic/zod schemas.
- No raw SQL string interpolation — parameterized queries only.
- PII: encrypt sensitive columns, redact from logs, minimize retention.
- Dependencies: automated vulnerability scanning in CI; no unmaintained packages.

## 7. Observability

- Structured JSON logs; include `trace_id`, `organization_id`, `property_id`
  where applicable. Never log secrets or full PII.
- Every background job logs start/finish/failure with correlation IDs.

## 8. AI-Specific

- Prompts are versioned code — stored in the repo, reviewed like code.
- Every LLM workflow ships with an eval set in `services/ai/evals/`.
- Model outputs must pass schema validation before entering the core system.
