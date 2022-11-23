import express from 'express';
import { query } from 'express-validator';
import { isAdmin, passportJwtAuth } from '../../../middlewares/authMiddlewares';
import { syncDatabaseController } from '../../../services/dev';

const devRouter = express.Router();

devRouter.use(passportJwtAuth, isAdmin);

devRouter.post(
  '/sync',
  query('force').optional().isBoolean().bail().toBoolean(),
  syncDatabaseController
);

export default devRouter;
