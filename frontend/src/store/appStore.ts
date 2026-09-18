import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** State-driven navigation within a single fixed URL (no router). */
export type View =
  | 'home'
  | 'campaigns'
  | 'campaign-form'
  | 'customers'
  | 'customer-profile'
  | 'order-form';

interface AppState {
  activeStoreId: string | null;
  currentView: View;
  /** Context id for detail/edit views (campaign id, customer id). */
  activeEntityId: string | null;
  setActiveStore: (storeId: string | null) => void;
  navigate: (view: View, entityId?: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeStoreId: null,
      currentView: 'home',
      activeEntityId: null,
      setActiveStore: (storeId) => set({ activeStoreId: storeId }),
      navigate: (view, entityId = null) => set({ currentView: view, activeEntityId: entityId }),
    }),
    {
      name: 'cashback-admin',
      // Only the active store persists; the current view resets to home on reload.
      partialize: (state) => ({ activeStoreId: state.activeStoreId }),
    },
  ),
);
