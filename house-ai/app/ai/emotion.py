"""
House AI — Emotion Detection
Lightweight emotion detection with dynamic tone adjustment.
"""

import re
import logging
from typing import Tuple, Dict

from app.models.schemas import Emotion

logger = logging.getLogger("house_ai")


# ── Emotion Keywords (multi-language) ────────────────────────

EMOTION_KEYWORDS: Dict[Emotion, list] = {
    Emotion.HAPPY: [
        r"thank", r"thanks", r"great", r"awesome", r"love", r"perfect",
        r"rahmat", r"zo'r", r"ajoyib", r"yaxshi", r"barakalla",
        r"спасибо", r"отлично", r"здорово", r"класс", r"супер",
        r"😊", r"😄", r"🎉", r"❤️", r"👍",
    ],
    Emotion.CONFUSED: [
        r"confused", r"don'?t\s+understand", r"what\s+do\s+you\s+mean",
        r"unclear", r"help\s+me\s+understand",
        r"tushunmadim", r"nima\s+demoqchisiz", r"qanday",
        r"не понимаю", r"не понял", r"что значит", r"как это",
        r"🤔", r"\?\?+",
    ],
    Emotion.FRUSTRATED: [
        r"frustrat", r"annoying", r"doesn'?t\s+work", r"broken",
        r"terrible", r"useless",
        r"ishlamayapti", r"buzilgan", r"yomon",
        r"не работает", r"ужас", r"бесполезн",
        r"😤", r"😡",
    ],
    Emotion.ANGRY: [
        r"angry", r"furious", r"worst", r"hate", r"stupid",
        r"horrible", r"disgusting",
        r"g'azab", r"nafrat", r"eng yomon",
        r"злой", r"ненавижу", r"худший", r"отврат",
        r"🤬", r"💢",
    ],
    Emotion.EXCITED: [
        r"excited", r"amazing", r"incredible", r"wow", r"can'?t\s+wait",
        r"fantastic",
        r"hayajon", r"ajab", r"zo'r-ku",
        r"ура", r"круто", r"невероятно", r"вау",
        r"🤩", r"🔥", r"💥", r"⚡",
    ],
}

COMPILED_EMOTION_KEYWORDS = {
    emotion: [re.compile(p, re.IGNORECASE) for p in keywords]
    for emotion, keywords in EMOTION_KEYWORDS.items()
}


# ── Tone Adjustments ─────────────────────────────────────────

TONE_ADJUSTMENTS = {
    Emotion.HAPPY: (
        "The user seems happy and satisfied. Maintain a warm, friendly, "
        "and enthusiastic tone. Use positive language."
    ),
    Emotion.CONFUSED: (
        "The user seems confused. Be extra clear, use simple language, "
        "break down complex information into steps. Ask if they need "
        "further clarification."
    ),
    Emotion.FRUSTRATED: (
        "The user seems frustrated. Be empathetic, patient, and "
        "solution-oriented. Acknowledge their frustration and provide "
        "clear, direct answers."
    ),
    Emotion.ANGRY: (
        "The user seems upset. Be very calm, professional, and "
        "empathetic. Apologize for any inconvenience and focus on "
        "resolving their issue quickly."
    ),
    Emotion.EXCITED: (
        "The user is excited! Match their energy with enthusiastic "
        "responses. Share in their excitement about the products."
    ),
    Emotion.NEUTRAL: (
        "The user has a neutral tone. Respond professionally and "
        "informatively."
    ),
}


def detect_emotion(text: str) -> Tuple[Emotion, float]:
    """
    Detect emotion from text using keyword matching.
    Returns (emotion, confidence).
    """
    scores = {}

    for emotion, patterns in COMPILED_EMOTION_KEYWORDS.items():
        match_count = sum(1 for p in patterns if p.search(text))
        if match_count > 0:
            confidence = min(0.5 + (match_count * 0.15), 0.95)
            scores[emotion] = confidence

    if not scores:
        return Emotion.NEUTRAL, 0.8

    best_emotion = max(scores, key=scores.get)
    return best_emotion, scores[best_emotion]


def get_tone_instruction(emotion: Emotion) -> str:
    """Get system prompt tone adjustment for detected emotion."""
    return TONE_ADJUSTMENTS.get(emotion, TONE_ADJUSTMENTS[Emotion.NEUTRAL])


async def detect_emotion_llm(text: str, llm_service) -> Tuple[Emotion, float]:
    """LLM-based emotion detection for ambiguous cases."""
    messages = [
        {
            "role": "system",
            "content": (
                "Detect the emotion in the user's message. "
                "Respond with ONLY one word: happy, confused, frustrated, "
                "angry, excited, or neutral."
            ),
        },
        {"role": "user", "content": text},
    ]

    try:
        result = await llm_service.complete(
            messages, temperature=0.1, max_tokens=10
        )
        emotion_str = result["content"].strip().lower()
        try:
            emotion = Emotion(emotion_str)
            return emotion, 0.8
        except ValueError:
            return Emotion.NEUTRAL, 0.5
    except Exception as e:
        logger.error(f"LLM emotion detection error: {e}")
        return Emotion.NEUTRAL, 0.5
