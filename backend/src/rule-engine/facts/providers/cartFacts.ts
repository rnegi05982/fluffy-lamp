import type { Money } from '../../../domain/money';

export interface CartInput {
  orderAmount: string | number;
  orderCurrency: string;
  lineItems: { productId: string; variantId: string; quantity: number }[];
}

/** Cart facts derive purely from the order: quantity, total, and currency. */
export function cartFacts(cart: CartInput): {
  numbers: Record<string, number>;
  money: Record<string, Money>;
  sets: Record<string, string[]>;
} {
  const totalQuantity = cart.lineItems.reduce((sum, li) => sum + li.quantity, 0);
  return {
    numbers: { 'cart.quantity': totalQuantity },
    money: { 'cart.total': { amount: String(cart.orderAmount), currency: cart.orderCurrency } },
    sets: { 'cart.currency': [cart.orderCurrency] },
  };
}
