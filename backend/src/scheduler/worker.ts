import cron, { type ScheduledTask } from 'node-cron';
import type { Types } from 'mongoose';
import { ScheduledOperation } from '../models';
import { ScheduledOperationStatus, ScheduledOperationType } from '../domain/enums';
import { deliverCashback } from './handlers/deliverCashback';
import { expireCashback } from './handlers/expireCashback';
import { logger } from '../lib/logger';

async function runHandler(type: string, transactionId: Types.ObjectId): Promise<void> {
  if (type === ScheduledOperationType.DELIVER_CASHBACK) {
    await deliverCashback(transactionId);
  } else if (type === ScheduledOperationType.EXPIRE_CASHBACK) {
    await expireCashback(transactionId);
  }
}

/**
 * Process all due operations. Each is claimed atomically (PENDING → PROCESSING) so a crash
 * mid-handler stays detectable, then marked DONE or FAILED. Runs on the cron heartbeat and
 * on the manual tick endpoint.
 */
export async function runTick(): Promise<{ processed: number; failed: number }> {
  let processed = 0;
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
      op.status = ScheduledOperationStatus.FAILED;
      op.failureReason = err instanceof Error ? err.message : 'Handler error';
      op.processedAt = new Date();
      await op.save();
      logger.error('Scheduled operation failed', err);
      failed += 1;
    }
  }

  return { processed, failed };
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
