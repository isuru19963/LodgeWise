"""LLM provider abstraction.

No concrete vendor SDK is imported here. Callers depend only on `LLMProvider`.
`StubLLMProvider` synthesizes answers from retrieved chunks for local/dev use.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.core.config import get_settings


@dataclass(frozen=True)
class RetrievedChunk:
    document_id: str
    document_title: str
    content: str
    score: float


@dataclass(frozen=True)
class LLMResponse:
    answer: str
    model: str


class LLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        *,
        question: str,
        chunks: list[RetrievedChunk],
        system_prompt: str | None = None,
    ) -> LLMResponse:
        """Produce an answer grounded in the retrieved chunks."""


class StubLLMProvider(LLMProvider):
    """Deterministic, offline stand-in — no network calls."""

    async def generate(
        self,
        *,
        question: str,
        chunks: list[RetrievedChunk],
        system_prompt: str | None = None,
    ) -> LLMResponse:
        _ = system_prompt
        if not chunks:
            return LLMResponse(
                answer=(
                    "I don't have enough property knowledge to answer that yet. "
                    "Please add documents to the knowledge base."
                ),
                model="stub-v1",
            )
        excerpts = "\n\n".join(
            f"[{i + 1}] ({c.document_title}) {c.content}" for i, c in enumerate(chunks[:3])
        )
        answer = (
            f'Based on the property knowledge base, here is what I found '
            f'regarding "{question.strip()}":\n\n{excerpts}'
        )
        return LLMResponse(answer=answer, model="stub-v1")


def get_llm_provider() -> LLMProvider:
    """Factory — swap providers via LLM_PROVIDER without touching callers.

    Unimplemented vendor names fall back to the stub so the RAG pipeline can
    be exercised without real API keys (foundation phase).
    """
    settings = get_settings()
    provider = settings.llm_provider.lower()
    if provider in {"stub", "openai", "anthropic", "azure"}:
        # Real SDK wiring lands in a later phase; all resolve to stub for now.
        return StubLLMProvider()
    raise ValueError(
        f"Unknown LLM provider '{settings.llm_provider}'. "
        "Configure LLM_PROVIDER or use 'stub'."
    )
