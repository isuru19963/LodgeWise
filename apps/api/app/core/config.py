"""Application settings, loaded from environment variables (12-factor).

A local `.env` file is honored for development; deployed environments must
inject configuration through the process environment.
"""

from functools import lru_cache
from typing import Literal, Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_SECRETS = {"", "change-me", "change-me-generate-a-real-secret"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "test", "staging", "production"] = "development"

    database_url: str = "postgresql+asyncpg://lodgwise:lodgwise@localhost:5432/lodgwise"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-generate-a-real-secret"

    jwt_algorithm: str = "HS256"
    jwt_access_token_ttl_seconds: int = 900  # 15 minutes
    jwt_refresh_token_ttl_seconds: int = 1_209_600  # 14 days

    api_title: str = "Lodgwise AI API"
    api_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000"

    log_level: str = "INFO"

    # AI — provider names are abstractions only; real SDK calls land later.
    llm_provider: str = "stub"
    embedding_provider: str = "stub"
    embedding_dimensions: int = 1536

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def _reject_insecure_production_secrets(self) -> Self:
        if self.is_production and self.secret_key in _INSECURE_SECRETS:
            raise ValueError("SECRET_KEY must be set to a strong value in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
