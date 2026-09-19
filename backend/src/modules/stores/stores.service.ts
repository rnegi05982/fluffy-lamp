import { Types } from 'mongoose';
import { Store, type IStore } from '../../models';
import { ApiError } from '../../lib/ApiError';
import { findByIdOr404 } from '../../lib/db';
import { isDuplicateKeyError } from '../../lib/mongoErrors';
import { escapeRegex, paginate, type PageMeta, type PaginationQuery } from '../../lib/pagination';
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

  const { docs, meta } = await paginate<StoreShape>(Store, filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    collation: { locale: 'en', strength: 2 },
  });

  return { items: docs.map(toStoreDTO), meta };
}

export async function getStore(id: string): Promise<StoreDTO> {
  const store = await findByIdOr404<StoreShape>(Store, id, 'STORE_NOT_FOUND', 'Store not found');
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
