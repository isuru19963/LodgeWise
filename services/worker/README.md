# services/worker — Background Jobs

Queue consumers and scheduled tasks: OTA channel sync, email/SMS delivery,
report generation, night audit, webhook fan-out, and AI batch jobs.

- Queue: Redis-backed (see [docs/SYSTEM_ARCHITECTURE.md](../../docs/SYSTEM_ARCHITECTURE.md))
- All handlers must be idempotent with retry + dead-letter support.

> Scaffolding pending.
