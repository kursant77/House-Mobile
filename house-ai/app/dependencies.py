"""
House AI — Dependency Injection
FastAPI dependencies for service instances and auth.
"""

import logging
from typing import Optional
from fastapi import Depends, Header, HTTPException
from jose import jwt, JWTError

from app.config import get_settings, Settings
from app.services.llm_service import LLMService
from app.services.supabase_service import SupabaseService
from app.services.redis_service import RedisService
from app.services.search_service import SearchService
from app.services.currency_service import CurrencyService

logger = logging.getLogger("house_ai")


# ── Service Singletons ──────────────────────────────────────

_llm_service: Optional[LLMService] = None
_supabase_service: Optional[SupabaseService] = None
_redis_service: Optional[RedisService] = None
_search_service: Optional[SearchService] = None
_currency_service: Optional[CurrencyService] = None


async def init_services(settings: Settings) -> None:
    """Initialize all services on startup."""
    global _llm_service, _supabase_service, _redis_service, _search_service, _currency_service

    _llm_service = LLMService(settings)
    _supabase_service = SupabaseService(settings)
    _redis_service = RedisService(settings)
    _search_service = SearchService(settings)
    _currency_service = CurrencyService(settings)

    await _redis_service.connect()
    logger.info("All services initialized")


async def shutdown_services() -> None:
    """Cleanup services on shutdown."""
    global _redis_service
    if _redis_service:
        await _redis_service.disconnect()
    logger.info("All services shut down")


# ── Dependency Getters ───────────────────────────────────────

def get_llm() -> LLMService:
    if _llm_service is None:
        raise RuntimeError("LLMService not initialized")
    return _llm_service


def get_supabase() -> SupabaseService:
    if _supabase_service is None:
        raise RuntimeError("SupabaseService not initialized")
    return _supabase_service


def get_redis() -> RedisService:
    if _redis_service is None:
        raise RuntimeError("RedisService not initialized")
    return _redis_service


def get_search() -> SearchService:
    if _search_service is None:
        raise RuntimeError("SearchService not initialized")
    return _search_service


def get_currency() -> CurrencyService:
    if _currency_service is None:
        raise RuntimeError("CurrencyService not initialized")
    return _currency_service


# ── Auth Dependency ──────────────────────────────────────────

async def get_current_user(
    authorization: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings),
) -> Optional[dict]:
    """
    Extract user from JWT token. Returns None for anonymous users.
    Does NOT block unauthenticated requests — allows anonymous fallback.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization[7:]
    if not settings.JWT_SECRET:
        return None

    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            return None
        return {"user_id": user_id, "role": payload.get("role", "user")}
    except JWTError:
        logger.warning("Invalid JWT token received")
        return None


async def require_auth(
    user: Optional[dict] = Depends(get_current_user),
) -> dict:
    """Strict auth dependency — raises 401 if not authenticated."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
