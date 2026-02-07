import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in Uzbek locale
 */
export function formatPrice(price: number, currency: string = "so'm"): string {
  return new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ` ${currency}`;
}

export const formatCurrency = formatPrice;

/**
 * Format price without currency
 */
export function formatPriceNumber(price: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format currency symbol based on currency code
 */
export function formatCurrencySymbol(currency: string = "UZS"): string {
  if (currency === "USD") {
    return "$";
  }
  return "so'm";
}
