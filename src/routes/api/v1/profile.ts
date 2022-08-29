import express from 'express';
import {
  isAuthenticated,
  passportJwtAuth,
} from '../../../middlewares/authMiddlewares';
import getUserDevice from '../../../middlewares/getUserDevice';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import {
  validateGetProfileByProfileId,
  validateGetProfileByUserName,
  validateProfilePatch,
} from '../../../middlewares/validators/profile';
import {
  getMyProfileController,
  getProfileByProfileIdController,
  getProfileByUserNameController,
  updateMyPrimaryProfileController,
} from '../../../services/profile';

const profileRouter = express.Router();

profileRouter.get(
  '/p/:profileId',
  validateGetProfileByProfileId,
  handleBadRequest,
  getProfileByProfileIdController
);
profileRouter.get(
  '/u/:userName',
  validateGetProfileByUserName,
  handleBadRequest,
  getProfileByUserNameController
);

profileRouter
  .route('/')
  .get(getUserDevice, passportJwtAuth, isAuthenticated, getMyProfileController)
  .patch(
    passportJwtAuth,
    isAuthenticated,
    validateProfilePatch,
    handleBadRequest,
    updateMyPrimaryProfileController
  );

export default profileRouter;
