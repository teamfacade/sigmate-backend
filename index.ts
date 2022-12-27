import dotenv from 'dotenv';
dotenv.config();

import { Settings } from 'luxon';
Settings.defaultZone = 'utc';

import AppServer from './src/services/servers/AppServer';
const app = new AppServer();
app.start();
