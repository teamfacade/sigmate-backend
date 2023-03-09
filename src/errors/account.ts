import ServerError from '.';

type ErrorCode = 'ACCOUNT/IV_CREATE_DTO';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'ACCOUNT/IV_CREATE_DTO': {
    message: 'Invalid creation DTO',
  },
};

export default class AccountError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('AccountError', options, defaultsMap));
  }
}
