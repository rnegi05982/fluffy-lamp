import { Types } from 'mongoose';
import { Campaign, Store, type ITier } from '../../models';
import { ApiError } from '../../lib/ApiError';
import { buildMeta, escapeRegex, type PageMeta, type PaginationQuery } from '../../lib/pagination';
import { zonedToUtc } from '../../lib/time/zoned';
import { toDecimal128 } from '../../lib/money/decimal';
import { ValueType } from '../../domain/enums';
import { BASE_CURRENCY } from '../reference/reference.data';
import type { CampaignBodyInput } from './campaigns.validation';
import {
  toCampaignDTO,
  toCampaignListItemDTO,
  type CampaignShape,
} from './campaigns.serializer';

/** Build embedded tiers, assigning rank + tierId by array order (rank = add order). */
function buildTiers(tiers: CampaignBodyInput['tiers']): ITier[] {
  return tiers.map((t, i) => ({
    tierId: `t${i + 1}`,
    rank: i + 1,
    valueType: t.valueType,
    value: t.valueType === ValueType.FIXED ? toDecimal128(t.value) : Number(t.value),
    ruleGroup: t.ruleGroup,
  }));
}

/** Map a validated body to persisted campaign fields (wall-clock → UTC). */
function toCampaignFields(input: CampaignBodyInput) {
  return {
    campaignName: input.campaignName,
    isEnabled: input.isEnabled,
    timezone: input.timezone,
    startAt: input.startAt ? zonedToUtc(input.startAt, input.timezone) : null,
    endAt: input.endAt ? zonedToUtc(input.endAt, input.timezone) : null,
    deliveryMode: input.deliveryMode,
    deliveryDays: input.deliveryDays,
    deliveryTime: input.deliveryTime,
    expiryMode: input.expiryMode,
    expiryDays: input.expiryDays,
    expiryTime: input.expiryTime,
    currency: input.currency,
    tiers: buildTiers(input.tiers),
  };
}

async function getStoreCurrencyOr404(storeId: Types.ObjectId | string): Promise<string> {
  const store = await Store.findById(storeId).lean<{ currency: string } | null>();
  if (!store) throw ApiError.notFound('STORE_NOT_FOUND', 'Store not found');
  return store.currency;
}

export async function listCampaigns(
  storeId: string,
  query: PaginationQuery,
): Promise<{ items: ReturnType<typeof toCampaignListItemDTO>[]; meta: PageMeta }> {
  const storeCurrency = await getStoreCurrencyOr404(storeId);
  const { page, limit, search } = query;

  const filter: Record<string, unknown> = {
    storeId: new Types.ObjectId(storeId),
    archivedAt: null,
  };
  if (search) filter.campaignName = { $regex: escapeRegex(search), $options: 'i' };

  const [docs, total] = await Promise.all([
    Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<CampaignShape[]>(),
    Campaign.countDocuments(filter),
  ]);

  const now = new Date();
  return {
    items: docs.map((d) => toCampaignListItemDTO(d, storeCurrency, now)),
    meta: buildMeta(page, limit, total),
  };
}

export async function createCampaign(storeId: string, input: CampaignBodyInput) {
  const storeCurrency = await getStoreCurrencyOr404(storeId);
  const created = await Campaign.create({
    storeId: new Types.ObjectId(storeId),
    ...toCampaignFields(input),
  });
  const doc = await Campaign.findById(created._id).lean<CampaignShape>();
  if (!doc) throw ApiError.notFound('CAMPAIGN_NOT_FOUND', 'Campaign not found');
  return toCampaignDTO(doc, storeCurrency, new Date());
}

export async function getCampaign(id: string) {
  const doc = await Campaign.findById(id).lean<CampaignShape | null>();
  if (!doc) throw ApiError.notFound('CAMPAIGN_NOT_FOUND', 'Campaign not found');
  const store = await Store.findById(doc.storeId).lean<{ currency: string } | null>();
  return toCampaignDTO(doc, store?.currency ?? doc.currency ?? BASE_CURRENCY, new Date());
}

export async function updateCampaign(id: string, input: CampaignBodyInput) {
  const doc = await Campaign.findByIdAndUpdate(
    id,
    { $set: toCampaignFields(input), $inc: { version: 1 } },
    { new: true },
  ).lean<CampaignShape | null>();
  if (!doc) throw ApiError.notFound('CAMPAIGN_NOT_FOUND', 'Campaign not found');
  const store = await Store.findById(doc.storeId).lean<{ currency: string } | null>();
  return toCampaignDTO(doc, store?.currency ?? doc.currency ?? BASE_CURRENCY, new Date());
}

export async function archiveCampaign(id: string): Promise<{ id: string; archivedAt: string }> {
  const doc = await Campaign.findByIdAndUpdate(
    id,
    { $set: { archivedAt: new Date() } },
    { new: true },
  ).lean<CampaignShape | null>();
  if (!doc) throw ApiError.notFound('CAMPAIGN_NOT_FOUND', 'Campaign not found');
  return { id: doc._id.toString(), archivedAt: (doc.archivedAt as Date).toISOString() };
}
