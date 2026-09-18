import type { RuleGroupOperator, RuleOperator } from './enums';

/**
 * The embedded eligibility tree for a tier. A group combines children with AND/OR;
 * each child is either a leaf Rule or another nested group. The UI builds a flat group
 * for now, but the shape supports arbitrary nesting.
 */
export interface Rule {
  type: 'RULE';
  /** Fact catalog key, e.g. `cart.total`. */
  fact: string;
  operator: RuleOperator;
  /** Scalar or array; an array means ANY-of (OR) within this one rule. Required at runtime
   *  (enforced by validation); typed optional to match schema inference. */
  value?: unknown;
  /** Optional per-rule params, e.g. the currency for a money comparison. */
  params?: Record<string, unknown>;
}

export interface RuleGroup {
  type: 'GROUP';
  operator: RuleGroupOperator;
  children: RuleNode[];
}

export type RuleNode = Rule | RuleGroup;
