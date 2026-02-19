import { useEffect } from "react";
import { useCurrencyStore, getCurrencySymbol } from "@/store/currencyStore";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Main hook — use this in components that display prices.
 * Auto-fetches rates on mount, refreshes every 30 minutes.
 */
export function useCurrency() {
    const {
        selectedCurrency,
        rates,
        ratesLastFetched,
        isFetchingRates,
        convertPrice,
        fetchRates,
    } = useCurrencyStore();

    // Auto-fetch + periodic refresh
    useEffect(() => {
        const shouldFetch =
            Object.keys(rates).length === 0 ||
            !ratesLastFetched ||
            Date.now() - ratesLastFetched > REFRESH_INTERVAL_MS;

        if (shouldFetch) fetchRates();

        const timer = setInterval(() => {
            fetchRates();
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Format price for display.
     * @param price    original price number
     * @param fromCur  currency the price was entered in (default UZS)
     */
    const formatPrice = (price: number, fromCur = "UZS"): string => {
        const converted = convertPrice(price, fromCur);
        const sym = getCurrencySymbol(selectedCurrency);

        // Decide decimal places
        const decimals = selectedCurrency === "UZS" ? 0
            : selectedCurrency === "KZT" ? 0
                : selectedCurrency === "KGS" ? 0
                    : 2;

        const formatted = new Intl.NumberFormat("uz-UZ", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(converted);

        // Symbol position
        const symBefore = ["$", "£", "€", "¥"].includes(sym);
        return symBefore ? `${sym}${formatted}` : `${formatted} ${sym}`;
    };

    /**
     * Raw converted number (without formatting).
     */
    const convertRaw = (price: number, fromCur = "UZS"): number => {
        return convertPrice(price, fromCur);
    };

    return {
        selectedCurrency,
        isFetchingRates,
        ratesLoaded: Object.keys(rates).length > 0,
        formatPrice,
        convertRaw,
        symbol: getCurrencySymbol(selectedCurrency),
    };
}
