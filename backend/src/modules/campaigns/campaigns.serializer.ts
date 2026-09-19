import type { Types } from 'mongoose';
import type { ICampaign, ITier } from '../../models';
import { ValueType } from '../../domain/enums';
import { utcToZoned } from '../../lib/time/zoned';
import { toStringValue } from '../../lib/money/decimal';

export type CampaignStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export interface CampaignShape extends ICampaign {
  _id: Types.ObjectId;
}

/**
 * Display status with precedence Disabled > Expired > Scheduled > Active. Disabled wins over
 * every other state; archived campaigns are filtered out before this is called.
 */
export function deriveStatus(
  c: Pick<ICampaign, 'isEnabled' | 'startAt' | 'endAt'>,
  now: Date,
): CampaignStatus {
  if (!c.isEnabled) return 'DISABLED';
  if (c.endAt && now.getTime() > c.endAt.getTime()) return 'EXPIRED';
  if (c.startAt && now.getTime() < c.startAt.getTime()) return 'SCHEDULED';
  return 'ACTIVE';
}

/** FIXED → amount string; PERCENTAGE → number. */
function serializeTierValue(tier: ITier): string | number {
  return tier.valueType === ValueType.FIXED ? toStringValue(tier.value) : Number(tier.value);
}

function toTierDTO(tier: ITier) {
  return {
    tierId: tier.tierId,
    rank: tier.rank,
    valueType: tier.valueType,
    value: serializeTierValue(tier),
    ruleGroup: tier.ruleGroup,
  };
}

export function toCampaignListItemDTO(c: CampaignShape, storeCurrency: string, now: Date) {
  return {
    id: c._id.toString(),
    campaignName: c.campaignName,
    status: deriveStatus(c, now),
    timezone: c.timezone,
    startAt: c.startAt ? c.startAt.toISOString() : null,
    endAt: c.endAt ? c.endAt.toISOString() : null,
    startAtLocal: c.startAt ? utcToZoned(c.startAt, c.timezone) : null,
    endAtLocal: c.endAt ? utcToZoned(c.endAt, c.timezone) : null,
    currency: c.currency ?? storeCurrency,
    tierCount: c.tiers.length,
  };
}

export function toCampaignDTO(c: CampaignShape, storeCurrency: string, now: Date) {
  return {
    id: c._id.toString(),
    storeId: c.storeId.toString(),
    campaignName: c.campaignName,
    isEnabled: c.isEnabled,
    status: deriveStatus(c, now),
    timezone: c.timezone,
    startAt: c.startAt ? c.startAt.toISOString() : null,
    endAt: c.endAt ? c.endAt.toISOString() : null,
    startAtLocal: c.startAt ? utcToZoned(c.startAt, c.timezone) : null,
    endAtLocal: c.endAt ? utcToZoned(c.endAt, c.timezone) : null,
    archivedAt: c.archivedAt ? c.archivedAt.toISOString() : null,
    deliveryMode: c.deliveryMode,
    deliveryDays: c.deliveryDays,
    deliveryTime: c.deliveryTime,
    expiryMode: c.expiryMode,
    expiryDays: c.expiryDays,
    expiryTime: c.expiryTime,
    currency: c.currency ?? storeCurrency,
    version: c.version,
    tiers: c.tiers.map(toTierDTO),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
