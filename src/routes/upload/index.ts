import express from 'express';
import wikiFileRouter from './v2/wiki';

const uploadV2Router = express.Router();

uploadV2Router.use('/wiki', wikiFileRouter);

export default uploadV2Router;
