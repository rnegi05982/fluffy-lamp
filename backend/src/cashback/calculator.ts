import { Types } from 'mongoose';
import type { ITier } from '../models';
import { ValueType } from '../domain/enums';
import { toDecimal128, fromCents, toCents } from '../lib/money/decimal';
import { convertToBase, getRate, type RateTable } from '../lib/money/fx';

export interface Payout {
  originalAmount: Types.Decimal128;
  originalCurrency: string;
  fxRate: number;
  baseAmount: Types.Decimal128;
}

/**
 * Turn a selected tier into a frozen payout.
 * - PERCENTAGE: a percent of the order amount, earned in the order currency.
 * - FIXED: a flat amount in the campaign currency.
 * Both are then converted to the base currency (rounded once).
 */
export function computePayout(
  tier: ITier,
  orderAmount: string,
  orderCurrency: string,
  campaignCurrency: string,
  rateTable: RateTable,
): Payout {
  if (tier.valueType === ValueType.PERCENTAGE) {
    const pct = Number(tier.value);
    const originalAmount = fromCents(Math.round((toCents(orderAmount) * pct) / 100));
    return {
      originalAmount,
      originalCurrency: orderCurrency,
      fxRate: getRate(orderCurrency, rateTable),
      baseAmount: convertToBase(originalAmount, orderCurrency, rateTable),
    };
  }

  const originalAmount = toDecimal128(tier.value);
  return {
    originalAmount,
    originalCurrency: campaignCurrency,
    fxRate: getRate(campaignCurrency, rateTable),
    baseAmount: convertToBase(originalAmount, campaignCurrency, rateTable),
  };
}
