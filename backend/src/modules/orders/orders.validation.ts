import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { CURRENCY_CODES, TIMEZONES } from '../reference/reference.data';

const objectId = z.string().refine((v) => isValidObjectId(v), 'Invalid id');

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
  orderCreatedAt: z.string().datetime({ offset: true }),
  orderTimezone: z.string().refine((v) => TIMEZONES.includes(v), 'Unsupported timezone'),
});

export type ProcessOrderRequest = z.infer<typeof processOrderSchema>;
