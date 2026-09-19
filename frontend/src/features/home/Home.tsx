import { useEffect, useState } from "react";
import {
  Store as StoreIcon,
  Plus,
  ShoppingCart,
  Percent,
  Users,
  ChevronRight,
} from "lucide-react";
import type { View } from "@/store/appStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStores } from "@/features/stores/useStores";
import { StoreForm } from "@/features/stores/StoreForm";
import { useAppStore } from "@/store/appStore";
import styles from "./Home.module.css";

const TILES: {
  view: View;
  icon: typeof ShoppingCart;
  title: string;
  desc: string;
}[] = [
  {
    view: "order-form",
    icon: ShoppingCart,
    title: "New Order",
    desc: "Simulate an order and run the cashback engine.",
  },
  {
    view: "campaigns",
    icon: Percent,
    title: "Campaigns",
    desc: "Create and manage cashback campaigns.",
  },
  {
    view: "customers",
    icon: Users,
    title: "Customers",
    desc: "View customers and their cashback balances.",
  },
];

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
      <ErrorState message="Couldn't load stores." onRetry={() => refetch()} />
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
        <Dialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Create store"
        >
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
          <Select
            value={activeStore.id}
            onChange={setActiveStore}
            options={storeOptions}
          />
        </div>
        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Create store
        </Button>
      </div>

      <Card>
        <div className={styles.detailsTop}>
          <span className={styles.storeChip}>
            <StoreIcon size={18} />
          </span>
          <div className={styles.detailsHead}>Active store</div>
        </div>
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
        {TILES.map((t) => (
          <button
            key={t.view}
            className={styles.tile}
            onClick={() => navigate(t.view)}
          >
            <span className={styles.tileIcon}>
              <t.icon size={20} />
            </span>
            <span className={styles.tileBody}>
              <span className={styles.tileTitle}>{t.title}</span>
              <span className={styles.tileDesc}>{t.desc}</span>
            </span>
            <ChevronRight className={styles.tileArrow} size={18} />
          </button>
        ))}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create store"
      >
        <StoreForm onDone={() => setCreateOpen(false)} />
      </Dialog>
    </div>
  );
}
