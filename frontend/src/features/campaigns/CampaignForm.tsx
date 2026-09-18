import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Segmented } from '@/components/ui/Segmented';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppStore } from '@/store/appStore';
import { getApiErrorMessage } from '@/lib/api';
import { useReference } from '@/features/reference/useReference';
import { useFactCatalog, type FactDefinition } from '@/features/reference/useFactCatalog';
import { useProducts } from '@/features/products/useProducts';
import { useStores } from '@/features/stores/useStores';
import { useCampaign, useSaveCampaign } from './detail';
import {
  fromDetail,
  initialForm,
  isArrayKind,
  optionsFor,
  toBody,
  defaultRule,
  emptyTier,
  type FormState,
  type RuleDraft,
  type TierDraft,
} from './campaignFormModel';
import styles from './CampaignForm.module.css';

export function CampaignForm() {
  const storeId = useAppStore((s) => s.activeStoreId);
  const campaignId = useAppStore((s) => s.activeEntityId);
  const navigate = useAppStore((s) => s.navigate);
  const isEdit = Boolean(campaignId);

  const { data: reference } = useReference();
  const { data: catalog } = useFactCatalog();
  const { data: products } = useProducts();
  const { data: stores } = useStores();
  const { data: existing } = useCampaign(campaignId);
  const save = useSaveCampaign(storeId, campaignId);

  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | undefined>();

  const activeStore = stores?.items.find((s) => s.id === storeId);
  const factByKey = useMemo(
    () => new Map((catalog?.facts ?? []).map((f) => [f.key, f])),
    [catalog],
  );

  // Initialize the form once the data it needs is available.
  useEffect(() => {
    if (form || !catalog || catalog.facts.length === 0) return;
    const firstFact = catalog.facts[0] as FactDefinition;
    if (isEdit) {
      if (existing) setForm(fromDetail(existing));
    } else if (activeStore) {
      setForm(initialForm(activeStore.timezone, activeStore.currency, firstFact));
    }
  }, [form, catalog, existing, isEdit, activeStore]);

  if (!reference || !catalog || !products || !form) {
    return (
      <div className={styles.page}>
        <Skeleton height={38} width={260} />
        <Skeleton height={200} />
      </div>
    );
  }

  const currencyOptions = reference.currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  const tzOptions = reference.timezones.map((t) => ({ value: t, label: t }));
  const firstFact = catalog.facts[0] as FactDefinition;

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const updateTier = (i: number, patch: Partial<TierDraft>) =>
    setForm((f) => (f ? { ...f, tiers: f.tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) } : f));

  const updateRule = (ti: number, ri: number, patch: Partial<RuleDraft>) =>
    updateTier(ti, {
      rules: form.tiers[ti]?.rules.map((r, idx) => (idx === ri ? { ...r, ...patch } : r)) ?? [],
    });

  const changeFact = (ti: number, ri: number, factKey: string) => {
    const fact = factByKey.get(factKey);
    if (fact) updateRule(ti, ri, defaultRule(fact));
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    if (!form.campaignName.trim()) return setError('Campaign name is required');
    if (!form.currency) return setError('Currency is required');
    if (form.scheduleMode === 'scheduled' && (!form.startAt || !form.endAt))
      return setError('A scheduled campaign needs both a start and an end');
    for (const tier of form.tiers) {
      if (!tier.value || Number(tier.value) <= 0) return setError('Each tier needs a value greater than 0');
      if (tier.rules.length === 0) return setError('Each tier needs at least one rule');
    }
    save.mutate(toBody(form, factByKey), {
      onSuccess: () => {
        toast.success(isEdit ? 'Campaign updated' : 'Campaign created');
        navigate('campaigns');
      },
      onError: (err) => setError(getApiErrorMessage(err)),
    });
  };

  return (
    <form className={styles.page} onSubmit={submit}>
      <div className={styles.headerRow}>
        <Breadcrumbs
          items={[
            { home: true, view: 'home' },
            { label: 'Campaigns', view: 'campaigns' },
            { label: isEdit ? 'Edit campaign' : 'New campaign' },
          ]}
        />
        <div className={styles.headerActions}>
          <label className={styles.enable}>
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) => set({ isEnabled: e.target.checked })}
            />
            Enabled
          </label>
          <Button type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create campaign'}
          </Button>
        </div>
      </div>

      <h1 className={styles.title}>{isEdit ? 'Edit campaign' : 'New campaign'}</h1>
      {error && <div className={styles.error}>{error}</div>}

      {/* Section A — settings */}
      <Card>
        <h2 className={styles.section}>Core details</h2>
        <div className={styles.grid}>
          <FormField label="Campaign name" htmlFor="c-name">
            <Input id="c-name" value={form.campaignName} onChange={(e) => set({ campaignName: e.target.value })} placeholder="e.g. Summer Saver" />
          </FormField>
          <FormField label="Timezone">
            <Select value={form.timezone} onChange={(v) => set({ timezone: v })} options={tzOptions} />
          </FormField>
          <FormField label="Currency" hint="Fixed cashback + money rule values use this">
            <Select value={form.currency} onChange={(v) => set({ currency: v })} options={currencyOptions} placeholder="Select a currency" />
          </FormField>
        </div>

        <h2 className={styles.section}>Timing &amp; schedule</h2>
        <Segmented
          value={form.scheduleMode}
          onChange={(v) => set({ scheduleMode: v as FormState['scheduleMode'] })}
          options={[
            { value: 'continuous', label: 'Run continuously' },
            { value: 'scheduled', label: 'Run on a schedule' },
          ]}
        />
        {form.scheduleMode === 'scheduled' && (
          <div className={styles.grid}>
            <FormField label="Start (campaign time)">
              <Input type="datetime-local" value={form.startAt} onChange={(e) => set({ startAt: e.target.value })} />
            </FormField>
            <FormField label="End (campaign time)">
              <Input type="datetime-local" value={form.endAt} onChange={(e) => set({ endAt: e.target.value })} />
            </FormField>
          </div>
        )}

        <h2 className={styles.section}>Delivery &amp; expiration</h2>
        <p className={styles.help}>
          After N days = <strong>(order/credit date + days + 1) at the given time</strong>, in the campaign timezone.
          <strong> Day 0 = next day.</strong> Example: order Oct 11, delivery “after 0 days, 10:00” → credited Oct 12 10:00.
        </p>
        <div className={styles.grid}>
          <FormField label="Delivery">
            <Segmented
              value={form.deliveryMode}
              onChange={(v) => set({ deliveryMode: v as FormState['deliveryMode'] })}
              options={[
                { value: 'IMMEDIATE', label: 'Immediate' },
                { value: 'AFTER_DAYS', label: 'After N days' },
              ]}
            />
          </FormField>
          {form.deliveryMode === 'AFTER_DAYS' && (
            <>
              <FormField label="Delivery days" hint="0 = next day">
                <Input type="number" min={0} value={form.deliveryDays} onChange={(e) => set({ deliveryDays: e.target.value })} />
              </FormField>
              <FormField label="Delivery time">
                <Input type="time" value={form.deliveryTime} onChange={(e) => set({ deliveryTime: e.target.value })} />
              </FormField>
            </>
          )}
        </div>
        <div className={styles.grid}>
          <FormField label="Expiration">
            <Segmented
              value={form.expiryMode}
              onChange={(v) => set({ expiryMode: v as FormState['expiryMode'] })}
              options={[
                { value: 'NEVER', label: 'Never' },
                { value: 'AFTER_DAYS', label: 'After N days' },
              ]}
            />
          </FormField>
          {form.expiryMode === 'AFTER_DAYS' && (
            <>
              <FormField label="Expiry days" hint="0 = next day">
                <Input type="number" min={0} value={form.expiryDays} onChange={(e) => set({ expiryDays: e.target.value })} />
              </FormField>
              <FormField label="Expiry time">
                <Input type="time" value={form.expiryTime} onChange={(e) => set({ expiryTime: e.target.value })} />
              </FormField>
            </>
          )}
        </div>
      </Card>

      {/* Section B + C — tiers */}
      <div className={styles.tiersHead}>
        <h2 className={styles.section}>Tiers</h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={form.tiers.length >= 5}
          onClick={() => set({ tiers: [...form.tiers, emptyTier(firstFact)] })}
        >
          <Plus size={15} /> Add tier
        </Button>
      </div>

      {form.tiers.map((tier, ti) => (
        <Card key={ti}>
          <div className={styles.tierHead}>
            <span className={styles.tierRank}>Tier {ti + 1}</span>
            {form.tiers.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => set({ tiers: form.tiers.filter((_, idx) => idx !== ti) })}
                aria-label="Remove tier"
              >
                <Trash2 size={15} />
              </Button>
            )}
          </div>

          <div className={styles.grid}>
            <FormField label="Value type">
              <Segmented
                value={tier.valueType}
                onChange={(v) => updateTier(ti, { valueType: v as TierDraft['valueType'] })}
                options={[
                  { value: 'PERCENTAGE', label: 'Percentage' },
                  { value: 'FIXED', label: 'Fixed' },
                ]}
              />
            </FormField>
            <FormField label="Cashback value" hint={tier.valueType === 'PERCENTAGE' ? '0–100 %' : `Amount in ${form.currency || 'currency'}`}>
              <Input type="number" min={0} value={tier.value} onChange={(e) => updateTier(ti, { value: e.target.value })} />
            </FormField>
          </div>

          <div className={styles.ruleHead}>
            <span className={styles.ruleTitle}>Eligibility rules</span>
            <Segmented
              value={tier.matchOperator}
              onChange={(v) => updateTier(ti, { matchOperator: v as TierDraft['matchOperator'] })}
              options={[
                { value: 'AND', label: 'Match ALL' },
                { value: 'OR', label: 'Match ANY' },
              ]}
            />
          </div>

          {tier.rules.map((rule, ri) => {
            const fact = factByKey.get(rule.fact);
            return (
              <div key={ri} className={styles.ruleRow}>
                <Select
                  value={rule.fact}
                  onChange={(v) => changeFact(ti, ri, v)}
                  options={catalog.facts.map((f) => ({ value: f.key, label: f.label }))}
                />
                <Select
                  value={rule.operator}
                  onChange={(v) => updateRule(ti, ri, { operator: v })}
                  options={(fact?.operators ?? []).map((op) => ({ value: op, label: op }))}
                />
                <div className={styles.ruleValue}>
                  {fact && (
                    <RuleValueInput
                      rule={rule}
                      fact={fact}
                      currency={form.currency}
                      catalog={catalog}
                      products={products}
                      onChange={(patch) => updateRule(ti, ri, patch)}
                    />
                  )}
                </div>
                {tier.rules.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateTier(ti, { rules: tier.rules.filter((_, idx) => idx !== ri) })}
                    aria-label="Remove rule"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => updateTier(ti, { rules: [...tier.rules, defaultRule(firstFact)] })}
          >
            <Plus size={14} /> Add rule
          </Button>
        </Card>
      ))}
    </form>
  );
}

interface RuleValueInputProps {
  rule: RuleDraft;
  fact: FactDefinition;
  currency: string;
  catalog: NonNullable<ReturnType<typeof useFactCatalog>['data']>;
  products: NonNullable<ReturnType<typeof useProducts>['data']>;
  onChange: (patch: Partial<RuleDraft>) => void;
}

function RuleValueInput({ rule, fact, currency, catalog, products, onChange }: RuleValueInputProps) {
  if (isArrayKind(fact.valueKind)) {
    return (
      <MultiSelect
        options={optionsFor(fact.valueKind, catalog, products)}
        selected={Array.isArray(rule.value) ? rule.value : []}
        onChange={(sel) => onChange({ value: sel })}
      />
    );
  }
  const placeholder = fact.valueKind === 'money' ? `Amount (${currency || 'currency'})` : 'Value';
  return (
    <Input
      type="number"
      min={0}
      value={typeof rule.value === 'string' ? rule.value : ''}
      onChange={(e) => onChange({ value: e.target.value })}
      placeholder={placeholder}
    />
  );
}
