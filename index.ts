import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();

import setExpress from './loaders/setExpress';
import useMiddlewares from './loaders/useMiddlewares';
import syncDatabase from './loaders/syncDatabase';

setExpress(app);
useMiddlewares(app);
syncDatabase();

// Start server
app.listen(app.get('port'), () => {
  console.log(`✅ Server started on port ${app.get('port')}`);
});
