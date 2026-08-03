# API Specification — Lodgwise AI

> Status: Draft — conventions and endpoint catalog. The FastAPI app in `apps/api`
> will publish the authoritative OpenAPI schema at `/api/v1/openapi.json`.

## 1. Conventions

- **Base URL**: `/api/v1`
- **Format**: JSON request/response; `snake_case` fields.
- **Auth**: `Authorization: Bearer <JWT>`; short-lived access token + refresh token.
- **Tenancy**: tenant (organization) resolved from the token; property scoping via
  path params. Cross-tenant access is impossible by construction.
- **Pagination**: cursor-based — `?cursor=…&limit=…`; responses include `next_cursor`.
- **Filtering / sorting**: `?filter[status]=confirmed&sort=-created_at`.
- **Idempotency**: `Idempotency-Key` header required on POSTs that create
  reservations or payments.
- **Errors**: RFC 9457 problem+json:

```json
{
  "type": "https://docs.lodgwise.ai/errors/unit-unavailable",
  "title": "Unit unavailable",
  "status": 409,
  "detail": "Unit 204 is already assigned for 2026-08-10..2026-08-12.",
  "trace_id": "..."
}
```

- **Versioning**: breaking changes → new URL version; additive changes are unversioned.
- **Rate limiting**: per-token, standard `RateLimit-*` response headers.
- **Webhooks**: signed (HMAC) event delivery for `reservation.*`, `payment.*`, etc.

## 2. Endpoint Catalog (Initial)

### Auth & Identity
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account + organization |
| POST | `/auth/login` | Obtain token pair |
| POST | `/auth/refresh` | Rotate access token |
| GET  | `/me` | Current user, memberships, roles |

### Organizations & Properties
| Method | Path | Description |
|--------|------|-------------|
| GET/PATCH | `/organization` | Tenant settings |
| GET/POST | `/properties` | List / create properties |
| GET/PATCH/DELETE | `/properties/{property_id}` | Manage a property |
| GET/POST | `/properties/{property_id}/unit-types` | Inventory classes |
| GET/POST | `/properties/{property_id}/units` | Physical units (rooms/beds/whole units) |

### Rates & Availability
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/properties/{property_id}/rate-plans` | Rate plans |
| PUT | `/properties/{property_id}/rates` | Bulk upsert date-ranged rates/restrictions |
| GET | `/properties/{property_id}/availability` | Calendar for a date range |

### Reservations
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/properties/{property_id}/reservations` | Search / create |
| GET/PATCH | `/reservations/{reservation_id}` | Details / modify |
| POST | `/reservations/{reservation_id}/check-in` | Check-in |
| POST | `/reservations/{reservation_id}/check-out` | Check-out |
| POST | `/reservations/{reservation_id}/cancel` | Cancel with policy evaluation |

### Guests
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/guests` | Tenant-wide guest directory |
| GET/PATCH | `/guests/{guest_id}` | Profile, preferences, history |

### Billing
| Method | Path | Description |
|--------|------|-------------|
| GET | `/reservations/{reservation_id}/folio` | Folio with items |
| POST | `/folios/{folio_id}/items` | Add charge/adjustment |
| POST | `/folios/{folio_id}/payments` | Record / capture payment |
| GET | `/properties/{property_id}/invoices` | Invoice list |

### Operations
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/properties/{property_id}/housekeeping-tasks` | Task board |
| PATCH | `/housekeeping-tasks/{task_id}` | Update status/assignee |
| GET/POST | `/properties/{property_id}/maintenance-tickets` | Maintenance |

### AI
| Method | Path | Description |
|--------|------|-------------|
| GET | `/properties/{property_id}/ai/price-suggestions` | Dynamic pricing output |
| POST | `/ai/price-suggestions/{suggestion_id}/accept` | Apply a suggestion |
| GET | `/properties/{property_id}/ai/forecast` | Occupancy/demand forecast |
| POST | `/ai/assistant/messages` | NL analytics & guest-messaging assistant |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/properties/{property_id}/reports/occupancy` | Occupancy, ADR, RevPAR |
| GET | `/properties/{property_id}/reports/revenue` | Revenue by channel/plan |

## 3. Non-Goals for v1

- GraphQL surface (may follow later for the web app).
- Public partner API keys (internal tokens only until the platform stabilizes).
