import express from 'express';
import {
  getMyProfileController,
  getProfileController,
  updateMyProfileController,
} from '../../../controllers/api/v1/profile';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import BadRequestHandler from '../../../middlewares/BadRequestHandler';
import pickModelProperties from '../../../middlewares/pickModelProperties';
import {
  validateGetProfile,
  validateProfilePatch,
} from '../../../middlewares/validators/profile';
import UserProfile from '../../../models/UserProfile';

const profileRouter = express.Router();

profileRouter
  .route('/:profileId')
  .get(validateGetProfile, BadRequestHandler, getProfileController)
  .patch(
    passportJwtAuth,
    pickModelProperties(UserProfile),
    validateProfilePatch,
    BadRequestHandler,
    updateMyProfileController
  );

profileRouter
  .route('/')
  .get(passportJwtAuth, getMyProfileController)
  .patch(
    passportJwtAuth,
    pickModelProperties(UserProfile),
    validateProfilePatch,
    BadRequestHandler,
    updateMyProfileController
  );

export default profileRouter;
