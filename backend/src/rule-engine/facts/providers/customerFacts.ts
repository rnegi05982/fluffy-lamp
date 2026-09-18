import type { Money } from '../../../domain/money';

/**
 * Customer facts from the DB: global tags and the per-store lifetime spend (already in base
 * currency, reflecting past orders only).
 */
export function customerFacts(
  tags: string[],
  lifetimeSpentBase: string,
  baseCurrency: string,
): {
  money: Record<string, Money>;
  sets: Record<string, string[]>;
} {
  return {
    sets: { 'customer.tags': tags },
    money: { 'customer.lifetimeSpent': { amount: lifetimeSpentBase, currency: baseCurrency } },
  };
}
