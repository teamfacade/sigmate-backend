import express from 'express';

const indexRouter = express.Router();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
indexRouter.get('/', (req, res, next) => {
  res.send('Hello express indexRouter');
});

export default indexRouter;
