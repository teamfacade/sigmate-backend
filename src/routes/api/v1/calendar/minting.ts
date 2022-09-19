import express from 'express';
import {
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import handlePagination from '../../../../middlewares/handlePagination';
import {
  validateCreateMintingSchedule,
  validateGetMintingSchedules,
  validateUpdateMintingSchedule,
} from '../../../../middlewares/validators/calendar';
import {
  createMintingScheduleController,
  getMintingSchedulesController,
  updateMintingScheduleController,
} from '../../../../services/calendar';

const mintingRouter = express.Router();

mintingRouter
  .route('/')
  .get(
    passportJwtAuthOptional,
    handlePagination,
    validateGetMintingSchedules,
    handleBadRequest,
    getMintingSchedulesController
  )
  .post(
    passportJwtAuth,
    validateCreateMintingSchedule,
    handleBadRequest,
    createMintingScheduleController
  );

mintingRouter
  .route('/:id')
  .patch(
    passportJwtAuth,
    validateUpdateMintingSchedule,
    handleBadRequest,
    updateMintingScheduleController
  );

export default mintingRouter;
