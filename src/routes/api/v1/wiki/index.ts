import express from 'express';
import clRouter from './collection';

const wikiRouter = express.Router();

wikiRouter.use('/collection', clRouter);

export default wikiRouter;
