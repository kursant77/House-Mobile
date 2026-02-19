"""
House AI — Brave Search Service
Async Brave Search API client for RAG fallback.
"""

import logging
from typing import List, Dict, Any

import httpx

from app.config import Settings

logger = logging.getLogger("house_ai")


class BraveService:
    """Brave Search API client for web search fallback."""

    BASE_URL = "https://api.search.brave.com/res/v1/web/search"

    def __init__(self, settings: Settings):
        self.api_key = settings.BRAVE_API_KEY
        self.search_count = settings.BRAVE_SEARCH_COUNT

    async def search(self, query: str, count: int = None) -> List[Dict[str, Any]]:
        """
        Search the web via Brave Search API.
        Returns list of results with title, url, description.
        """
        if not self.api_key:
            logger.warning("Brave API key not configured, skipping search")
            return []

        count = count or self.search_count

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    self.BASE_URL,
                    params={"q": query, "count": count},
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip",
                        "X-Subscription-Token": self.api_key,
                    },
                )
                response.raise_for_status()
                data = response.json()

            results = []
            web_results = data.get("web", {}).get("results", [])

            for item in web_results[:count]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "description": item.get("description", ""),
                })

            logger.info(f"Brave search: query='{query}', results={len(results)}")
            return results

        except httpx.HTTPError as e:
            logger.error(f"Brave search HTTP error: {e}")
            return []
        except Exception as e:
            logger.error(f"Brave search error: {e}")
            return []

    def format_sources(self, results: List[Dict[str, Any]]) -> List[str]:
        """Format search results as source citations."""
        sources = []
        for r in results:
            title = r.get("title", "Unknown")
            url = r.get("url", "")
            sources.append(f"[{title}]({url})")
        return sources

    def build_context(self, results: List[Dict[str, Any]]) -> str:
        """Build context string from search results for LLM prompt."""
        if not results:
            return ""

        context_parts = []
        for i, r in enumerate(results, 1):
            title = r.get("title", "")
            desc = r.get("description", "")
            url = r.get("url", "")
            context_parts.append(
                f"Source {i}: {title}\n{desc}\nURL: {url}"
            )

        return "\n\n".join(context_parts)
