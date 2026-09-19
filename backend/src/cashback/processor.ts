import { Types } from 'mongoose';
import {
  Campaign,
  Store,
  Customer,
  Transaction,
  CustomerStoreAccount,
  ScheduledOperation,
  type ICampaign,
  type ITier,
} from '../models';
import {
  TransactionType,
  DeliveryMode,
  ExpiryMode,
  ScheduledOperationType,
} from '../domain/enums';
import { ApiError } from '../lib/ApiError';
import { logger } from '../lib/logger';
import { toStringValue, toCents } from '../lib/money/decimal';
import { FX_RATES, BASE_CURRENCY } from '../modules/reference/reference.data';
import { buildContext } from '../rule-engine/context';
import { selectTier } from '../rule-engine/selection';
import { computePayout, type Payout } from './calculator';
import { scheduleAt } from '../lib/time/zoned';

export interface ProcessOrderInput {
  orderId: Types.ObjectId;
  storeId: string;
  customerId: string;
  lineItems: { productId: string; variantId: string; quantity: number }[];
  orderAmount: string;
  orderCurrency: string;
  orderCreatedAt: Date;
}

export interface CashbackOutcome {
  outcome: 'CASHBACK_EARNED' | 'NO_CASHBACK';
  selectedCampaign: {
    campaignId: string;
    campaignName: string;
    tierId: string;
    rank: number;
  } | null;
  cashback: {
    originalAmount: string;
    originalCurrency: string;
    fxRate: number;
    baseAmount: string;
    baseCurrency: string;
    delivery: 'IMMEDIATE' | 'DELAYED';
    deliverAt: string | null;
    expiresAt: string | null;
  } | null;
  transactionId: string | null;
  reason: string | null;
}

type CampaignDoc = ICampaign & { _id: Types.ObjectId };

interface Candidate {
  campaign: CampaignDoc;
  tier: ITier;
  payout: Payout;
}

/**
 * Compute and freeze cashback for a persisted order: evaluate live campaigns, pick the
 * single best payout, write the ledger entry, update the balance cache, and schedule the
 * delayed delivery or expiry. Writes are ordered (ledger first) so the ledger stays the
 * source of truth without a multi-document transaction.
 */
export async function processCashback(order: ProcessOrderInput): Promise<CashbackOutcome> {
  const store = await Store.findById(order.storeId).lean<{ currency: string } | null>();
  if (!store) throw ApiError.notFound('STORE_NOT_FOUND', 'Store not found');

  const ctx = await buildContext(order);
  const placedAt = order.orderCreatedAt.getTime();

  const campaigns = await Campaign.find({
    storeId: new Types.ObjectId(order.storeId),
    isEnabled: true,
    archivedAt: null,
  }).lean<CampaignDoc[]>();

  const candidates: Candidate[] = [];
  for (const campaign of campaigns) {
    const inWindow =
      (campaign.startAt === null || placedAt >= campaign.startAt.getTime()) &&
      (campaign.endAt === null || placedAt <= campaign.endAt.getTime());
    if (!inWindow) continue;

    const campaignCurrency = campaign.currency ?? store.currency;
    const tier = selectTier(campaign.tiers, ctx, { rateTable: FX_RATES, campaignCurrency });
    if (!tier) continue;

    const payout = computePayout(
      tier,
      order.orderAmount,
      order.orderCurrency,
      campaignCurrency,
      FX_RATES,
    );
    candidates.push({ campaign, tier, payout });
  }

  if (candidates.length === 0) {
    return {
      outcome: 'NO_CASHBACK',
      selectedCampaign: null,
      cashback: null,
      transactionId: null,
      reason: 'No qualifying campaign for this order',
    };
  }

  // Highest base payout wins; ties break to the lowest campaign id.
  candidates.sort((a, b) => {
    const diff = toCents(b.payout.baseAmount) - toCents(a.payout.baseAmount);
    if (diff !== 0) return diff;
    return a.campaign._id.toString() < b.campaign._id.toString() ? -1 : 1;
  });

  const { campaign, tier, payout } = candidates[0] as Candidate;
  const isImmediate = campaign.deliveryMode === DeliveryMode.IMMEDIATE;

  // Immediate credits are delivered as of the order's placed-at instant.
  const deliverAt = isImmediate
    ? order.orderCreatedAt
    : scheduleAt(order.orderCreatedAt, campaign.deliveryDays ?? 0, campaign.deliveryTime ?? '00:00', campaign.timezone);

  // Immediate credits expire measured from their delivery instant (the order's placed-at);
  // for delayed credits expiry is set at delivery time.
  const expiresAt =
    isImmediate && campaign.expiryMode === ExpiryMode.AFTER_DAYS
      ? scheduleAt(deliverAt, campaign.expiryDays ?? 0, campaign.expiryTime ?? '00:00', campaign.timezone)
      : null;

  const customerId = new Types.ObjectId(order.customerId);
  const storeId = new Types.ObjectId(order.storeId);

  // 1. Ledger entry (source of truth).
  const tx = await Transaction.create({
    customerId,
    storeId,
    orderId: order.orderId,
    campaignId: campaign._id,
    type: isImmediate ? TransactionType.COMPLETED : TransactionType.SCHEDULED,
    originalAmount: payout.originalAmount,
    originalCurrency: payout.originalCurrency,
    fxRate: payout.fxRate,
    baseAmount: payout.baseAmount,
    deliverAt,
    expiresAt,
  });

  // Steps 2-3 update caches derived from the ledger. If either fails after the ledger write
  // the caches diverge (and a delayed credit would have no scheduled op), so log the ledger
  // id for reconciliation before surfacing the failure.
  try {
    // 2. Balance cache: delivered now, or pending until delivery.
    await CustomerStoreAccount.findOneAndUpdate(
      { customerId, storeId },
      { $inc: isImmediate ? { balanceBase: payout.baseAmount } : { pendingBase: payout.baseAmount } },
      { upsert: true, new: true },
    );
    if (isImmediate) {
      await Customer.findByIdAndUpdate(customerId, { $inc: { globalBalanceBase: payout.baseAmount } });
    }

    // 3. Schedule the delayed delivery, or the expiry of an immediate credit.
    if (!isImmediate) {
      await ScheduledOperation.create({
        type: ScheduledOperationType.DELIVER_CASHBACK,
        runAt: deliverAt,
        transactionId: tx._id,
      });
    } else if (expiresAt) {
      await ScheduledOperation.create({
        type: ScheduledOperationType.EXPIRE_CASHBACK,
        runAt: expiresAt,
        transactionId: tx._id,
      });
    }
  } catch (err) {
    logger.error('Cashback writes after the ledger entry failed; ledger entry needs reconciliation', {
      transactionId: tx._id.toString(),
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  return {
    outcome: 'CASHBACK_EARNED',
    selectedCampaign: {
      campaignId: campaign._id.toString(),
      campaignName: campaign.campaignName,
      tierId: tier.tierId,
      rank: tier.rank,
    },
    cashback: {
      originalAmount: toStringValue(payout.originalAmount),
      originalCurrency: payout.originalCurrency,
      fxRate: payout.fxRate,
      baseAmount: toStringValue(payout.baseAmount),
      baseCurrency: BASE_CURRENCY,
      delivery: isImmediate ? 'IMMEDIATE' : 'DELAYED',
      deliverAt: deliverAt ? deliverAt.toISOString() : null,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    },
    transactionId: tx._id.toString(),
    reason: null,
  };
}
