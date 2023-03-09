import ServerError from '..';

type ErrorCode =
  | 'AUTH/GOOGLE/NF_CODE'
  | 'AUTH/GOOGLE/UA_TOKEN'
  | 'AUTH/GOOGLE/NF_ACCESS_TOKEN'
  | 'AUTH/GOOGLE/UA_PROFILE'
  | 'AUTH/GOOGLE/IV_PROFILE';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'AUTH/GOOGLE/NF_CODE': {
    message: 'Google OAuth code not provided',
    httpCode: 401,
    logLevel: 'verbose',
  },
  'AUTH/GOOGLE/UA_TOKEN': {
    message: 'Google OAuth tokens unavailable',
    httpCode: 503,
    logLevel: 'warn',
    secure: true,
  },
  'AUTH/GOOGLE/NF_ACCESS_TOKEN': {
    message: 'Google OAuth response missing access token',
    httpCode: 401,
    logLevel: 'warn',
    secure: true,
  },
  'AUTH/GOOGLE/UA_PROFILE': {
    message: 'Google People API unavailable',
    httpCode: 503,
    logLevel: 'warn',
  },
  'AUTH/GOOGLE/IV_PROFILE': {
    message: 'Google People API response missing required attributes',
    httpCode: 401,
    logLevel: 'warn',
    secure: true,
  },
};

export default class GoogleAuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('GoogleAuthError', options, defaultsMap));
  }
}
