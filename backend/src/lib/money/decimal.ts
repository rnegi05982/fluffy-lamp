import { Types } from 'mongoose';

/**
 * Money helpers. Amounts are stored as Decimal128 and never held as floats. Arithmetic is
 * done in integer minor units (cents, 2 decimals) to avoid float drift, then rebuilt as
 * Decimal128.
 */
export type DecimalInput = string | number | Types.Decimal128;

/** Parse a money value to integer minor units (2 decimals). */
export function toCents(value: DecimalInput): number {
  const str = value instanceof Types.Decimal128 ? value.toString() : String(value);
  return Math.round(Number(str) * 100);
}

/** Build a 2-decimal Decimal128 from integer minor units. */
export function fromCents(cents: number): Types.Decimal128 {
  return Types.Decimal128.fromString((cents / 100).toFixed(2));
}

export function toDecimal128(value: DecimalInput): Types.Decimal128 {
  return value instanceof Types.Decimal128 ? value : fromCents(toCents(value));
}

export function add(a: DecimalInput, b: DecimalInput): Types.Decimal128 {
  return fromCents(toCents(a) + toCents(b));
}

export function subtract(a: DecimalInput, b: DecimalInput): Types.Decimal128 {
  return fromCents(toCents(a) - toCents(b));
}

export function negate(a: DecimalInput): Types.Decimal128 {
  return fromCents(-toCents(a));
}

export function compare(a: DecimalInput, b: DecimalInput): -1 | 0 | 1 {
  const diff = toCents(a) - toCents(b);
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

/** Canonical 2-decimal string for serialization. */
export function toStringValue(value: DecimalInput): string {
  return fromCents(toCents(value)).toString();
}
