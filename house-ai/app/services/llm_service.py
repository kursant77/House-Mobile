"""
House AI — LLM Service
Async OpenAI client with smart model routing, streaming, and embeddings.
"""

import logging
import tiktoken
from typing import AsyncGenerator, List, Optional

from openai import AsyncOpenAI

from app.config import Settings

logger = logging.getLogger("house_ai")


class LLMService:
    """OpenAI LLM service with smart routing and token tracking."""

    def __init__(self, settings: Settings):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model_default = settings.LLM_MODEL_DEFAULT
        self.model_advanced = settings.LLM_MODEL_ADVANCED
        self.embedding_model = settings.EMBEDDING_MODEL
        self.max_response_tokens = settings.MAX_RESPONSE_TOKENS
        self.confidence_threshold = settings.CONFIDENCE_THRESHOLD
        self._encoding = None

    @property
    def encoding(self):
        if self._encoding is None:
            try:
                self._encoding = tiktoken.encoding_for_model(self.model_default)
            except Exception:
                self._encoding = tiktoken.get_encoding("cl100k_base")
        return self._encoding

    def count_tokens(self, text: str) -> int:
        """Count tokens in a text string."""
        return len(self.encoding.encode(text))

    def count_messages_tokens(self, messages: list[dict]) -> int:
        """Count tokens across a list of chat messages."""
        total = 0
        for msg in messages:
            total += 4  # message overhead
            total += self.count_tokens(msg.get("content", ""))
            total += self.count_tokens(msg.get("role", ""))
        total += 2  # reply priming
        return total

    def select_model(self, intent: str, confidence: float) -> str:
        """Smart model routing based on intent and confidence."""
        advanced_intents = {"comparison", "product_detail"}
        if intent in advanced_intents and confidence < self.confidence_threshold:
            logger.info(f"Routing to advanced model: intent={intent}, confidence={confidence}")
            return self.model_advanced
        return self.model_default

    async def complete(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> dict:
        """
        Single completion call. Returns dict with 'content', 'model', 'tokens'.
        """
        model = model or self.model_default
        max_tokens = max_tokens or self.max_response_tokens

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            choice = response.choices[0]
            usage = response.usage

            return {
                "content": choice.message.content or "",
                "model": model,
                "tokens": {
                    "prompt": usage.prompt_tokens if usage else 0,
                    "completion": usage.completion_tokens if usage else 0,
                    "total": usage.total_tokens if usage else 0,
                },
                "finish_reason": choice.finish_reason,
            }
        except Exception as e:
            logger.error(f"LLM completion error: {e}")
            raise

    async def stream(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming completion — yields text chunks.
        """
        model = model or self.model_default
        max_tokens = max_tokens or self.max_response_tokens

        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"LLM stream error: {e}")
            raise

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=texts,
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            raise

    async def embed_single(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        embeddings = await self.embed([text])
        return embeddings[0]
