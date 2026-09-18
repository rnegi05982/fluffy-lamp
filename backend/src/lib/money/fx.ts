import { Types } from 'mongoose';
import { ApiError } from '../ApiError';
import { toCents, fromCents, type DecimalInput } from './decimal';

/**
 * Currency conversion against a rate table where `rateTable[c]` = value of 1 unit of `c`
 * in the base currency. Conversions round once to 2 decimals. The rate table is passed in
 * so this stays independent of where the rates are defined.
 */
export type RateTable = Record<string, number>;

export function getRate(currency: string, rateTable: RateTable): number {
  const rate = rateTable[currency];
  if (rate === undefined) {
    throw new ApiError(500, 'UNKNOWN_CURRENCY', `No FX rate configured for ${currency}`);
  }
  return rate;
}

export function convertToBase(
  amount: DecimalInput,
  from: string,
  rateTable: RateTable,
): Types.Decimal128 {
  return fromCents(Math.round(toCents(amount) * getRate(from, rateTable)));
}

export function convertFromBase(
  baseAmount: DecimalInput,
  to: string,
  rateTable: RateTable,
): Types.Decimal128 {
  return fromCents(Math.round(toCents(baseAmount) / getRate(to, rateTable)));
}

export function convert(
  amount: DecimalInput,
  from: string,
  to: string,
  rateTable: RateTable,
): Types.Decimal128 {
  if (from === to) return fromCents(toCents(amount));
  const baseCents = toCents(amount) * getRate(from, rateTable);
  return fromCents(Math.round(baseCents / getRate(to, rateTable)));
}
