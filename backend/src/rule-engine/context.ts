import { Types } from 'mongoose';
import type { Money } from '../domain/money';
import { Customer, CustomerStoreAccount, Product } from '../models';
import { BASE_CURRENCY } from '../modules/reference/reference.data';
import { cartFacts } from './facts/providers/cartFacts';
import { customerFacts } from './facts/providers/customerFacts';
import { productFacts, type ProductMeta } from './facts/providers/productFacts';

export interface OrderContextInput {
  storeId: string;
  customerId: string;
  lineItems: { productId: string; variantId: string; quantity: number }[];
  orderAmount: string;
  orderCurrency: string;
}

/**
 * Resolved fact values, bucketed by comparison kind, built ONCE per order and reused across
 * every candidate campaign and tier. No DB access happens during evaluation.
 */
export interface EvalContext {
  numbers: Record<string, number>;
  money: Record<string, Money>;
  sets: Record<string, string[]>;
}

export async function buildContext(order: OrderContextInput): Promise<EvalContext> {
  const productIds = order.lineItems.map((li) => li.productId);

  const [customer, account, products] = await Promise.all([
    Customer.findById(order.customerId).lean<{ tags: string[] } | null>(),
    CustomerStoreAccount.findOne({
      customerId: new Types.ObjectId(order.customerId),
      storeId: new Types.ObjectId(order.storeId),
    }).lean<{ lifetimeSpent: Types.Decimal128 } | null>(),
    Product.find({ _id: { $in: productIds } }).lean<
      Array<{ _id: Types.ObjectId; productType: string; collections: string[]; tags: string[] }>
    >(),
  ]);

  const tags = customer?.tags ?? [];
  const lifetimeSpent = account?.lifetimeSpent ? account.lifetimeSpent.toString() : '0';

  const productsById = new Map<string, ProductMeta>(
    products.map((p) => [
      p._id.toString(),
      { productType: p.productType, collections: p.collections, tags: p.tags },
    ]),
  );

  const cart = cartFacts(order);
  const customerData = customerFacts(tags, lifetimeSpent, BASE_CURRENCY);
  const product = productFacts(order.lineItems, productsById);

  return {
    numbers: { ...cart.numbers },
    money: { ...cart.money, ...customerData.money },
    sets: { ...cart.sets, ...customerData.sets, ...product.sets },
  };
}
