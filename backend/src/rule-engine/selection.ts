import type { ITier } from '../models';
import { evaluate, type EvaluationOptions } from './evaluator';
import type { EvalContext } from './context';

/**
 * Pick a campaign's winning tier: evaluate tiers by rank (1 = highest) and return the first
 * that qualifies. Returns null when no tier qualifies.
 */
export function selectTier(
  tiers: ITier[],
  ctx: EvalContext,
  opts: EvaluationOptions,
): ITier | null {
  const byRank = [...tiers].sort((a, b) => a.rank - b.rank);
  for (const tier of byRank) {
    if (evaluate(tier.ruleGroup, ctx, opts)) return tier;
  }
  return null;
}
