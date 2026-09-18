import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CustomerIdentity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tags: string[];
}

/** Identity list (no storeId) — used by the order form's user picker. */
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<CustomerIdentity[]>('/customers'),
    staleTime: 60_000,
  });
}
