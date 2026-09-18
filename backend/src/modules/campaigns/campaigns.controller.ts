import type { Request, Response } from 'express';
import { validated } from '../../middleware/validate';
import type { PaginationQuery } from '../../lib/pagination';
import {
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  archiveCampaign,
} from './campaigns.service';
import type {
  CampaignBodyInput,
  StoreIdParams,
  CampaignIdParams,
} from './campaigns.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const { storeId } = validated<StoreIdParams>(req, 'params');
  const query = validated<PaginationQuery>(req, 'query');
  const { items, meta } = await listCampaigns(storeId, query);
  res.json({ data: items, meta });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { storeId } = validated<StoreIdParams>(req, 'params');
  const input = validated<CampaignBodyInput>(req, 'body');
  const campaign = await createCampaign(storeId, input);
  res.status(201).json({ data: campaign });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validated<CampaignIdParams>(req, 'params');
  const campaign = await getCampaign(id);
  res.json({ data: campaign });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = validated<CampaignIdParams>(req, 'params');
  const input = validated<CampaignBodyInput>(req, 'body');
  const campaign = await updateCampaign(id, input);
  res.json({ data: campaign });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = validated<CampaignIdParams>(req, 'params');
  const result = await archiveCampaign(id);
  res.json({ data: result });
}
