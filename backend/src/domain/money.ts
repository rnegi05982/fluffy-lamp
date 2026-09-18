/**
 * Money is stored as Decimal128 and serialized to the client as a string to preserve
 * precision (never a float). An amount is always paired with a currency.
 */
export interface Money {
  amount: string;
  currency: string;
}
