"""
House AI — Redis Service
Async Redis client for caching, session memory, and token tracking.
"""

import json
import logging
from typing import Optional, Any, List, Dict

import redis.asyncio as aioredis

from app.config import Settings

logger = logging.getLogger("house_ai")


class RedisService:
    """Async Redis service for caching and session management."""

    def __init__(self, settings: Settings):
        self.url = settings.REDIS_URL
        self.max_session_messages = settings.SESSION_MEMORY_MAX_MESSAGES
        self.client: Optional[aioredis.Redis] = None

    async def connect(self) -> None:
        """Connect to Redis."""
        try:
            self.client = aioredis.from_url(
                self.url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
            )
            await self.client.ping()
            logger.info("Redis connected")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using fallback mode.")
            self.client = None

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self.client:
            await self.client.close()
            logger.info("Redis disconnected")

    @property
    def is_connected(self) -> bool:
        return self.client is not None

    # ── Generic Cache ────────────────────────────────────

    async def get_cached(self, key: str) -> Optional[Any]:
        """Get a cached value by key."""
        if not self.is_connected:
            return None
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Redis get error: {e}")
            return None

    async def set_cached(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set a cached value with TTL."""
        if not self.is_connected:
            return
        try:
            await self.client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            logger.warning(f"Redis set error: {e}")

    async def delete_cached(self, key: str) -> None:
        """Delete a cached key."""
        if not self.is_connected:
            return
        try:
            await self.client.delete(key)
        except Exception as e:
            logger.warning(f"Redis delete error: {e}")

    # ── Session Memory ───────────────────────────────────

    def _session_key(self, session_id: str) -> str:
        return f"session:{session_id}:messages"

    async def get_session_memory(self, session_id: str) -> List[Dict[str, str]]:
        """Get session messages from Redis (short-term memory)."""
        if not self.is_connected:
            return []
        try:
            key = self._session_key(session_id)
            messages = await self.client.lrange(key, 0, -1)
            return [json.loads(m) for m in messages]
        except Exception as e:
            logger.warning(f"Redis session memory get error: {e}")
            return []

    async def add_to_session_memory(
        self,
        session_id: str,
        role: str,
        content: str,
    ) -> None:
        """Append a message to session memory and auto-trim."""
        if not self.is_connected:
            return
        try:
            key = self._session_key(session_id)
            message = json.dumps({"role": role, "content": content})
            await self.client.rpush(key, message)
            # Auto-trim to keep only last N messages
            await self.client.ltrim(key, -self.max_session_messages, -1)
            # Set expiry (24h)
            await self.client.expire(key, 86400)
        except Exception as e:
            logger.warning(f"Redis session memory add error: {e}")

    async def clear_session_memory(self, session_id: str) -> None:
        """Clear session memory (e.g., after summarization)."""
        if not self.is_connected:
            return
        try:
            await self.client.delete(self._session_key(session_id))
        except Exception as e:
            logger.warning(f"Redis session memory clear error: {e}")

    # ── Token Usage Tracking ─────────────────────────────

    def _token_key(self, user_id: str) -> str:
        return f"tokens:{user_id}:daily"

    async def get_token_usage(self, user_id: str) -> int:
        """Get today's token usage for a user."""
        if not self.is_connected:
            return 0
        try:
            usage = await self.client.get(self._token_key(user_id))
            return int(usage) if usage else 0
        except Exception as e:
            logger.warning(f"Redis token usage get error: {e}")
            return 0

    async def increment_token_usage(self, user_id: str, tokens: int) -> int:
        """Increment daily token usage. Returns new total."""
        if not self.is_connected:
            return 0
        try:
            key = self._token_key(user_id)
            new_total = await self.client.incrby(key, tokens)
            # Set expiry to end of day (24h max)
            ttl = await self.client.ttl(key)
            if ttl == -1:  # no expiry set
                await self.client.expire(key, 86400)
            return new_total
        except Exception as e:
            logger.warning(f"Redis token usage increment error: {e}")
            return 0

    # ── Cache Key Builders ───────────────────────────────

    @staticmethod
    def product_cache_key(query: str) -> str:
        return f"cache:product:{query.lower().strip()}"

    @staticmethod
    def comparison_cache_key(products: List[str]) -> str:
        key = ":".join(sorted(p.lower().strip() for p in products))
        return f"cache:compare:{key}"

    @staticmethod
    def rag_cache_key(query: str) -> str:
        return f"cache:rag:{query.lower().strip()}"

    @staticmethod
    def currency_cache_key(from_cur: str, to_cur: str) -> str:
        return f"cache:currency:{from_cur}:{to_cur}"
