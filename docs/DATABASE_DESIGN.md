# Database Design — Lodgwise AI

> Status: Draft — entity list and strategy. Concrete DDL lives in `database/migrations/`.

## 1. Strategy

- **PostgreSQL**, single database, shared schema.
- **Tenant isolation**: every tenant-owned table carries `organization_id`;
  enforced by application scoping **and** PostgreSQL Row-Level Security.
- **Migrations**: versioned, forward-only migrations in `database/migrations/`
  (Alembic). Seed data for local/dev environments in `database/seeds/`.
- **Keys**: UUIDv7 primary keys (time-ordered, index-friendly).
- **Auditing**: `created_at`, `updated_at` on all tables; append-only
  `audit_logs` for sensitive mutations.
- **Soft deletes** only where business requires history (guests, reservations);
  hard delete elsewhere.

## 2. Core Entity Map

```
Organization (tenant)
 ├── User ─────────────── Membership (role, property scope)
 ├── Property (hotel | villa | resort | cabana | hostel | guest_house | apartment)
 │    ├── UnitType (e.g. "Deluxe Double", "8-Bed Dorm", "Entire Villa")
 │    │    └── Unit (room / bed / whole unit)
 │    ├── RatePlan ── RateRule (seasonal price, restrictions)
 │    ├── Reservation ── ReservationUnit ── Folio ── FolioItem / Payment
 │    ├── HousekeepingTask / MaintenanceTicket
 │    └── ChannelConnection (OTA mappings)
 └── Guest (tenant-scoped profile, stay history)
```

## 3. Key Tables (Initial)

| Table | Purpose | Notes |
|-------|---------|-------|
| `organizations` | Tenant root | Plan, billing status, settings JSONB |
| `users` | Platform users | Global identity; org access via memberships |
| `memberships` | User↔org link | Role + optional property scoping |
| `properties` | A bookable property | `type` enum covers all 7 property types |
| `unit_types` | Sellable inventory class | Capacity, base occupancy, amenities JSONB |
| `units` | Physical unit | `kind`: room / bed / whole_unit; status |
| `rate_plans` | Pricing product | Cancellation policy, meal plan |
| `rate_rules` | Date-ranged pricing | Price, min/max stay, CTA/CTD |
| `guests` | Guest CRM profile | PII-encrypted columns, GDPR erasure support |
| `reservations` | Booking header | Status machine, source/channel, totals |
| `reservation_units` | Unit-night assignment | Enables unit moves and group bookings |
| `availability` | Denormalized calendar | Per unit_type per date; kept in sync by triggers/jobs |
| `folios` / `folio_items` | Guest billing | Taxes, charges, adjustments |
| `payments` | Payment records | Gateway refs only — no raw card data |
| `housekeeping_tasks` | Room turnover | Status lifecycle, assignee |
| `maintenance_tickets` | Repairs | Priority, unit linkage |
| `channel_connections` | OTA sync config | Per property, per channel |
| `ai_price_suggestions` | Pricing model output | Suggested price + acceptance tracking |
| `audit_logs` | Compliance trail | Append-only |
| `outbox_events` | Domain events | Transactional outbox for reliable messaging |

## 4. Modeling the 7 Property Types

One schema serves all property types by making **inventory granularity configurable**:

- **Hotel / Resort / Guest House** → `unit_types` with many `units` of kind `room`.
- **Hostel** → dorm `unit_types` with `units` of kind `bed`.
- **Villa / Cabana / Apartment** → a `unit_type` with one (or few) `units`
  of kind `whole_unit`.

No table structure changes per property type — only configuration.

## 5. Indexing & Performance Notes

- Composite indexes lead with `organization_id` (and `property_id` where relevant).
- `availability(property_id, unit_type_id, date)` unique index — the hottest read path.
- Reservation date-range queries use GiST on `daterange(check_in, check_out)`
  to enforce no double-assignment per unit.
- Partitioning of `reservations` / `availability` by date is a planned option,
  not a day-one implementation.

## 6. Data Lifecycle

- GDPR: guest PII erasure via crypto-shredding or column nulling with tombstones.
- Retention: audit logs and financial records kept per jurisdiction requirements.
- Backups: continuous WAL archiving + daily snapshots; restore drills documented in ops runbooks.
