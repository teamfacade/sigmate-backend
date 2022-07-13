import { EnvConfig } from '.';

export type InitConfig = {
  fallbackPort: number;
  staticRoot: string;
};

const initConfig: EnvConfig<InitConfig> = {
  development: {
    fallbackPort: 5100,
    staticRoot: 'public',
  },
  production: {
    fallbackPort: 5100,
    staticRoot: 'public',
  },
};

export default initConfig;
