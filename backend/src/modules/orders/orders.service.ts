import mongoose, { Types } from 'mongoose';
import { Store, Customer, Product, Order } from '../../models';
import { ApiError } from '../../lib/ApiError';
import { toDecimal128, toStringValue } from '../../lib/money/decimal';
import { zonedToUtc } from '../../lib/time/zoned';
import { accumulateLifetimeSpent } from '../customerStoreAccount/customerStoreAccount.service';
import { dispatchCashback } from '../../cashback/dispatch';
import type { ProcessOrderRequest } from './orders.validation';

export interface ProcessOrderResult {
  orderId: string;
}

interface ProductWithVariants {
  _id: Types.ObjectId;
  variants: { variantId: string; price: Types.Decimal128 }[];
}

interface OrderLineItem {
  productId: Types.ObjectId;
  variantId: string;
  quantity: number;
  unitPrice: Types.Decimal128;
}

/** Validate each line item against its product/variant and snapshot the unit price. */
function buildLineItems(
  items: ProcessOrderRequest['lineItems'],
  productsById: Map<string, ProductWithVariants>,
): OrderLineItem[] {
  return items.map((li) => {
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
}

/**
 * Handle the process-order use case: validate, persist the order, record the customer's spend,
 * then hand cashback off to its dispatcher. Cashback is a downstream reaction — its result is
 * not part of the order response.
 */
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

  const lineItems = buildLineItems(input.lineItems, productsById);
  const orderAmount = toStringValue(input.orderAmount);
  const orderCreatedAt = zonedToUtc(input.orderCreatedAt, input.orderTimezone);

  // 1. Persist the order and record the customer's spend atomically — both commit or neither.
  const session = await mongoose.startSession();
  let orderId: Types.ObjectId;
  try {
    session.startTransaction();
    const order = await new Order({
      storeId: new Types.ObjectId(input.storeId),
      customerId: new Types.ObjectId(input.customerId),
      lineItems,
      orderAmount: toDecimal128(orderAmount),
      orderCurrency: input.orderCurrency,
      orderCreatedAt,
      orderTimezone: input.orderTimezone,
    }).save({ session });
    await accumulateLifetimeSpent(
      input.customerId,
      input.storeId,
      orderAmount,
      input.orderCurrency,
      session,
    );
    await session.commitTransaction();
    orderId = order._id;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // 2. Cashback runs after commit (reads the durable lifetime total; fault-isolated, never fails the order).
  // FUTURE (scalability): swap this in-process call for a queue enqueue to run cashback off the request path.
  await dispatchCashback({
    orderId,
    storeId: input.storeId,
    customerId: input.customerId,
    lineItems: input.lineItems,
    orderAmount,
    orderCurrency: input.orderCurrency,
    orderCreatedAt,
  });

  return { orderId: orderId.toString() };
}
