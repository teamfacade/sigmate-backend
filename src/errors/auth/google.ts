import ServerError from '..';

type ErrorCode =
  | 'AUTH/GOOGLE/NF_CODE'
  | 'AUTH/GOOGLE/UA_TOKEN'
  | 'AUTH/GOOGLE/NF_ACCESS_TOKEN'
  | 'AUTH/GOOGLE/UA_PROFILE'
  | 'AUTH/GOOGLE/IV_PROFILE'
  | 'AUTH/GOOGLE/RJ_CHANGE_INTERVAL'
  | 'AUTH/GOOGLE/NF_GOOGLE'
  | 'AUTH/GOOGLE/NF_AUTH'
  | 'AUTH/GOOGLE/UA_REVOKE';

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
  'AUTH/GOOGLE/RJ_CHANGE_INTERVAL': {
    message: 'Cannot change connected Google accounts too often',
    httpCode: 403,
    logLevel: 'verbose',
  },
  'AUTH/GOOGLE/NF_GOOGLE': {
    message: 'Google account not connected',
    httpCode: 409,
    logLevel: 'verbose',
  },
  'AUTH/GOOGLE/NF_AUTH': {
    message: 'Auth not found',
    secure: true,
  },
  'AUTH/GOOGLE/UA_REVOKE': {
    message: 'Google OAuth revoke endpoint unavailable',
    httpCode: 503,
    logLevel: 'warn',
  },
};

export default class GoogleAuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('GoogleAuthError', options, defaultsMap));
  }
}
