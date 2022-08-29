import express from 'express';
import handlePagination from '../../../middlewares/handlePagination';
import { getCategoriesController } from '../../../services/forum';

const forumRouter = express.Router();

forumRouter.route('/categories').get(handlePagination, getCategoriesController);

export default forumRouter;
