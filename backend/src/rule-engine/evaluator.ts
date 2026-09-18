import { RuleOperator, RuleGroupOperator, RuleNodeType } from '../domain/enums';
import type { Rule, RuleGroup, RuleNode } from '../domain/rule-tree';
import { FACT_BY_KEY } from './facts/catalog';
import { convertToBase, type RateTable } from '../lib/money/fx';
import { toCents } from '../lib/money/decimal';
import type { EvalContext } from './context';

export interface EvaluationOptions {
  rateTable: RateTable;
  /** Effective campaign currency, used when a rule value has no explicit currency. */
  campaignCurrency: string;
}

const { GTE, LTE, EQ, IS, IS_NOT } = RuleOperator;

/** Recursive short-circuit evaluation of a rule group against the context. */
export function evaluate(group: RuleGroup, ctx: EvalContext, opts: EvaluationOptions): boolean {
  return group.operator === RuleGroupOperator.AND
    ? group.children.every((child) => evaluateNode(child, ctx, opts))
    : group.children.some((child) => evaluateNode(child, ctx, opts));
}

function evaluateNode(node: RuleNode, ctx: EvalContext, opts: EvaluationOptions): boolean {
  return node.type === RuleNodeType.GROUP
    ? evaluate(node, ctx, opts)
    : evaluateRule(node, ctx, opts);
}

function evaluateRule(rule: Rule, ctx: EvalContext, opts: EvaluationOptions): boolean {
  const def = FACT_BY_KEY[rule.fact];
  if (!def) return false;

  // Membership facts (IS / IS_NOT): ANY-of intersection of the fact set with the rule list.
  if (rule.operator === IS || rule.operator === IS_NOT) {
    const factSet = ctx.sets[rule.fact] ?? [];
    const values = Array.isArray(rule.value) ? (rule.value as unknown[]).map(String) : [];
    const intersects = values.some((v) => factSet.includes(v));
    return rule.operator === IS ? intersects : !intersects;
  }

  // Numeric / money facts (GTE / LTE / EQ).
  let left: number;
  let right: number;

  if (def.valueKind === 'number') {
    left = ctx.numbers[rule.fact] ?? 0;
    right = Number(rule.value);
  } else {
    const money = ctx.money[rule.fact];
    if (!money) return false;
    const valueCurrency =
      typeof rule.params?.currency === 'string' ? rule.params.currency : opts.campaignCurrency;
    left = toCents(convertToBase(money.amount, money.currency, opts.rateTable));
    right = toCents(convertToBase(String(rule.value), valueCurrency, opts.rateTable));
  }

  if (!Number.isFinite(right)) return false;
  switch (rule.operator) {
    case GTE:
      return left >= right;
    case LTE:
      return left <= right;
    case EQ:
      return left === right;
    default:
      return false;
  }
}
