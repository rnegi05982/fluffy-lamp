import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useReference } from '@/features/reference/useReference';
import { useAppStore } from '@/store/appStore';
import { ApiError, getApiErrorMessage } from '@/lib/api';
import { useCreateStore } from './useStores';
import styles from './StoreForm.module.css';

export function StoreForm({ onDone }: { onDone: () => void }) {
  const { data: reference } = useReference();
  const createStore = useCreateStore();
  const setActiveStore = useAppStore((s) => s.setActiveStore);

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();

  const currencyOptions = reference?.currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })) ?? [];
  const tzOptions = reference?.timezones.map((t) => ({ value: t, label: t })) ?? [];
  const canSubmit = name.trim() !== '' && timezone !== '' && currency !== '';

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNameError(undefined);
    if (!canSubmit) return;
    createStore.mutate(
      { name: name.trim(), timezone, currency },
      {
        onSuccess: (store) => {
          setActiveStore(store.id);
          toast.success('Store created');
          onDone();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'DUPLICATE_STORE_NAME') {
            setNameError('A store with this name already exists');
          } else {
            toast.error(getApiErrorMessage(err));
          }
        },
      },
    );
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <FormField label="Store name" htmlFor="store-name" error={nameError}>
        <Input
          id="store-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aurora Outfitters"
          invalid={Boolean(nameError)}
          autoFocus
        />
      </FormField>
      <FormField label="Timezone" htmlFor="store-tz">
        <Select value={timezone} onChange={setTimezone} options={tzOptions} placeholder="Select a timezone" />
      </FormField>
      <FormField label="Currency" htmlFor="store-ccy">
        <Select value={currency} onChange={setCurrency} options={currencyOptions} placeholder="Select a currency" />
      </FormField>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={createStore.isPending} disabled={!canSubmit}>
          Create store
        </Button>
      </div>
    </form>
  );
}
