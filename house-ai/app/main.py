"""
House AI — Application Entry Point
FastAPI app with async lifespan, middleware, and structured logging.
"""

import logging
import json
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.config import get_settings
from app.middleware import setup_middleware
from app.dependencies import init_services, shutdown_services
from app.routes import router as system_router
from app.ai.router import router as ai_router


# ── Structured JSON Logging ──────────────────────────────────

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


def setup_logging(level: str = "info"):
    """Configure structured JSON logging."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    root_logger.handlers = [handler]

    # Quiet noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


logger = logging.getLogger("house_ai")


# ── Lifespan ─────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — init and teardown services."""
    settings = get_settings()
    setup_logging(settings.LOG_LEVEL)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    try:
        await init_services(settings)
        logger.info("All services ready")
        yield
    finally:
        await shutdown_services()
        logger.info("Shutdown complete")


# ── FastAPI App ──────────────────────────────────────────────

def create_app() -> FastAPI:
    """Factory function to create the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Production-grade AI Assistant for House Mobile — "
            "a smartphone e-commerce platform. Features smart LLM routing, "
            "RAG pipeline, emotion-aware responses, and multi-language support."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Middleware
    setup_middleware(app, settings)

    # Routers
    app.include_router(system_router)
    app.include_router(ai_router, prefix="/api")

    return app


app = create_app()
