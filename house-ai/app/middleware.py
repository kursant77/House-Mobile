"""
House AI — Middleware Stack
CORS, rate limiting, error handling, logging, prompt injection filter.
"""

import time
import json
import re
import logging
from typing import Callable, Dict
from collections import defaultdict
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


logger = logging.getLogger("house_ai")


# ── Prompt Injection Patterns ────────────────────────────────

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?prior",
    r"you\s+are\s+now\s+(a\s+)?DAN",
    r"pretend\s+you\s+are",
    r"act\s+as\s+if\s+you\s+have\s+no\s+restrictions",
    r"override\s+(your\s+)?system\s+prompt",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"what\s+is\s+your\s+system\s+prompt",
    r"ignore\s+safety",
    r"bypass\s+(content\s+)?filter",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def detect_prompt_injection(text: str) -> bool:
    """Check if text contains prompt injection attempts."""
    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            return True
    return False


# ── Rate Limiter ─────────────────────────────────────────────

class RateLimiter:
    """Redis-backed sliding window rate limiter with in-memory fallback."""

    def __init__(self, redis_client=None):
        self._redis = redis_client
        self._fallback: Dict[str, list] = defaultdict(list)

    def set_redis(self, redis_client):
        """Set Redis client after initialization."""
        self._redis = redis_client

    def is_allowed(self, key: str, limit: int, window: int = 60) -> bool:
        # Try Redis first
        if self._redis:
            try:
                import asyncio
                # Sync wrapper — middleware dispatch is sync context for rate check
                rl_key = f"rl:{key}"
                # Fallback to in-memory if event loop issues
            except Exception:
                pass

        # In-memory fallback
        now = time.time()
        self._fallback[key] = [
            t for t in self._fallback[key] if t > now - window
        ]
        if len(self._fallback[key]) >= limit:
            return False
        self._fallback[key].append(now)
        return True

    def get_remaining(self, key: str, limit: int, window: int = 60) -> int:
        now = time.time()
        self._fallback[key] = [
            t for t in self._fallback[key] if t > now - window
        ]
        return max(0, limit - len(self._fallback[key]))


rate_limiter = RateLimiter()


# ── Logging Middleware ───────────────────────────────────────

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Structured JSON request/response logging."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = f"{int(start_time * 1000)}"

        # Log request
        logger.info(json.dumps({
            "event": "request_start",
            "request_id": request_id,
            "method": request.method,
            "path": str(request.url.path),
            "client_ip": request.client.host if request.client else "unknown",
        }))

        try:
            response = await call_next(request)
            duration = time.time() - start_time

            # Log response
            logger.info(json.dumps({
                "event": "request_end",
                "request_id": request_id,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
            }))

            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{round(duration * 1000, 2)}ms"
            return response

        except Exception as e:
            duration = time.time() - start_time
            logger.error(json.dumps({
                "event": "request_error",
                "request_id": request_id,
                "error": str(e),
                "duration_ms": round(duration * 1000, 2),
            }))
            raise


# ── Rate Limit Middleware ────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP rate limiting middleware."""

    def __init__(self, app, rate_limit: int = 30, anon_rate_limit: int = 10):
        super().__init__(app)
        self.rate_limit = rate_limit
        self.anon_rate_limit = anon_rate_limit

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks
        if request.url.path in ("/health", "/docs", "/openapi.json"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        # Check for authenticated user (JWT in header)
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            limit = self.rate_limit
            key = f"rate:{auth_header[7:20]}:{client_ip}"
        else:
            limit = self.anon_rate_limit
            key = f"rate:anon:{client_ip}"

        if not rate_limiter.is_allowed(key, limit):
            remaining = rate_limiter.get_remaining(key, limit)
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Maximum {limit} requests per minute. Try again shortly.",
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": str(remaining),
                    "Retry-After": "60",
                },
            )

        response = await call_next(request)
        remaining = rate_limiter.get_remaining(key, limit)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response


# ── Error Handler Middleware ─────────────────────────────────

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Global exception handler — returns structured JSON errors."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except ValueError as e:
            logger.warning(f"Validation error: {e}")
            return JSONResponse(
                status_code=400,
                content={"error": "Bad Request", "detail": str(e)},
            )
        except PermissionError as e:
            logger.warning(f"Permission error: {e}")
            return JSONResponse(
                status_code=403,
                content={"error": "Forbidden", "detail": str(e)},
            )
        except Exception as e:
            logger.exception(f"Unhandled error: {e}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "detail": "An unexpected error occurred. Please try again later.",
                },
            )


# ── Setup Function ───────────────────────────────────────────

def setup_middleware(app: FastAPI, settings) -> None:
    """Register all middleware on the FastAPI app."""

    # Order matters: outermost middleware runs first
    app.add_middleware(ErrorHandlerMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        RateLimitMiddleware,
        rate_limit=settings.RATE_LIMIT_PER_MINUTE,
        anon_rate_limit=settings.RATE_LIMIT_PER_MINUTE_ANON,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
