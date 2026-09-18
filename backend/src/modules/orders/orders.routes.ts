import { Router } from 'express';
import { validate } from '../../middleware/validate';
import * as controller from './orders.controller';
import { processOrderSchema } from './orders.validation';

export const ordersRouter = Router();

ordersRouter.post('/process', validate(processOrderSchema, 'body'), controller.processOrderHandler);
