# services/worker — Background Jobs

Redis-backed job worker for Lodgwise AI: email, notifications, and AI
pipelines. Uses [arq](https://github.com/samuelcolvin/arq) against the shared
Redis instance.

## Layout

```
app/
├── main.py                 # arq WorkerSettings (entrypoint)
├── config.py               # Environment settings
├── queue/connection.py     # RedisSettings / pool helpers
├── tasks/
│   ├── email_tasks.py      # Booking / check-in / check-out emails (stubs)
│   ├── notification_tasks.py
│   └── ai_tasks.py         # Document ingest / embeddings (stubs)
└── utils/                  # Logging + helpers
```

## Registered jobs

| Function | Purpose |
|----------|---------|
| `send_booking_confirmation` | Guest booking confirmation email |
| `send_checkin_reminder` | Pre-arrival reminder |
| `send_checkout_reminder` | Departure reminder |
| `create_notification` | In-app notification placeholder |
| `send_staff_alert` | Staff alert placeholder |
| `process_document` | Async knowledge-document pipeline |
| `generate_embeddings` | Async (re)embedding |

All handlers are **stubs** — they log structured intent and return
`status: skipped`. No SMTP, WhatsApp, or real AI calls yet. Retries are
enabled via arq (`max_tries`, `retry_jobs`, optional `raise Retry(defer=…)`).

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | `redis://localhost:6379/0` | Queue broker |
| `ENVIRONMENT` | `development` | Runtime label |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
| `WORKER_MAX_JOBS` | `10` | Concurrent jobs |
| `WORKER_MAX_TRIES` | `3` | Retry attempts |
| `WORKER_JOB_TIMEOUT_SECONDS` | `300` | Per-job timeout |
| `WORKER_RETRY_DELAY_SECONDS` | `15` | Hint for defer backoff |

## Local run (Docker)

```bash
docker compose up -d worker
docker compose logs -f worker
```

## Local run (host)

```bash
cd services/worker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
REDIS_URL=redis://localhost:6379/0 arq app.main.WorkerSettings
```

## Enqueue (later, from the API)

```python
from arq import create_pool
from arq.connections import RedisSettings

redis = await create_pool(RedisSettings.from_dsn(redis_url))
await redis.enqueue_job(
    "send_booking_confirmation",
    booking_id="...",
    organization_id="...",
    recipient_email="guest@example.com",
)
```
