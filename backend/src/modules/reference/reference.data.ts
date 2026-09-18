/**
 * Fixed reference data for L1: the currencies, timezones, and FX rates the whole app
 * is constrained to. Kept as in-code constants (no DB collection) so dropdowns and the
 * cashback engine share one bounded, always-available set — a missing FX rate cannot occur.
 */

export interface CurrencyRef {
  code: string;
  name: string;
}

/** Base currency all stored balances/aggregates are denominated in. */
export const BASE_CURRENCY = 'USD';

export const CURRENCIES: CurrencyRef[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'CNY', name: 'Chinese Yuan' },
];

export const TIMEZONES: string[] = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
];

/**
 * FX_RATES[c] = value of 1 unit of currency `c` in the base currency (USD).
 * Convert to base: `base = amount * FX_RATES[from]`.
 * Convert from base: `amount = base / FX_RATES[to]`.
 */
export const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
  JPY: 0.0067,
  CAD: 0.73,
  AUD: 0.66,
  SGD: 0.74,
  AED: 0.27,
  CNY: 0.14,
};

/** Convenience sets for validation. */
export const CURRENCY_CODES: string[] = CURRENCIES.map((c) => c.code);
