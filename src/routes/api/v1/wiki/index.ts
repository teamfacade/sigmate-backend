import express from 'express';
import activityRouter from './activity';
import clRouter from './collection';
import docRouter from './document';

const wikiRouter = express.Router();

wikiRouter.use('/collection', clRouter);
wikiRouter.use('/d', docRouter);
wikiRouter.use('/activity', activityRouter);

export default wikiRouter;
