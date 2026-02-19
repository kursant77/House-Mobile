"""
House AI — Intent Classification
Rule-based fast detection with GPT-4o-mini fallback.
"""

import re
import logging
from typing import Tuple

from app.models.schemas import Intent

logger = logging.getLogger("house_ai")


# ── Keyword Patterns ─────────────────────────────────────────

INTENT_PATTERNS = {
    Intent.RECOMMENDATION: [
        r"recommend",
        r"suggest",
        r"tavsiya",
        r"qaysi.*yaxshi",
        r"eng yaxshi",
        r"best\s+(phone|smartphone|device)",
        r"top\s+\d+",
        r"what\s+should\s+i\s+(buy|get)",
        r"рекоменд",
        r"посоветуй",
        r"какой.*лучш",
        r"самый лучший",
        r"nima olsam",
        r"qanday telefon",
    ],
    Intent.COMPARISON: [
        r"compare",
        r"vs\.?",
        r"versus",
        r"difference\s+between",
        r"taqqosla",
        r"farqi\s+nima",
        r"qaysi\s+biri",
        r"сравни",
        r"разница",
        r"что лучше",
        r"или",
        r"yoki",
    ],
    Intent.PRODUCT_DETAIL: [
        r"specifications?",
        r"specs?\b",
        r"details?\s+about",
        r"tell\s+me\s+about",
        r"xarakter",
        r"texnik",
        r"ma'lumot",
        r"haqida",
        r"характеристик",
        r"подробн",
        r"расскаж",
        r"price\s+of",
        r"narxi",
        r"цена",
        r"how\s+much",
        r"qancha",
        r"сколько\s+стоит",
    ],
    Intent.BLOG_SEARCH: [
        r"blog",
        r"article",
        r"maqola",
        r"news",
        r"yangilik",
        r"review",
        r"обзор",
        r"статья",
        r"новост",
    ],
    Intent.TREND_INQUIRY: [
        r"trend",
        r"popular",
        r"mashhur",
        r"ommabop",
        r"trending",
        r"what'?s\s+hot",
        r"тренд",
        r"популярн",
        r"хит",
    ],
    Intent.BUDGET_CONVERSION: [
        r"convert",
        r"currency",
        r"dollar",
        r"valyuta",
        r"so'm",
        r"sum\b",
        r"usd",
        r"eur",
        r"uzs",
        r"конверт",
        r"валют",
        r"доллар",
        r"necha dollar",
        r"necha so'm",
    ],
    Intent.PLATFORM_HELP: [
        # English
        r"how\s+do\s+i",
        r"where\s+(is|are|can\s+i\s+find)",
        r"how\s+to\s+(change|switch|find|access|open|apply|become|register)",
        r"how\s+can\s+i",
        r"language\s+(change|switch|setting)",
        r"apply\s+(for\s+)?(blogger|seller)",
        r"become\s+a?\s+(seller|blogger)",
        r"my\s+orders",
        r"order\s+history",
        r"where\s+is\s+(cart|basket|favorites|profile|menu)",
        r"edit\s+profile",
        # Uzbek
        r"qanday\s+qilsam",
        r"qayerda",
        r"qanday\s+o[''`]zgartirish",
        r"til\s+(o[''`]zgartirish|sozlash)",
        r"blogerlikga\s+ariza",
        r"sotuvchiga\s+ariza",
        r"mening\s+buyurtmalarim",
        r"profil\s+tahrirlash",
        r"savatcha",
        r"sevimlilar",
        r"sozlamalar",
        r"qanday\s+ulash",
        r"qanday\s+ro[''`]yxatdan",
        r"ilovada\s+qayerdan",
        r"qayerdan\s+topaman",
        # Russian
        r"как\s+(изменить|переключить|найти|зайти|подать)",
        r"где\s+(находится|найти)",
        r"смена\s+языка",
        r"настройки",
        r"стать\s+(продавцом|блогером)",
        r"подать\s+заявку",
        r"мои\s+заказы",
        r"редактировать\s+профиль",
        r"корзина",
        r"избранное",
    ],
}

# Compile patterns
COMPILED_INTENT_PATTERNS = {
    intent: [re.compile(p, re.IGNORECASE) for p in patterns]
    for intent, patterns in INTENT_PATTERNS.items()
}


def classify_intent_rule_based(text: str) -> Tuple[Intent, float]:
    """
    Rule-based intent classification.
    Returns (intent, confidence) where confidence is 0.0-1.0.
    """
    scores = {}

    for intent, patterns in COMPILED_INTENT_PATTERNS.items():
        match_count = sum(1 for p in patterns if p.search(text))
        if match_count > 0:
            # Confidence scales with number of matching patterns
            confidence = min(0.5 + (match_count * 0.15), 0.95)
            scores[intent] = confidence

    if not scores:
        return Intent.GENERAL_CHAT, 0.9

    # Return highest scoring intent
    best_intent = max(scores, key=scores.get)
    return best_intent, scores[best_intent]


async def classify_intent_llm(text: str, llm_service) -> Tuple[Intent, float]:
    """
    LLM-based intent classification fallback.
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are an intent classifier for a smartphone e-commerce platform. "
                "Classify the user message into exactly one category. "
                "Respond with ONLY the category name, nothing else.\n\n"
                "Categories:\n"
                "- recommendation (user wants phone suggestions)\n"
                "- comparison (user wants to compare phones)\n"
                "- product_detail (user asks about a specific phone)\n"
                "- blog_search (user asks about articles/reviews)\n"
                "- trend_inquiry (user asks about trending phones)\n"
                "- budget_conversion (user asks about currency/price conversion)\n"
                "- platform_help (user asks how to use the app, navigation, how to apply for blogger/seller, change language, find orders, settings, etc.)\n"
                "- general_chat (everything else)"
            ),
        },
        {"role": "user", "content": text},
    ]

    try:
        result = await llm_service.complete(
            messages, temperature=0.1, max_tokens=20
        )
        intent_str = result["content"].strip().lower().replace(" ", "_")

        try:
            intent = Intent(intent_str)
            return intent, 0.85
        except ValueError:
            return Intent.GENERAL_CHAT, 0.6

    except Exception as e:
        logger.error(f"LLM intent classification error: {e}")
        return Intent.GENERAL_CHAT, 0.5


async def classify_intent(text: str, llm_service=None) -> Tuple[Intent, float]:
    """
    Hybrid intent classification:
    1. Try rule-based first
    2. Fall back to LLM if confidence is low
    """
    intent, confidence = classify_intent_rule_based(text)

    # If rule-based confidence is high enough, use it
    if confidence >= 0.65:
        logger.info(f"Intent (rule-based): {intent.value}, confidence={confidence}")
        return intent, confidence

    # Fall back to LLM
    if llm_service:
        intent, confidence = await classify_intent_llm(text, llm_service)
        logger.info(f"Intent (LLM): {intent.value}, confidence={confidence}")
        return intent, confidence

    return intent, confidence
