"""
House AI — Main API Router
REST + WebSocket streaming endpoints. Central chat orchestrator.
"""

import json
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from app.config import get_settings, Settings
from app.models.schemas import (
    ChatRequest, RecommendRequest, CompareRequest,
    SessionCreate, Intent, Language,
)
from app.models.response_models import (
    ChatResponse, StreamChunk, RecommendationResponse,
    ComparisonResponse, SessionResponse,
)
from app.dependencies import (
    get_llm, get_supabase, get_redis, get_search, get_currency,
    get_current_user,
)
from app.services.llm_service import LLMService
from app.services.supabase_service import SupabaseService
from app.services.redis_service import RedisService
from app.services.search_service import SearchService
from app.services.currency_service import CurrencyService
from app.ai.intent import classify_intent
from app.ai.emotion import detect_emotion, get_tone_instruction
from app.ai.language import process_language, get_language_instruction
from app.ai.memory import MemoryManager
from app.ai.cost_control import CostController
from app.ai.recommend import RecommendationEngine
from app.ai.compare import ComparisonEngine
from app.ai.rag import RAGPipeline
from app.middleware import detect_prompt_injection

logger = logging.getLogger("house_ai")

router = APIRouter(tags=["AI Chat"])


# ── System Prompt ────────────────────────────────────────────

BASE_SYSTEM_PROMPT = (
    "You are House Mobile's AI Assistant — a friendly, knowledgeable "
    "smartphone expert. You help users find the perfect phone, compare "
    "devices, and answer questions about smartphones.\n\n"
    "Guidelines:\n"
    "- Be helpful, conversational, and concise\n"
    "- Provide specific, accurate information\n"
    "- When recommending, explain why each device is a good fit\n"
    "- Format responses with markdown for readability\n"
    "- If you don't have enough info, say so honestly\n"
    "- Never hallucinate specifications or prices\n"
)


# ── Chat Endpoint (REST) ────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    llm: LLMService = Depends(get_llm),
    supabase: SupabaseService = Depends(get_supabase),
    redis: RedisService = Depends(get_redis),
    search: SearchService = Depends(get_search),
    currency: CurrencyService = Depends(get_currency),
    user: Optional[dict] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Main chat endpoint — processes user message and returns AI response."""

    # 0. Input validation: prompt injection check
    if detect_prompt_injection(request.message):
        return ChatResponse(
            message="I'm sorry, I can only help with smartphone-related questions. How can I assist you today?",
            session_id=request.session_id or str(uuid.uuid4()),
        )

    try:
        # 1. Session setup
        session_id = request.session_id or str(uuid.uuid4())
        user_id = request.user_id or (user["user_id"] if user else None)

        # 2. Cost control: budget check
        cost_ctrl = CostController(redis, settings)
        if user_id:
            allowed, remaining = await cost_ctrl.check_budget(user_id)
            if not allowed:
                lang = request.language.value if request.language else "en"
                return ChatResponse(
                    message=cost_ctrl.budget_exceeded_message(lang),
                    session_id=session_id,
                )

        # 3. Language processing
        corrected_text, language = await process_language(
            request.message,
            override=request.language,
            llm_service=llm,
        )

        # 4. Intent classification
        intent, intent_conf = await classify_intent(corrected_text, llm)

        # 5. Emotion detection
        emotion, emotion_conf = detect_emotion(corrected_text)

        # 6. Memory context
        memory = MemoryManager(redis, supabase, llm, settings)
        context = await memory.get_context(session_id)

        # 7. Build system prompt
        system_prompt = (
            BASE_SYSTEM_PROMPT
            + get_language_instruction(language) + "\n"
            + get_tone_instruction(emotion) + "\n"
        )

        # 8. Route by intent
        products = None
        comparison = None
        sources = None
        tokens_used = 0

        if intent == Intent.RECOMMENDATION:
            try:
                # Extract focus from query
                focus = _extract_focus(corrected_text)
                rec_engine = RecommendationEngine(settings)
                rec_result = await rec_engine.recommend(
                    supabase, llm, corrected_text,
                    focus=focus, language=language.value,
                )
                response_text = rec_result["message"]
                products = rec_result.get("products")
                tokens_used = rec_result.get("tokens_used", 0)
            except Exception as e:
                logger.warning(f"Recommendation failed: {e}")
                
                # Fallback: Try Web Search first
                model = settings.LLM_MODEL_FALLBACK
                web_context = ""
                sources = ["General Knowledge (Database Unavailable)"]
                try:
                    # Search using original query
                    web_results = await search.search(corrected_text)
                    if web_results:
                        formatted_context = search.build_context(web_results)
                        web_context = f"\n\nWeb Search Results (Use these to answer):\n{formatted_context}"
                        sources = search.format_sources(web_results)
                except Exception as ws_e:
                    logger.error(f"Fallback web search failed: {ws_e}")

                # Fallback LLM generation
                fallback_sys = system_prompt + "\n(Note: Product Database unavailable. Answer based on general knowledge and web results if provided.)" + web_context
                messages = memory.build_messages(fallback_sys, context, corrected_text)
                result = await llm.complete(messages, model=model)
                response_text = result["content"]
                products = []
                tokens_used = result["tokens"]["total"]

        elif intent == Intent.COMPARISON:
            # Extract product names
            product_names = _extract_product_names(corrected_text)
            if len(product_names) >= 2:
                comp_engine = ComparisonEngine()
                comp_result = await comp_engine.compare(
                    supabase, llm, product_names, language=language.value,
                )
                response_text = comp_result["message"]
                comparison = comp_result.get("comparison")
                tokens_used = comp_result.get("tokens_used", 0)
            else:
                # Not enough product names detected — use RAG
                try:
                    rag = RAGPipeline(settings)
                    rag_result = await rag.query(
                        corrected_text, llm, supabase, search, redis,
                        language=language.value, system_context=system_prompt,
                    )
                    response_text = rag_result["message"]
                    sources = rag_result.get("sources")
                    tokens_used = rag_result.get("tokens_used", 0)
                except Exception as e:
                    logger.warning(f"RAG failed: {e}")
                    
                    # Fallback: Try Web Search first
                    model = settings.LLM_MODEL_FALLBACK
                    web_context = ""
                    sources = ["General Knowledge (Database Unavailable)"]
                    try:
                        web_results = await search.search(corrected_text)
                        if web_results:
                            formatted_context = search.build_context(web_results)
                            web_context = f"\n\nWeb Search Results (Use these to answer):\n{formatted_context}"
                            sources = search.format_sources(web_results)
                    except Exception as ws_e:
                        logger.error(f"Fallback web search failed: {ws_e}")

                    # Fallback LLM generation
                    fallback_sys = system_prompt + "\n(Note: Database currently unavailable. Answer based on general knowledge and web results if provided.)" + web_context
                    messages = memory.build_messages(fallback_sys, context, corrected_text)
                    result = await llm.complete(messages, model=model)
                    response_text = result["content"]
                    tokens_used = result["tokens"]["total"]

        elif intent == Intent.BUDGET_CONVERSION:
            # Handle currency conversion
            response_text = await _handle_currency(corrected_text, currency, language.value)
            tokens_used = 0

        elif intent in (Intent.PRODUCT_DETAIL, Intent.BLOG_SEARCH, Intent.TREND_INQUIRY):
            # Use RAG pipeline
            try:
                rag = RAGPipeline(settings)
                rag_result = await rag.query(
                    corrected_text, llm, supabase, search, redis,
                    language=language.value, system_context=system_prompt,
                )
                response_text = rag_result["message"]
                sources = rag_result.get("sources")
                tokens_used = rag_result.get("tokens_used", 0)
            except Exception as e:
                logger.warning(f"RAG failed: {e}")
                
                # Fallback: Try Web Search first
                model = settings.LLM_MODEL_FALLBACK
                web_context = ""
                sources = ["General Knowledge (Database Unavailable)"]
                try:
                    web_results = await search.search(corrected_text)
                    if web_results:
                        formatted_context = search.build_context(web_results)
                        web_context = f"\n\nWeb Search Results (Use these to answer):\n{formatted_context}"
                        sources = search.format_sources(web_results)
                except Exception as ws_e:
                    logger.error(f"Fallback web search failed: {ws_e}")

                # Fallback LLM generation
                fallback_sys = system_prompt + "\n(Note: Database currently unavailable. Answer based on general knowledge and web results if provided.)" + web_context
                messages = memory.build_messages(fallback_sys, context, corrected_text)
                result = await llm.complete(messages, model=model)
                response_text = result["content"]
                tokens_used = result["tokens"]["total"]

        else:
            # General chat — use LLM with memory context
            model = cost_ctrl.select_model(intent, intent_conf)
            messages = memory.build_messages(system_prompt, context, corrected_text)
            result = await llm.complete(messages, model=model)
            response_text = result["content"]
            tokens_used = result["tokens"]["total"]

        # 9. Save exchange to memory
        await memory.save_exchange(session_id, request.message, response_text)

        # 10. Check if summarization needed
        await memory.check_and_summarize(session_id)

        # 11. Track token usage
        if user_id and tokens_used > 0:
            await cost_ctrl.track_usage(user_id, tokens_used, settings.LLM_MODEL_DEFAULT)

        return ChatResponse(
            message=response_text,
            session_id=session_id,
            intent=intent,
            emotion=emotion,
            language=language,
            products=products,
            comparison=comparison,
            sources=sources,
            tokens_used=tokens_used,
            model_used=settings.LLM_MODEL_DEFAULT,
        )

    except Exception as e:
        import traceback
        groq_key_len = len(settings.GROQ_API_KEY) if settings.GROQ_API_KEY else 0
        error_msg = f"Internal Error: {str(e)}\n(Groq Key Len: {groq_key_len})\n{traceback.format_exc()}"
        logger.error(error_msg)
        return ChatResponse(
            message=f"I encountered a server error. Details: {str(e)} \n(Groq Key Len: {groq_key_len})",
            session_id=request.session_id or "error",
        )


# ── WebSocket Streaming ─────────────────────────────────────

@router.websocket("/chat/stream")
async def chat_stream(
    websocket: WebSocket,
    llm: LLMService = Depends(get_llm),
    supabase: SupabaseService = Depends(get_supabase),
    redis: RedisService = Depends(get_redis),
    settings: Settings = Depends(get_settings),
):
    """WebSocket endpoint for streaming chat responses."""
    await websocket.accept()

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            request = json.loads(data)

            message = request.get("message", "")
            session_id = request.get("session_id", str(uuid.uuid4()))

            if not message:
                await websocket.send_json(
                    StreamChunk(type="error", content="Empty message").model_dump()
                )
                continue

            # Prompt injection check
            if detect_prompt_injection(message):
                await websocket.send_json(
                    StreamChunk(
                        type="text",
                        content="I'm sorry, I can only help with smartphone-related questions."
                    ).model_dump()
                )
                await websocket.send_json(
                    StreamChunk(type="done").model_dump()
                )
                continue

            # Process language and intent
            corrected_text, language = await process_language(message)
            emotion, _ = detect_emotion(corrected_text)

            # Build prompt
            system_prompt = (
                BASE_SYSTEM_PROMPT
                + get_language_instruction(language) + "\n"
                + get_tone_instruction(emotion) + "\n"
            )

            # Memory context
            memory = MemoryManager(redis, supabase, llm, settings)
            context = await memory.get_context(session_id)
            messages = memory.build_messages(system_prompt, context, corrected_text)

            # Stream response
            full_response = ""
            async for chunk in llm.stream(messages):
                full_response += chunk
                await websocket.send_json(
                    StreamChunk(type="text", content=chunk).model_dump()
                )

            # Save exchange
            await memory.save_exchange(session_id, message, full_response)

            # Send done
            await websocket.send_json(
                StreamChunk(
                    type="done",
                    data={"session_id": session_id}
                ).model_dump()
            )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json(
                StreamChunk(type="error", content=str(e)).model_dump()
            )
        except Exception:
            pass


# ── Recommendation Endpoint ─────────────────────────────────

@router.post("/recommend", response_model=RecommendationResponse)
async def recommend(
    request: RecommendRequest,
    llm: LLMService = Depends(get_llm),
    supabase: SupabaseService = Depends(get_supabase),
    redis: RedisService = Depends(get_redis),
    settings: Settings = Depends(get_settings),
):
    """Dedicated recommendation endpoint."""
    # Check cache
    cache_key = redis.product_cache_key(request.query)
    cached = await redis.get_cached(cache_key)
    if cached:
        return RecommendationResponse(**cached)

    engine = RecommendationEngine(settings)
    result = await engine.recommend(
        supabase, llm, request.query,
        focus=request.focus,
        budget_min=request.budget_min,
        budget_max=request.budget_max,
        language=request.language.value if request.language else "en",
    )

    session_id = request.session_id or str(uuid.uuid4())
    response = RecommendationResponse(
        message=result["message"],
        products=result.get("products", []),
        session_id=session_id,
        language=request.language or Language.ENGLISH,
        tokens_used=result.get("tokens_used", 0),
    )

    # Cache
    await redis.set_cached(cache_key, response.model_dump(), settings.CACHE_TTL_PRODUCTS)

    return response


# ── Comparison Endpoint ──────────────────────────────────────

@router.post("/compare", response_model=ComparisonResponse)
async def compare(
    request: CompareRequest,
    llm: LLMService = Depends(get_llm),
    supabase: SupabaseService = Depends(get_supabase),
    redis: RedisService = Depends(get_redis),
    settings: Settings = Depends(get_settings),
):
    """Dedicated comparison endpoint."""
    # Check cache
    cache_key = redis.comparison_cache_key(request.product_names)
    cached = await redis.get_cached(cache_key)
    if cached:
        return ComparisonResponse(**cached)

    engine = ComparisonEngine()
    result = await engine.compare(
        supabase, llm, request.product_names,
        language=request.language.value if request.language else "en",
    )

    session_id = request.session_id or str(uuid.uuid4())
    response = ComparisonResponse(
        message=result["message"],
        comparison=result.get("comparison"),
        session_id=session_id,
        language=request.language or Language.ENGLISH,
        tokens_used=result.get("tokens_used", 0),
    )

    # Cache
    await redis.set_cached(cache_key, response.model_dump(), settings.CACHE_TTL_COMPARISONS)

    return response


# ── Session Endpoint ─────────────────────────────────────────

@router.post("/session", response_model=SessionResponse)
async def create_session(
    request: SessionCreate,
    supabase: SupabaseService = Depends(get_supabase),
    user: Optional[dict] = Depends(get_current_user),
):
    """Create or resume a chat session."""
    user_id = request.user_id or (user["user_id"] if user else None)
    session = await supabase.create_session(
        user_id=user_id,
        anonymous_session_id=request.anonymous_session_id,
    )

    return SessionResponse(
        session_id=session.get("id", str(uuid.uuid4())),
    )


# ── Helper Functions ─────────────────────────────────────────

def _extract_focus(text: str) -> Optional[str]:
    """Extract user's focus from query text."""
    text_lower = text.lower()

    focus_keywords = {
        "gaming": ["gaming", "game", "o'yin", "игр", "pubg", "genshin"],
        "camera": ["camera", "photo", "kamera", "камер", "selfie", "rasm"],
        "budget": ["budget", "cheap", "arzon", "дешев", "affordable", "byudjet"],
        "trend": ["trend", "popular", "mashhur", "популярн", "trending"],
    }

    for focus, keywords in focus_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                return focus

    return None


def _extract_product_names(text: str) -> list:
    """Extract product names from comparison query."""
    import re

    # Common patterns: "X vs Y", "X yoki Y", "X или Y", "X and Y"
    separators = r"\s+(?:vs\.?|versus|yoki|или|and|va|bilan|с|compared?\s+to)\s+"
    parts = re.split(separators, text, flags=re.IGNORECASE)

    # Clean up and filter
    names = []
    for part in parts:
        # Remove common filler words
        cleaned = re.sub(
            r"\b(compare|taqqosla|сравни|which|qaysi|какой|is|better|yaxshi|лучше)\b",
            "", part, flags=re.IGNORECASE
        ).strip()
        if cleaned and len(cleaned) > 2:
            names.append(cleaned)

    return names


async def _handle_currency(
    text: str, currency: CurrencyService, language: str
) -> str:
    """Handle currency conversion queries."""
    import re

    # Try to extract amount and currencies
    amount_match = re.search(r"(\d[\d\s,]*\.?\d*)", text)
    if not amount_match:
        msgs = {
            "en": "Please specify an amount to convert. For example: '100 USD to UZS'",
            "uz": "Iltimos, konvertatsiya qilish uchun miqdorni ko'rsating. Masalan: '100 USD to UZS'",
            "ru": "Укажите сумму для конвертации. Например: '100 USD в UZS'",
        }
        return msgs.get(language, msgs["en"])

    amount = float(amount_match.group(1).replace(",", "").replace(" ", ""))

    # Detect currencies
    text_upper = text.upper()
    from_cur = "USD"
    to_cur = "UZS"

    if "UZS" in text_upper and ("USD" in text_upper or "DOLLAR" in text_upper.upper()):
        if text_upper.index("UZS") < text_upper.index("USD") if "USD" in text_upper else 999:
            from_cur, to_cur = "UZS", "USD"
    elif "EUR" in text_upper:
        if "UZS" in text_upper:
            from_cur, to_cur = "EUR", "UZS"
        else:
            from_cur, to_cur = "USD", "EUR"
    elif "SO'M" in text_upper or "СУМ" in text_upper:
        from_cur, to_cur = "UZS", "USD"

    converted = await currency.convert(amount, from_cur, to_cur)
    from_formatted = await currency.format_price(amount, from_cur)
    to_formatted = await currency.format_price(converted, to_cur)

    return f"💱 {from_formatted} = **{to_formatted}**"
