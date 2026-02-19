"""
House AI — Recommendation Engine
Dynamic scoring with user intent-based weight adjustment.
"""

import logging
from typing import List, Dict, Optional

from app.models.schemas import Product, Intent
from app.models.response_models import ProductCard
from app.services.supabase_service import SupabaseService
from app.services.llm_service import LLMService
from app.config import Settings

logger = logging.getLogger("house_ai")


class RecommendationEngine:
    """Dynamic product recommendation engine."""

    def __init__(self, settings: Settings):
        self.base_weights = {
            "value": settings.WEIGHT_VALUE,
            "gaming": settings.WEIGHT_GAMING,
            "camera": settings.WEIGHT_CAMERA,
            "trend": settings.WEIGHT_TREND,
        }

    def adjust_weights(self, focus: Optional[str] = None) -> Dict[str, float]:
        """
        Adjust scoring weights based on user focus.
        
        If user mentions:
        - gaming → increase gaming weight
        - camera → increase camera weight
        - budget → prioritize value_score
        """
        weights = self.base_weights.copy()

        if not focus:
            return weights

        focus = focus.lower()

        if "gaming" in focus or "game" in focus or "o'yin" in focus or "игр" in focus:
            weights["gaming"] = 0.45
            weights["value"] = 0.25
            weights["camera"] = 0.15
            weights["trend"] = 0.15

        elif "camera" in focus or "photo" in focus or "kamera" in focus or "камер" in focus:
            weights["camera"] = 0.45
            weights["value"] = 0.25
            weights["gaming"] = 0.15
            weights["trend"] = 0.15

        elif "budget" in focus or "cheap" in focus or "arzon" in focus or "дешев" in focus:
            weights["value"] = 0.55
            weights["gaming"] = 0.15
            weights["camera"] = 0.15
            weights["trend"] = 0.15

        elif "trend" in focus or "popular" in focus or "mashhur" in focus or "популярн" in focus:
            weights["trend"] = 0.40
            weights["value"] = 0.25
            weights["gaming"] = 0.20
            weights["camera"] = 0.15

        return weights

    def calculate_score(
        self, product: Dict, weights: Dict[str, float]
    ) -> float:
        """Calculate overall product score based on weighted formula."""
        score = (
            weights["value"] * float(product.get("value_score", 0))
            + weights["gaming"] * float(product.get("gaming_score", 0))
            + weights["camera"] * float(product.get("camera_score", 0))
            + weights["trend"] * float(product.get("trend_score", 0))
        )
        return round(score, 2)

    async def recommend(
        self,
        supabase: SupabaseService,
        llm: LLMService,
        query: str,
        focus: Optional[str] = None,
        budget_min: Optional[float] = None,
        budget_max: Optional[float] = None,
        language: str = "en",
        top_k: int = 5,
    ) -> Dict:
        """
        Full recommendation pipeline:
        1. Fetch products (optionally filtered by budget)
        2. Score and rank
        3. Generate explanation via LLM
        """
        # 1. Fetch products
        products = await supabase.get_products(
            min_price=budget_min,
            max_price=budget_max,
            limit=20,
        )

        if not products:
            return {
                "products": [],
                "message": self._no_products_message(language),
                "tokens_used": 0,
            }

        # 2. Score and rank
        weights = self.adjust_weights(focus)
        scored = []
        for p in products:
            score = self.calculate_score(p, weights)
            scored.append((score, p))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_products = scored[:top_k]

        # 3. Build product cards
        cards = []
        for score, p in top_products:
            card = ProductCard(
                name=p.get("name", ""),
                brand=p.get("brand", ""),
                price=float(p.get("price", 0)),
                currency=p.get("currency", "UZS"),
                image_url=p.get("image_url"),
                overall_score=score,
                specs={
                    "CPU": p.get("cpu", "N/A"),
                    "GPU": p.get("gpu", "N/A"),
                    "RAM": p.get("ram", "N/A"),
                    "Storage": p.get("storage", "N/A"),
                    "Battery": p.get("battery", "N/A"),
                    "Display": p.get("display", "N/A"),
                    "Camera": p.get("camera", "N/A"),
                },
                strengths=self._identify_strengths(p, weights),
                weaknesses=self._identify_weaknesses(p, weights),
                best_for=self._best_use_case(p, weights),
            )
            cards.append(card)

        # 4. Generate explanation
        explanation, tokens = await self._generate_explanation(
            llm, cards, query, focus, language
        )

        return {
            "products": cards,
            "message": explanation,
            "tokens_used": tokens,
        }

    def _identify_strengths(
        self, product: Dict, weights: Dict[str, float]
    ) -> List[str]:
        """Identify a product's top strengths."""
        strengths = []
        scores = {
            "Gaming performance": float(product.get("gaming_score", 0)),
            "Camera quality": float(product.get("camera_score", 0)),
            "Value for money": float(product.get("value_score", 0)),
            "Trend popularity": float(product.get("trend_score", 0)),
        }

        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        for name, score in sorted_scores[:2]:
            if score >= 7:
                strengths.append(f"{name}: {score}/10")

        if product.get("battery") and "5000" in str(product.get("battery", "")):
            strengths.append("Large battery capacity")

        return strengths or ["Balanced performance"]

    def _identify_weaknesses(
        self, product: Dict, weights: Dict[str, float]
    ) -> List[str]:
        """Identify a product's weaknesses."""
        weaknesses = []
        scores = {
            "Gaming performance": float(product.get("gaming_score", 0)),
            "Camera quality": float(product.get("camera_score", 0)),
            "Value for money": float(product.get("value_score", 0)),
        }

        for name, score in scores.items():
            if score < 5:
                weaknesses.append(f"{name}: {score}/10")

        return weaknesses or ["No significant weaknesses"]

    def _best_use_case(
        self, product: Dict, weights: Dict[str, float]
    ) -> str:
        """Determine the best use case for this product."""
        gaming = float(product.get("gaming_score", 0))
        camera = float(product.get("camera_score", 0))
        value = float(product.get("value_score", 0))

        if gaming >= 8:
            return "Heavy gaming and performance tasks"
        elif camera >= 8:
            return "Photography and content creation"
        elif value >= 8:
            return "Best value for everyday use"
        else:
            return "Balanced daily use"

    async def _generate_explanation(
        self,
        llm: LLMService,
        cards: List[ProductCard],
        query: str,
        focus: Optional[str],
        language: str,
    ) -> tuple:
        """Generate a natural language explanation of recommendations."""
        products_text = "\n".join(
            f"- {c.name} ({c.brand}): Score {c.overall_score}/10, "
            f"Price: {c.price:,.0f} {c.currency}, "
            f"Strengths: {', '.join(c.strengths)}, "
            f"Best for: {c.best_for}"
            for c in cards
        )

        lang_instruction = {
            "en": "Respond in English.",
            "uz": "O'zbek tilida javob bering.",
            "ru": "Отвечайте на русском языке.",
        }.get(language, "Respond in English.")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a smartphone expert for House Mobile. "
                    "Provide a clear, helpful recommendation based on the "
                    "scored products below. Be conversational and helpful. "
                    f"{lang_instruction}\n\n"
                    f"Products:\n{products_text}"
                ),
            },
            {
                "role": "user",
                "content": query,
            },
        ]

        if focus:
            messages[0]["content"] += f"\nUser's focus: {focus}"

        try:
            result = await llm.complete(messages, temperature=0.7)
            return result["content"], result["tokens"]["total"]
        except Exception as e:
            logger.error(f"Recommendation explanation error: {e}")
            return "Here are my top recommendations based on your preferences:", 0

    @staticmethod
    def _no_products_message(language: str) -> str:
        msgs = {
            "en": "Sorry, I couldn't find any products matching your criteria. Try adjusting your budget or preferences.",
            "uz": "Kechirasiz, mezonlaringizga mos mahsulot topilmadi. Byudjetingiz yoki afzalliklaringizni o'zgartirib ko'ring.",
            "ru": "Извините, я не нашёл товаров по вашим критериям. Попробуйте изменить бюджет или предпочтения.",
        }
        return msgs.get(language, msgs["en"])
