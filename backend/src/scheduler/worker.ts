import cron, { type ScheduledTask } from 'node-cron';
import type { Types } from 'mongoose';
import { ScheduledOperation } from '../models';
import { ScheduledOperationStatus, ScheduledOperationType } from '../domain/enums';
import { deliverCashback } from './handlers/deliverCashback';
import { expireCashback } from './handlers/expireCashback';
import { logger } from '../lib/logger';

/** Total attempts allowed per operation before it is marked FAILED (terminal). */
const MAX_ATTEMPTS = 3;
/** Base delay before a failed op is retried; grows linearly with the attempt count. */
const RETRY_BACKOFF_MS = 60_000;
/** An op stuck in PROCESSING longer than this is assumed orphaned by a crash and reclaimed. */
const PROCESSING_TIMEOUT_MS = 5 * 60_000;

async function runHandler(type: string, transactionId: Types.ObjectId): Promise<void> {
  if (type === ScheduledOperationType.DELIVER_CASHBACK) {
    await deliverCashback(transactionId);
  } else if (type === ScheduledOperationType.EXPIRE_CASHBACK) {
    await expireCashback(transactionId);
  }
}

/**
 * Reclaim operations left in PROCESSING by a crashed worker: reset them to PENDING so the
 * normal claim loop retries them. Their attempt count is preserved, so a crash-looping op
 * still reaches MAX_ATTEMPTS and stops. Handlers are idempotent, so re-running is safe.
 */
async function reclaimStuck(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - PROCESSING_TIMEOUT_MS);
  const res = await ScheduledOperation.updateMany(
    { status: ScheduledOperationStatus.PROCESSING, claimedAt: { $lte: cutoff } },
    { $set: { status: ScheduledOperationStatus.PENDING, claimedAt: null } },
  );
  return res.modifiedCount ?? 0;
}

/**
 * Process all due operations. First reclaim ops orphaned by a crash, then drain the queue:
 * each op is claimed atomically (PENDING → PROCESSING, attempts incremented), then marked
 * DONE on success. On failure it is released back to PENDING with a backoff (retried on a
 * later tick) until MAX_ATTEMPTS, after which it becomes FAILED (terminal). Handlers are
 * idempotent, so at-least-once retries cannot double-credit or double-expire. Runs on the
 * cron heartbeat and on the manual tick endpoint.
 */
export async function runTick(): Promise<{
  processed: number;
  retried: number;
  failed: number;
  reclaimed: number;
}> {
  const reclaimed = await reclaimStuck(new Date());
  let processed = 0;
  let retried = 0;
  let failed = 0;

  for (;;) {
    const now = new Date();
    const op = await ScheduledOperation.findOneAndUpdate(
      { status: ScheduledOperationStatus.PENDING, runAt: { $lte: now } },
      { $set: { status: ScheduledOperationStatus.PROCESSING, claimedAt: now }, $inc: { attempts: 1 } },
      { new: true, sort: { runAt: 1 } },
    );
    if (!op) break;

    try {
      await runHandler(op.type, op.transactionId);
      op.status = ScheduledOperationStatus.DONE;
      op.processedAt = new Date();
      await op.save();
      processed += 1;
    } catch (err) {
      op.failureReason = err instanceof Error ? err.message : 'Handler error';
      if (op.attempts < MAX_ATTEMPTS) {
        // Transient: release for another attempt, pushed past this drain so it retries later.
        op.status = ScheduledOperationStatus.PENDING;
        op.claimedAt = null;
        op.runAt = new Date(now.getTime() + RETRY_BACKOFF_MS * op.attempts);
        await op.save();
        retried += 1;
      } else {
        op.status = ScheduledOperationStatus.FAILED;
        op.processedAt = new Date();
        await op.save();
        failed += 1;
      }
      logger.error('Scheduled operation failed', err);
    }
  }

  return { processed, retried, failed, reclaimed };
}

let task: ScheduledTask | null = null;

export function startScheduler(): void {
  task = cron.schedule('* * * * *', () => {
    runTick().catch((err) => logger.error('Scheduler tick failed', err));
  });
  logger.info('Scheduler started (heartbeat: every minute)');
}

export function stopScheduler(): void {
  task?.stop();
  task = null;
}
