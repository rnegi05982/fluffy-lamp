import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import {
  RuleOperator,
  RuleGroupOperator,
  ValueType,
  DeliveryMode,
  ExpiryMode,
} from '../../domain/enums';
import type { RuleGroup } from '../../domain/rule-tree';
import { CURRENCY_CODES, TIMEZONES } from '../reference/reference.data';
import { FACT_BY_KEY, type FactDefinition } from '../../rule-engine/facts/catalog';
import {
  PRODUCT_COLLECTIONS,
  PRODUCT_TYPES,
  PRODUCT_TAGS,
  CUSTOMER_TAGS,
} from '../../rule-engine/facts/options';

const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

function isNonEmptyStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string');
}

function isNumeric(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  return typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v));
}

function requireArrayMembers(
  value: unknown,
  allowed: string[],
  ctx: z.RefinementCtx,
): void {
  if (!isNonEmptyStringArray(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expected a non-empty list', path: ['value'] });
    return;
  }
  for (const item of value) {
    if (!allowed.includes(item)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unsupported value: ${item}`, path: ['value'] });
    }
  }
}

/** Validate a leaf rule's `value` (and `params`) against its fact's expected input kind. */
function validateValueShape(
  def: FactDefinition,
  value: unknown,
  params: Record<string, unknown> | undefined,
  ctx: z.RefinementCtx,
): void {
  switch (def.valueKind) {
    case 'customerTags':
      requireArrayMembers(value, CUSTOMER_TAGS, ctx);
      break;
    case 'collections':
      requireArrayMembers(value, PRODUCT_COLLECTIONS, ctx);
      break;
    case 'productTags':
      requireArrayMembers(value, PRODUCT_TAGS, ctx);
      break;
    case 'productTypes':
      requireArrayMembers(value, PRODUCT_TYPES, ctx);
      break;
    case 'currency':
      requireArrayMembers(value, CURRENCY_CODES, ctx);
      break;
    case 'products':
      if (!isNonEmptyStringArray(value) || !value.every((id) => isValidObjectId(id))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expected a non-empty list of product ids', path: ['value'] });
      }
      break;
    case 'variants':
      if (!isNonEmptyStringArray(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expected a non-empty list of variant ids', path: ['value'] });
      }
      break;
    case 'number':
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expected a non-negative integer', path: ['value'] });
      }
      break;
    case 'money':
      if (!isNumeric(value) || Number(value) < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expected a non-negative amount', path: ['value'] });
      }
      break;
    case 'moneyWithCurrency':
      if (!isNumeric(value) || Number(value) < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expected a non-negative amount', path: ['value'] });
      }
      if (typeof params?.currency !== 'string' || !CURRENCY_CODES.includes(params.currency)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A valid currency is required', path: ['params', 'currency'] });
      }
      break;
  }
}

const ruleLeafSchema = z
  .object({
    type: z.literal('RULE'),
    fact: z.string(),
    operator: z.nativeEnum(RuleOperator),
    value: z.unknown(),
    params: z.record(z.unknown()).optional(),
  })
  .superRefine((rule, ctx) => {
    const def = FACT_BY_KEY[rule.fact];
    if (!def) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown fact: ${rule.fact}`, path: ['fact'] });
      return;
    }
    if (!def.operators.includes(rule.operator)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Operator ${rule.operator} is not allowed for ${rule.fact}`,
        path: ['operator'],
      });
    }
    validateValueShape(def, rule.value, rule.params, ctx);
  });

const ruleGroupSchema: z.ZodType<RuleGroup> = z.lazy(() =>
  z.object({
    type: z.literal('GROUP'),
    operator: z.nativeEnum(RuleGroupOperator),
    children: z.array(z.union([ruleLeafSchema, ruleGroupSchema])).min(1, 'A tier needs at least one rule'),
  }),
);

const tierInputSchema = z
  .object({
    valueType: z.nativeEnum(ValueType),
    value: z.union([z.number(), z.string()]),
    ruleGroup: ruleGroupSchema,
  })
  .superRefine((tier, ctx) => {
    const n = Number(tier.value);
    if (tier.valueType === ValueType.PERCENTAGE) {
      if (!Number.isFinite(n) || n <= 0 || n > 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Percentage must be between 0 and 100', path: ['value'] });
      }
    } else if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Fixed value must be greater than 0', path: ['value'] });
    }
  });

export const campaignBodySchema = z
  .object({
    campaignName: z.string().trim().min(1, 'Campaign name is required'),
    isEnabled: z.boolean().default(true),
    timezone: z.string().refine((v) => TIMEZONES.includes(v), 'Unsupported timezone'),
    startAt: z.string().regex(WALL_CLOCK, 'Invalid date/time').nullable().default(null),
    endAt: z.string().regex(WALL_CLOCK, 'Invalid date/time').nullable().default(null),
    deliveryMode: z.nativeEnum(DeliveryMode),
    deliveryDays: z.number().int().min(0).nullable().default(null),
    deliveryTime: z.string().regex(HH_MM, 'Invalid time').nullable().default(null),
    expiryMode: z.nativeEnum(ExpiryMode),
    expiryDays: z.number().int().min(0).nullable().default(null),
    expiryTime: z.string().regex(HH_MM, 'Invalid time').nullable().default(null),
    currency: z
      .string()
      .refine((v) => CURRENCY_CODES.includes(v), 'Unsupported currency')
      .nullable()
      .default(null),
    tiers: z.array(tierInputSchema).min(1, 'At least one tier is required').max(5, 'At most 5 tiers'),
  })
  .superRefine((c, ctx) => {
    // Schedule: both bounds or neither; start before end.
    if ((c.startAt === null) !== (c.endAt === null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A scheduled campaign needs both a start and an end', path: ['startAt'] });
    }
    if (c.startAt && c.endAt && !(c.startAt < c.endAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Start must be before end', path: ['endAt'] });
    }
    // Delivery fields required only for AFTER_DAYS.
    if (c.deliveryMode === DeliveryMode.AFTER_DAYS) {
      if (c.deliveryDays === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery days required', path: ['deliveryDays'] });
      if (c.deliveryTime === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Delivery time required', path: ['deliveryTime'] });
    }
    if (c.expiryMode === ExpiryMode.AFTER_DAYS) {
      if (c.expiryDays === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expiry days required', path: ['expiryDays'] });
      if (c.expiryTime === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expiry time required', path: ['expiryTime'] });
    }
  });

export type CampaignBodyInput = z.infer<typeof campaignBodySchema>;

export const storeIdParamsSchema = z.object({
  storeId: z.string().refine((v) => isValidObjectId(v), 'Invalid store id'),
});
export type StoreIdParams = z.infer<typeof storeIdParamsSchema>;

export const campaignIdParamsSchema = z.object({
  id: z.string().refine((v) => isValidObjectId(v), 'Invalid campaign id'),
});
export type CampaignIdParams = z.infer<typeof campaignIdParamsSchema>;
