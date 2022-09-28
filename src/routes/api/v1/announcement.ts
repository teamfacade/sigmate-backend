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

announcementRouter.route('/channels').get(getAllChannelsController);

announcementRouter.route('/latest').get(getLatestAnnouncementController);

announcementRouter
  .route('/ann')
  .get(
    handlePagination,
    validateGetAllAnnouncements,
    handleBadRequest,
    getAllAnnouncementsController
  )
  .post(postAnnouncementController);

export default announcementRouter;
