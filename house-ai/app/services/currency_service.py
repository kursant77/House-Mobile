"""
House AI — Currency Service
Currency conversion with Redis caching.
"""

import logging
from typing import Optional, Dict

import httpx

from app.config import Settings

logger = logging.getLogger("house_ai")


# Default fallback rates (approximate)
DEFAULT_RATES = {
    "USD_UZS": 12500,
    "EUR_UZS": 13500,
    "USD_EUR": 0.92,
    "EUR_USD": 1.09,
    "UZS_USD": 0.00008,
    "UZS_EUR": 0.000074,
}


class CurrencyService:
    """Currency conversion service with caching."""

    API_URL = "https://api.exchangerate-api.com/v4/latest"

    def __init__(self, settings: Settings):
        self.cache_ttl = settings.CACHE_TTL_CURRENCY
        self._rates_cache: Dict[str, float] = {}

    async def get_rate(self, from_currency: str, to_currency: str) -> float:
        """Get exchange rate between two currencies."""
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()

        if from_currency == to_currency:
            return 1.0

        cache_key = f"{from_currency}_{to_currency}"

        # Check in-memory cache
        if cache_key in self._rates_cache:
            return self._rates_cache[cache_key]

        # Try to fetch from API
        try:
            rate = await self._fetch_rate(from_currency, to_currency)
            if rate:
                self._rates_cache[cache_key] = rate
                return rate
        except Exception as e:
            logger.warning(f"Currency API error: {e}")

        # Fallback to defaults
        if cache_key in DEFAULT_RATES:
            return DEFAULT_RATES[cache_key]

        logger.warning(f"No rate found for {cache_key}, returning 1.0")
        return 1.0

    async def _fetch_rate(
        self, from_currency: str, to_currency: str
    ) -> Optional[float]:
        """Fetch rate from external API."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.API_URL}/{from_currency}")
                response.raise_for_status()
                data = response.json()

            rates = data.get("rates", {})
            rate = rates.get(to_currency)

            if rate:
                logger.info(f"Currency rate: {from_currency}/{to_currency} = {rate}")
                return float(rate)
            return None

        except Exception as e:
            logger.error(f"Currency fetch error: {e}")
            return None

    async def convert(
        self, amount: float, from_currency: str, to_currency: str
    ) -> float:
        """Convert an amount between currencies."""
        rate = await self.get_rate(from_currency, to_currency)
        return round(amount * rate, 2)

    async def format_price(
        self, price: float, currency: str = "UZS"
    ) -> str:
        """Format a price with currency symbol."""
        currency = currency.upper()
        if currency == "UZS":
            return f"{price:,.0f} UZS"
        elif currency == "USD":
            return f"${price:,.2f}"
        elif currency == "EUR":
            return f"€{price:,.2f}"
        return f"{price:,.2f} {currency}"
