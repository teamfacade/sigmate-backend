import dotenv from 'dotenv';
import AppServer from './src/services/servers/AppServer';
dotenv.config();

const app = new AppServer();
app.start();
