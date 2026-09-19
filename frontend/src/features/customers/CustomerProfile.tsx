import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Segmented } from '@/components/ui/Segmented';
import { Tabs } from '@/components/ui/Tabs';
import { Table, TableSkeleton, TableEmptyRow } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppStore } from '@/store/appStore';
import { formatInTz, formatMoney } from '@/lib/format';
import { useCustomer, useBalance, useTransactions, type LedgerTx } from './queries';
import styles from './CustomerProfile.module.css';

const TYPE_TONE: Record<LedgerTx['type'], BadgeTone> = {
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  FAILED: 'failed',
};

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
];

function tabToType(tab: string): string | undefined {
  if (tab === 'scheduled') return 'SCHEDULED';
  if (tab === 'expired') return 'EXPIRED';
  return undefined;
}

/** The event date for a row's status — no status word (the badge conveys that). */
function eventDate(tx: LedgerTx, tz: string): string {
  if (tx.type === 'SCHEDULED') return formatInTz(tx.deliverAt, tz);
  if (tx.type === 'COMPLETED') return formatInTz(tx.deliverAt ?? tx.createdAt, tz);
  return formatInTz(tx.createdAt, tz); // EXPIRED / FAILED
}

export function CustomerProfile() {
  const id = useAppStore((s) => s.activeEntityId);
  const activeStoreId = useAppStore((s) => s.activeStoreId);

  const [view, setView] = useState<'store' | 'user'>('store');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  const storeIdForView = view === 'store' ? (activeStoreId ?? undefined) : undefined;
  const { data: customer } = useCustomer(id);
  const { data: balance } = useBalance(id, storeIdForView);
  const { data: txData, isLoading: txLoading } = useTransactions(id, storeIdForView, tabToType(tab), page);

  if (!id) {
    return <EmptyState title="No customer selected" description="Open a customer from the list." />;
  }

  const viewTz = balance?.timezone ?? 'UTC';
  const items = txData?.items ?? [];
  const meta = txData?.meta;
  const isUserView = view === 'user';
  const colCount = isUserView ? 6 : 5;

  const changeView = (v: string) => {
    setView(v as 'store' | 'user');
    setPage(1);
  };
  const changeTab = (t: string) => {
    setTab(t);
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <Breadcrumbs
          items={[
            { home: true, view: 'home' },
            { label: 'Customers', view: 'customers' },
            { label: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer' },
          ]}
        />
        <Segmented
          value={view}
          onChange={changeView}
          options={[
            { value: 'store', label: 'Store view' },
            { value: 'user', label: 'User view' },
          ]}
        />
      </div>

      {customer ? (
        <div className={styles.identity}>
          <h1 className={styles.name}>
            {customer.firstName} {customer.lastName}
          </h1>
          <span className={styles.email}>{customer.email}</span>
          {customer.tags.length > 0 && (
            <div className={styles.tags}>
              {customer.tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Skeleton height={32} width={220} />
      )}

      <Card>
        <div className={styles.balanceLabel}>
          Cashback balance · {isUserView ? 'all stores' : 'this store'}
        </div>
        {balance ? (
          <div className={styles.balanceValue}>{formatMoney(balance.balance)}</div>
        ) : (
          <Skeleton height={28} width={120} />
        )}
        <div className={styles.balanceSub}>Shown in {balance?.currency ?? '—'} · {viewTz}</div>
      </Card>

      <Tabs tabs={TABS} value={tab} onChange={changeTab} />

      <Table>
        <thead>
          <tr>
            <th>Campaign</th>
            {isUserView && <th>Store</th>}
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {txLoading ? (
            <TableSkeleton rows={4} cols={colCount} />
          ) : items.length === 0 ? (
            <TableEmptyRow colSpan={colCount}>
              <EmptyState title="No transactions" />
            </TableEmptyRow>
          ) : (
            items.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.campaignName ?? '—'}</td>
                {isUserView && <td className={styles.muted}>{tx.storeName ?? '—'}</td>}
                <td>{formatMoney(tx.amount)}</td>
                <td>
                  <Badge tone={TYPE_TONE[tx.type]}>{tx.type[0] + tx.type.slice(1).toLowerCase()}</Badge>
                </td>
                <td className={styles.muted}>{eventDate(tx, viewTz)}</td>
                <td className={styles.muted}>{formatInTz(tx.expiresAt, viewTz)}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {meta && items.length > 0 && (
        <Pagination page={meta.page} limit={meta.limit} total={meta.total} hasMore={meta.hasMore} onPage={setPage} />
      )}
    </div>
  );
}
