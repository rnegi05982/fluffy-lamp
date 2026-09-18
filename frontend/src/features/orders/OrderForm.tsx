import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppStore } from '@/store/appStore';
import { getApiErrorMessage } from '@/lib/api';
import { useReference } from '@/features/reference/useReference';
import { useProducts } from '@/features/products/useProducts';
import { useCustomers } from '@/features/customers/useCustomers';
import { useStores } from '@/features/stores/useStores';
import { useProcessOrder, type OrderOutcome } from './useProcessOrder';
import styles from './OrderForm.module.css';

interface LineItemDraft {
  productId: string;
  variantId: string;
  quantity: number;
}

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function announce(outcome: OrderOutcome) {
  if (outcome.cashbackError) {
    toast.warning('Order saved — cashback could not be computed', { description: outcome.cashbackError });
    return;
  }
  if (outcome.outcome === 'CASHBACK_EARNED' && outcome.cashback && outcome.selectedCampaign) {
    const c = outcome.cashback;
    const when = c.delivery === 'IMMEDIATE' ? 'credited now' : `scheduled for ${c.deliverAt?.slice(0, 10)}`;
    toast.success(`${outcome.selectedCampaign.campaignName}: ${c.baseAmount} ${c.baseCurrency}`, {
      description: `Cashback ${when}.`,
    });
    return;
  }
  toast('No cashback earned', { description: outcome.reason ?? 'No qualifying campaign for this order.' });
}

export function OrderForm() {
  const storeId = useAppStore((s) => s.activeStoreId);
  const { data: reference } = useReference();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const { data: stores } = useStores();
  const process = useProcessOrder();

  const activeStore = stores?.items.find((s) => s.id === storeId);

  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [orderAmount, setOrderAmount] = useState('');
  const [orderCurrency, setOrderCurrency] = useState('');
  const [orderTimezone, setOrderTimezone] = useState('');
  const [createdAt, setCreatedAt] = useState(nowLocalInput());
  const [error, setError] = useState<string | undefined>();

  // Default currency + timezone to the active store's once it resolves.
  useEffect(() => {
    if (!activeStore) return;
    setOrderCurrency((c) => c || activeStore.currency);
    setOrderTimezone((t) => t || activeStore.timezone);
  }, [activeStore]);

  if (!storeId || !activeStore) {
    return <EmptyState title="No store selected" description="Pick a store on the home screen first." />;
  }
  if (!reference || !products || !customers) {
    return (
      <div className={styles.page}>
        <Skeleton height={38} width={220} />
        <Skeleton height={280} />
      </div>
    );
  }

  const productsById = new Map(products.map((p) => [p.id, p]));

  const onProductsChange = (selected: string[]) => {
    setLineItems((prev) => {
      const kept = prev.filter((li) => selected.includes(li.productId));
      const added = selected
        .filter((id) => !prev.some((li) => li.productId === id))
        .map((id) => ({
          productId: id,
          variantId: productsById.get(id)?.variants[0]?.variantId ?? '',
          quantity: 1,
        }));
      return [...kept, ...added];
    });
  };

  const updateLine = (productId: string, patch: Partial<LineItemDraft>) =>
    setLineItems((prev) => prev.map((li) => (li.productId === productId ? { ...li, ...patch } : li)));

  const clear = () => {
    setCustomerId('');
    setLineItems([]);
    setOrderAmount('');
    setCreatedAt(nowLocalInput());
    setError(undefined);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    if (!customerId) return setError('Select a user');
    if (lineItems.length === 0) return setError('Select at least one product');
    if (lineItems.some((li) => !li.variantId || li.quantity < 1)) return setError('Each product needs a variant and quantity');
    if (!orderAmount || Number(orderAmount) <= 0) return setError('Order amount must be greater than 0');

    process.mutate(
      {
        storeId,
        customerId,
        lineItems,
        orderAmount,
        orderCurrency,
        orderCreatedAt: createdAt,
        orderTimezone,
      },
      {
        onSuccess: (outcome) => {
          announce(outcome);
          clear();
        },
        onError: (err) => {
          const message = getApiErrorMessage(err);
          setError(message);
          toast.error(message);
        },
      },
    );
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.firstName} ${c.lastName} — ${c.email}${c.tags.length ? ` (${c.tags.join(', ')})` : ''}`,
  }));
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));
  const currencyOptions = reference.currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  const tzOptions = reference.timezones.map((t) => ({ value: t, label: t }));

  return (
    <form className={styles.page} onSubmit={submit}>
      <Breadcrumbs items={[{ home: true, view: 'home' }, { label: 'New order' }]} />
      <h1 className={styles.title}>New order</h1>
      {error && <div className={styles.error}>{error}</div>}

      <Card>
        <div className={styles.fields}>
          <FormField label="Store">
            <Input value={activeStore.name} readOnly disabled />
          </FormField>

          <FormField label="User">
            <Select value={customerId} onChange={setCustomerId} options={customerOptions} placeholder="Select a user" />
          </FormField>

          <FormField label="Products" hint="Each selected product becomes a line below">
            <MultiSelectDropdown
              options={productOptions}
              selected={lineItems.map((li) => li.productId)}
              onChange={onProductsChange}
              placeholder="Select products"
            />
          </FormField>

          {lineItems.length > 0 && (
            <div className={styles.lines}>
              {lineItems.map((li) => {
                const product = productsById.get(li.productId);
                return (
                  <div key={li.productId} className={styles.lineRow}>
                    <span className={styles.lineName}>{product?.name}</span>
                    <Select
                      value={li.variantId}
                      onChange={(v) => updateLine(li.productId, { variantId: v })}
                      options={(product?.variants ?? []).map((v) => ({ value: v.variantId, label: v.name }))}
                    />
                    <Input
                      type="number"
                      min={1}
                      value={String(li.quantity)}
                      onChange={(e) => updateLine(li.productId, { quantity: Number(e.target.value) })}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.grid}>
            <FormField label="Order amount" hint="Authoritative cart total">
              <Input type="number" min={0} value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="Order currency">
              <Select value={orderCurrency} onChange={setOrderCurrency} options={currencyOptions} />
            </FormField>
          </div>

          <div className={styles.grid}>
            <FormField label="Order created at">
              <Input type="datetime-local" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} />
            </FormField>
            <FormField label="Order timezone">
              <Select value={orderTimezone} onChange={setOrderTimezone} options={tzOptions} />
            </FormField>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={clear}>
              Clear
            </Button>
            <Button type="submit" loading={process.isPending}>
              Process Order
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
