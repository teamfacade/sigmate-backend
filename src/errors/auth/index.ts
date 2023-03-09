import ServerError from '..';

type ErrorCode = 'AUTH/RJ_UNAUTHENTICATED' | 'AUTH/NF_AUTH';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'AUTH/NF_AUTH': {
    message: 'Auth not found',
    httpCode: 401,
    logLevel: 'error',
    secure: true,
  },
  'AUTH/RJ_UNAUTHENTICATED': {
    message: 'Unauthenticated',
    httpCode: 401,
    logLevel: 'verbose',
  },
};

export default class AuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('AuthError', options, defaultsMap));
  }
}
