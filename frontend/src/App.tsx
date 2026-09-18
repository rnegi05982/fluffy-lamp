import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Home } from '@/features/home/Home';
import { Campaigns } from '@/features/campaigns/Campaigns';
import { CampaignForm } from '@/features/campaigns/CampaignForm';
import { OrderForm } from '@/features/orders/OrderForm';
import { useStores } from '@/features/stores/useStores';
import { useAppStore } from '@/store/appStore';
import styles from './App.module.css';

function ComingSoon({ label }: { label: string }) {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <EmptyState
      title={`${label} — coming soon`}
      description="This screen is being built next."
      action={
        <Button variant="secondary" onClick={() => navigate('home')}>
          <ArrowLeft size={16} /> Back to home
        </Button>
      }
    />
  );
}

const VIEW_LABELS: Record<string, string> = {
  campaigns: 'Campaigns',
  'campaign-form': 'Campaign',
  customers: 'Customers',
  'customer-profile': 'Customer',
  'order-form': 'New Order',
};

export function App() {
  const currentView = useAppStore((s) => s.currentView);
  const activeStoreId = useAppStore((s) => s.activeStoreId);
  const navigate = useAppStore((s) => s.navigate);
  const { data } = useStores();
  const activeStore = data?.items.find((s) => s.id === activeStoreId);

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <button className={styles.brand} onClick={() => navigate('home')}>
          Cashback Admin
        </button>
        <span className={styles.storeLabel}>{activeStore ? activeStore.name : 'No store selected'}</span>
      </header>
      <main className={styles.main}>
        {currentView === 'home' && <Home />}
        {currentView === 'campaigns' && <Campaigns />}
        {currentView === 'campaign-form' && <CampaignForm />}
        {currentView === 'order-form' && <OrderForm />}
        {currentView !== 'home' &&
          currentView !== 'campaigns' &&
          currentView !== 'campaign-form' &&
          currentView !== 'order-form' && <ComingSoon label={VIEW_LABELS[currentView] ?? currentView} />}
      </main>
    </div>
  );
}
