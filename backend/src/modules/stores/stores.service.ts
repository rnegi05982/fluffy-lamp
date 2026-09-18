import { Types } from 'mongoose';
import { Store, type IStore } from '../../models';
import { ApiError } from '../../lib/ApiError';
import { isDuplicateKeyError } from '../../lib/mongoErrors';
import { buildMeta, escapeRegex, type PageMeta, type PaginationQuery } from '../../lib/pagination';
import type { CreateStoreInput } from './stores.validation';

interface StoreShape extends IStore {
  _id: Types.ObjectId;
}

export interface StoreDTO {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

function toStoreDTO(store: StoreShape): StoreDTO {
  return {
    id: store._id.toString(),
    name: store.name,
    timezone: store.timezone,
    currency: store.currency,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
}

export async function listStores(
  query: PaginationQuery,
): Promise<{ items: StoreDTO[]; meta: PageMeta }> {
  const { page, limit, search } = query;
  const filter = search
    ? { name: { $regex: escapeRegex(search), $options: 'i' } }
    : {};

  const [docs, total] = await Promise.all([
    Store.find(filter)
      .collation({ locale: 'en', strength: 2 })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<StoreShape[]>(),
    Store.countDocuments(filter),
  ]);

  return { items: docs.map(toStoreDTO), meta: buildMeta(page, limit, total) };
}

export async function getStore(id: string): Promise<StoreDTO> {
  const store = await Store.findById(id).lean<StoreShape | null>();
  if (!store) throw ApiError.notFound('STORE_NOT_FOUND', 'Store not found');
  return toStoreDTO(store);
}

export async function createStore(input: CreateStoreInput): Promise<StoreDTO> {
  try {
    const store = await Store.create(input);
    return toStoreDTO(store);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw ApiError.conflict('DUPLICATE_STORE_NAME', 'A store with this name already exists');
    }
    throw err;
  }
}
