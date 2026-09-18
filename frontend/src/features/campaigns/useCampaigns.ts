import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CampaignListItem } from './types';

export function useCampaigns(storeId: string | null, page: number, search: string) {
  return useQuery({
    queryKey: ['campaigns', storeId, page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      return api.getList<CampaignListItem>(`/stores/${storeId}/campaigns?${params.toString()}`);
    },
    enabled: Boolean(storeId),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteCampaign(storeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ id: string }>(`/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns', storeId] }),
  });
}
