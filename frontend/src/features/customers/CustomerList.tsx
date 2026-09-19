import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableSkeleton, TableEmptyRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAppStore } from '@/store/appStore';
import { useStores } from '@/features/stores/useStores';
import { formatInTz, formatMoney } from '@/lib/format';
import { useCustomerListForStore } from './queries';
import styles from './CustomerList.module.css';

export function CustomerList() {
  const storeId = useAppStore((s) => s.activeStoreId);
  const navigate = useAppStore((s) => s.navigate);
  const { data: stores } = useStores();
  const { data, isLoading, isError, refetch } = useCustomerListForStore(storeId);
  const [search, setSearch] = useState('');

  const activeStore = stores?.items.find((s) => s.id === storeId);

  if (!storeId || !activeStore) {
    return <EmptyState title="No store selected" description="Pick a store on the home screen first." />;
  }

  const rows = (data ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className={styles.page}>
      <Breadcrumbs items={[{ home: true, view: 'home' }, { label: 'Customers' }]} />
      <PageHeader
        title="Customers"
        actions={
          <Input
            className={styles.search}
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />
      <p className={styles.note}>Balances shown for {activeStore.name} ({activeStore.currency}).</p>

      {isError ? (
        <ErrorState message="Couldn't load customers." onRetry={() => refetch()} />
      ) : (
        <Table>
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '32%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Balance</th>
              <th>Last credited</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : rows.length === 0 ? (
              <TableEmptyRow colSpan={4}>
                <EmptyState title={search ? `No customers match “${search}”` : 'No customers'} />
              </TableEmptyRow>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className={styles.row} onClick={() => navigate('customer-profile', c.id)}>
                  <td className={styles.name}>{c.firstName} {c.lastName}</td>
                  <td className={styles.muted}>{c.email}</td>
                  <td>{formatMoney(c.storeBalance)}</td>
                  <td className={styles.muted}>
                    {c.lastCreditedAt ? formatInTz(c.lastCreditedAt, activeStore.timezone) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
