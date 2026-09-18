import type { Request, Response } from 'express';
import { listProducts } from './products.service';

export async function list(_req: Request, res: Response): Promise<void> {
  const products = await listProducts();
  res.json({ data: products });
}
