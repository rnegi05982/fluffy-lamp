import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { TransactionType } from '../../domain/enums';

const optionalStoreId = z
  .string()
  .refine((v) => isValidObjectId(v), 'Invalid store id')
  .optional();

export const listCustomersQuerySchema = z.object({ storeId: optionalStoreId });
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const balanceQuerySchema = z.object({ storeId: optionalStoreId });
export type BalanceQuery = z.infer<typeof balanceQuerySchema>;

export const transactionsQuerySchema = z.object({
  storeId: optionalStoreId,
  type: z.nativeEnum(TransactionType).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;

export const customerIdParamsSchema = z.object({
  id: z.string().refine((v) => isValidObjectId(v), 'Invalid customer id'),
});
export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;
