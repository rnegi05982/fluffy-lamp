import type { Request, Response } from 'express';
import { getFactCatalog } from './fact-catalog.service';

export function get(_req: Request, res: Response): void {
  res.json({ data: getFactCatalog() });
}
