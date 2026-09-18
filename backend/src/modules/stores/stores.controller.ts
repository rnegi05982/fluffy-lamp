import type { Request, Response } from 'express';
import { validated } from '../../middleware/validate';
import type { PaginationQuery } from '../../lib/pagination';
import { listStores, getStore, createStore } from './stores.service';
import type { CreateStoreInput, StoreIdParams } from './stores.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const query = validated<PaginationQuery>(req, 'query');
  const { items, meta } = await listStores(query);
  res.json({ data: items, meta });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validated<StoreIdParams>(req, 'params');
  const store = await getStore(id);
  res.json({ data: store });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = validated<CreateStoreInput>(req, 'body');
  const store = await createStore(input);
  res.status(201).json({ data: store });
}
