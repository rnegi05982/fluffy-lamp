import type { Model, Types } from 'mongoose';
import { ApiError } from './ApiError';

/**
 * Fetch a document by id as a lean object, or throw a 404 ApiError with the given code.
 * Centralizes the "find-or-not-found" pattern shared across services.
 */
export async function findByIdOr404<T>(
  model: Model<any>,
  id: string | Types.ObjectId,
  code: string,
  message: string,
): Promise<T> {
  const doc = await model.findById(id).lean<T | null>();
  if (!doc) throw ApiError.notFound(code, message);
  return doc;
}
