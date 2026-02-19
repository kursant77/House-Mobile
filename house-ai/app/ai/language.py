"""
House AI — Language Detection & Typo Correction
Auto-detect Uzbek/Russian/English with manual override support.
"""

import re
import logging
from typing import Optional, Tuple

from app.models.schemas import Language

logger = logging.getLogger("house_ai")


# ── Character Set Detection ──────────────────────────────────

# Uzbek-specific Latin characters and common words
UZBEK_MARKERS = [
    r"[oʻOʻ]",  # O'zbek o'
    r"[gʻGʻ]",  # O'zbek g'
    r"\b(salom|rahmat|telefon|narx|qancha|yaxshi|qaysi|menga|uchun|kerak|bor|yo'q)\b",
    r"\b(tavsiya|taqqosla|eng|kamera|o'yin|arzon|qimmat)\b",
    r"\b(tushunmadim|nima|qanday|qayerda|iltimos)\b",
]

# Cyrillic characters (Russian)
RUSSIAN_MARKERS = [
    r"[а-яА-ЯёЁ]",
    r"\b(привет|спасибо|телефон|цена|сколько|хороший|какой|мне|для|нужно)\b",
    r"\b(рекомендуй|сравни|лучший|камера|игра|дешевый|дорогой)\b",
    r"\b(не понимаю|что|как|где|пожалуйста)\b",
]

COMPILED_UZBEK = [re.compile(p, re.IGNORECASE | re.UNICODE) for p in UZBEK_MARKERS]
COMPILED_RUSSIAN = [re.compile(p, re.IGNORECASE | re.UNICODE) for p in RUSSIAN_MARKERS]


def detect_language(text: str) -> Tuple[Language, float]:
    """
    Detect language from text using character-set heuristics.
    Returns (language, confidence).
    """
    # Count pattern matches
    uzbek_score = sum(1 for p in COMPILED_UZBEK if p.search(text))
    russian_score = sum(1 for p in COMPILED_RUSSIAN if p.search(text))

    # Check for Cyrillic characters specifically
    cyrillic_count = len(re.findall(r"[а-яА-ЯёЁ]", text))
    total_alpha = len(re.findall(r"[a-zA-Zа-яА-ЯёЁ]", text)) or 1
    cyrillic_ratio = cyrillic_count / total_alpha

    if cyrillic_ratio > 0.3 or russian_score >= 2:
        confidence = min(0.6 + (russian_score * 0.1) + (cyrillic_ratio * 0.3), 0.95)
        return Language.RUSSIAN, confidence

    if uzbek_score >= 2:
        confidence = min(0.6 + (uzbek_score * 0.1), 0.95)
        return Language.UZBEK, confidence

    # Latin characters → could be Uzbek or English
    # Check for Uzbek-specific patterns more carefully
    if uzbek_score >= 1:
        return Language.UZBEK, 0.6

    # Default to English
    return Language.ENGLISH, 0.7


async def detect_language_llm(text: str, llm_service) -> Tuple[Language, float]:
    """LLM-based language detection for ambiguous cases."""
    messages = [
        {
            "role": "system",
            "content": (
                "Detect the language of the user's message. "
                "Respond with ONLY one of: uz, ru, en"
            ),
        },
        {"role": "user", "content": text},
    ]

    try:
        result = await llm_service.complete(
            messages, temperature=0.1, max_tokens=5
        )
        lang_str = result["content"].strip().lower()
        try:
            lang = Language(lang_str)
            return lang, 0.9
        except ValueError:
            return Language.ENGLISH, 0.5
    except Exception:
        return Language.ENGLISH, 0.5


# ── Language Instructions ────────────────────────────────────

LANGUAGE_INSTRUCTIONS = {
    Language.UZBEK: (
        "Foydalanuvchi O'zbek tilida yozmoqda. "
        "O'zbek tilida javob bering. Sodda va tushunarli tilda yozing."
    ),
    Language.RUSSIAN: (
        "Пользователь пишет на русском языке. "
        "Отвечайте на русском. Используйте понятный и простой язык."
    ),
    Language.ENGLISH: (
        "The user is writing in English. "
        "Respond in English. Use clear, conversational language."
    ),
}


def get_language_instruction(language: Language) -> str:
    """Get system prompt instruction for the detected language."""
    return LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS[Language.ENGLISH])


# ── Typo Correction ─────────────────────────────────────────

# Common typos across languages
COMMON_TYPOS = {
    # English
    "recomend": "recommend",
    "reccomend": "recommend",
    "comparee": "compare",
    "compair": "compare",
    "camra": "camera",
    "baterry": "battery",
    "disply": "display",
    "processer": "processor",
    "smartfon": "smartphone",
    # Uzbek
    "telefn": "telefon",
    "kmaera": "kamera",
    "baterya": "batareya",
    "ekarn": "ekran",
    "protsesser": "protsessor",
    # Russian
    "телефн": "телефон",
    "камра": "камера",
    "батаря": "батарея",
    "экарн": "экран",
    "процесер": "процессор",
}


def correct_typos(text: str) -> str:
    """Light automatic typo correction."""
    corrected = text
    for typo, correction in COMMON_TYPOS.items():
        pattern = re.compile(re.escape(typo), re.IGNORECASE)
        corrected = pattern.sub(correction, corrected)
    return corrected


async def process_language(
    text: str,
    override: Optional[Language] = None,
    llm_service=None,
) -> Tuple[str, Language]:
    """
    Full language processing pipeline:
    1. Correct typos
    2. Detect language (or use override)
    3. Return corrected text + detected language
    """
    corrected = correct_typos(text)

    if override:
        return corrected, override

    language, confidence = detect_language(corrected)

    # If confidence is low, try LLM
    if confidence < 0.6 and llm_service:
        language, confidence = await detect_language_llm(corrected, llm_service)

    logger.info(f"Language detected: {language.value}, confidence={confidence}")
    return corrected, language
