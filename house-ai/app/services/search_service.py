"""
House AI — Search Service
Async Tavily Search API client for RAG fallback.
"""

import logging
from typing import List, Dict, Any, Optional

import httpx

from app.config import Settings

logger = logging.getLogger("house_ai")


class SearchService:
    """Tavily Search API client for web search fallback."""

    BASE_URL = "https://api.tavily.com/search"

    def __init__(self, settings: Settings):
        self.api_key = settings.TAVILY_API_KEY
        self.search_count = settings.TAVILY_SEARCH_COUNT

    async def search(self, query: str, count: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Search the web via Tavily API.
        Returns list of results with title, url, description (content).
        """
        if not self.api_key:
            logger.warning("Tavily API key not configured, skipping search")
            return []

        count = count or self.search_count

        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "basic",
            "include_images": False,
            "max_results": count,
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                data = response.json()

            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "description": item.get("content", ""),  # Tavily returns 'content'
                })

            logger.info(f"Tavily search: query='{query}', results={len(results)}")
            return results

        except httpx.HTTPError as e:
            logger.error(f"Tavily search HTTP error: {e}")
            return []
        except Exception as e:
            logger.error(f"Tavily search error: {e}")
            return []

    def format_sources(self, results: List[Dict[str, Any]]) -> List[str]:
        """Format search results as source citations."""
        return [r.get("url", "") for r in results if r.get("url")]

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
