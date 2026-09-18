import { useAppStore } from '@/store/appStore';
import styles from './App.module.css';

export function App() {
  const currentView = useAppStore((s) => s.currentView);

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <span className={styles.brand}>Cashback Admin</span>
        <span className={styles.storeLabel}>No store selected</span>
      </header>
      <main className={styles.main}>
        <p>Current view: {currentView} — screens coming next.</p>
      </main>
    </div>
  );
}
