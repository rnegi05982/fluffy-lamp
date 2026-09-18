import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { paginationSchema } from '../../lib/pagination';
import * as controller from './scheduler.controller';

export const schedulerRouter = Router();

schedulerRouter.post('/tick', controller.tick);
schedulerRouter.get('/pending', validate(paginationSchema, 'query'), controller.pending);
