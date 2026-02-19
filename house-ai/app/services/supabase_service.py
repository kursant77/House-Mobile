"""
House AI — Supabase Service
Async Supabase client for products, blog posts, chat sessions, and vector search.
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from supabase import create_client, Client

from app.config import Settings

logger = logging.getLogger("house_ai")


class SupabaseService:
    """Supabase async client wrapper."""

    def __init__(self, settings: Settings):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY,
        )
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY

    # ── Vector Search ────────────────────────────────────

    async def vector_search(
        self,
        table: str,
        query_embedding: List[float],
        top_k: int = 3,
        threshold: float = 0.75,
    ) -> List[Dict[str, Any]]:
        """Perform pgvector similarity search via RPC."""
        try:
            result = self.client.rpc(
                "match_documents",
                {
                    "query_embedding": query_embedding,
                    "match_count": top_k,
                    "match_threshold": threshold,
                    "target_table": table,
                },
            ).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Vector search error: {e}")
            return []

    async def search_products_by_embedding(
        self,
        query_embedding: List[float],
        top_k: int = 3,
        threshold: float = 0.75,
    ) -> List[Dict[str, Any]]:
        """Search products by vector similarity."""
        try:
            result = self.client.rpc(
                "match_products",
                {
                    "query_embedding": query_embedding,
                    "match_count": top_k,
                    "match_threshold": threshold,
                },
            ).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Product vector search error: {e}")
            return []

    async def search_blog_posts_by_embedding(
        self,
        query_embedding: List[float],
        top_k: int = 3,
        threshold: float = 0.75,
    ) -> List[Dict[str, Any]]:
        """Search blog posts by vector similarity."""
        try:
            result = self.client.rpc(
                "match_blog_posts",
                {
                    "query_embedding": query_embedding,
                    "match_count": top_k,
                    "match_threshold": threshold,
                },
            ).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Blog post vector search error: {e}")
            return []

    # ── Products ─────────────────────────────────────────

    async def get_products(
        self,
        brand: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetch products with optional filters."""
        try:
            query = self.client.table("ai_products").select("*")
            if brand:
                query = query.ilike("brand", f"%{brand}%")
            if min_price is not None:
                query = query.gte("price", min_price)
            if max_price is not None:
                query = query.lte("price", max_price)
            query = query.limit(limit)
            result = query.execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Get products error: {e}")
            return []

    async def get_product_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Find a product by name (fuzzy match)."""
        try:
            result = (
                self.client.table("ai_products")
                .select("*")
                .ilike("name", f"%{name}%")
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Get product by name error: {e}")
            return None

    async def get_products_by_names(self, names: List[str]) -> List[Dict[str, Any]]:
        """Find multiple products by their names."""
        products = []
        for name in names:
            product = await self.get_product_by_name(name)
            if product:
                products.append(product)
        return products

    # ── Chat Sessions ────────────────────────────────────

    async def create_session(
        self,
        user_id: Optional[str] = None,
        anonymous_session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new chat session."""
        try:
            data = {"created_at": datetime.utcnow().isoformat()}
            if user_id:
                data["user_id"] = user_id
            if anonymous_session_id:
                data["anonymous_session_id"] = anonymous_session_id

            result = (
                self.client.table("chat_sessions").insert(data).execute()
            )
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Create session error: {e}")
            return {}

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a chat session by ID."""
        try:
            result = (
                self.client.table("chat_sessions")
                .select("*")
                .eq("id", session_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Get session error: {e}")
            return None

    # ── Chat Messages ────────────────────────────────────

    async def save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        summary: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Save a chat message."""
        try:
            data = {
                "session_id": session_id,
                "role": role,
                "content": content,
                "created_at": datetime.utcnow().isoformat(),
            }
            if summary:
                data["summary"] = summary

            result = (
                self.client.table("chat_messages").insert(data).execute()
            )
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Save message error: {e}")
            return {}

    async def get_session_messages(
        self,
        session_id: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get recent messages for a session."""
        try:
            result = (
                self.client.table("chat_messages")
                .select("*")
                .eq("session_id", session_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            messages = result.data or []
            messages.reverse()  # chronological order
            return messages
        except Exception as e:
            logger.error(f"Get messages error: {e}")
            return []

    # ── Summaries ────────────────────────────────────────

    async def save_summary(self, session_id: str, summary: str) -> None:
        """Save conversation summary for a session."""
        try:
            # Upsert the latest summary message
            await self.save_message(session_id, "system", summary, summary=summary)
        except Exception as e:
            logger.error(f"Save summary error: {e}")

    async def get_previous_summary(self, session_id: str) -> Optional[str]:
        """Get the most recent summary for a session."""
        try:
            result = (
                self.client.table("chat_messages")
                .select("summary")
                .eq("session_id", session_id)
                .not_.is_("summary", "null")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if result.data and result.data[0].get("summary"):
                return result.data[0]["summary"]
            return None
        except Exception as e:
            logger.error(f"Get summary error: {e}")
            return None
