import ServerError from '..';

type ErrorCode = 'AUTH/DISCORD/NF_CODE';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'AUTH/DISCORD/NF_CODE': {
    message: 'Discord OAuth code not provided',
    httpCode: 401,
    logLevel: 'verbose',
  },
};

export default class DiscordAuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('DiscordAuthError', options, defaultsMap));
  }
}
