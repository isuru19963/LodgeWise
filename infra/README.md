# infra — Infrastructure

- `docker/` — Dockerfiles for each deployable (`api.Dockerfile`,
  `web.Dockerfile`, `ai.Dockerfile`, `worker.Dockerfile`).
- `nginx/` — reverse proxy configuration for self-hosted/local environments
  (TLS termination, routing to web and api).

Local orchestration lives in the root `docker-compose.yml`.
