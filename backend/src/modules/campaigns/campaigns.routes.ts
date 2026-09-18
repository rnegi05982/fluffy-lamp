import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { paginationSchema } from '../../lib/pagination';
import * as controller from './campaigns.controller';
import {
  campaignBodySchema,
  storeIdParamsSchema,
  campaignIdParamsSchema,
} from './campaigns.validation';

/** Store-scoped list + create, mounted at /stores/:storeId/campaigns. */
export const storeCampaignsRouter = Router({ mergeParams: true });

storeCampaignsRouter.get(
  '/',
  validate(storeIdParamsSchema, 'params'),
  validate(paginationSchema, 'query'),
  controller.list,
);
storeCampaignsRouter.post(
  '/',
  validate(storeIdParamsSchema, 'params'),
  validate(campaignBodySchema, 'body'),
  controller.create,
);

/** By-id read/update/delete, mounted at /campaigns. */
export const campaignsRouter = Router();

campaignsRouter.get('/:id', validate(campaignIdParamsSchema, 'params'), controller.getById);
campaignsRouter.put(
  '/:id',
  validate(campaignIdParamsSchema, 'params'),
  validate(campaignBodySchema, 'body'),
  controller.update,
);
campaignsRouter.delete('/:id', validate(campaignIdParamsSchema, 'params'), controller.remove);
