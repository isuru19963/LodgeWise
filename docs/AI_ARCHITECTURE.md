# AI Architecture — Lodgwise AI

> Status: Draft — describes the AI service layout in `services/ai` and how AI
> features integrate with the core PMS.

## 1. Principles

1. **AI advises, humans decide** — every AI output (price, message, forecast)
   is reviewable and overridable; auto-apply is opt-in per property.
2. **Tenant isolation extends to AI** — prompts, embeddings, and training data
   never cross tenant boundaries.
3. **Deterministic core, probabilistic edge** — bookings, billing, and
   availability are never mutated directly by a model; AI proposes, the core
   API executes through the same validated endpoints as humans.
4. **Model-agnostic** — LLM access goes through a provider abstraction so
   models can be swapped per task (cost/quality/latency).

## 2. Capabilities

### 2.1 Dynamic Pricing
- Inputs: historical bookings, pace, seasonality, day-of-week, local events,
  competitor rates (when available), property constraints (min/max price).
- Output: per unit-type per date price suggestions written to
  `ai_price_suggestions`, surfaced in the rates UI with explanation.
- Approach: start with gradient-boosted models / rules hybrid; graduate to
  learned demand curves as data accumulates. Cold-start via property-type
  and region priors.

### 2.2 Demand & Occupancy Forecasting
- Time-series forecasts (per property, per unit type) feeding both the pricing
  engine and operator dashboards.
- Batch jobs (nightly) executed via `services/worker` → `services/ai`.

### 2.3 Guest Communication Assistant
- Drafts and (optionally) auto-sends pre-arrival, in-stay, and post-stay
  messages; answers common guest questions grounded in property data.
- RAG over tenant-scoped knowledge: property policies, amenities, local guides.
- Human-in-the-loop review queue by default; escalation to staff on low
  confidence or sensitive topics (refunds, complaints, safety).

### 2.4 Natural-Language Analytics
- "What was my RevPAR in July?" → guarded text-to-SQL / semantic layer over
  reporting views only (read-only role, tenant-scoped, allowlisted schema).

## 3. Service Design (`services/ai`)

```
services/ai/
  api/          # Internal HTTP interface consumed by apps/api
  workflows/    # Orchestrated multi-step LLM workflows (messaging, analytics)
  pricing/      # Pricing models: features, training, inference
  forecasting/  # Time-series pipelines
  rag/          # Ingestion, chunking, embedding, retrieval (pgvector)
  evals/        # Offline evaluation suites and golden datasets
```

- Exposed only on the internal network; never public.
- Synchronous path: low-latency inference (assistant replies, on-demand pricing).
- Asynchronous path: queue-driven batch scoring, embedding refresh, retraining.

## 4. Data & Storage

| Concern | Choice |
|---------|--------|
| Embeddings / vector search | `pgvector` in the primary Postgres (per-tenant scoped) |
| Feature data | Reporting/read-replica views; no direct writes to OLTP |
| Model artifacts | Object storage, versioned |
| Prompt & completion logs | Retained with PII redaction, per-tenant, TTL-bound |

## 5. Safety, Quality & Governance

- **Evals before rollout**: every workflow ships with an offline eval set;
  regressions block deploys.
- **Guardrails**: output schema validation (structured outputs), profanity/PII
  filters on guest-facing text, price bounds enforced outside the model.
- **Observability**: token usage, latency, acceptance-rate of suggestions,
  and override-rate tracked per tenant.
- **Cost controls**: per-tenant budgets and rate limits on LLM usage.
- **Privacy**: no tenant data used for cross-tenant model training without
  explicit consent; provider data-retention set to zero where supported.

## 6. Phasing

1. **Phase 1** — Guest messaging drafts + rule-assisted pricing suggestions.
2. **Phase 2** — Forecasting, learned pricing, NL analytics (read-only).
3. **Phase 3** — Autonomous workflows (auto-apply pricing within bounds,
   auto-reply for whitelisted intents) with per-property opt-in.
