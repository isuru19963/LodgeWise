# services/integrations — Third-Party Integrations

Connectors to external systems, isolated from the core so provider quirks
never leak into domain logic:

- **Channel managers / OTAs** — Booking.com, Airbnb, Expedia (availability,
  rates, reservation sync)
- **Payments** — Stripe (and future gateways)
- **Messaging** — email/SMS/WhatsApp providers
- **Other** — door locks, accounting exports (later phases)

Each connector implements a common interface per category; sync jobs are
executed via `services/worker`.

> Scaffolding pending.
