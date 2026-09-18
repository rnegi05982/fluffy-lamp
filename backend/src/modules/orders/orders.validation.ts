import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { CURRENCY_CODES, TIMEZONES } from '../reference/reference.data';

const objectId = z.string().refine((v) => isValidObjectId(v), 'Invalid id');
const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export const processOrderSchema = z.object({
  storeId: objectId,
  customerId: objectId,
  lineItems: z
    .array(
      z.object({
        productId: objectId,
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'At least one line item is required'),
  orderAmount: z.union([z.number(), z.string()]).refine((v) => Number(v) > 0, 'Order amount must be greater than 0'),
  orderCurrency: z.string().refine((v) => CURRENCY_CODES.includes(v), 'Unsupported currency'),
  orderCreatedAt: z.string().regex(WALL_CLOCK, 'Invalid date/time'),
  orderTimezone: z.string().refine((v) => TIMEZONES.includes(v), 'Unsupported timezone'),
});

export type ProcessOrderRequest = z.infer<typeof processOrderSchema>;
