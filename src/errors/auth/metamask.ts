import ServerError from '..';

type ErrorCode =
  | 'AUTH/METAMASK/NF_NONCE'
  | 'AUTH/METAMASK/NF_WALLET'
  | 'AUTH/METAMASK/NF_USER'
  | 'AUTH/METAMASK/RJ_NONCE_EXP'
  | 'AUTH/METAMASK/RJ_INVALID_SIGNATURE'
  | 'AUTH/METAMASK/CF_WALLET_NOT_MINE'
  | 'AUTH/METAMASK/CF_WALLET_ALREADY_MINE'
  | 'AUTH/METAMASK/RJ_ADDRESS_MISMATCH'
  | 'AUTH/METAMASK/CF_NOT_CONNECTED'
  | 'AUTH/METAMASK/RJ_CHANGE_INTERVAL';

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
  'AUTH/METAMASK/CF_WALLET_NOT_MINE': {
    message: 'Provided wallet address is registered to another user',
    httpCode: 409,
    logLevel: 'verbose',
  },
  'AUTH/METAMASK/CF_WALLET_ALREADY_MINE': {
    message: 'Provided wallet address is already connected to my account',
    httpCode: 409,
    logLevel: 'verbose',
  },
  'AUTH/METAMASK/RJ_ADDRESS_MISMATCH': {
    message: 'Provided wallet address does not match the expected value',
    httpCode: 401,
    logLevel: 'warn',
  },
  'AUTH/METAMASK/CF_NOT_CONNECTED': {
    message: 'Metamask wallet not connected',
    httpCode: 409,
    logLevel: 'verbose',
  },
  'AUTH/METAMASK/RJ_CHANGE_INTERVAL': {
    message: 'Cannot change connected Metamask wallets too often',
    httpCode: 403,
    logLevel: 'verbose',
  },
};

export default class MetamaskAuthError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('MetamaskAuthError', options, defaultsMap));
  }
}
