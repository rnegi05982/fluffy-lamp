import { Router } from 'express';
import mongoose from 'mongoose';
import { referenceRouter } from '../modules/reference/reference.routes';
import { storesRouter } from '../modules/stores/stores.routes';
import { productsRouter } from '../modules/products/products.routes';

/**
 * Root API router mounted at `/api`. Module routers (stores, reference, campaigns,
 * customers, products, orders, scheduler) are mounted here as they are built.
 */
export const apiRouter = Router();

// GET /api/health — liveness + DB connection state.
const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};
apiRouter.get('/health', (_req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    data: {
      status: 'ok',
      db: DB_STATES[state] ?? String(state),
      uptime: process.uptime(),
    },
  });
});

apiRouter.use('/reference', referenceRouter);
apiRouter.use('/stores', storesRouter);
apiRouter.use('/products', productsRouter);
