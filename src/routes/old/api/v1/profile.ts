import express from 'express';
import {
  createMyProfileController,
  deleteMyProfileController,
  getMyProfileController,
  getProfileController,
  updateMyProfileController,
} from '../../../controllers/api/v1/profile';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import BadRequestHandler from '../../../middlewares/BadRequestHandler';
import methodNotAllowed from '../../../middlewares/methodNotAllowed';
import pickModelProperties from '../../../middlewares/pickModelProperties';
import {
  validateGetProfile,
  validateProfileDeleteBody,
  validateProfileDeleteParams,
  validateProfilePatch,
  validateProfilePost,
} from '../../../middlewares/validators/profile';
import UserProfile from '../../../models/UserProfile';

const profileRouter = express.Router();

profileRouter
  .route('/:profileId')
  .get(validateGetProfile, BadRequestHandler, getProfileController)
  .post(methodNotAllowed)
  .patch(
    passportJwtAuth,
    pickModelProperties(UserProfile),
    validateProfilePatch,
    BadRequestHandler,
    updateMyProfileController
  )
  .delete(
    passportJwtAuth,
    validateProfileDeleteParams,
    BadRequestHandler,
    deleteMyProfileController
  );

profileRouter
  .route('/')
  .get(passportJwtAuth, getMyProfileController)
  .post(
    passportJwtAuth,
    pickModelProperties(UserProfile),
    validateProfilePost,
    BadRequestHandler,
    createMyProfileController
  )
  .patch(
    passportJwtAuth,
    pickModelProperties(UserProfile),
    validateProfilePatch,
    BadRequestHandler,
    updateMyProfileController
  )
  .delete(
    passportJwtAuth,
    validateProfileDeleteBody,
    BadRequestHandler,
    deleteMyProfileController
  );

export default profileRouter;
