import express from 'express';
import mintingRouter from './minting';

const calendarRouter = express.Router();

calendarRouter.use('/minting', mintingRouter);

export default calendarRouter;
