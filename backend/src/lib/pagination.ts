import { z } from 'zod';
import type { FilterQuery, Model } from 'mongoose';

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

export interface PaginateOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
  collation?: { locale: string; strength?: number };
}

/** Run a paginated find + count in parallel, returning lean docs and page meta. */
export async function paginate<T>(
  model: Model<any>,
  filter: FilterQuery<any>,
  opts: PaginateOptions,
): Promise<{ docs: T[]; meta: PageMeta }> {
  const { page, limit, sort, collation } = opts;
  const query = model.find(filter);
  if (collation) query.collation(collation);
  if (sort) query.sort(sort);
  query.skip((page - 1) * limit).limit(limit);
  const [docs, total] = await Promise.all([query.lean<T[]>(), model.countDocuments(filter)]);
  return { docs, meta: buildMeta(page, limit, total) };
}

/** Escape a user string for safe use inside a `$regex`. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
