import type { Request, Response } from 'express';
import { validated } from '../../middleware/validate';
import { processOrder } from './orders.service';
import type { ProcessOrderRequest } from './orders.validation';

export async function processOrderHandler(req: Request, res: Response): Promise<void> {
  const input = validated<ProcessOrderRequest>(req, 'body');
  const result = await processOrder(input);
  res.status(201).json({ data: result });
}
