import type { Request, Response } from 'express';
import { getReference } from './reference.service';

export function get(_req: Request, res: Response): void {
  res.json({ data: getReference() });
}
