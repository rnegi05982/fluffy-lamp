import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { CURRENCY_CODES, TIMEZONES } from '../reference/reference.data';

export const createStoreSchema = z.object({
  name: z.string().trim().min(1, 'Store name is required'),
  timezone: z.string().refine((v) => TIMEZONES.includes(v), 'Unsupported timezone'),
  currency: z.string().refine((v) => CURRENCY_CODES.includes(v), 'Unsupported currency'),
});
export type CreateStoreInput = z.infer<typeof createStoreSchema>;

export const storeIdParamsSchema = z.object({
  id: z.string().refine((v) => isValidObjectId(v), 'Invalid store id'),
});
export type StoreIdParams = z.infer<typeof storeIdParamsSchema>;
