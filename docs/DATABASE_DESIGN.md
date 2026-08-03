# Database Design — Lodgwise AI

> Status: Design specification. Concrete DDL will live in `database/migrations/`
> (Alembic); ER diagrams in `database/diagrams/`. No migrations exist yet.
>
> Related: [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) § 5,
> [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) § 3.

---

## 1. Strategy

- **Engine**: PostgreSQL 16+ — single database, shared schema, read replicas
  for reporting/AI feature reads.
- **Multi-tenancy**: shared schema with row-level isolation. Every
  tenant-owned table carries `tenant_id` (FK → `organizations.id`), enforced by
  application-level query scoping **and** PostgreSQL Row-Level Security.
- **Extensions**: `pgcrypto` (encryption helpers), `btree_gist` (exclusion
  constraints for double-booking prevention), `pgvector` (AI embeddings).

### Naming conventions

- Tables: `snake_case`, plural. Columns: `snake_case`. FKs: `<entity>_id`.
  Timestamps: `*_at`, always `timestamptz` (UTC).
- The tenant key column is **`tenant_id`** on every tenant-owned table and
  always references `organizations(id)`. ("Organization" is the business name
  for a tenant; `tenant_id` is the technical isolation key.)
- The booking domain uses **booking** as the canonical term (`bookings`,
  `booking_items`); other documents that say "reservation" refer to the same
  entity and will be aligned as APIs are implemented.

### Global rules

| Rule | Implementation |
|------|----------------|
| Primary keys | `id UUID` (UUIDv7 — time-ordered, index-friendly), `DEFAULT` generated app-side or via function |
| Timestamps | `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` (trigger-maintained) on every table |
| Soft deletion | `deleted_at timestamptz NULL` on tables where history matters (marked ⌫ below). Queries exclude soft-deleted rows by default; hard delete elsewhere |
| Tenant isolation | `tenant_id UUID NOT NULL REFERENCES organizations(id)` on every tenant-owned table + RLS policy |
| Money | `NUMERIC(12,2)` + ISO-4217 `currency CHAR(3)`; never floats |
| Enums | PostgreSQL `ENUM` types for closed sets (statuses, kinds); lookup tables for extensible sets |

### Row-Level Security design

Every tenant-owned table ships (in the same migration that creates it):

1. `ALTER TABLE … ENABLE ROW LEVEL SECURITY` (+ `FORCE`).
2. A policy comparing `tenant_id` to the request-scoped setting
   `current_setting('app.tenant_id')::uuid`, applied to SELECT/INSERT/UPDATE/DELETE.
3. The application sets `app.tenant_id` per connection/transaction from the
   authenticated JWT before any query runs; platform-admin paths use a
   separate role with explicit bypass policies and audit logging.

RLS is defense in depth — the application layer still scopes every query, so a
missing filter degrades to a correctness bug, never a data leak.

---

## 2. Tenancy Hierarchy

```
Organization (tenant root)
    │
    └── Properties            (hotel | villa | resort | cabana | hostel | guest_house | apartment)
            │
            └── Units         (rooms, beds, or whole units — via unit_types)
                    │
                    └── Bookings  (booking_items assign units to stays)
```

Supporting domains hang off this spine: users/roles at the organization level,
guests at the tenant level (shared across a tenant's properties), AI knowledge
and conversations at tenant/property level, and SaaS billing at the
organization level.

---

## 3. Entity Definitions

Legend: **PK** primary key · **FK** foreign key · **T** tenant-owned
(`tenant_id` + RLS) · ⌫ soft-deletable (`deleted_at`) · all tables also carry
`created_at` / `updated_at` (not repeated below).

### 3.1 Tenant / Organization

#### `organizations` — tenant root ⌫

The top of the hierarchy; one row per customer. Not itself RLS-scoped by
`tenant_id` (it *is* the tenant) — access controlled via memberships and
platform-admin policies.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `name` | VARCHAR(200) | NOT NULL |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE — URL-safe identifier |
| `status` | ENUM | `active` \| `trial` \| `suspended` \| `closed` |
| `default_currency` | CHAR(3) | NOT NULL, ISO 4217 |
| `default_timezone` | VARCHAR(64) | NOT NULL, IANA name |
| `settings` | JSONB | NOT NULL DEFAULT `{}` — tenant preferences |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: 1→N `properties`, `guests`, `memberships`, `subscriptions`,
and every other tenant-owned table via `tenant_id`.

#### `users` — global platform identities ⌫

Global (not tenant-owned): one identity can belong to multiple organizations.
Tenant access is granted exclusively through `memberships`.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `email` | CITEXT | NOT NULL, UNIQUE |
| `password_hash` | TEXT | NULL (null for SSO-only users), argon2 |
| `full_name` | VARCHAR(200) | NOT NULL |
| `phone` | VARCHAR(32) | NULL |
| `is_platform_admin` | BOOLEAN | NOT NULL DEFAULT false — Lodgwise staff only |
| `last_login_at` | TIMESTAMPTZ | NULL |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: N→M `organizations` through `memberships`.

#### `roles` — role definitions **T** (system roles global)

System roles (`owner`, `manager`, `front_desk`, `housekeeping`, `accountant`)
have `tenant_id NULL` and `is_system = true`; tenants may add custom roles.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → `organizations.id`, NULL for system roles |
| `code` | VARCHAR(50) | NOT NULL; UNIQUE per tenant (or globally when system) |
| `name` | VARCHAR(100) | NOT NULL |
| `description` | TEXT | NULL |
| `is_system` | BOOLEAN | NOT NULL DEFAULT false |

**Relationships**: N→M `permissions` via `role_permissions`; referenced by
`memberships.role_id`.

#### `permissions` — global permission catalog

Fixed, code-defined catalog (e.g. `bookings.create`, `rates.update`,
`reports.view`). Global — no `tenant_id`.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `code` | VARCHAR(100) | NOT NULL, UNIQUE |
| `category` | VARCHAR(50) | NOT NULL — grouping for admin UI |
| `description` | TEXT | NOT NULL |

#### `role_permissions` — role ↔ permission join

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `role_id` | UUID | PK part, FK → `roles.id` ON DELETE CASCADE |
| `permission_id` | UUID | PK part, FK → `permissions.id` ON DELETE CASCADE |

#### `memberships` — user ↔ organization access **T**

The junction that makes multi-tenancy work: grants a user a role within one
organization, optionally scoped to specific properties.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `user_id` | UUID | NOT NULL, FK → `users.id` |
| `role_id` | UUID | NOT NULL, FK → `roles.id` |
| `property_ids` | UUID[] | NULL — NULL = all of the tenant's properties |
| `status` | ENUM | `invited` \| `active` \| `disabled` |
| | | UNIQUE (`tenant_id`, `user_id`) |

---

### 3.2 Property Management

#### `property_types` — global lookup

The seven supported types as data, not schema: `hotel`, `villa`, `resort`,
`cabana`, `hostel`, `guest_house`, `apartment`.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `code` | VARCHAR(30) | NOT NULL, UNIQUE |
| `name` | VARCHAR(100) | NOT NULL |
| `default_unit_kind` | ENUM | `room` \| `bed` \| `whole_unit` — onboarding default |
| `description` | TEXT | NULL |

#### `properties` — a bookable property **T** ⌫

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `property_type_id` | UUID | NOT NULL, FK → `property_types.id` |
| `name` | VARCHAR(200) | NOT NULL |
| `slug` | VARCHAR(100) | NOT NULL; UNIQUE (`tenant_id`, `slug`) |
| `description` | TEXT | NULL |
| `address_line1` / `address_line2` | VARCHAR(200) | line2 NULL |
| `city` / `region` / `postal_code` | VARCHAR(100) | region/postal NULL |
| `country_code` | CHAR(2) | NOT NULL, ISO 3166-1 |
| `latitude` / `longitude` | NUMERIC(9,6) | NULL |
| `timezone` | VARCHAR(64) | NOT NULL, IANA name |
| `currency` | CHAR(3) | NOT NULL |
| `check_in_time` / `check_out_time` | TIME | NOT NULL, property-local |
| `status` | ENUM | `draft` \| `active` \| `inactive` |
| `settings` | JSONB | NOT NULL DEFAULT `{}` — policies, tax config |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: N→1 `organizations`, `property_types`; 1→N `unit_types`,
`units`, `bookings`; N→M `amenities` via `property_amenities`.

#### `unit_types` — sellable inventory class **T** ⌫

What guests book and what is priced: "Deluxe Double", "8-Bed Mixed Dorm",
"Entire Villa". The key to serving all seven property types with one schema.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `property_id` | UUID | NOT NULL, FK → `properties.id` |
| `name` | VARCHAR(150) | NOT NULL; UNIQUE (`property_id`, `name`) |
| `unit_kind` | ENUM | `room` \| `bed` \| `whole_unit` |
| `description` | TEXT | NULL |
| `max_occupancy` | SMALLINT | NOT NULL, > 0 |
| `base_occupancy` | SMALLINT | NOT NULL — included in base price |
| `base_price` | NUMERIC(12,2) | NOT NULL — fallback nightly rate |
| `size_sqm` | NUMERIC(7,2) | NULL |
| `attributes` | JSONB | NOT NULL DEFAULT `{}` — bed config, view, floor plan |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: N→1 `properties`; 1→N `units`; N→M `amenities` via
`unit_type_amenities`; referenced by `booking_items.unit_type_id`.

#### `units` — physical bookable unit **T** ⌫

A concrete room, a bed in a dorm, or an entire villa/apartment.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `property_id` | UUID | NOT NULL, FK → `properties.id` |
| `unit_type_id` | UUID | NOT NULL, FK → `unit_types.id` |
| `name` | VARCHAR(100) | NOT NULL — "204", "Dorm A / Bed 3"; UNIQUE (`property_id`, `name`) |
| `floor` | VARCHAR(20) | NULL |
| `status` | ENUM | `available` \| `out_of_service` |
| `housekeeping_status` | ENUM | `dirty` \| `clean` \| `inspected` |
| `notes` | TEXT | NULL |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: N→1 `unit_types`, `properties`; referenced by
`booking_items.unit_id` for stay assignment.

#### `amenities` — global amenity catalog

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE — `wifi`, `pool`, `parking`, … |
| `name` | VARCHAR(100) | NOT NULL |
| `category` | ENUM | `property` \| `unit` \| `both` |
| `icon` | VARCHAR(50) | NULL — icon token for UI |

**Junctions** (both **T**, composite PKs, CASCADE deletes):
`property_amenities(tenant_id, property_id FK, amenity_id FK)` and
`unit_type_amenities(tenant_id, unit_type_id FK, amenity_id FK)`.

---

### 3.3 Guest & Booking

#### `guests` — tenant-scoped guest profile **T** ⌫

Shared across all of a tenant's properties (portfolio-wide stay history).
PII columns are application-encrypted; GDPR erasure via crypto-shredding.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `first_name` / `last_name` | VARCHAR(100) | NOT NULL |
| `email` | CITEXT | NULL; UNIQUE (`tenant_id`, `email`) where not null |
| `phone` | VARCHAR(32) | NULL |
| `nationality` | CHAR(2) | NULL, ISO 3166-1 |
| `document_type` | ENUM | `passport` \| `national_id` \| `driving_license`, NULL |
| `document_number_enc` | TEXT | NULL — encrypted at application layer |
| `date_of_birth` | DATE | NULL |
| `preferences` | JSONB | NOT NULL DEFAULT `{}` |
| `notes` | TEXT | NULL — staff notes |
| `is_blacklisted` | BOOLEAN | NOT NULL DEFAULT false |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: 1→N `bookings`, `conversations`.

#### `bookings` — booking header **T** ⌫

One row per stay reservation; line-level detail lives in `booking_items`.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `property_id` | UUID | NOT NULL, FK → `properties.id` |
| `guest_id` | UUID | NOT NULL, FK → `guests.id` — primary guest |
| `reference` | VARCHAR(20) | NOT NULL, UNIQUE — human-readable code (e.g. `LW-8F3K2A`) |
| `status` | ENUM | `pending` \| `confirmed` \| `checked_in` \| `checked_out` \| `cancelled` \| `no_show` |
| `source` | ENUM | `direct` \| `walk_in` \| `phone` \| `ota` \| `channel_manager` |
| `channel_ref` | VARCHAR(100) | NULL — OTA booking id when sourced externally |
| `check_in` / `check_out` | DATE | NOT NULL; CHECK (`check_out` > `check_in`) |
| `adults` / `children` | SMALLINT | NOT NULL DEFAULT 1 / 0 |
| `currency` | CHAR(3) | NOT NULL |
| `subtotal` / `tax_total` / `total` | NUMERIC(12,2) | NOT NULL — denormalized from items |
| `notes` | TEXT | NULL |
| `confirmed_at` / `cancelled_at` | TIMESTAMPTZ | NULL |
| `cancellation_reason` | TEXT | NULL |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: N→1 `properties`, `guests`; 1→N `booking_items`, `payments`.

#### `booking_items` — booking line items **T**

Line items of a booking: unit-stay assignments plus extras/fees/taxes. Unit
assignments carry the stay range, enabling group bookings, unit moves, and
per-night pricing.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `booking_id` | UUID | NOT NULL, FK → `bookings.id` ON DELETE CASCADE |
| `item_type` | ENUM | `accommodation` \| `addon` \| `fee` \| `tax` \| `adjustment` |
| `unit_type_id` | UUID | FK → `unit_types.id`, NULL unless accommodation |
| `unit_id` | UUID | FK → `units.id`, NULL until a unit is assigned |
| `stay_from` / `stay_to` | DATE | NULL unless accommodation; CHECK (`stay_to` > `stay_from`) |
| `description` | VARCHAR(300) | NOT NULL |
| `quantity` | NUMERIC(8,2) | NOT NULL DEFAULT 1 |
| `unit_price` | NUMERIC(12,2) | NOT NULL |
| `total` | NUMERIC(12,2) | NOT NULL |

**Integrity**: a GiST **exclusion constraint** on
(`unit_id`, `daterange(stay_from, stay_to)`) prevents assigning the same unit
to overlapping stays — double-booking is impossible at the database level.

**Relationships**: N→1 `bookings`, `unit_types`, `units`.

#### `payments` — payment records **T**

Gateway references only — raw card data never touches this database
(PCI scope minimized via tokenization).

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `booking_id` | UUID | NOT NULL, FK → `bookings.id` |
| `amount` | NUMERIC(12,2) | NOT NULL; negative for refunds |
| `currency` | CHAR(3) | NOT NULL |
| `method` | ENUM | `card` \| `cash` \| `bank_transfer` \| `ota_collect` |
| `status` | ENUM | `pending` \| `authorized` \| `captured` \| `failed` \| `refunded` |
| `gateway` | VARCHAR(50) | NULL — `stripe`, … |
| `gateway_ref` | VARCHAR(255) | NULL — PaymentIntent/charge id; UNIQUE where not null |
| `idempotency_key` | VARCHAR(100) | NULL, UNIQUE — guards duplicate submissions |
| `paid_at` / `refunded_at` | TIMESTAMPTZ | NULL |
| `failure_reason` | TEXT | NULL |

**Relationships**: N→1 `bookings`.

---

### 3.4 AI System

#### `knowledge_documents` — tenant knowledge base **T** ⌫

Source documents grounding the AI assistant: policies, amenity guides, FAQs,
local recommendations. Property-scoped or tenant-wide.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `property_id` | UUID | FK → `properties.id`, NULL = tenant-wide |
| `title` | VARCHAR(300) | NOT NULL |
| `source_type` | ENUM | `manual` \| `upload` \| `pms_generated` \| `url` |
| `content` | TEXT | NOT NULL — normalized text |
| `language` | CHAR(2) | NOT NULL DEFAULT `'en'` |
| `version` | INTEGER | NOT NULL DEFAULT 1 — bumped on edit; triggers re-embedding |
| `status` | ENUM | `draft` \| `active` \| `archived` |
| `metadata` | JSONB | NOT NULL DEFAULT `{}` — source URL, file ref, tags |
| `deleted_at` | TIMESTAMPTZ | NULL |

**Relationships**: 1→N `embeddings` (regenerated per version).

#### `embeddings` — vector index for RAG **T**

One row per document chunk. Tenant isolation applies to vectors exactly as to
rows — RLS on this table guarantees retrieval never crosses tenants.

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `document_id` | UUID | NOT NULL, FK → `knowledge_documents.id` ON DELETE CASCADE |
| `document_version` | INTEGER | NOT NULL — chunk provenance |
| `chunk_index` | INTEGER | NOT NULL; UNIQUE (`document_id`, `document_version`, `chunk_index`) |
| `chunk_text` | TEXT | NOT NULL |
| `embedding` | VECTOR(1536) | NOT NULL — dimension fixed per embedding model generation |
| `embedding_model` | VARCHAR(100) | NOT NULL — enables model migration |
| `metadata` | JSONB | NOT NULL DEFAULT `{}` — section headers, tags for filtered retrieval |

**Relationships**: N→1 `knowledge_documents`.

#### `conversations` — AI conversation threads **T**

A thread between the AI and either a guest (messaging assistant) or a staff
user (analytics assistant).

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `property_id` | UUID | FK → `properties.id`, NULL for tenant-level threads |
| `kind` | ENUM | `guest_messaging` \| `staff_assistant` |
| `guest_id` | UUID | FK → `guests.id`, NULL — set for guest threads |
| `user_id` | UUID | FK → `users.id`, NULL — set for staff threads |
| `booking_id` | UUID | FK → `bookings.id`, NULL — stay context when known |
| `channel` | ENUM | `in_app` \| `email` \| `sms` \| `whatsapp` |
| `status` | ENUM | `open` \| `awaiting_review` \| `escalated` \| `closed` |
| `metadata` | JSONB | NOT NULL DEFAULT `{}` |

**Relationships**: 1→N `messages`; N→1 `guests` / `users` / `bookings`.

#### `messages` — conversation messages **T**

Append-only: rows are never updated after creation (moderation state is
carried in `metadata` history).

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `conversation_id` | UUID | NOT NULL, FK → `conversations.id` ON DELETE CASCADE |
| `role` | ENUM | `guest` \| `staff` \| `assistant` \| `system` |
| `content` | TEXT | NOT NULL |
| `status` | ENUM | `draft` \| `pending_review` \| `sent` \| `rejected` — AI drafts start as `draft` |
| `model` | VARCHAR(100) | NULL — model id for assistant messages |
| `prompt_tokens` / `completion_tokens` | INTEGER | NULL — cost tracking |
| `confidence` | NUMERIC(4,3) | NULL — drives human-review routing |
| `metadata` | JSONB | NOT NULL DEFAULT `{}` — retrieval sources, guardrail results |

**Relationships**: N→1 `conversations`.

---

### 3.5 SaaS Billing (platform level)

Billing for the Lodgwise platform itself (tenants paying Lodgwise) — distinct
from guest billing (§ 3.3). Rows belong to an organization but are managed by
the platform; RLS grants tenants read-only access to their own rows.

#### `plans` — subscription plan catalog (global)

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE — `starter`, `pro`, `enterprise` |
| `name` | VARCHAR(100) | NOT NULL |
| `price_monthly` / `price_yearly` | NUMERIC(12,2) | NOT NULL |
| `currency` | CHAR(3) | NOT NULL |
| `limits` | JSONB | NOT NULL — `{max_properties, max_units, max_users, ai_credits}` |
| `features` | JSONB | NOT NULL — feature flags per plan |
| `is_active` | BOOLEAN | NOT NULL DEFAULT true — retired plans stay for existing subscribers |

#### `subscriptions` — organization ↔ plan **T**

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `plan_id` | UUID | NOT NULL, FK → `plans.id` |
| `status` | ENUM | `trialing` \| `active` \| `past_due` \| `cancelled` \| `expired` |
| `billing_cycle` | ENUM | `monthly` \| `yearly` |
| `current_period_start` / `current_period_end` | TIMESTAMPTZ | NOT NULL |
| `trial_ends_at` | TIMESTAMPTZ | NULL |
| `cancel_at_period_end` | BOOLEAN | NOT NULL DEFAULT false |
| `cancelled_at` | TIMESTAMPTZ | NULL |
| `gateway_customer_ref` / `gateway_subscription_ref` | VARCHAR(255) | NULL — Stripe ids |

**Constraint**: at most one non-terminal subscription per tenant
(partial unique index on `tenant_id` where `status IN ('trialing','active','past_due')`).

**Relationships**: N→1 `organizations`, `plans`; 1→N `invoices`.

#### `invoices` — platform invoices **T**

| Column | Type | Constraints / Notes |
|--------|------|---------------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | NOT NULL, FK → `organizations.id` |
| `subscription_id` | UUID | NOT NULL, FK → `subscriptions.id` |
| `number` | VARCHAR(30) | NOT NULL, UNIQUE — sequential, human-readable |
| `status` | ENUM | `draft` \| `open` \| `paid` \| `void` \| `uncollectible` |
| `currency` | CHAR(3) | NOT NULL |
| `amount_due` / `amount_paid` | NUMERIC(12,2) | NOT NULL |
| `period_start` / `period_end` | TIMESTAMPTZ | NOT NULL |
| `due_at` / `paid_at` | TIMESTAMPTZ | due NOT NULL, paid NULL |
| `gateway_invoice_ref` | VARCHAR(255) | NULL |
| `pdf_url` | TEXT | NULL — object-storage reference |

**Relationships**: N→1 `subscriptions`.

---

## 4. Entity Relationship Summary

```
organizations 1──N memberships N──1 users
organizations 1──N roles ── role_permissions ── permissions
organizations 1──N properties N──1 property_types
properties    1──N unit_types 1──N units
properties    1──N bookings N──1 guests           (guests are tenant-wide)
bookings      1──N booking_items N──1 units / unit_types
bookings      1──N payments
organizations 1──N knowledge_documents 1──N embeddings
organizations 1──N conversations 1──N messages    (↔ guests / users / bookings)
organizations 1──N subscriptions N──1 plans
subscriptions 1──N invoices
```

Reading the spine top-down: an **organization** owns **properties**; each
property defines **unit_types** (what is sold) realized as physical **units**
(what is occupied); a **booking** belongs to one property and one primary
**guest**, and its **booking_items** attach specific units for specific date
ranges — which is where availability is decided and double-booking is
excluded. Everything else (roles, AI knowledge, conversations, platform
billing) attaches to the organization and inherits its isolation boundary.

Two deliberate asymmetries:

- **Guests attach to the tenant, not the property**, so a portfolio operator
  sees one profile and one stay history across all properties.
- **`unit_types` vs `units`** separates pricing/selling (type level) from
  occupancy/housekeeping (unit level) — the single mechanism that lets hotels
  (many rooms per type), hostels (beds), and villas (one whole unit) share a
  schema.

---

## 5. Indexing Strategy

Principles: composite indexes lead with `tenant_id` (matches RLS predicate and
every query's access path); index for the hot read paths first; measure before
adding more.

| Index | Table | Purpose |
|-------|-------|---------|
| UNIQUE (`tenant_id`, `slug`) | properties | Tenant-scoped lookups |
| (`tenant_id`, `property_id`, `status`) | bookings | Property dashboards, arrivals/departures boards |
| (`tenant_id`, `property_id`, `check_in`), (…, `check_out`) | bookings | Date-window queries |
| GiST EXCLUDE (`unit_id` WITH =, `daterange(stay_from, stay_to)` WITH &&) | booking_items | **Double-booking prevention** (constraint + index) |
| (`booking_id`) | booking_items, payments | Header → lines joins |
| UNIQUE (`reference`) | bookings | Guest-facing lookup code |
| (`tenant_id`, `email`), (`tenant_id`, `phone`) | guests | Guest search / dedup |
| Trigram (GIN) on `last_name`, `first_name` | guests | Fuzzy name search |
| (`tenant_id`, `property_id`, `unit_type_id`) | units | Inventory listing |
| HNSW on `embedding` | embeddings | Vector similarity search (partitioned by tenant via RLS-filtered scans) |
| (`document_id`, `document_version`) | embeddings | Re-embedding / cleanup |
| (`conversation_id`, `created_at`) | messages | Thread rendering |
| (`tenant_id`, `status`) | conversations | Review-queue views |
| Partial UNIQUE (`tenant_id`) WHERE status active-like | subscriptions | One live subscription per tenant |
| (`tenant_id`, `status`, `due_at`) | invoices | Dunning queries |

Notes:

- Soft-deleted rows are excluded with partial indexes
  (`WHERE deleted_at IS NULL`) on the hottest tables (bookings, guests, units).
- A denormalized **availability calendar** (per unit_type per date) is planned
  as a derived table/materialization when calendar-read volume demands it; the
  GiST exclusion constraint remains the source of truth either way.
- Date-based partitioning of `bookings`/`booking_items` is a documented
  option, deferred until table sizes justify it.

---

## 6. Migration Strategy

- **Tooling**: Alembic; all migrations live in `database/migrations/`,
  versioned and linear. Seed data (sample tenants, one property of each of the
  seven types, demo bookings) lives in `database/seeds/` — dev/demo only.
- **Forward-only**: merged migrations are immutable; corrections are new
  migrations. Every migration is reversible or documents why not.
- **Zero-downtime (expand → migrate → contract)**: additive change first (new
  nullable column/table), backfill in batches, application cutover, then a
  later migration removes the old structure. The previous application release
  must always run against the current schema.
- **RLS is part of the schema**: any migration creating a tenant-owned table
  must, in the same migration, add `tenant_id`, enable/force RLS, and create
  the tenant policy. CI fails migrations that create a table with `tenant_id`
  but no policy.
- **Enum evolution**: `ADD VALUE` is safe; renames/removals go through the
  expand/contract pattern with a temporary text column when needed.
- **Embedding migrations**: changing embedding model/dimension versions via
  `embedding_model` + `document_version` — new vectors are written alongside
  old, retrieval switches per model, old vectors are garbage-collected.
- **Diagrams**: `database/diagrams/` holds the ERD (Mermaid/dbml, text-based);
  updating the diagram is part of any migration PR that changes relationships.

---

## 7. Data Lifecycle

- **GDPR**: guest PII erasure via crypto-shredding (`document_number_enc`) and
  column nulling with tombstones; bookings survive erasure as anonymized
  financial records.
- **Retention**: audit logs and invoices retained per jurisdiction; AI
  prompt/completion logs TTL-bound with PII redaction.
- **Backups**: continuous WAL archiving + daily snapshots; restore drills are
  part of the ops runbook.
