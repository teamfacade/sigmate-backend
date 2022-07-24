import express from 'express';
import {
  checkReferralController,
  checkUserNameController,
  deleteUserController,
  getReferralCodeController,
  getUserController,
  patchUserController,
  postReferralCodeController,
  updateReferralController,
} from '../../../controllers/api/v1/user';
import { passportJwtAuth } from '../../../middlewares/authMiddlewares';
import pickModelProperties from '../../../middlewares/pickModelProperties';
import User from '../../../models/User';
import {
  validateCheckReferralCode,
  validatePostReferralCode,
  validateUserNameCheck,
  validateUserPatch,
} from '../../../middlewares/validators/user';
import BadRequestHandler from '../../../middlewares/BadRequestHandler';

const userRouter = express.Router();

userRouter.use(passportJwtAuth);

userRouter
  .route('/')
  .get(getUserController)
  .patch(
    pickModelProperties(User),
    validateUserPatch,
    BadRequestHandler,
    patchUserController
  )
  .delete(deleteUserController);

userRouter.post(
  '/username/check',
  validateUserNameCheck,
  BadRequestHandler,
  checkUserNameController
);

userRouter.get(
  '/referral/check/:referralCode',
  validateCheckReferralCode,
  BadRequestHandler,
  checkReferralController
);

userRouter.get(
  '/referral/update/:referralCode',
  validateCheckReferralCode,
  BadRequestHandler,
  updateReferralController
);

userRouter
  .route('/referral/code')
  .get(getReferralCodeController)
  .post(
    validatePostReferralCode,
    BadRequestHandler,
    postReferralCodeController
  );

export default userRouter;
