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
app/
├── (marketing)/page.tsx          # Landing at /
├── (auth)/login/page.tsx         # /login
└── (dashboard)/
    ├── layout.tsx                # Sidebar + header shell
    ├── overview/page.tsx         # /overview (dashboard home)
    ├── properties|bookings|guests|calendar|ai|analytics|billing|settings/
components/
├── layout/                       # Sidebar, header, navigation
├── ui/                           # shadcn/ui primitives
├── shared/                       # PageShell, StatCard, EmptyState
└── providers/
lib/navigation.ts                 # Dashboard nav items
```

Overview lives at `/overview` so the marketing landing can keep `/`. No API wiring yet — pages use empty states and placeholder cards only.

Conventions:

- Server components by default; `"use client"` only where interactivity
  requires it (providers, forms, nav).
- Add shadcn primitives with `npx shadcn@latest add <component>`.

## Getting started

Requires Node 20+.

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. Dashboard: <http://localhost:3000/overview>. Login shell: <http://localhost:3000/login>.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
