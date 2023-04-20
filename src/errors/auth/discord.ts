import ServerError from '..';

type ErrorCode =
  | 'AUTH/DISCORD/NF_CODE'
  | 'AUTH/DISCORD/UA_TOKEN'
  | 'AUTH/DISCORD/NF_ACCESS_TOKEN'
  | 'AUTH/DISCORD/UA_PROFILE'
  | 'AUTH/DISCORD/IV_PROFILE'
  | 'AUTH/DISCORD/RJ_CHANGE_INTERVAL'
  | 'AUTH/DISCORD/NF_DISCORD'
  | 'AUTH/DISCORD/NF_AUTH'
  | 'AUTH/DISCORD/UA_REVOKE';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'AUTH/DISCORD/NF_CODE': {
    message: 'Discord OAuth code not provided',
    httpCode: 401,
    logLevel: 'verbose',
  },
  'AUTH/DISCORD/UA_TOKEN': {
    message: 'Discord OAuth tokens unavailable',
    httpCode: 503,
    logLevel: 'warn',
    secure: true,
  },
  'AUTH/DISCORD/NF_ACCESS_TOKEN': {
    message: 'Discord OAuth response missing access token',
    httpCode: 401,
    logLevel: 'warn',
    secure: true,
  },
  'AUTH/DISCORD/UA_PROFILE': {
    message: 'Discord People API unavailable',
    httpCode: 503,
    logLevel: 'warn',
  },
  'AUTH/DISCORD/IV_PROFILE': {
    message: 'Discord People API response missing required attributes',
    httpCode: 401,
    logLevel: 'warn',
    secure: true,
  },
  'AUTH/DISCORD/RJ_CHANGE_INTERVAL': {
    message: 'Cannot change connected Discord accounts too often',
    httpCode: 403,
    logLevel: 'verbose',
  },
  'AUTH/DISCORD/NF_DISCORD': {
    message: 'Discord account not connected',
    httpCode: 409,
    logLevel: 'verbose',
  },
  'AUTH/DISCORD/NF_AUTH': {
    message: 'Auth not found',
    secure: true,
  },
  'AUTH/DISCORD/UA_REVOKE': {
    message: 'Discord OAuth revoke endpoint unavailable',
    httpCode: 503,
    logLevel: 'warn',
  },
};

export default class DiscordAuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('DiscordAuthError', options, defaultsMap));
  }
}
