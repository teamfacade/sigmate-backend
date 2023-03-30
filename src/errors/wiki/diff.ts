import ServerError from '..';

type ErrorCode =
  | 'WIKI/DIFF/RJ_KI_NAME'
  | 'WIKI/DIFF/ER_REQUIRED'
  | 'WIKI/DIFF/ER_ID_MISMATCH';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'WIKI/DIFF/RJ_KI_NAME': {
    message: 'Cannot change key info name. Re-create the block if necessary',
    httpCode: 409,
    logLevel: 'verbose',
  },
  'WIKI/DIFF/ER_REQUIRED': {
    message: 'Required field cannot be undefined',
  },
  'WIKI/DIFF/ER_ID_MISMATCH': {
    message: 'Unexpected ID mismatch.',
  },
};

export default class WikiDiffError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('WikiDiffError', options, defaultsMap));
  }
}
