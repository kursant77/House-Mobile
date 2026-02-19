"""
House AI — Conversation Summarizer
Standalone summarization utilities for token-efficient memory.
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger("house_ai")


async def summarize_conversation(
    messages: List[Dict[str, str]],
    llm_service,
    max_tokens: int = 300,
) -> Optional[str]:
    """
    Summarize a list of conversation messages.
    Returns a concise summary capturing key points.
    """
    if not messages:
        return None

    conversation_text = "\n".join(
        f"{m.get('role', 'user')}: {m.get('content', '')}"
        for m in messages
    )

    summary_messages = [
        {
            "role": "system",
            "content": (
                "You are a conversation summarizer for a smartphone e-commerce "
                "assistant. Summarize the conversation below. Include:\n"
                "- User's main interests and preferences\n"
                "- Products discussed or compared\n"
                "- Key decisions or preferences expressed\n"
                "- Any budget or feature priorities mentioned\n\n"
                "Be concise. Maximum 150 words."
            ),
        },
        {"role": "user", "content": conversation_text},
    ]

    try:
        result = await llm_service.complete(
            summary_messages,
            temperature=0.3,
            max_tokens=max_tokens,
        )
        summary = result["content"].strip()
        logger.info(f"Summarized {len(messages)} messages into {len(summary)} chars")
        return summary
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        return None


async def create_session_context(
    summary: Optional[str],
    recent_messages: List[Dict[str, str]],
) -> str:
    """
    Build a context string from summary + recent messages.
    Used when resuming a conversation.
    """
    parts = []

    if summary:
        parts.append(f"Previous conversation context: {summary}")

    if recent_messages:
        recent_text = "\n".join(
            f"{m['role']}: {m['content']}" for m in recent_messages[-3:]
        )
        parts.append(f"Recent messages:\n{recent_text}")

    return "\n\n".join(parts)


def estimate_summary_savings(
    original_messages: List[Dict[str, str]],
    summary: str,
    token_counter,
) -> Dict[str, int]:
    """Calculate token savings from summarization."""
    original_tokens = sum(
        token_counter(m.get("content", "")) for m in original_messages
    )
    summary_tokens = token_counter(summary)

    return {
        "original_tokens": original_tokens,
        "summary_tokens": summary_tokens,
        "saved_tokens": original_tokens - summary_tokens,
        "compression_ratio": round(summary_tokens / max(original_tokens, 1), 2),
    }
