"""
House AI — RAG Pipeline
Cost-efficient retrieval-augmented generation with vector search and Brave fallback.
"""

import logging
from typing import Any, Dict, List, Optional

from app.services.llm_service import LLMService
from app.services.supabase_service import SupabaseService
from app.services.search_service import SearchService
from app.services.redis_service import RedisService
from app.config import Settings

logger = logging.getLogger("house_ai")


class RAGPipeline:
    """Retrieval-Augmented Generation pipeline."""

    def __init__(self, settings: Settings):
        self.top_k = settings.RAG_TOP_K
        self.similarity_threshold = settings.RAG_SIMILARITY_THRESHOLD
        self.cache_ttl = settings.CACHE_TTL_RAG

    async def query(
        self,
        user_query: str,
        llm: LLMService,
        supabase: SupabaseService,
        search: SearchService,
        redis: RedisService,
        language: str = "en",
        system_context: str = "",
        conversation_history: Optional[Dict[str, Any]] = None,
    ) -> Dict:
        """
        Full RAG pipeline:
        1. Check cache
        2. Embed user query
        3. Vector search in Supabase
        4. If similarity low → call Web Search
        5. Merge context
        6. Generate grounded response
        7. Cache result
        """
        # 1. Check cache
        cache_key = redis.rag_cache_key(user_query)
        cached = await redis.get_cached(cache_key)
        if cached:
            logger.info(f"RAG cache hit: {user_query[:50]}")
            return cached

        # 2. Embed user query
        query_embedding = await llm.embed_single(user_query)

        # 3. Vector search — products
        product_results = await supabase.search_products_by_embedding(
            query_embedding, top_k=self.top_k, threshold=self.similarity_threshold
        )

        # 4. Vector search — blog posts
        blog_results = await supabase.search_blog_posts_by_embedding(
            query_embedding, top_k=self.top_k, threshold=self.similarity_threshold
        )

        # 5. Build context
        context_parts = []
        sources = []
        used_web_search = False

        # Add product context
        if product_results:
            product_context = self._format_product_context(product_results)
            context_parts.append(product_context)

        # Add blog context
        if blog_results:
            blog_context = self._format_blog_context(blog_results)
            context_parts.append(blog_context)

        # 6. If no results or low quality, try Web search
        if not product_results and not blog_results:
            logger.info("No vector results, falling back to Web search")
            search_results = await search.search(
                f"smartphone {user_query}", count=3
            )
            if search_results:
                search_context = search.build_context(search_results)
                context_parts.append(search_context)
                sources = search.format_sources(search_results)
                used_web_search = True

        # 7. Merge context
        merged_context = "\n\n".join(context_parts) if context_parts else ""

        # 8. Generate grounded response
        result = await self._generate_response(
            llm=llm,
            query=user_query,
            context=merged_context,
            has_context=bool(context_parts),
            used_web_search=used_web_search,
            sources=sources,
            language=language,
            system_context=system_context,
            conversation_history=conversation_history,
        )

        # 9. Cache result
        if result.get("message"):
            await redis.set_cached(cache_key, result, self.cache_ttl)

        return result

    def _format_product_context(self, products: List[Dict]) -> str:
        """Format product results as context for LLM."""
        parts = ["Product Information:"]
        for p in products:
            parts.append(
                f"- {p.get('name', 'Unknown')} ({p.get('brand', '')}): "
                f"Price: {p.get('price', 'N/A')}, "
                f"CPU: {p.get('cpu', 'N/A')}, "
                f"RAM: {p.get('ram', 'N/A')}, "
                f"Camera: {p.get('camera', 'N/A')}, "
                f"Battery: {p.get('battery', 'N/A')}, "
                f"Gaming Score: {p.get('gaming_score', 'N/A')}/10, "
                f"Value Score: {p.get('value_score', 'N/A')}/10"
            )
        return "\n".join(parts)

    def _format_blog_context(self, posts: List[Dict]) -> str:
        """Format blog post results as context for LLM."""
        parts = ["Blog/Article Information:"]
        for post in posts:
            content = post.get("content", "")
            # Truncate long content
            if len(content) > 500:
                content = content[:500] + "..."
            parts.append(
                f"- Title: {post.get('title', 'Unknown')}\n"
                f"  Content: {content}"
            )
        return "\n".join(parts)

    async def _generate_response(
        self,
        llm: LLMService,
        query: str,
        context: str,
        has_context: bool,
        used_web_search: bool,
        sources: List[str],
        language: str,
        system_context: str = "",
        conversation_history: Optional[Dict[str, Any]] = None,
    ) -> Dict:
        """Generate a grounded response using retrieved context."""
        lang_instruction = {
            "en": "Respond in English.",
            "uz": "O'zbek tilida javob bering.",
            "ru": "Отвечайте на русском языке.",
        }.get(language, "Respond in English.")

        if has_context:
            system_prompt = (
                "You are a knowledgeable smartphone assistant for House Mobile. "
                "Answer the user's question using ONLY the provided context below. "
                "Do NOT make up information. If the context doesn't contain the "
                "answer, say so clearly. Be helpful and conversational.\n"
                f"{lang_instruction}\n\n"
                f"Context:\n{context}"
            )

            if used_web_search and sources:
                system_prompt += (
                    "\n\nNote: Some information came from web search. "
                    "Cite sources when using external information."
                )
        else:
            system_prompt = (
                "You are a smartphone assistant for House Mobile. "
                "The user asked a question, but no relevant data was found "
                "in our database or web search. Politely inform the user "
                "that you don't have specific information about this topic, "
                "but offer general guidance if possible.\n"
                f"{lang_instruction}"
            )

        if system_context:
            system_prompt = f"{system_context}\n\n{system_prompt}"

        messages = [{"role": "system", "content": system_prompt}]

        # Inject conversation summary if available
        if conversation_history and conversation_history.get("summary"):
            messages.append({
                "role": "system",
                "content": f"Previous conversation summary:\n{conversation_history['summary']}",
            })

        # Inject recent conversation messages (excluding current query)
        if conversation_history and conversation_history.get("recent_messages"):
            for msg in conversation_history["recent_messages"]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        # Add current user query
        messages.append({"role": "user", "content": query})

        try:
            result = await llm.complete(messages, temperature=0.5)
            return {
                "message": result["content"],
                "sources": sources if used_web_search else [],
                "tokens_used": result["tokens"]["total"],
                "model": result["model"],
                "used_web_search": used_web_search,
                "context_found": has_context,
            }
        except Exception as e:
            logger.error(f"RAG generation error: {e}")
            return {
                "message": self._fallback_message(language),
                "sources": [],
                "tokens_used": 0,
                "model": "",
                "used_web_search": False,
                "context_found": False,
            }

    @staticmethod
    def _fallback_message(language: str) -> str:
        msgs = {
            "en": "I'm sorry, I encountered an error while processing your request. Please try again.",
            "uz": "Kechirasiz, so'rovingizni qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring.",
            "ru": "Извините, произошла ошибка при обработке запроса. Попробуйте снова.",
        }
        return msgs.get(language, msgs["en"])
