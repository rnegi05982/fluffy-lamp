import type { FactCatalog, FactDefinition, FactValueKind } from '@/features/reference/useFactCatalog';
import type { Product } from '@/features/products/useProducts';
import type { CampaignBody, CampaignDetail, RuleLeaf, RuleOperator } from './detail';

export interface RuleDraft {
  fact: string;
  operator: string;
  value: string[] | string;
}

export interface TierDraft {
  valueType: 'PERCENTAGE' | 'FIXED';
  value: string;
  matchOperator: 'AND' | 'OR';
  rules: RuleDraft[];
}

export interface FormState {
  campaignName: string;
  isEnabled: boolean;
  timezone: string;
  currency: string;
  scheduleMode: 'continuous' | 'scheduled';
  startAt: string;
  endAt: string;
  deliveryMode: 'IMMEDIATE' | 'AFTER_DAYS';
  deliveryDays: string;
  deliveryTime: string;
  expiryMode: 'NEVER' | 'AFTER_DAYS';
  expiryDays: string;
  expiryTime: string;
  tiers: TierDraft[];
}

const ARRAY_KINDS: FactValueKind[] = [
  'customerTags',
  'collections',
  'productTags',
  'productTypes',
  'currency',
  'products',
  'variants',
];

export function isArrayKind(kind: FactValueKind): boolean {
  return ARRAY_KINDS.includes(kind);
}

export function defaultRule(fact: FactDefinition): RuleDraft {
  const operator = fact.operators[0] ?? 'IS';
  if (isArrayKind(fact.valueKind)) return { fact: fact.key, operator, value: [] };
  return { fact: fact.key, operator, value: '' };
}

export function emptyTier(firstFact: FactDefinition): TierDraft {
  return { valueType: 'PERCENTAGE', value: '', matchOperator: 'AND', rules: [defaultRule(firstFact)] };
}

export function initialForm(timezone: string, currency: string, firstFact: FactDefinition): FormState {
  return {
    campaignName: '',
    isEnabled: true,
    timezone,
    currency,
    scheduleMode: 'continuous',
    startAt: '',
    endAt: '',
    deliveryMode: 'IMMEDIATE',
    deliveryDays: '0',
    deliveryTime: '10:00',
    expiryMode: 'NEVER',
    expiryDays: '0',
    expiryTime: '23:59',
    tiers: [emptyTier(firstFact)],
  };
}

export function optionsFor(
  kind: FactValueKind,
  catalog: FactCatalog,
  products: Product[],
): { value: string; label: string }[] {
  switch (kind) {
    case 'customerTags':
      return catalog.options.customerTags.map((t) => ({ value: t, label: t }));
    case 'collections':
      return catalog.options.collections.map((t) => ({ value: t, label: t }));
    case 'productTags':
      return catalog.options.productTags.map((t) => ({ value: t, label: t }));
    case 'productTypes':
      return catalog.options.productTypes.map((t) => ({ value: t, label: t }));
    case 'currency':
      return catalog.options.currencies.map((c) => ({ value: c.code, label: c.code }));
    case 'products':
      return products.map((p) => ({ value: p.id, label: p.name }));
    case 'variants':
      return products.flatMap((p) => p.variants.map((v) => ({ value: v.variantId, label: `${p.name} — ${v.name}` })));
    default:
      return [];
  }
}

function leafToDraft(leaf: RuleLeaf): RuleDraft {
  const value = Array.isArray(leaf.value) ? (leaf.value as string[]) : String(leaf.value ?? '');
  return { fact: leaf.fact, operator: leaf.operator, value };
}

export function fromDetail(c: CampaignDetail): FormState {
  return {
    campaignName: c.campaignName,
    isEnabled: c.isEnabled,
    timezone: c.timezone,
    currency: c.currency,
    scheduleMode: c.startAt ? 'scheduled' : 'continuous',
    startAt: c.startAtLocal ? c.startAtLocal.slice(0, 16) : '',
    endAt: c.endAtLocal ? c.endAtLocal.slice(0, 16) : '',
    deliveryMode: c.deliveryMode,
    deliveryDays: String(c.deliveryDays ?? 0),
    deliveryTime: c.deliveryTime ?? '10:00',
    expiryMode: c.expiryMode,
    expiryDays: String(c.expiryDays ?? 0),
    expiryTime: c.expiryTime ?? '23:59',
    tiers: c.tiers.map((t) => ({
      valueType: t.valueType,
      value: String(t.value),
      matchOperator: t.ruleGroup.operator,
      rules: t.ruleGroup.children
        .filter((n): n is RuleLeaf => n.type === 'RULE')
        .map(leafToDraft),
    })),
  };
}

function ruleToNode(rule: RuleDraft, factByKey: Map<string, FactDefinition>): RuleLeaf {
  const kind = factByKey.get(rule.fact)?.valueKind;
  const value: unknown = kind === 'number' ? Number(rule.value) : rule.value;
  return { type: 'RULE', fact: rule.fact, operator: rule.operator as RuleOperator, value };
}

export function toBody(form: FormState, factByKey: Map<string, FactDefinition>): CampaignBody {
  const scheduled = form.scheduleMode === 'scheduled';
  const afterDelivery = form.deliveryMode === 'AFTER_DAYS';
  const afterExpiry = form.expiryMode === 'AFTER_DAYS';
  return {
    campaignName: form.campaignName.trim(),
    isEnabled: form.isEnabled,
    timezone: form.timezone,
    startAt: scheduled && form.startAt ? form.startAt : null,
    endAt: scheduled && form.endAt ? form.endAt : null,
    deliveryMode: form.deliveryMode,
    deliveryDays: afterDelivery ? Number(form.deliveryDays) : null,
    deliveryTime: afterDelivery ? form.deliveryTime : null,
    expiryMode: form.expiryMode,
    expiryDays: afterExpiry ? Number(form.expiryDays) : null,
    expiryTime: afterExpiry ? form.expiryTime : null,
    currency: form.currency || null,
    tiers: form.tiers.map((t) => ({
      valueType: t.valueType,
      value: t.valueType === 'PERCENTAGE' ? Number(t.value) : t.value,
      ruleGroup: { type: 'GROUP', operator: t.matchOperator, children: t.rules.map((r) => ruleToNode(r, factByKey)) },
    })),
  };
}
