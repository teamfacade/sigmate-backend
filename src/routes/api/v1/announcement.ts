import express from 'express';
import {
  getAllChannelsController,
  getLatestAnnouncementController,
  postAnnouncementController,
  getAllAnnouncementsController,
} from '../../../services/announcement/index';
import handleBadRequest from '../../../middlewares/handleBadRequest';

const announcementRouter = express.Router();

announcementRouter.route('/channels').get(getAllChannelsController);

announcementRouter.route('/latest').get(getLatestAnnouncementController);

announcementRouter
  .route('/ann')
  .get(handleBadRequest, getAllAnnouncementsController)
  .post(postAnnouncementController);

export default announcementRouter;
