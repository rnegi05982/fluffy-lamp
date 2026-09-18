import { Home } from '@/features/home/Home';
import { Campaigns } from '@/features/campaigns/Campaigns';
import { CampaignForm } from '@/features/campaigns/CampaignForm';
import { OrderForm } from '@/features/orders/OrderForm';
import { CustomerList } from '@/features/customers/CustomerList';
import { CustomerProfile } from '@/features/customers/CustomerProfile';
import { useStores } from '@/features/stores/useStores';
import { useAppStore } from '@/store/appStore';
import styles from './App.module.css';

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
        {currentView === 'customers' && <CustomerList />}
        {currentView === 'customer-profile' && <CustomerProfile />}
      </main>
    </div>
  );
}
