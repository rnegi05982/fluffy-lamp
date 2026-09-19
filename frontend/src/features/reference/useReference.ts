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

/** Build currency dropdown options ("USD — US Dollar") from reference data. */
export function toCurrencyOptions(ref: Reference | undefined): { value: string; label: string }[] {
  return (ref?.currencies ?? []).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
}

/** Build timezone dropdown options from reference data. */
export function toTimezoneOptions(ref: Reference | undefined): { value: string; label: string }[] {
  return (ref?.timezones ?? []).map((t) => ({ value: t, label: t }));
}
