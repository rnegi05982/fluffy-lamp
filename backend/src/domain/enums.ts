/**
 * Domain enums. Single source so models, Zod validation, and the fact catalog never
 * drift. Values are UPPER_SNAKE strings; each enum is an `as const` object paired with a
 * derived union type of the same name.
 *
 * Use with Zod via `z.nativeEnum(ValueType)`.
 */

/** Tier cashback value type. */
export const ValueType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;
export type ValueType = (typeof ValueType)[keyof typeof ValueType];

/** Rule-group boolean combinator. */
export const RuleGroupOperator = {
  AND: 'AND',
  OR: 'OR',
} as const;
export type RuleGroupOperator = (typeof RuleGroupOperator)[keyof typeof RuleGroupOperator];

/** Leaf-rule comparison operators. */
export const RuleOperator = {
  GTE: 'GTE',
  LTE: 'LTE',
  EQ: 'EQ',
  IS: 'IS',
  IS_NOT: 'IS_NOT',
} as const;
export type RuleOperator = (typeof RuleOperator)[keyof typeof RuleOperator];

/** Node discriminator for the embedded rule tree. */
export const RuleNodeType = {
  GROUP: 'GROUP',
  RULE: 'RULE',
} as const;
export type RuleNodeType = (typeof RuleNodeType)[keyof typeof RuleNodeType];

/** Cashback delivery model. */
export const DeliveryMode = {
  IMMEDIATE: 'IMMEDIATE',
  AFTER_DAYS: 'AFTER_DAYS',
} as const;
export type DeliveryMode = (typeof DeliveryMode)[keyof typeof DeliveryMode];

/** Cashback expiry model. */
export const ExpiryMode = {
  NEVER: 'NEVER',
  AFTER_DAYS: 'AFTER_DAYS',
} as const;
export type ExpiryMode = (typeof ExpiryMode)[keyof typeof ExpiryMode];

/** Ledger transaction type. */
export const TransactionType = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

/** Durable scheduler queue op type. */
export const ScheduledOperationType = {
  DELIVER_CASHBACK: 'DELIVER_CASHBACK',
  EXPIRE_CASHBACK: 'EXPIRE_CASHBACK',
} as const;
export type ScheduledOperationType =
  (typeof ScheduledOperationType)[keyof typeof ScheduledOperationType];

/** Scheduler op lifecycle — claim-then-act. */
export const ScheduledOperationStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;
export type ScheduledOperationStatus =
  (typeof ScheduledOperationStatus)[keyof typeof ScheduledOperationStatus];

/**
 * Derived campaign phase (NOT stored) — computed on read from isEnabled + window + now.
 * Display status that also folds in DISABLED/ARCHIVED is a presentation concern handled
 * by the campaigns serializer, not this core enum.
 */
export const CampaignPhase = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
} as const;
export type CampaignPhase = (typeof CampaignPhase)[keyof typeof CampaignPhase];
