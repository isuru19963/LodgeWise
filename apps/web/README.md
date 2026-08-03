# apps/web — Next.js Frontend

Operator-facing web application for Lodgwise AI: dashboards, reservation
calendar, rates, housekeeping boards, billing, and AI insights.

- **Stack**: Next.js 15 (App Router), React 19, TypeScript (strict),
  Tailwind CSS v4, shadcn/ui
- **Data**: TanStack Query for server state, Zod for validation,
  React Hook Form for forms
- **Conventions**: [docs/CODING_STANDARDS.md](../../docs/CODING_STANDARDS.md)

## Layout

```
app/                  # App Router: routes, layouts, globals.css
components/
├── ui/               # shadcn/ui primitives (generated via CLI)
├── shared/           # Reusable app components composed from primitives
└── providers/        # QueryProvider, ThemeProvider, root Providers
features/             # Feature modules (dashboard, bookings, … — empty by design)
hooks/                # Shared React hooks
lib/                  # Utilities (cn, …)
services/             # API access layer (typed client — arrives with the SDK)
types/                # Local TS types (shared types come from packages/types)
public/               # Static assets
```

Conventions:

- Server components by default; `"use client"` only where interactivity
  requires it (providers, forms).
- Feature code lives in `features/<name>/`, composed from `components/` and
  `services/` — pages stay thin.
- Add shadcn primitives with `npx shadcn@latest add <component>`; never edit
  generated files in `components/ui` beyond what the CLI produces.

## Getting started

Requires Node 20+.

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. The backend API is expected at
`NEXT_PUBLIC_API_URL` (see the repo-root `docker-compose.yml` to run it).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
