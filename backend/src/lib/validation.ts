import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

/** A Zod string that must be a valid Mongo ObjectId. */
export function zObjectId(message: string) {
  return z.string().refine((v) => isValidObjectId(v), message);
}

/** Wall-clock timestamp 'YYYY-MM-DDTHH:mm(:ss)?' with no timezone offset. */
export const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** 24-hour time of day 'HH:mm'. */
export const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
