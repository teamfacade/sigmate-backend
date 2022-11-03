import dotenv from 'dotenv';
import AppServer from './src/services/common/servers/AppServer';
dotenv.config();

const args = process.argv.slice(2);
const server = args.length ? args[0] : 'app';

if (server === 'app') {
  const appServer = new AppServer();
  appServer.start();
}
