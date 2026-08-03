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

Overview lives at `/overview` so the marketing landing can keep `/`.

### Properties flow

```
/properties                     # list
/properties/new                 # select type → details → save
/properties/[id]/units          # manage units (features/units)
```

### Units feature

```
features/units/
├── components/   # list, card, form, type selector
├── hooks/        # useUnits, useCreateUnit
├── schemas/      # Zod unit schemas
└── services/     # GET/POST /units (+ unit-types)
```

### Bookings feature

```
features/bookings/
├── components/   # list, form, card, calendar, status badge
├── hooks/        # useBookings, useAvailability, useGuests
├── schemas/
└── services/     # GET/POST /bookings, GET /availability, guests
```

Pages: `/bookings`, `/calendar`

## Auth & API foundation

```
lib/api-client.ts       # fetch wrapper, Bearer token, 401 → refresh
lib/auth.ts             # Zod schemas, cookie token helpers
lib/auth-cookies.ts     # Cookie names (shared with middleware)
services/auth-service.ts
services/user-service.ts
hooks/use-auth.ts
hooks/use-user.ts
providers/auth-provider.tsx
providers/query-provider.tsx
middleware.ts           # Protects dashboard routes → /login
```

Tokens live in cookies (`lw_access_token`, `lw_refresh_token`) so middleware can guard `/overview`, `/properties`, and other dashboard paths. No registration UI yet.

## Getting started

Requires Node 20+.

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. Sign in at <http://localhost:3000/login> (API at `NEXT_PUBLIC_API_URL`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
