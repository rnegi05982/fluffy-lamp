import { logger } from '../lib/logger';
import { processCashback, type ProcessOrderInput } from './processor';

/**
 * Trigger cashback for a persisted order. Runs in-process today and is fault-isolated, so a
 * cashback failure never affects the order. This is the single seam to swap for a queue
 * enqueue when cashback moves off the request path.
 */
export async function dispatchCashback(event: ProcessOrderInput): Promise<void> {
  try {
    await processCashback(event);
  } catch (err) {
    logger.error('Cashback processing failed', {
      orderId: event.orderId.toString(),
      storeId: event.storeId,
      customerId: event.customerId,
      err,
    });
  }
}
