import mongoose, { Schema, model, Types, type Model } from 'mongoose';
import { ValueType, DeliveryMode, ExpiryMode } from '../domain/enums';
import type { RuleGroup } from '../domain/rule-tree';

export interface ITier {
  tierId: string;
  /** 1 = highest; evaluated ascending, first qualifying tier wins. */
  rank: number;
  valueType: ValueType;
  /** Decimal128 for FIXED, number for PERCENTAGE — validated by valueType. */
  value: Types.Decimal128 | number;
  /** Embedded eligibility tree (free-form; shape enforced by Zod in the service). */
  ruleGroup: RuleGroup;
}

export interface ICampaign {
  storeId: Types.ObjectId;
  campaignName: string;
  isEnabled: boolean;
  timezone: string;
  /** UTC window bounds; null = starts now / never ends. */
  startAt: Date | null;
  endAt: Date | null;
  /** Non-null once soft-deleted. */
  archivedAt: Date | null;
  deliveryMode: DeliveryMode;
  deliveryDays: number | null;
  deliveryTime: string | null;
  expiryMode: ExpiryMode;
  expiryDays: number | null;
  expiryTime: string | null;
  /** Currency override; falls back to the store currency when null. */
  currency: string | null;
  version: number;
  tiers: ITier[];
  createdAt: Date;
  updatedAt: Date;
}

const tierSchema = new Schema<ITier>(
  {
    tierId: { type: String, required: true },
    rank: { type: Number, required: true },
    valueType: { type: String, enum: Object.values(ValueType), required: true },
    value: { type: Schema.Types.Mixed, required: true },
    ruleGroup: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const campaignSchema = new Schema<ICampaign>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    campaignName: { type: String, required: true, trim: true },
    isEnabled: { type: Boolean, default: true },
    timezone: { type: String, required: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    deliveryMode: { type: String, enum: Object.values(DeliveryMode), required: true },
    deliveryDays: { type: Number, default: null },
    deliveryTime: { type: String, default: null },
    expiryMode: { type: String, enum: Object.values(ExpiryMode), required: true },
    expiryDays: { type: Number, default: null },
    expiryTime: { type: String, default: null },
    currency: { type: String, default: null },
    version: { type: Number, default: 1 },
    tiers: { type: [tierSchema], default: [] },
  },
  { timestamps: true, collection: 'campaigns' },
);

campaignSchema.index({ storeId: 1 });

export const Campaign: Model<ICampaign> =
  (mongoose.models.Campaign as Model<ICampaign>) ||
  model<ICampaign>('Campaign', campaignSchema);
