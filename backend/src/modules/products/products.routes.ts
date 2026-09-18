import { Router } from 'express';
import * as controller from './products.controller';

export const productsRouter = Router();

productsRouter.get('/', controller.list);
