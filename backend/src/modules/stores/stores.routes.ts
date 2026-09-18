import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { paginationSchema } from '../../lib/pagination';
import * as controller from './stores.controller';
import { createStoreSchema, storeIdParamsSchema } from './stores.validation';

export const storesRouter = Router();

storesRouter.get('/', validate(paginationSchema, 'query'), controller.list);
storesRouter.get('/:id', validate(storeIdParamsSchema, 'params'), controller.getById);
storesRouter.post('/', validate(createStoreSchema, 'body'), controller.create);
