import ServerError from '.';

type ErrorCode = 'LOGGER/ER_AWS_INIT';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'LOGGER/ER_AWS_INIT': {
    message: 'AWS client intialization failed',
  },
};

export default class LoggerError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('LoggerError', options, defaultsMap));
  }
}
