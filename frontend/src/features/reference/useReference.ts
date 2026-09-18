import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Reference {
  currencies: { code: string; name: string }[];
  timezones: string[];
}

export function useReference() {
  return useQuery({
    queryKey: ['reference'],
    queryFn: () => api.get<Reference>('/reference'),
    staleTime: Infinity,
  });
}
