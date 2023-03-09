import ServerError from '.';

type ErrorCode = 'ACTION/FAILED';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'ACTION/FAILED': {
    message: 'Action failed',
  },
};

export default class ActionError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('ActionError', options, defaultsMap));
  }
}
