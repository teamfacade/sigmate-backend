import ServerError from '.';

type ErrorCode = 'ACTION/FAILED' | 'ACTION/TX_ROLLBACK' | 'ACTION/TX_COMMIT';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'ACTION/FAILED': {
    message: 'Action failed',
  },
  'ACTION/TX_COMMIT': {
    message: 'Transaction commit failed',
    logLevel: 'warn',
  },
  'ACTION/TX_ROLLBACK': {
    message: 'Transaction rollback failed',
  },
};

export default class ActionError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('ActionError', options, defaultsMap));
  }
}
