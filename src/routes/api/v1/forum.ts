import express from 'express';
import {
  isAuthenticated,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import handlePagination from '../../../middlewares/handlePagination';
import {
  validateCreateCategory,
  validateCreateForumPost,
  validateDeleteCategory,
  validateGetForumPostById,
  validateGetForumPostsByCategory,
  validateUpdateCategory,
} from '../../../middlewares/validators/forum';
import {
  createCategoryController,
  createForumPostController,
  deleteCategoryController,
  getCategoriesController,
  getForumPostByIdController,
  getForumPostsByCategoryController,
  updateCategoryController,
  updateForumPostController,
} from '../../../services/forum';

const forumRouter = express.Router();

forumRouter
  .route('/c')
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

forumRouter
  .route('/p')
  .post(
    passportJwtAuth,
    isAuthenticated,
    validateCreateForumPost,
    handleBadRequest,
    createForumPostController
  );

forumRouter
  .route('/p/:postId')
  .get(validateGetForumPostById, handleBadRequest, getForumPostByIdController)
  .patch(passportJwtAuth, isAuthenticated, updateForumPostController)
  .delete();

forumRouter
  .route('/c/:categoryId/p')
  .get(
    handlePagination,
    validateGetForumPostsByCategory,
    handleBadRequest,
    getForumPostsByCategoryController
  );

export default forumRouter;
