import ServerError from '..';

type ErrorCode =
  | 'AUTH/TWITTER/NF_CODE'
  | 'AUTH/Twitter/UA_TOKEN'
  | 'AUTH/TWITTER/NF_ACCESS_TOKEN'
  | 'AUTH/Twitter/UA_PROFILE';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'AUTH/TWITTER/NF_CODE': {
    message: 'Twitter OAuth code not provided',
    httpCode: 401,
    logLevel: 'verbose',
  },
  'AUTH/Twitter/UA_TOKEN': {
    message: 'Twitter OAuth tokens unavailable',
    httpCode: 503,
    logLevel: 'warn',
    secure: true,
  },
  'AUTH/TWITTER/NF_ACCESS_TOKEN': {
    message: 'Twitter OAuth response missing access token',
    httpCode: 401,
    logLevel: 'warn',
    secure: true,
  },
  'AUTH/Twitter/UA_PROFILE': {
    message: 'Google People API unavailable',
    httpCode: 503,
    logLevel: 'warn',
  },
};

export default class TwitterAuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('TwitterAuthError', options, defaultsMap));
  }
}
