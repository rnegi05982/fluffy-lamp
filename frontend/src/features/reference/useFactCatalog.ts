import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type FactCategory = 'CUSTOMER' | 'CART' | 'PRODUCT';
export type FactValueKind =
  | 'customerTags'
  | 'money'
  | 'moneyWithCurrency'
  | 'number'
  | 'currency'
  | 'products'
  | 'variants'
  | 'collections'
  | 'productTags'
  | 'productTypes';

export interface FactDefinition {
  key: string;
  category: FactCategory;
  label: string;
  description: string;
  operators: string[];
  valueKind: FactValueKind;
}

export interface FactCatalog {
  facts: FactDefinition[];
  options: {
    currencies: { code: string; name: string }[];
    collections: string[];
    productTypes: string[];
    productTags: string[];
    customerTags: string[];
  };
}

export function useFactCatalog() {
  return useQuery({
    queryKey: ['fact-catalog'],
    queryFn: () => api.get<FactCatalog>('/fact-catalog'),
    staleTime: Infinity,
  });
}
