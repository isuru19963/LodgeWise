# Product Requirements — Lodgwise AI

> Status: Draft — to be refined during discovery.

## 1. Goals

- Provide a complete PMS for hotels, villas, resorts, cabanas, hostels, guest houses, and apartments.
- Operate as a multi-tenant SaaS supporting 1000+ properties with strict tenant isolation.
- Differentiate through embedded AI: pricing, forecasting, guest communication, and automation.

## 2. Personas

| Persona | Needs |
|---------|-------|
| Owner / GM | Portfolio overview, revenue, occupancy, staff oversight |
| Front Desk Agent | Fast check-in/out, reservation lookup, guest requests |
| Reservations Manager | Availability, rates, group bookings, OTA parity |
| Housekeeping Supervisor | Room status, task assignment, turnover tracking |
| Accountant | Folios, invoices, payments, tax reports |
| Platform Admin (internal) | Tenant provisioning, plans, billing, support tooling |

## 3. Functional Requirements

### 3.1 Tenancy & Access
- Organizations (tenants) contain one or more properties.
- Role-based access control (RBAC) scoped per organization and per property.
- SSO-ready authentication; email/password at launch.

### 3.2 Property & Inventory
- Configurable property types and unit types (room, bed, whole unit).
- Unit attributes: capacity, amenities, photos, floor/building grouping.
- Bed-level inventory for hostels; whole-unit for villas/apartments.

### 3.3 Reservations
- Create, modify, cancel, no-show, and walk-in flows.
- Availability calendar with drag-and-drop unit assignment.
- Group and multi-unit bookings.
- Overbooking rules and waitlists.

### 3.4 Rates & Pricing
- Rate plans (BAR, non-refundable, packages) with seasonal rules.
- Restrictions: min/max stay, closed-to-arrival/departure.
- AI dynamic pricing suggestions with manual override (see AI_ARCHITECTURE.md).

### 3.5 Guests & CRM
- Unified guest profiles with stay history across properties in a tenant.
- Preferences, notes, blacklist flags, GDPR-compliant data handling.

### 3.6 Operations
- Housekeeping task boards, room status lifecycle (dirty → clean → inspected).
- Maintenance tickets with priority and assignment.

### 3.7 Billing
- Guest folios, split billing, city/tourism taxes.
- Invoice generation and payment tracking; gateway integrations (Stripe first).

### 3.8 Channel Distribution
- Two-way sync of availability, rates, and reservations with OTAs
  via channel manager integration.

### 3.9 AI Features
- Dynamic pricing recommendations.
- Demand and occupancy forecasting.
- AI guest-messaging assistant (pre-arrival, in-stay, post-stay).
- Natural-language analytics ("What was my RevPAR last month?").

### 3.10 Reporting
- Occupancy, ADR, RevPAR, revenue by channel/rate plan.
- Exportable reports (CSV/PDF), scheduled email digests.

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Scale | 1000+ properties, 100k+ reservations/month |
| Tenancy | Row-level isolation; no cross-tenant data leakage |
| Availability | 99.9% uptime target for core booking APIs |
| Performance | p95 API latency < 300 ms for core reads |
| Security | OWASP ASVS-aligned, encrypted at rest and in transit, audit logs |
| Compliance | GDPR; PCI-DSS scope minimized via tokenized payments |
| i18n | Multi-language and multi-currency ready from day one |
| Observability | Structured logging, tracing, metrics on all services |

## 5. Out of Scope (Initial Releases)

- Point of Sale (POS) hardware integrations
- Native mobile apps (responsive web first)
- On-premise deployments
