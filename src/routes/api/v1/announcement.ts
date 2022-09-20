import express from 'express';
import {
  getAllChannelsController,
  getLatestAnnouncementController,
  postAnnouncementController,
} from '../../../services/announcement/index';

const announcementRouter = express.Router();

announcementRouter.route('/channels').get(getAllChannelsController);

announcementRouter.route('/latest').get(getLatestAnnouncementController);

announcementRouter.route('/ann').post(postAnnouncementController);

export default announcementRouter;
