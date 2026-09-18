import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type RuleOperator = 'GTE' | 'LTE' | 'EQ' | 'IS' | 'IS_NOT';

export interface RuleLeaf {
  type: 'RULE';
  fact: string;
  operator: RuleOperator;
  value: unknown;
  params?: { currency?: string };
}

export interface RuleGroupNode {
  type: 'GROUP';
  operator: 'AND' | 'OR';
  children: Array<RuleLeaf | RuleGroupNode>;
}

export interface TierDetail {
  tierId: string;
  rank: number;
  valueType: 'PERCENTAGE' | 'FIXED';
  value: string | number;
  ruleGroup: RuleGroupNode;
}

export interface CampaignDetail {
  id: string;
  storeId: string;
  campaignName: string;
  isEnabled: boolean;
  status: string;
  timezone: string;
  startAt: string | null;
  endAt: string | null;
  startAtLocal: string | null;
  endAtLocal: string | null;
  deliveryMode: 'IMMEDIATE' | 'AFTER_DAYS';
  deliveryDays: number | null;
  deliveryTime: string | null;
  expiryMode: 'NEVER' | 'AFTER_DAYS';
  expiryDays: number | null;
  expiryTime: string | null;
  currency: string;
  version: number;
  tiers: TierDetail[];
}

export interface CampaignBody {
  campaignName: string;
  isEnabled: boolean;
  timezone: string;
  startAt: string | null;
  endAt: string | null;
  deliveryMode: 'IMMEDIATE' | 'AFTER_DAYS';
  deliveryDays: number | null;
  deliveryTime: string | null;
  expiryMode: 'NEVER' | 'AFTER_DAYS';
  expiryDays: number | null;
  expiryTime: string | null;
  currency: string | null;
  tiers: Array<{
    valueType: 'PERCENTAGE' | 'FIXED';
    value: number | string;
    ruleGroup: RuleGroupNode;
  }>;
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get<CampaignDetail>(`/campaigns/${id}`),
    enabled: Boolean(id),
  });
}

export function useSaveCampaign(storeId: string | null, campaignId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CampaignBody) =>
      campaignId
        ? api.put<CampaignDetail>(`/campaigns/${campaignId}`, body)
        : api.post<CampaignDetail>(`/stores/${storeId}/campaigns`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', storeId] });
      if (campaignId) qc.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });
}
