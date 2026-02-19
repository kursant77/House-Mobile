"""
House AI — Application Configuration
Centralized Pydantic settings loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "House AI Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8100
    WORKERS: int = 4
    LOG_LEVEL: str = "info"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── OpenAI & Groq ────────────────────────────────────
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    LLM_MODEL_DEFAULT: str = "gpt-4o-mini"
    LLM_MODEL_ADVANCED: str = "gpt-4o"
    LLM_MODEL_FALLBACK: str = "llama-3.3-70b-versatile"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536
    CONFIDENCE_THRESHOLD: float = 0.7
    MAX_CONTEXT_MESSAGES: int = 5

    # ── Token Budget ─────────────────────────────────────
    DAILY_TOKEN_BUDGET_PER_USER: int = 100_000
    SUMMARIZE_TOKEN_THRESHOLD: int = 3000
    MAX_RESPONSE_TOKENS: int = 1024

    # ── Supabase ─────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # ── Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_PRODUCTS: int = 86400       # 24h
    CACHE_TTL_COMPARISONS: int = 43200    # 12h
    CACHE_TTL_RAG: int = 21600            # 6h
    CACHE_TTL_CURRENCY: int = 172800      # 48h
    SESSION_MEMORY_MAX_MESSAGES: int = 20

    # ── Tavily Search ────────────────────────────────────
    TAVILY_API_KEY: str = ""
    TAVILY_SEARCH_COUNT: int = 5

    # ── RAG ──────────────────────────────────────────────
    RAG_TOP_K: int = 3
    RAG_SIMILARITY_THRESHOLD: float = 0.75

    # ── Security ─────────────────────────────────────────
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    RATE_LIMIT_PER_MINUTE: int = 30
    RATE_LIMIT_PER_MINUTE_ANON: int = 10

    # ── Recommendation Weights ───────────────────────────
    WEIGHT_VALUE: float = 0.40
    WEIGHT_GAMING: float = 0.25
    WEIGHT_CAMERA: float = 0.20
    WEIGHT_TREND: float = 0.15

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
