import ServerError from '.';

type ErrorCode = 'SERVICE/UA';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'SERVICE/UA': {
    httpCode: 503,
    message: 'Service unavailable',
    logLevel: 'warn',
  },
};

export default class ServiceError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('Serviceerror', options, defaultsMap));
  }
}
