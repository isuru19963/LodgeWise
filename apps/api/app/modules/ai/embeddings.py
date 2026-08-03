"""Embedding provider abstraction.

Real providers (OpenAI, Voyage, local models) plug in behind `EmbeddingProvider`.
The default `StubEmbeddingProvider` produces deterministic pseudo-vectors so
the RAG pipeline can be developed and tested without external API calls.
"""

from __future__ import annotations

import hashlib
import math
from abc import ABC, abstractmethod

from app.core.config import get_settings


class EmbeddingProvider(ABC):
    @property
    @abstractmethod
    def dimensions(self) -> int: ...

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Return one embedding vector per input text."""


class StubEmbeddingProvider(EmbeddingProvider):
    """Hash-based deterministic embeddings — not for production ranking quality."""

    def __init__(self, dimensions: int | None = None) -> None:
        self._dimensions = dimensions or get_settings().embedding_dimensions

    @property
    def dimensions(self) -> int:
        return self._dimensions

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(text) for text in texts]

    def _embed_one(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values: list[float] = []
        seed = digest
        while len(values) < self._dimensions:
            seed = hashlib.sha256(seed).digest()
            for byte in seed:
                if len(values) >= self._dimensions:
                    break
                values.append((byte / 127.5) - 1.0)
        norm = math.sqrt(sum(v * v for v in values)) or 1.0
        return [v / norm for v in values]


def get_embedding_provider() -> EmbeddingProvider:
    """Factory — swap providers via EMBEDDING_PROVIDER without touching callers.

    Unimplemented vendor names fall back to the stub during the foundation phase.
    """
    settings = get_settings()
    provider = settings.embedding_provider.lower()
    if provider in {"stub", "openai", "voyage", "bedrock"}:
        return StubEmbeddingProvider()
    raise ValueError(
        f"Unknown embedding provider '{settings.embedding_provider}'. "
        "Configure EMBEDDING_PROVIDER or use 'stub'."
    )
