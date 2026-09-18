import { z } from 'zod';

/** Query schema for paginated + searchable list endpoints. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
});
export type PaginationQuery = z.infer<typeof paginationSchema>;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function buildMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, hasMore: page * limit < total };
}

/** Escape a user string for safe use inside a `$regex`. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
