import { Router } from 'express';
import { validate } from '../../middleware/validate';
import * as controller from './customers.controller';
import {
  listCustomersQuerySchema,
  balanceQuerySchema,
  transactionsQuerySchema,
  customerIdParamsSchema,
} from './customers.validation';

export const customersRouter = Router();

customersRouter.get('/', validate(listCustomersQuerySchema, 'query'), controller.list);
customersRouter.get('/:id', validate(customerIdParamsSchema, 'params'), controller.getById);
customersRouter.get(
  '/:id/balance',
  validate(customerIdParamsSchema, 'params'),
  validate(balanceQuerySchema, 'query'),
  controller.balance,
);
customersRouter.get(
  '/:id/transactions',
  validate(customerIdParamsSchema, 'params'),
  validate(transactionsQuerySchema, 'query'),
  controller.transactions,
);
