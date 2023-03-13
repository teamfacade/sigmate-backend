import ServerError from '..';

type ErrorCode =
  | 'AUTH/METAMASK/NF_NONCE'
  | 'AUTH/METAMASK/NF_WALLET'
  | 'AUTH/METAMASK/NF_USER'
  | 'AUTH/METAMASK/RJ_NONCE_EXP'
  | 'AUTH/METAMASK/RJ_INVALID_SIGNATURE';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'AUTH/METAMASK/NF_WALLET': {
    message: 'Metamask wallet address not provided',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'AUTH/METAMASK/NF_NONCE': {
    message: 'Metamask nonce not generated',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'AUTH/METAMASK/NF_USER': {
    message: 'User with the provided Metamask wallet address not found',
    httpCode: 404,
    logLevel: 'verbose',
  },
  'AUTH/METAMASK/RJ_NONCE_EXP': {
    message: 'Metamask nonce expired',
    httpCode: 401,
    logLevel: 'verbose',
  },
  'AUTH/METAMASK/RJ_INVALID_SIGNATURE': {
    message: 'Metamask signature invalid',
    httpCode: 401,
    logLevel: 'verbose',
  },
};

export default class MetamaskAuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('MetamaskAuthError', options, defaultsMap));
  }
}
