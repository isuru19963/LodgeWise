"""Worker settings — environment-driven (12-factor)."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "test", "staging", "production"] = "development"
    log_level: str = "INFO"

    redis_url: str = "redis://localhost:6379/0"

    # arq worker tuning
    worker_max_jobs: int = 10
    worker_job_timeout_seconds: int = 300
    worker_max_tries: int = 3
    worker_retry_delay_seconds: int = 15

    # Placeholders for future providers (never used in foundation stubs)
    smtp_host: str = ""
    email_from: str = "no-reply@lodgwise.ai"
    ai_service_url: str = "http://localhost:8100"


@lru_cache
def get_settings() -> Settings:
    return Settings()
