import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────
export interface CBURate {
    Ccy: string;       // Currency code: USD, EUR, RUB...
    CcyNm_UZ: string;  // Name in Uzbek
    CcyNm_EN: string;  // Name in English
    Rate: string;      // Rate to UZS (1 unit = Rate UZS)
    Nominal: string;   // Nominal (usually 1, sometimes 10)
    Diff: string;      // Daily change
    Date: string;      // Date string
}

export interface CurrencyState {
    // User preference
    selectedCurrency: string;   // e.g. "UZS", "USD", "EUR", "RUB"

    // Rates cache
    rates: Record<string, number>; // { USD: 12132.48, EUR: 14360, ... } — value in UZS per 1 unit
    ratesLastFetched: number | null;  // timestamp (ms)
    isFetchingRates: boolean;

    // Actions
    setSelectedCurrency: (currency: string) => void;
    fetchRates: () => Promise<void>;
    convertPrice: (price: number, fromCurrency: string) => number;
    getDisplayCurrency: () => string;
    getRate: (currency: string) => number;
}

const CBU_URL = "https://cbu.uz/uz/arkhiv-kursov-valyut/json/";
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Popular currencies to show in UI
export const POPULAR_CURRENCIES = [
    { code: "UZS", name: "O'zbek so'mi", symbol: "so'm", flag: "🇺🇿" },
    { code: "USD", name: "AQSH dollari", symbol: "$", flag: "🇺🇸" },
    { code: "EUR", name: "Evro", symbol: "€", flag: "🇪🇺" },
    { code: "RUB", name: "Rossiya rubli", symbol: "₽", flag: "🇷🇺" },
    { code: "KZT", name: "Qozog'iston tengesi", symbol: "₸", flag: "🇰🇿" },
    { code: "GBP", name: "Britaniya funt sterlingi", symbol: "£", flag: "🇬🇧" },
    { code: "CNY", name: "Xitoy yuani", symbol: "¥", flag: "🇨🇳" },
    { code: "TRY", name: "Turk lirasi", symbol: "₺", flag: "🇹🇷" },
    { code: "AED", name: "BAA dirhami", symbol: "د.إ", flag: "🇦🇪" },
    { code: "KGS", name: "Qirg'iz somi", symbol: "с", flag: "🇰🇬" },
] as const;

export const getCurrencySymbol = (code: string): string => {
    const found = POPULAR_CURRENCIES.find(c => c.code === code);
    return found?.symbol ?? code;
};

export const getCurrencyFlag = (code: string): string => {
    const found = POPULAR_CURRENCIES.find(c => c.code === code);
    return found?.flag ?? "💱";
};

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set, get) => ({
            selectedCurrency: "UZS",
            rates: {},
            ratesLastFetched: null,
            isFetchingRates: false,

            setSelectedCurrency: (currency) => {
                set({ selectedCurrency: currency });
                // Auto-fetch if rates not loaded yet
                const { rates, ratesLastFetched } = get();
                const needsFetch = Object.keys(rates).length === 0 ||
                    !ratesLastFetched ||
                    Date.now() - ratesLastFetched > REFRESH_INTERVAL_MS;
                if (needsFetch) get().fetchRates();
            },

            fetchRates: async () => {
                const { isFetchingRates, ratesLastFetched } = get();
                // Skip if already fetching or fetched recently
                if (isFetchingRates) return;
                if (ratesLastFetched && Date.now() - ratesLastFetched < REFRESH_INTERVAL_MS) return;

                set({ isFetchingRates: true });
                try {
                    const res = await fetch(CBU_URL, { cache: "no-cache" });
                    if (!res.ok) throw new Error(`CBU API error: ${res.status}`);
                    const data: CBURate[] = await res.json();

                    const newRates: Record<string, number> = { UZS: 1 }; // 1 UZS = 1 UZS
                    data.forEach(item => {
                        const rate = parseFloat(item.Rate);
                        const nominal = parseInt(item.Nominal) || 1;
                        if (!isNaN(rate) && item.Ccy) {
                            // Rate is per `nominal` units, normalize to 1 unit
                            newRates[item.Ccy] = rate / nominal;
                        }
                    });

                    set({
                        rates: newRates,
                        ratesLastFetched: Date.now(),
                        isFetchingRates: false,
                    });
                } catch (err) {
                    console.error("[CurrencyStore] Failed to fetch CBU rates:", err);
                    set({ isFetchingRates: false });
                }
            },

            // Get rate: how many UZS = 1 unit of `currency`
            getRate: (currency: string): number => {
                if (currency === "UZS") return 1;
                const { rates } = get();
                return rates[currency] ?? 1;
            },

            // Convert price: from `fromCurrency` → selectedCurrency
            convertPrice: (price: number, fromCurrency: string): number => {
                const { selectedCurrency, getRate } = get();
                if (fromCurrency === selectedCurrency) return price;

                // Step 1: Convert source → UZS
                const priceInUZS = fromCurrency === "UZS"
                    ? price
                    : price * getRate(fromCurrency);

                // Step 2: Convert UZS → target
                if (selectedCurrency === "UZS") return priceInUZS;
                const targetRate = getRate(selectedCurrency);
                if (!targetRate) return priceInUZS;
                return priceInUZS / targetRate;
            },

            getDisplayCurrency: () => get().selectedCurrency,
        }),
        {
            name: "house-currency-store",
            // Only persist user preference, not live rates
            partialize: (state) => ({
                selectedCurrency: state.selectedCurrency,
            }),
        }
    )
);
