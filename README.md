# Lodgwise AI

AI-powered Property Management System (PMS) for hospitality businesses — hotels,
villas, resorts, cabanas, hostels, guest houses, and apartments — built as a
multi-tenant SaaS platform designed to scale to 1000+ properties.

> **Status**: Project scaffolding phase. No application code yet — structure and
> documentation only. See [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md).

## Repository Layout

```
├── apps/
│   ├── web/              # Next.js frontend (operator dashboard & booking UIs)
│   └── api/              # FastAPI backend (core PMS system of record)
│
├── packages/
│   ├── ui/               # Shared UI components (design system)
│   ├── types/            # Shared TypeScript types (generated from OpenAPI)
│   ├── config/           # Shared lint/TS/env configuration
│   ├── sdk/              # Typed API client SDK (generated from OpenAPI)
│   └── validators/       # Shared validation schemas (zod)
│
├── services/
│   ├── ai/               # AI services: pricing, forecasting, guest messaging
│   ├── worker/           # Background jobs: OTA sync, emails, scheduled tasks
│   └── integrations/     # Third-party connectors: OTAs, payments, messaging
│
├── database/
│   ├── migrations/       # Versioned schema migrations
│   ├── seeds/            # Local/dev seed data
│   └── diagrams/         # ERDs and schema diagrams
│
├── tests/
│   ├── unit/             # Isolated tests for shared/domain logic
│   ├── integration/      # API + database tests (real Postgres/Redis)
│   └── e2e/              # Browser-driven end-to-end journeys
│
├── docs/                 # Architecture & product documentation
│
├── infra/
│   ├── docker/           # Dockerfiles per deployable
│   └── nginx/            # Reverse proxy configuration
│
├── scripts/              # Repo tooling and one-off scripts
│
└── .github/
    └── workflows/        # CI/CD pipelines
```

## Documentation

| Document | Contents |
|----------|----------|
| [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Vision, users, capabilities |
| [ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) | Key technical decisions and their rationale |
| [PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) | Functional & non-functional requirements |
| [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Services, tenancy model, infrastructure |
| [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Data model & migration strategy |
| [API_SPECIFICATION.md](docs/API_SPECIFICATION.md) | API conventions & endpoint catalog |
| [AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md) | AI capabilities, safety, phasing |
| [DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) | Phased delivery plan |
| [CODING_STANDARDS.md](docs/CODING_STANDARDS.md) | Code, commit, and review conventions |

## Tech Stack (Planned)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (TypeScript), shared design system |
| Backend | FastAPI (Python 3.12+), async SQLAlchemy |
| Database | PostgreSQL 16+ (row-level security for tenancy), Redis |
| AI | LLM provider abstraction, pgvector, ML pipelines |
| Infra | Docker, nginx, GitHub Actions CI/CD |

## Getting Started (Local Development)

Dependencies are intentionally **not installed yet** — this repository currently
contains structure and documentation only. Once scaffolding lands:

```bash
cp .env.example .env      # configure local environment
docker compose up -d      # start Postgres, Redis, api, web
```

## Contributing

Read [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) before opening a PR.
All changes go through pull requests with CI green and at least one review.
