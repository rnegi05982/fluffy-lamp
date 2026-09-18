export type CampaignStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export interface CampaignListItem {
  id: string;
  campaignName: string;
  status: CampaignStatus;
  timezone: string;
  startAt: string | null;
  endAt: string | null;
  startAtLocal: string | null;
  endAtLocal: string | null;
  currency: string;
  tierCount: number;
}
