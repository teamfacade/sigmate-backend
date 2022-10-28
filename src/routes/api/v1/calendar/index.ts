import express from 'express';
import mintingRouter from './minting';
import myRouter from './my';

const calendarRouter = express.Router();

calendarRouter.use('/minting', mintingRouter);
calendarRouter.use('/my', myRouter);

export default calendarRouter;
