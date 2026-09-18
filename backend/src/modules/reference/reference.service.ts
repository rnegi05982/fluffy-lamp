import { CURRENCIES, TIMEZONES } from './reference.data';

/** The bounded dropdown data the frontend caches. FX stays server-side. */
export function getReference(): { currencies: typeof CURRENCIES; timezones: string[] } {
  return { currencies: CURRENCIES, timezones: TIMEZONES };
}
