import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ProcessOrderRequest {
  storeId: string;
  customerId: string;
  lineItems: { productId: string; variantId: string; quantity: number }[];
  orderAmount: string;
  orderCurrency: string;
  orderCreatedAt: string;
  orderTimezone: string;
}

export interface OrderResult {
  orderId: string;
}

export function useProcessOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProcessOrderRequest) => api.post<OrderResult>('/orders/process', body),
    onSuccess: () => {
      // Balances / ledgers changed — refresh customer views.
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
