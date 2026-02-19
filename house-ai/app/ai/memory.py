"""
House AI — Memory System
Short-term (Redis) + Long-term (Supabase) memory management.
"""

import logging
from typing import List, Dict, Optional

from app.services.redis_service import RedisService
from app.services.supabase_service import SupabaseService
from app.services.llm_service import LLMService
from app.config import Settings

logger = logging.getLogger("house_ai")


class MemoryManager:
    """Manages short-term and long-term conversation memory."""

    def __init__(
        self,
        redis: RedisService,
        supabase: SupabaseService,
        llm: LLMService,
        settings: Settings,
    ):
        self.redis = redis
        self.supabase = supabase
        self.llm = llm
        self.max_context_messages = settings.MAX_CONTEXT_MESSAGES
        self.summarize_threshold = settings.SUMMARIZE_TOKEN_THRESHOLD

    async def get_context(self, session_id: str) -> Dict:
        """
        Build conversation context for LLM:
        - Load previous summary (long-term memory)
        - Load recent messages (short-term memory)
        - Combine into a compact context
        """
        # 1. Get previous summary from Supabase
        summary = await self.supabase.get_previous_summary(session_id)

        # 2. Get recent messages from Redis
        recent_messages = await self.redis.get_session_memory(session_id)

        # 3. If no Redis messages, try Supabase
        if not recent_messages:
            db_messages = await self.supabase.get_session_messages(
                session_id, limit=self.max_context_messages
            )
            recent_messages = [
                {"role": m["role"], "content": m["content"]}
                for m in db_messages
                if m.get("role") != "system"
            ]

        # 4. Trim to last N messages
        recent_messages = recent_messages[-self.max_context_messages:]

        return {
            "summary": summary,
            "recent_messages": recent_messages,
        }

    def build_messages(
        self,
        system_prompt: str,
        context: Dict,
        user_message: str,
    ) -> List[Dict[str, str]]:
        """
        Build the messages array for LLM call:
        system + summary + recent messages + current user message.
        """
        messages = [{"role": "system", "content": system_prompt}]

        # Inject summary as context
        if context.get("summary"):
            messages.append({
                "role": "system",
                "content": (
                    f"Previous conversation summary:\n{context['summary']}"
                ),
            })

        # Add recent messages
        for msg in context.get("recent_messages", []):
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return messages

    async def save_exchange(
        self,
        session_id: str,
        user_message: str,
        assistant_response: str,
    ) -> None:
        """Save user and assistant messages to both Redis and Supabase."""
        # Short-term: Redis
        await self.redis.add_to_session_memory(session_id, "user", user_message)
        await self.redis.add_to_session_memory(session_id, "assistant", assistant_response)

        # Long-term: Supabase
        await self.supabase.save_message(session_id, "user", user_message)
        await self.supabase.save_message(session_id, "assistant", assistant_response)

    async def check_and_summarize(self, session_id: str) -> Optional[str]:
        """
        Check if conversation needs summarization.
        If token count exceeds threshold, summarize and store.
        """
        # Get all messages from Redis
        messages = await self.redis.get_session_memory(session_id)

        if not messages:
            return None

        # Count tokens
        total_text = " ".join(m.get("content", "") for m in messages)
        token_count = self.llm.count_tokens(total_text)

        if token_count < self.summarize_threshold:
            return None

        logger.info(
            f"Summarizing session {session_id}: "
            f"{token_count} tokens > {self.summarize_threshold} threshold"
        )

        # Summarize
        summary = await self._summarize_messages(messages)

        if summary:
            # Store in Supabase
            await self.supabase.save_summary(session_id, summary)

            # Clear Redis and keep only last 2 messages
            last_two = messages[-2:] if len(messages) >= 2 else messages
            await self.redis.clear_session_memory(session_id)
            for msg in last_two:
                await self.redis.add_to_session_memory(
                    session_id, msg["role"], msg["content"]
                )

            logger.info(f"Session {session_id} summarized successfully")
            return summary

        return None

    async def _summarize_messages(self, messages: List[Dict]) -> Optional[str]:
        """Summarize a list of messages using GPT-4o-mini."""
        conversation = "\n".join(
            f"{m['role']}: {m['content']}" for m in messages
        )

        summary_messages = [
            {
                "role": "system",
                "content": (
                    "Summarize this conversation concisely. Capture key "
                    "topics, user preferences, products discussed, and "
                    "any decisions made. Keep it under 200 words."
                ),
            },
            {"role": "user", "content": conversation},
        ]

        try:
            result = await self.llm.complete(
                summary_messages, temperature=0.3, max_tokens=300
            )
            return result["content"]
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            return None

    async def initialize_session(
        self,
        session_id: str,
        user_id: Optional[str] = None,
    ) -> Dict:
        """
        Initialize or resume a session.
        Creates in Supabase if new, loads context if existing.
        """
        session = await self.supabase.get_session(session_id)

        if not session:
            # Create new session
            session = await self.supabase.create_session(
                user_id=user_id,
                anonymous_session_id=session_id if not user_id else None,
            )

        # Load context
        context = await self.get_context(session_id)
        return context
