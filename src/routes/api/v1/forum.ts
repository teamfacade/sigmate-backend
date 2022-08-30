import express from 'express';
import {
  isAuthenticated,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import handlePagination from '../../../middlewares/handlePagination';
import {
  validateCreateCategory,
  validateDeleteCategory,
  validateUpdateCategory,
} from '../../../middlewares/validators/forum';
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  updateCategoryController,
} from '../../../services/forum';

const forumRouter = express.Router();

forumRouter
  .route('/category')
  .get(handlePagination, getCategoriesController)
  .post(
    passportJwtAuth,
    isAuthenticated,
    validateCreateCategory,
    handleBadRequest,
    createCategoryController
  )
  .patch(
    passportJwtAuth,
    isAuthenticated,
    validateUpdateCategory,
    handleBadRequest,
    updateCategoryController
  )
  .delete(
    passportJwtAuth,
    isAuthenticated,
    validateDeleteCategory,
    handleBadRequest,
    deleteCategoryController
  );

export default forumRouter;
