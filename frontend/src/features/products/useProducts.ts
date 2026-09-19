import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Money } from '@/lib/format';

export interface ProductVariant {
  variantId: string;
  name: string;
  price: Money;
}

export interface Product {
  id: string;
  name: string;
  productType: string;
  collections: string[];
  tags: string[];
  currency: string;
  variants: ProductVariant[];
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/products'),
    staleTime: Infinity,
  });
}
