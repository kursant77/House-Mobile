"""
House AI — Cost Control
Smart model routing, token budgets, and usage tracking.
"""

import logging
from typing import Dict, Optional, Tuple

from app.models.schemas import Intent
from app.services.redis_service import RedisService
from app.config import Settings

logger = logging.getLogger("house_ai")


class CostController:
    """Manages LLM cost optimization and token budgets."""

    def __init__(self, redis: RedisService, settings: Settings):
        self.redis = redis
        self.daily_budget = settings.DAILY_TOKEN_BUDGET_PER_USER
        self.confidence_threshold = settings.CONFIDENCE_THRESHOLD
        self.model_default = settings.LLM_MODEL_DEFAULT
        self.model_advanced = settings.LLM_MODEL_ADVANCED

    # ── Smart Model Routing ──────────────────────────────

    def select_model(
        self,
        intent: Intent,
        confidence: float,
        query_complexity: Optional[str] = None,
    ) -> str:
        """
        Select the optimal model based on intent and confidence.
        
        GPT-4o is used ONLY when:
        - Deep comparison (Intent.COMPARISON with low confidence)
        - Complex RAG reasoning
        - Multi-product analysis
        """
        # High-complexity intents that may need GPT-4o
        advanced_intents = {
            Intent.COMPARISON,
            Intent.PRODUCT_DETAIL,
        }

        if intent in advanced_intents and confidence < self.confidence_threshold:
            logger.info(
                f"Advanced model selected: intent={intent.value}, "
                f"confidence={confidence:.2f}"
            )
            return self.model_advanced

        if query_complexity == "high":
            return self.model_advanced

        return self.model_default

    # ── Budget Management ────────────────────────────────

    async def check_budget(self, user_id: str) -> Tuple[bool, int]:
        """
        Check if user has remaining token budget.
        Returns (is_allowed, remaining_tokens).
        """
        if not user_id:
            return True, self.daily_budget

        usage = await self.redis.get_token_usage(user_id)
        remaining = max(0, self.daily_budget - usage)
        is_allowed = remaining > 0

        if not is_allowed:
            logger.warning(f"Token budget exceeded for user {user_id}: {usage}/{self.daily_budget}")

        return is_allowed, remaining

    async def track_usage(
        self,
        user_id: str,
        tokens_used: int,
        model: str,
    ) -> Dict:
        """
        Track token usage for a user.
        Returns updated usage info.
        """
        if not user_id:
            return {"tracked": False}

        new_total = await self.redis.increment_token_usage(user_id, tokens_used)

        # Calculate approximate cost
        cost = self._estimate_cost(tokens_used, model)

        usage_info = {
            "tracked": True,
            "tokens_used": tokens_used,
            "daily_total": new_total,
            "daily_budget": self.daily_budget,
            "remaining": max(0, self.daily_budget - new_total),
            "model": model,
            "estimated_cost_usd": cost,
        }

        logger.info(
            f"Token usage: user={user_id}, used={tokens_used}, "
            f"total={new_total}/{self.daily_budget}, model={model}"
        )

        return usage_info

    # ── Cache Check ──────────────────────────────────────

    async def get_cached_response(
        self,
        cache_key: str,
    ) -> Optional[Dict]:
        """Check if we have a cached response to avoid API call."""
        cached = await self.redis.get_cached(cache_key)
        if cached:
            logger.info(f"Cache hit: {cache_key}")
            return cached
        return None

    async def cache_response(
        self,
        cache_key: str,
        response: Dict,
        ttl: int = 3600,
    ) -> None:
        """Cache a response for future identical queries."""
        await self.redis.set_cached(cache_key, response, ttl)
        logger.info(f"Response cached: {cache_key}, ttl={ttl}")

    # ── Cost Estimation ──────────────────────────────────

    @staticmethod
    def _estimate_cost(tokens: int, model: str) -> float:
        """Estimate USD cost for token usage."""
        # Approximate pricing per 1M tokens (as of 2024)
        rates = {
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4o": {"input": 5.00, "output": 15.00},
            "text-embedding-3-small": {"input": 0.02, "output": 0.0},
        }

        rate = rates.get(model, rates["gpt-4o-mini"])
        # Approximate: assume 60% input, 40% output
        avg_rate = (rate["input"] * 0.6 + rate["output"] * 0.4)
        return round(tokens * avg_rate / 1_000_000, 6)

    # ── Response Helpers ─────────────────────────────────

    def budget_exceeded_message(self, language: str = "en") -> str:
        """Return a budget exceeded message in the appropriate language."""
        messages = {
            "en": (
                "⚠️ You've reached your daily usage limit. "
                "Please try again tomorrow! Your limit resets every 24 hours."
            ),
            "uz": (
                "⚠️ Kunlik foydalanish limitingiz tugadi. "
                "Iltimos, ertaga qayta urinib ko'ring! "
                "Limitingiz har 24 soatda yangilanadi."
            ),
            "ru": (
                "⚠️ Вы достигли дневного лимита использования. "
                "Пожалуйста, попробуйте завтра! "
                "Ваш лимит обновляется каждые 24 часа."
            ),
        }
        return messages.get(language, messages["en"])
