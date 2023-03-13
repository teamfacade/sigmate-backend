import ServerError from '.';

export type AccountErrorCode =
  | 'ACCOUNT/NF_AUTH'
  | 'ACCOUNT/IV_CREATE_DTO'
  | 'ACCOUNT/IV_USERNAME_EMPTY'
  | 'ACCOUNT/IV_USERNAME_TOO_SHORT'
  | 'ACCOUNT/IV_USERNAME_TOO_LONG'
  | 'ACCOUNT/IV_USERNAME_ILLEGAL_CHARS'
  | 'ACCOUNT/IV_USERNAME_ILLEGAL_WORDS'
  | 'ACCOUNT/IV_USERNAME_CONSEC_SPECIAL_CHARS'
  | 'ACCOUNT/IV_USERNAME_BEGINS_OR_ENDS_WITH_SPECIAL_CHARS'
  | 'ACCOUNT/RJ_UNAUTHENTICATED'
  | 'ACCOUNT/RJ_USERNAME_CHANGE_INTERVAL'
  | 'ACCOUNT/CF_CONNECT_GOOGLE_ALREADY_EXISTS'
  | 'ACCOUNT/IV_USERNAME_TAKEN';

const defaultsMap: sigmate.Error.DefaultsMap<AccountErrorCode> = {
  'ACCOUNT/NF_AUTH': {
    message: 'Auth not found',
  },
  'ACCOUNT/IV_CREATE_DTO': {
    message: 'Invalid creation DTO',
  },
  'ACCOUNT/IV_USERNAME_EMPTY': {
    message: 'Username policy violation: Username cannot be empty',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/IV_USERNAME_TOO_SHORT': {
    message: 'Username policy violation: Username is too short',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/IV_USERNAME_TOO_LONG': {
    message: 'Username policy violation: Username is too long',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/IV_USERNAME_ILLEGAL_CHARS': {
    message: 'Username policy violation: Username contains illegal characters',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/IV_USERNAME_ILLEGAL_WORDS': {
    message: 'Username policy violation: Username contains illegal words',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/IV_USERNAME_CONSEC_SPECIAL_CHARS': {
    message:
      'Username policy violation: Special characters cannot appear in a row',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/IV_USERNAME_BEGINS_OR_ENDS_WITH_SPECIAL_CHARS': {
    message:
      'Username policy violation: Usernames cannot begin or end with a special character',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/IV_USERNAME_TAKEN': {
    message: 'Username already taken',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'ACCOUNT/RJ_UNAUTHENTICATED': {
    message: 'Account unauthenticated',
    httpCode: 401,
    logLevel: 'verbose',
  },
  'ACCOUNT/RJ_USERNAME_CHANGE_INTERVAL': {
    message: 'Cannot change username too often',
    httpCode: 403,
    logLevel: 'verbose',
  },
  'ACCOUNT/CF_CONNECT_GOOGLE_ALREADY_EXISTS': {
    message: 'This google account is already connected to another account',
    httpCode: 409,
    logLevel: 'verbose',
  },
};

export default class AccountError extends ServerError<AccountErrorCode> {
  constructor(options: sigmate.Error.Options<AccountErrorCode>) {
    super(ServerError.parseOptions('AccountError', options, defaultsMap));
  }
}
