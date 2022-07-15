import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();

import setExpress from './services/loaders/setExpress';
import setMiddlewares from './services/loaders/setMiddlewares';
import syncDatabase from './services/loaders/syncDatabase';
import setRoutes from './services/loaders/setRoutes';
import setErrorHandlers from './services/loaders/setErrorHandlers';

// Express settings (port, ...)
setExpress(app);

// Set global middlewares
setMiddlewares(app);

// Connect, init, and sync database with Sequelize
syncDatabase();

// Set up routers
setRoutes(app);

// Set up error handlers
setErrorHandlers(app);

// Start server
app.listen(app.get('port'), () => {
  console.log(`✅ Server started on port ${app.get('port')}`);
});
