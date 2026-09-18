import type { Types } from 'mongoose';
import {
  Transaction,
  Campaign,
  Customer,
  CustomerStoreAccount,
  ScheduledOperation,
} from '../../models';
import { TransactionType, ExpiryMode, ScheduledOperationType } from '../../domain/enums';
import { negate } from '../../lib/money/decimal';
import { scheduleAt } from '../../lib/time/zoned';

/**
 * Credit a scheduled cashback: flip SCHEDULED → COMPLETED, move the amount from pending to
 * available balance (and global), then schedule its expiry measured from the delivery time.
 * Idempotent: the guarded flip means a re-run finds no SCHEDULED tx and does nothing.
 */
export async function deliverCashback(transactionId: Types.ObjectId): Promise<void> {
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, type: TransactionType.SCHEDULED },
    { $set: { type: TransactionType.COMPLETED } },
    { new: true },
  ).lean<{
    _id: Types.ObjectId;
    customerId: Types.ObjectId;
    storeId: Types.ObjectId;
    campaignId: Types.ObjectId | null;
    baseAmount: Types.Decimal128;
  } | null>();

  if (!tx) return; // already delivered or missing — nothing to do

  await CustomerStoreAccount.findOneAndUpdate(
    { customerId: tx.customerId, storeId: tx.storeId },
    { $inc: { pendingBase: negate(tx.baseAmount), balanceBase: tx.baseAmount } },
  );
  await Customer.findByIdAndUpdate(tx.customerId, { $inc: { globalBalanceBase: tx.baseAmount } });

  if (!tx.campaignId) return;
  const campaign = await Campaign.findById(tx.campaignId).lean<{
    expiryMode: string;
    expiryDays: number | null;
    expiryTime: string | null;
    timezone: string;
  } | null>();
  if (campaign && campaign.expiryMode === ExpiryMode.AFTER_DAYS) {
    const expiresAt = scheduleAt(
      new Date(),
      campaign.expiryDays ?? 0,
      campaign.expiryTime ?? '00:00',
      campaign.timezone,
    );
    await Transaction.findByIdAndUpdate(tx._id, { $set: { expiresAt } });
    await ScheduledOperation.create({
      type: ScheduledOperationType.EXPIRE_CASHBACK,
      runAt: expiresAt,
      transactionId: tx._id,
    });
  }
}
