import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Money } from '@/lib/format';

export interface CustomerListRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tags: string[];
  storeBalance: Money;
  storeCurrency: string;
  lastCreditedAt: string | null;
}

export interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tags: string[];
  currency: string;
  timezone: string;
}

export interface CustomerBalance {
  view: 'store' | 'user';
  currency: string;
  timezone: string;
  balance: Money;
  pending: Money;
}

export interface LedgerTx {
  id: string;
  type: 'SCHEDULED' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  campaignId: string | null;
  campaignName: string | null;
  storeId?: string;
  storeName?: string | null;
  amount: Money;
  originalAmount: Money;
  deliverAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function useCustomerListForStore(storeId: string | null) {
  return useQuery({
    queryKey: ['customers', storeId],
    queryFn: () => api.get<CustomerListRow[]>(`/customers?storeId=${storeId}`),
    enabled: Boolean(storeId),
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get<CustomerDetail>(`/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useBalance(id: string | null, storeId: string | undefined) {
  return useQuery({
    queryKey: ['balance', id, storeId ?? 'global'],
    queryFn: () => api.get<CustomerBalance>(`/customers/${id}/balance${storeId ? `?storeId=${storeId}` : ''}`),
    enabled: Boolean(id),
  });
}

export function useTransactions(
  id: string | null,
  storeId: string | undefined,
  type: string | undefined,
  page: number,
) {
  return useQuery({
    queryKey: ['transactions', id, storeId ?? 'global', type ?? 'all', page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (storeId) params.set('storeId', storeId);
      if (type) params.set('type', type);
      return api.getList<LedgerTx>(`/customers/${id}/transactions?${params.toString()}`);
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}
