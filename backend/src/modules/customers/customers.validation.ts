import { z } from 'zod';
import { TransactionType } from '../../domain/enums';
import { paginationSchema } from '../../lib/pagination';
import { zObjectId } from '../../lib/validation';

const optionalStoreId = zObjectId('Invalid store id').optional();

export const listCustomersQuerySchema = z.object({ storeId: optionalStoreId });
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const balanceQuerySchema = z.object({ storeId: optionalStoreId });
export type BalanceQuery = z.infer<typeof balanceQuerySchema>;

export const transactionsQuerySchema = paginationSchema.omit({ search: true }).extend({
  storeId: optionalStoreId,
  type: z.nativeEnum(TransactionType).optional(),
});
export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;

export const customerIdParamsSchema = z.object({
  id: zObjectId('Invalid customer id'),
});
export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;
