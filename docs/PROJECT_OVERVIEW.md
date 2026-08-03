# Project Overview — Lodgwise AI

## What is Lodgwise AI?

Lodgwise AI is an AI-powered Property Management System (PMS) built as a multi-tenant SaaS
platform for the hospitality industry. It centralizes reservations, guest management,
housekeeping, billing, and channel distribution — and layers AI on top for pricing,
guest communication, forecasting, and operational automation.

## Supported Property Types

| Property Type | Typical Characteristics |
|---------------|------------------------|
| Hotels        | Multi-room, room types, front desk operations |
| Villas        | Whole-unit rentals, often remote check-in |
| Resorts       | Multi-building, amenities, activities, packages |
| Cabanas       | Small standalone units, seasonal demand |
| Hostels       | Bed-level inventory, shared dorms |
| Guest Houses  | Small owner-operated, simple rate plans |
| Apartments    | Long/short-stay mix, unit-level inventory |

The domain model treats **inventory as configurable units** (rooms, beds, whole units)
so a single platform serves every property type without forked logic.

## Vision

Give hospitality operators of any size a single system that:

1. **Runs the property** — reservations, availability, rates, housekeeping, invoicing.
2. **Thinks with the operator** — AI-driven dynamic pricing, demand forecasting,
   automated guest messaging, and revenue insights.
3. **Scales as a business** — one tenant-isolated platform serving 1000+ properties.

## Target Users

- **Property owners / managers** — day-to-day operations and revenue oversight.
- **Front desk / reception staff** — check-in/out, reservations, guest requests.
- **Housekeeping teams** — task boards, room status.
- **Multi-property operators** — portfolio dashboards across properties.
- **Platform administrators (Lodgwise staff)** — tenant onboarding, billing, support.

## High-Level Capabilities (Planned)

- Multi-tenant organization → property → unit hierarchy
- Reservation lifecycle management with availability calendar
- Rate plans, seasonal pricing, and AI dynamic pricing
- Guest profiles and CRM
- Housekeeping and maintenance workflows
- Invoicing, payments, and folio management
- OTA / channel manager integrations (Booking.com, Airbnb, Expedia, etc.)
- AI concierge and automated guest communication
- Reporting, analytics, and demand forecasting

## Repository

This is a monorepo. See the root [README](../README.md) for the layout and
[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for how the pieces fit together.

## Document Index

| Document | Purpose |
|----------|---------|
| [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) | Functional and non-functional requirements |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Architecture, services, and infrastructure |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Multi-tenant data model and schema strategy |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | API conventions and endpoint catalog |
| [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) | AI services, workflows, and model strategy |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Phased delivery plan |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Conventions for code, commits, and reviews |
