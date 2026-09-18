import { Types } from 'mongoose';
import { Store, Customer, Product, Order, CustomerStoreAccount } from '../../models';
import { ApiError } from '../../lib/ApiError';
import { logger } from '../../lib/logger';
import { toDecimal128, toStringValue } from '../../lib/money/decimal';
import { convertToBase } from '../../lib/money/fx';
import { zonedToUtc } from '../../lib/time/zoned';
import { FX_RATES } from '../reference/reference.data';
import { processCashback, type CashbackOutcome } from '../../cashback/processor';
import type { ProcessOrderRequest } from './orders.validation';

export interface ProcessOrderResult extends CashbackOutcome {
  orderId: string;
  cashbackError: string | null;
}

interface ProductWithVariants {
  _id: Types.ObjectId;
  variants: { variantId: string; price: Types.Decimal128 }[];
}

export async function processOrder(input: ProcessOrderRequest): Promise<ProcessOrderResult> {
  const [store, customer] = await Promise.all([
    Store.findById(input.storeId).lean<{ _id: Types.ObjectId } | null>(),
    Customer.findById(input.customerId).lean<{ _id: Types.ObjectId } | null>(),
  ]);
  if (!store) throw ApiError.notFound('STORE_NOT_FOUND', 'Store not found');
  if (!customer) throw ApiError.notFound('CUSTOMER_NOT_FOUND', 'Customer not found');

  const productIds = [...new Set(input.lineItems.map((li) => li.productId))];
  const products = await Product.find({ _id: { $in: productIds } }).lean<ProductWithVariants[]>();
  const productsById = new Map(products.map((p) => [p._id.toString(), p]));

  // Validate + snapshot the unit price of each line item's variant.
  const lineItems = input.lineItems.map((li) => {
    const product = productsById.get(li.productId);
    if (!product) throw ApiError.badRequest('INVALID_LINE_ITEM', `Unknown product: ${li.productId}`);
    const variant = product.variants.find((v) => v.variantId === li.variantId);
    if (!variant) {
      throw ApiError.badRequest('INVALID_LINE_ITEM', `Unknown variant ${li.variantId} for product ${li.productId}`);
    }
    return {
      productId: new Types.ObjectId(li.productId),
      variantId: li.variantId,
      quantity: li.quantity,
      unitPrice: variant.price,
    };
  });

  const orderAmount = toStringValue(input.orderAmount);
  const orderCreatedAt = zonedToUtc(input.orderCreatedAt, input.orderTimezone);

  // 1. Persist the order (always succeeds; cashback below is fault-isolated).
  const order = await Order.create({
    storeId: new Types.ObjectId(input.storeId),
    customerId: new Types.ObjectId(input.customerId),
    lineItems,
    orderAmount: toDecimal128(orderAmount),
    orderCurrency: input.orderCurrency,
    orderCreatedAt,
    orderTimezone: input.orderTimezone,
  });

  // 2. Cashback — never fails the order.
  let outcome: CashbackOutcome;
  let cashbackError: string | null = null;
  try {
    outcome = await processCashback({
      orderId: order._id,
      storeId: input.storeId,
      customerId: input.customerId,
      lineItems: input.lineItems,
      orderAmount,
      orderCurrency: input.orderCurrency,
      orderCreatedAt,
    });
  } catch (err) {
    logger.error('Cashback processing failed', err);
    cashbackError = err instanceof Error ? err.message : 'Cashback processing failed';
    outcome = {
      outcome: 'NO_CASHBACK',
      selectedCampaign: null,
      cashback: null,
      transactionId: null,
      reason: null,
    };
  }

  // 3. Accumulate lifetime spend (after cashback, so eligibility saw pre-order spend).
  const orderBase = convertToBase(orderAmount, input.orderCurrency, FX_RATES);
  await CustomerStoreAccount.findOneAndUpdate(
    { customerId: new Types.ObjectId(input.customerId), storeId: new Types.ObjectId(input.storeId) },
    { $inc: { lifetimeSpent: orderBase } },
    { upsert: true, new: true },
  );

  return { orderId: order._id.toString(), ...outcome, cashbackError };
}
