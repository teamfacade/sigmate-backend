import express from 'express';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import {
  validateGetProfileByProfileId,
  validateGetProfileByUserName,
} from '../../../middlewares/validators/profile';
import {
  getProfileByProfileIdController,
  getProfileByUserNameController,
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

export default profileRouter;
