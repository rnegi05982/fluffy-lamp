import type { Request, Response } from 'express';
import { validated } from '../../middleware/validate';
import type { PaginationQuery } from '../../lib/pagination';
import { runTick } from '../../scheduler/worker';
import { listPendingOps } from './scheduler.service';

export async function tick(_req: Request, res: Response): Promise<void> {
  const result = await runTick();
  res.json({ data: result });
}

export async function pending(req: Request, res: Response): Promise<void> {
  const query = validated<PaginationQuery>(req, 'query');
  const { items, meta } = await listPendingOps(query);
  res.json({ data: items, meta });
}
