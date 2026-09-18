import { Router } from 'express';
import * as controller from './reference.controller';

export const referenceRouter = Router();

referenceRouter.get('/', controller.get);
