"""
House AI — Comparison Engine
Structured product comparison with per-category winners and LLM summary.
"""

import logging
from typing import List, Dict, Optional

from app.models.response_models import ComparisonTable, ComparisonRow
from app.services.supabase_service import SupabaseService
from app.services.llm_service import LLMService

logger = logging.getLogger("house_ai")


# ── Comparison Categories ────────────────────────────────────

COMPARISON_CATEGORIES = [
    ("CPU", "cpu"),
    ("GPU", "gpu"),
    ("RAM", "ram"),
    ("Storage", "storage"),
    ("Display", "display"),
    ("Camera", "camera"),
    ("Battery", "battery"),
    ("Gaming Score", "gaming_score"),
    ("Camera Score", "camera_score"),
    ("Value Score", "value_score"),
    ("Trend Score", "trend_score"),
    ("Price", "price"),
]


class ComparisonEngine:
    """Product comparison engine."""

    async def compare(
        self,
        supabase: SupabaseService,
        llm: LLMService,
        product_names: List[str],
        language: str = "en",
    ) -> Dict:
        """
        Full comparison pipeline:
        1. Fetch products by name
        2. Build comparison table
        3. Determine winners per category
        4. Generate final recommendation via LLM
        """
        # 1. Fetch products
        products = await supabase.get_products_by_names(product_names)

        if len(products) < 2:
            return {
                "comparison": None,
                "message": self._not_found_message(product_names, language),
                "tokens_used": 0,
            }

        # 2. Build comparison rows
        rows = self._build_comparison_rows(products)

        # 3. Build table
        product_labels = [p.get("name", "Unknown") for p in products]
        table = ComparisonTable(
            products=product_labels,
            rows=rows,
        )

        # 4. Generate LLM recommendation
        recommendation, tokens = await self._generate_recommendation(
            llm, products, rows, language
        )

        table.final_recommendation = recommendation
        table.reasoning = recommendation

        return {
            "comparison": table,
            "message": recommendation,
            "tokens_used": tokens,
        }

    def _build_comparison_rows(
        self, products: List[Dict]
    ) -> List[ComparisonRow]:
        """Build comparison rows with per-category winners."""
        rows = []

        for label, key in COMPARISON_CATEGORIES:
            values = {}
            for p in products:
                name = p.get("name", "Unknown")
                val = p.get(key, "N/A")
                if val is None:
                    val = "N/A"
                values[name] = str(val)

            # Determine winner
            winner = self._determine_winner(key, products)

            rows.append(ComparisonRow(
                category=label,
                values=values,
                winner=winner,
            ))

        return rows

    def _determine_winner(
        self, key: str, products: List[Dict]
    ) -> Optional[str]:
        """Determine the winner for a specific category."""
        # Score-based categories (higher is better)
        score_keys = [
            "gaming_score", "camera_score", "value_score", "trend_score"
        ]

        # Price: lower is better
        if key == "price":
            valid = [
                (p.get("name", ""), float(p.get(key, 0)))
                for p in products
                if p.get(key) is not None
            ]
            if valid:
                return min(valid, key=lambda x: x[1])[0]
            return None

        # Numeric scores: higher is better
        if key in score_keys:
            valid = [
                (p.get("name", ""), float(p.get(key, 0)))
                for p in products
                if p.get(key) is not None
            ]
            if valid:
                return max(valid, key=lambda x: x[1])[0]
            return None

        # Spec-based categories: can't determine a clear winner automatically
        return None

    async def _generate_recommendation(
        self,
        llm: LLMService,
        products: List[Dict],
        rows: List[ComparisonRow],
        language: str,
    ) -> tuple:
        """Generate a final recommendation based on comparison data."""
        comparison_text = "\n".join(
            f"- {row.category}: "
            + ", ".join(f"{k}: {v}" for k, v in row.values.items())
            + (f" (Winner: {row.winner})" if row.winner else "")
            for row in rows
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
                    "Based on the comparison data below, provide a clear "
                    "final recommendation. Explain which phone is better "
                    "for different use cases. Be specific and helpful.\n"
                    f"{lang_instruction}\n\n"
                    f"Comparison:\n{comparison_text}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Compare these phones and tell me which one to buy: "
                    f"{', '.join(p.get('name', '') for p in products)}"
                ),
            },
        ]

        try:
            result = await llm.complete(messages, temperature=0.7)
            return result["content"], result["tokens"]["total"]
        except Exception as e:
            logger.error(f"Comparison recommendation error: {e}")
            return "Please review the comparison table above.", 0

    @staticmethod
    def _not_found_message(
        product_names: List[str], language: str
    ) -> str:
        names = ", ".join(product_names)
        msgs = {
            "en": f"Sorry, I couldn't find all the products to compare: {names}. Please check the product names.",
            "uz": f"Kechirasiz, taqqoslash uchun barcha mahsulotlarni topa olmadim: {names}. Iltimos, mahsulot nomlarini tekshiring.",
            "ru": f"Извините, не удалось найти все продукты для сравнения: {names}. Проверьте названия.",
        }
        return msgs.get(language, msgs["en"])
