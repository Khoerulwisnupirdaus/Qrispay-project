/**
 * USD ↔ IDR Currency Converter
 *
 * Handles conversion between USD (stablecoin) and IDR amounts.
 * Uses a configurable exchange rate with fallback to env variable.
 * All rates are scaled by 100 for precision (e.g., 15800.50 IDR/USD = 1580050).
 */

/** Default fallback exchange rate: 15,800 IDR per 1 USD (scaled by 100) */
const FALLBACK_RATE = parseInt(process.env.FALLBACK_EXCHANGE_RATE || "1580000");

/** USDC has 6 decimal places */
const USDC_DECIMALS = 6;

/**
 * Converts a USD amount (in USDC smallest unit) to IDR.
 *
 * @param usdcAmount - Amount in USDC smallest unit (e.g., 1000000 = 1 USDC)
 * @param exchangeRate - USD/IDR rate scaled by 100 (e.g., 1580000 = 15800.00)
 * @returns IDR amount as integer (rounded)
 */
export function usdcToIdr(usdcAmount: number, exchangeRate?: number): number {
  const rate = exchangeRate || FALLBACK_RATE;
  // usdcAmount / 10^6 gives USD value
  // Multiply by rate/100 to get IDR
  return Math.round((usdcAmount / Math.pow(10, USDC_DECIMALS)) * (rate / 100));
}

/**
 * Converts an IDR amount to USDC smallest unit.
 *
 * @param idrAmount - Amount in IDR (integer)
 * @param exchangeRate - USD/IDR rate scaled by 100
 * @returns USDC amount in smallest unit (6 decimals)
 */
export function idrToUsdc(idrAmount: number, exchangeRate?: number): number {
  const rate = exchangeRate || FALLBACK_RATE;
  // IDR / (rate/100) = USD, then multiply by 10^6 for USDC unit
  return Math.round((idrAmount / (rate / 100)) * Math.pow(10, USDC_DECIMALS));
}

/**
 * Format USDC amount for display (e.g., 1500000 → "1.50")
 *
 * @param usdcAmount - Amount in USDC smallest unit
 * @returns Formatted string with 2 decimal places
 */
export function formatUsdc(usdcAmount: number): string {
  return (usdcAmount / Math.pow(10, USDC_DECIMALS)).toFixed(2);
}

/**
 * Format IDR amount for display (e.g., 15800 → "Rp 15.800")
 *
 * @param idrAmount - Amount in IDR
 * @returns Formatted IDR string with thousand separators
 */
export function formatIdr(idrAmount: number): string {
  return `Rp ${idrAmount.toLocaleString("id-ID")}`;
}

/**
 * Get the current exchange rate.
 * In production, this would fetch from an API.
 * For MVP, returns the fallback rate.
 *
 * @returns Exchange rate (USD to IDR, scaled by 100)
 */
export async function getCurrentExchangeRate(): Promise<number> {
  // TODO: In production, fetch from a reliable FX API
  // e.g., exchangerate-api.com, or use Xendit's built-in rates
  return FALLBACK_RATE;
}
