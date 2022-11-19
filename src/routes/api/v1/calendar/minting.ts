import express from 'express';
import {
  passportJwtAuth,
  passportJwtAuthOptional,
} from '../../../../middlewares/authMiddlewares';
import handleBadRequest from '../../../../middlewares/handleBadRequest';
import handlePagination from '../../../../middlewares/handlePagination';
import {
  validateCreateMintingSchedule,
  validateDeleteMintingSchedule,
  validateGetMintingScheduleById,
  validateGetMintingSchedules,
  validateUpdateMintingSchedule,
} from '../../../../middlewares/validators/calendar';
import {
  createMintingScheduleController,
  deleteMintingScheduleController,
  getMintingScheduleByIdController,
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
  .get(
    passportJwtAuthOptional,
    validateGetMintingScheduleById,
    handleBadRequest,
    getMintingScheduleByIdController
  )
  .patch(
    passportJwtAuth,
    validateUpdateMintingSchedule,
    handleBadRequest,
    updateMintingScheduleController
  )
  .delete(
    passportJwtAuth,
    validateDeleteMintingSchedule,
    handleBadRequest,
    deleteMintingScheduleController
  );

export default mintingRouter;
