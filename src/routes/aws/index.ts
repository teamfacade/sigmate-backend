import express from 'express';

const awsRouter = express.Router();

// AWS ELB Health checker
// eslint-disable-next-line @typescript-eslint/no-unused-vars
awsRouter.get('/', (req, res, next) => {
  res.status(200).send();
});

export default awsRouter;
