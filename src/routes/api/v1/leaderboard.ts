import express from 'express';
import { passportJwtAuthOptional } from '../../../middlewares/authMiddlewares';
import handlePagination from '../../../middlewares/handlePagination';
import {
  getLeaderboardController,
  getMyLeaderboardController,
} from '../../../services/leaderboard';

const lbRouter = express.Router(); // leaderboardRouter

lbRouter.get('/', handlePagination, getLeaderboardController);

lbRouter.get('/my', passportJwtAuthOptional, getMyLeaderboardController);

export default lbRouter;
