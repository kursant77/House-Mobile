"""
House AI — Response Models
Structured API response schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.schemas import Product, Emotion, Intent, Language


# ── Health ───────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── Error ────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    status_code: int = 500


# ── Chat ─────────────────────────────────────────────────────

class ChatResponse(BaseModel):
    message: str
    session_id: str
    intent: Intent = Intent.GENERAL_CHAT
    emotion: Emotion = Emotion.NEUTRAL
    language: Language = Language.ENGLISH
    products: Optional[List["ProductCard"]] = None
    comparison: Optional["ComparisonTable"] = None
    sources: Optional[List[str]] = None
    tokens_used: int = 0
    model_used: str = "gpt-4o-mini"


class StreamChunk(BaseModel):
    type: str = "text"  # "text", "product", "comparison", "done", "error"
    content: str = ""
    data: Optional[Dict[str, Any]] = None


# ── Product Card ─────────────────────────────────────────────

class ProductCard(BaseModel):
    name: str
    brand: str
    price: float
    currency: str = "UZS"
    image_url: Optional[str] = None
    overall_score: float = 0.0
    strengths: List[str] = []
    weaknesses: List[str] = []
    best_for: str = ""
    specs: Dict[str, str] = {}


# ── Comparison Table ─────────────────────────────────────────

class ComparisonRow(BaseModel):
    category: str
    values: Dict[str, str]  # product_name -> value
    winner: Optional[str] = None


class ComparisonTable(BaseModel):
    products: List[str]
    rows: List[ComparisonRow]
    final_recommendation: str = ""
    reasoning: str = ""


# ── Recommendation Response ──────────────────────────────────

class RecommendationResponse(BaseModel):
    message: str
    products: List[ProductCard]
    session_id: str
    language: Language = Language.ENGLISH
    tokens_used: int = 0


# ── Comparison Response ──────────────────────────────────────

class ComparisonResponse(BaseModel):
    message: str
    comparison: ComparisonTable
    session_id: str
    language: Language = Language.ENGLISH
    tokens_used: int = 0


# ── Session ──────────────────────────────────────────────────

class SessionResponse(BaseModel):
    session_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    message_count: int = 0
    has_summary: bool = False
