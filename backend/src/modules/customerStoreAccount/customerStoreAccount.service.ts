import { Types } from 'mongoose';
import { CustomerStoreAccount } from '../../models';
import { convertToBase } from '../../lib/money/fx';
import { FX_RATES } from '../reference/reference.data';

/**
 * Add an order's amount (converted to base currency) to the customer's per-store lifetime
 * spend. Called in the order flow before cashback, so eligibility reads the up-to-date total
 * straight from the stored value.
 */
export async function accumulateLifetimeSpent(
  customerId: string,
  storeId: string,
  orderAmount: string,
  orderCurrency: string,
): Promise<void> {
  const orderBase = convertToBase(orderAmount, orderCurrency, FX_RATES);
  await CustomerStoreAccount.findOneAndUpdate(
    { customerId: new Types.ObjectId(customerId), storeId: new Types.ObjectId(storeId) },
    { $inc: { lifetimeSpent: orderBase } },
    { upsert: true },
  );
}
