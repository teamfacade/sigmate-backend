import express from 'express';
import {
  getAllChannelsController,
  getLatestAnnouncementController,
  postAnnouncementController,
  getAllAnnouncementsController,
} from '../../../services/announcement/index';
import handleBadRequest from '../../../middlewares/handleBadRequest';
import { validateGetAllAnnouncements } from '../../../middlewares/validators/announcement';
import handlePagination from '../../../middlewares/handlePagination';

const announcementRouter = express.Router();

// api for bot server
announcementRouter.route('/channels').get(getAllChannelsController);
announcementRouter.route('/latest').get(getLatestAnnouncementController);

// api for frontend (what's happening?)
announcementRouter
  .route('/ann')
  .get(
    handlePagination,
    validateGetAllAnnouncements,
    handleBadRequest,
    getAllAnnouncementsController
  )
  // api for bot server
  .post(postAnnouncementController);

export default announcementRouter;
