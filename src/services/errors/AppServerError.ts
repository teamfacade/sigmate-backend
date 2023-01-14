import ServerError, { ServerErrorOptions } from './ServerError';

type AppServerErrorCode = 'SERVER/APP/ER_CTOR' | 'SERVER/APP/NF_ENV';
type ErrorDefaultsMap = sigmate.Error.ErrorDefaultsMap<AppServerErrorCode>;

const defaultsMap: ErrorDefaultsMap = {
  'SERVER/APP/ER_CTOR': {
    message: 'Unexpected error in AppServer constructor',
  },
  'SERVER/APP/NF_ENV': {
    message: 'Required environment variables not set',
  },
};

export default class AppServerError extends ServerError {
  constructor(options: ServerErrorOptions<AppServerErrorCode>) {
    super({
      ...options,
      name: 'AppServerError',
    });
  }

  get defaultsMap() {
    return defaultsMap;
  }
}
