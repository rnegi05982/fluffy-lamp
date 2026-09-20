import { Types, type ClientSession } from 'mongoose';
import { CustomerStoreAccount } from '../../models';
import { convertToBase } from '../../lib/money/fx';
import { FX_RATES } from '../reference/reference.data';

/**
 * Add an order's amount (converted to base currency) to the customer's per-store lifetime spend.
 * Pass `session` to commit this write atomically with the order.
 */
export async function accumulateLifetimeSpent(
  customerId: string,
  storeId: string,
  orderAmount: string,
  orderCurrency: string,
  session?: ClientSession,
): Promise<void> {
  const orderBase = convertToBase(orderAmount, orderCurrency, FX_RATES);
  await CustomerStoreAccount.findOneAndUpdate(
    { customerId: new Types.ObjectId(customerId), storeId: new Types.ObjectId(storeId) },
    { $inc: { lifetimeSpent: orderBase } },
    { upsert: true, session },
  );
}
