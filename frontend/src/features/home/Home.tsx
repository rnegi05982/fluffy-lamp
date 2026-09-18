import { useEffect, useState } from 'react';
import { Store as StoreIcon, Plus, ShoppingCart, Percent, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStores } from '@/features/stores/useStores';
import { StoreForm } from '@/features/stores/StoreForm';
import { useAppStore } from '@/store/appStore';
import styles from './Home.module.css';

export function Home() {
  const { data, isLoading, isError, refetch } = useStores();
  const activeStoreId = useAppStore((s) => s.activeStoreId);
  const setActiveStore = useAppStore((s) => s.setActiveStore);
  const navigate = useAppStore((s) => s.navigate);
  const [createOpen, setCreateOpen] = useState(false);

  const stores = data?.items ?? [];

  // Resolve the active store: keep the persisted one if it still exists, else the first.
  useEffect(() => {
    const first = stores[0];
    if (!first) return;
    if (!activeStoreId || !stores.some((s) => s.id === activeStoreId)) {
      setActiveStore(first.id);
    }
  }, [stores, activeStoreId, setActiveStore]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton height={38} width={280} />
        <Skeleton height={120} />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <p className={styles.error}>
          Couldn&apos;t load stores.{' '}
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </p>
      </Card>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <EmptyState
          icon={StoreIcon}
          title="Create your first store to get started"
          description="A store holds its own campaigns, orders, and customers."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create store
            </Button>
          }
        />
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create store">
          <StoreForm onDone={() => setCreateOpen(false)} />
        </Dialog>
      </>
    );
  }

  const activeStore = stores.find((s) => s.id === activeStoreId) ?? stores[0];
  if (!activeStore) return null;
  const storeOptions = stores.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className={styles.page}>
      <div className={styles.switcherRow}>
        <div className={styles.switcher}>
          <Select value={activeStore.id} onChange={setActiveStore} options={storeOptions} />
        </div>
        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Create store
        </Button>
      </div>

      <Card>
        <div className={styles.detailsHead}>Active store</div>
        <div className={styles.detailsGrid}>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Name</span>
            <span className={styles.detailValue}>{activeStore.name}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Currency</span>
            <span className={styles.detailValue}>{activeStore.currency}</span>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Timezone</span>
            <span className={styles.detailValue}>{activeStore.timezone}</span>
          </div>
        </div>
      </Card>

      <div className={styles.tiles}>
        <button className={styles.tile} onClick={() => navigate('order-form')}>
          <ShoppingCart size={20} />
          <span>New Order</span>
        </button>
        <button className={styles.tile} onClick={() => navigate('campaigns')}>
          <Percent size={20} />
          <span>Campaigns</span>
        </button>
        <button className={styles.tile} onClick={() => navigate('customers')}>
          <Users size={20} />
          <span>Customers</span>
        </button>
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create store">
        <StoreForm onDone={() => setCreateOpen(false)} />
      </Dialog>
    </div>
  );
}
