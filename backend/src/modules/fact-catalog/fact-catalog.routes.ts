import { Router } from 'express';
import * as controller from './fact-catalog.controller';

export const factCatalogRouter = Router();

factCatalogRouter.get('/', controller.get);
