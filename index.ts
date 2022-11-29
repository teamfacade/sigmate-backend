import dotenv from 'dotenv';
dotenv.config();

import checkEnv from './src/loaders/checkEnv';
checkEnv();

import express from 'express';
import setupExpress from './src/loaders/setupExpress';
import setupRoutes from './src/loaders/setupRoutes';
// import syncDatabase from './src/loaders/syncDatabase';
import setupErrorHandlers from './src/loaders/setupErrorHandlers';

const app = express();
setupExpress(app);
setupRoutes(app);
setupErrorHandlers(app);
// syncDatabase(); // TODO remove in production

app.listen(app.get('port'), () => {
  console.log(`✅ Server listening on port ${app.get('port')}...`);
});
