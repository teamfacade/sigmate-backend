import express from 'express';
import {
  isAuthenticated,
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import handlePagination from '../../../middlewares/handlePagination';
import {
  validateCreateCategory,
  validateCreateForumPost,
  validateDeleteCategory,
  validateDeleteForumPost,
  validateGetForumPostById,
  validateGetForumPostsByCategory,
  validateUpdateCategory,
  validateUpdateForumPost,
  validateVoteForumPost,
} from '../../../middlewares/validators/forum';
import {
  createCategoryController,
  createForumPostController,
  deleteCategoryController,
  deleteForumPostByIdController,
  getCategoriesController,
  getForumPostByIdController,
  getForumPostsByCategoryController,
  updateCategoryController,
  updateForumPostController,
  voteForumPostController,
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
  .get(
    passportJwtAuthOptional,
    validateGetForumPostById,
    handleBadRequest,
    getForumPostByIdController
  )
  .patch(
    passportJwtAuth,
    isAuthenticated,
    validateUpdateForumPost,
    handleBadRequest,
    updateForumPostController
  )
  .delete(
    passportJwtAuth,
    isAuthenticated,
    validateDeleteForumPost,
    handleBadRequest,
    deleteForumPostByIdController
  );

forumRouter
  .route('/c/:categoryId/p')
  .get(
    handlePagination,
    validateGetForumPostsByCategory,
    handleBadRequest,
    getForumPostsByCategoryController
  );

forumRouter
  .route('/vote/p/:postId')
  .post(
    passportJwtAuth,
    isAuthenticated,
    validateVoteForumPost,
    handleBadRequest,
    voteForumPostController
  );

export default forumRouter;
