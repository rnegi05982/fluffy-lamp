import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateStoreBody, Store } from './types';

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => api.getList<Store>('/stores?limit=100'),
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStoreBody) => api.post<Store>('/stores', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stores'] }),
  });
}
