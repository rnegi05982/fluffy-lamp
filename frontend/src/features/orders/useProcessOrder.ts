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

export interface OrderOutcome {
  orderId: string;
  outcome: 'CASHBACK_EARNED' | 'NO_CASHBACK';
  selectedCampaign: { campaignId: string; campaignName: string; tierId: string; rank: number } | null;
  cashback: {
    originalAmount: string;
    originalCurrency: string;
    fxRate: number;
    baseAmount: string;
    baseCurrency: string;
    delivery: 'IMMEDIATE' | 'DELAYED';
    deliverAt: string | null;
    expiresAt: string | null;
  } | null;
  transactionId: string | null;
  reason: string | null;
  cashbackError: string | null;
}

export function useProcessOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProcessOrderRequest) => api.post<OrderOutcome>('/orders/process', body),
    onSuccess: () => {
      // Balances / ledgers changed — refresh customer views.
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
