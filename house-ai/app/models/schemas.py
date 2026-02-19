"""
House AI — Pydantic Data Models & Request Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


# ── Enums ────────────────────────────────────────────────────

class Role(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Intent(str, Enum):
    RECOMMENDATION = "recommendation"
    COMPARISON = "comparison"
    PRODUCT_DETAIL = "product_detail"
    BLOG_SEARCH = "blog_search"
    TREND_INQUIRY = "trend_inquiry"
    BUDGET_CONVERSION = "budget_conversion"
    GENERAL_CHAT = "general_chat"


class Emotion(str, Enum):
    HAPPY = "happy"
    CONFUSED = "confused"
    FRUSTRATED = "frustrated"
    ANGRY = "angry"
    EXCITED = "excited"
    NEUTRAL = "neutral"


class Language(str, Enum):
    UZBEK = "uz"
    RUSSIAN = "ru"
    ENGLISH = "en"


# ── Chat Schemas ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Role
    content: str
    created_at: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    language: Optional[Language] = None


class SessionCreate(BaseModel):
    user_id: Optional[str] = None
    anonymous_session_id: Optional[str] = None


# ── Product Schemas ──────────────────────────────────────────

class Product(BaseModel):
    id: str
    name: str
    brand: str
    price: float
    currency: str = "UZS"
    cpu: Optional[str] = None
    gpu: Optional[str] = None
    ram: Optional[str] = None
    storage: Optional[str] = None
    battery: Optional[str] = None
    display: Optional[str] = None
    camera: Optional[str] = None
    gaming_score: float = 0.0
    camera_score: float = 0.0
    value_score: float = 0.0
    trend_score: float = 0.0
    image_url: Optional[str] = None


class BlogPost(BaseModel):
    id: str
    title: str
    content: str
    created_at: Optional[datetime] = None


# ── Recommendation / Comparison ──────────────────────────────

class RecommendRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    focus: Optional[str] = None  # "gaming", "camera", "budget"
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    language: Optional[Language] = None


class CompareRequest(BaseModel):
    product_names: List[str] = Field(..., min_length=2, max_length=5)
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    language: Optional[Language] = None


# ── User Context ─────────────────────────────────────────────

class UserContext(BaseModel):
    user_id: Optional[str] = None
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    language: Language = Language.ENGLISH
    emotion: Emotion = Emotion.NEUTRAL
    intent: Intent = Intent.GENERAL_CHAT
    summary: Optional[str] = None
    recent_messages: List[ChatMessage] = []
    token_usage_today: int = 0
