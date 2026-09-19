import type { Types } from 'mongoose';
import { ScheduledOperation, type IScheduledOperation } from '../../models';
import { ScheduledOperationStatus } from '../../domain/enums';
import { paginate, type PageMeta, type PaginationQuery } from '../../lib/pagination';

interface OpShape extends IScheduledOperation {
  _id: Types.ObjectId;
}

export interface ScheduledOpDTO {
  id: string;
  type: string;
  status: string;
  runAt: Date;
  transactionId: string;
  claimedAt: Date | null;
  attempts: number;
  failureReason: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

function toOpDTO(op: OpShape): ScheduledOpDTO {
  return {
    id: op._id.toString(),
    type: op.type,
    status: op.status,
    runAt: op.runAt,
    transactionId: op.transactionId.toString(),
    claimedAt: op.claimedAt,
    attempts: op.attempts,
    failureReason: op.failureReason,
    createdAt: op.createdAt,
    processedAt: op.processedAt,
  };
}

/** Inspect not-yet-done operations (PENDING / PROCESSING / FAILED) for debugging. */
export async function listPendingOps(
  query: PaginationQuery,
): Promise<{ items: ScheduledOpDTO[]; meta: PageMeta }> {
  const { page, limit } = query;
  const filter = {
    status: {
      $in: [
        ScheduledOperationStatus.PENDING,
        ScheduledOperationStatus.PROCESSING,
        ScheduledOperationStatus.FAILED,
      ],
    },
  };

  const { docs, meta } = await paginate<OpShape>(ScheduledOperation, filter, {
    page,
    limit,
    sort: { runAt: 1 },
  });

  return { items: docs.map(toOpDTO), meta };
}
