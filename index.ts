import AppServer from './src/servers/app';

try {
  const app = new AppServer();
  app.start();
} catch (error) {
  console.error(error);
}
