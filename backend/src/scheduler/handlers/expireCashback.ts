import type { Types } from 'mongoose';
import { Transaction, Customer, CustomerStoreAccount } from '../../models';
import { TransactionType } from '../../domain/enums';
import { negate } from '../../lib/money/decimal';

/**
 * Expire a delivered credit: write a negative EXPIRED reversal linked to the credit and
 * decrement the balances. Idempotent — only a still-active COMPLETED credit with no existing
 * reversal is expired.
 */
export async function expireCashback(transactionId: Types.ObjectId): Promise<void> {
  const credit = await Transaction.findById(transactionId).lean<{
    _id: Types.ObjectId;
    customerId: Types.ObjectId;
    storeId: Types.ObjectId;
    orderId: Types.ObjectId;
    campaignId: Types.ObjectId | null;
    type: string;
    originalAmount: Types.Decimal128;
    originalCurrency: string;
    fxRate: number;
    baseAmount: Types.Decimal128;
  } | null>();

  if (!credit || credit.type !== TransactionType.COMPLETED) return;

  const alreadyReversed = await Transaction.exists({
    sourceTransactionId: credit._id,
    type: TransactionType.EXPIRED,
  });
  if (alreadyReversed) return;

  await Transaction.create({
    customerId: credit.customerId,
    storeId: credit.storeId,
    orderId: credit.orderId,
    campaignId: credit.campaignId,
    sourceTransactionId: credit._id,
    type: TransactionType.EXPIRED,
    originalAmount: negate(credit.originalAmount),
    originalCurrency: credit.originalCurrency,
    fxRate: credit.fxRate,
    baseAmount: negate(credit.baseAmount),
  });

  await CustomerStoreAccount.findOneAndUpdate(
    { customerId: credit.customerId, storeId: credit.storeId },
    { $inc: { balanceBase: negate(credit.baseAmount) } },
  );
  await Customer.findByIdAndUpdate(credit.customerId, {
    $inc: { globalBalanceBase: negate(credit.baseAmount) },
  });
}
