import express from 'express';
import useUserRoutes from './user';

const v2Router = express.Router();
useUserRoutes(v2Router);

export default v2Router;
