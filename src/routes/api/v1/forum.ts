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
  validateCreateForumPostComment,
  validateDeleteCategory,
  validateDeleteForumPost,
  validateDeleteMyForumPostVote,
  validateGetForumPostById,
  validateGetForumPostComments,
  validateGetForumPostsByCategory,
  validateGetMyForumPostVote,
  validateUpdateCategory,
  validateUpdateForumPost,
  validateVoteForumPost,
} from '../../../middlewares/validators/forum';
import {
  createCategoryController,
  createForumPostCommentController,
  createForumPostController,
  deleteCategoryController,
  deleteForumPostByIdController,
  deleteMyForumPostVoteController,
  getCategoriesController,
  getForumPostByIdController,
  getForumPostCommentsController,
  getForumPostsByCategoryController,
  getMyForumPostVoteController,
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
  .route('/p/:postId/vote')
  .get(
    passportJwtAuth,
    isAuthenticated,
    validateGetMyForumPostVote,
    getMyForumPostVoteController
  )
  .post(
    passportJwtAuth,
    isAuthenticated,
    validateVoteForumPost,
    handleBadRequest,
    voteForumPostController
  )
  .delete(
    passportJwtAuth,
    isAuthenticated,
    validateDeleteMyForumPostVote,
    handleBadRequest,
    deleteMyForumPostVoteController
  );

// Comments
forumRouter
  .route('/p/:postId/cm')
  .get(
    passportJwtAuthOptional,
    handlePagination,
    validateGetForumPostComments,
    handleBadRequest,
    getForumPostCommentsController
  )
  .post(
    passportJwtAuth,
    validateCreateForumPostComment,
    handleBadRequest,
    createForumPostCommentController
  );

forumRouter
  .route('/c/:categoryId/p')
  .get(
    handlePagination,
    validateGetForumPostsByCategory,
    handleBadRequest,
    getForumPostsByCategoryController
  );

export default forumRouter;
