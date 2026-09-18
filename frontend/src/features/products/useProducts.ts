import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ProductVariant {
  variantId: string;
  name: string;
  price: { amount: string; currency: string };
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
