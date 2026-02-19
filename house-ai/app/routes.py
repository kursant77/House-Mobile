"""
House AI — Top-Level Routes
Health check and router inclusion.
"""

from fastapi import APIRouter
from app.models.response_models import HealthResponse
from app.config import get_settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
    )


@router.get("/", tags=["System"])
async def root():
    """Root endpoint — API information."""
    settings = get_settings()
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
