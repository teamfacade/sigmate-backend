import express from 'express';
import clRouter from './collection';
import docRouter from './document';

const wikiRouter = express.Router();

wikiRouter.use('/collection', clRouter);
wikiRouter.use('/d', docRouter);

export default wikiRouter;
