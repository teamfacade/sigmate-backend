import { Express } from 'express';
import { getNodeEnv } from '../config';
import initConfig, { InitConfig } from '../config/initConfig';

const env = getNodeEnv();
const config: InitConfig = initConfig[env];

const setExpress = (app: Express) => {
  app.set('port', process.env.PORT || config.fallbackPort);
};

export default setExpress;
