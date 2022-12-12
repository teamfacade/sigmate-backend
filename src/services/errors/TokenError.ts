import { ErrorCodeMap } from '.';
import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

type TokenErrorCode =
  | 'TOKEN/NA_KEY_FILE'
  | 'TOKEN/ER_KEY_READ'
  | 'TOKEN/NA_KEY'
  | 'TOKEN/NA_USER'
  | 'TOKEN/NF_USER'
  | 'TOKEN/NF_USER_AUTH'
  | 'TOKEN/IV_VERIFY_PAYLOAD'
  | 'TOKEN/ER_VERIFY_TYPE'
  | 'TOKEN/ER_VERIFY_IAT'
  | 'TOKEN/IV_TYPE';

export const ERROR_CODES_TOKEN: ErrorCodeMap<TokenErrorCode> = {
  // SERVICE 'TOKEN'
  'TOKEN/NA_KEY_FILE': {
    status: 503,
    level: 'error',
    critical: true,
    message: 'Key file does not exist',
  },
  'TOKEN/ER_KEY_READ': {
    status: 500,
    level: 'error',
    critical: true,
    message: 'Failed to read key from file',
  },
  'TOKEN/NA_KEY': {
    status: 503,
    level: 'error',
    critical: true,
    message: 'Keys are not set. Load keys first',
  },
  'TOKEN/NA_USER': {
    status: 401,
    level: 'debug',
    critical: true,
    message: 'Token method failed (user not set)',
  },
  'TOKEN/NF_USER': {
    status: 401,
    level: 'debug',
    critical: true,
    message: 'Token method failed (user not found)',
  },
  'TOKEN/NF_USER_AUTH': {
    status: 500,
    level: 'warn', // TODO why?
    critical: true,
    message: 'Token method failed (user auth not loaded)',
  },
  'TOKEN/IV_VERIFY_PAYLOAD': {
    status: 401,
    level: 'debug',
    message: 'Token payload is invalid',
  },
  'TOKEN/ER_VERIFY_TYPE': {
    status: 401,
    level: 'debug',
    message: 'Token type different from expectation',
  },
  'TOKEN/ER_VERIFY_IAT': {
    status: 401,
    level: 'debug',
    message: 'Token iat does not match expectation',
  },
  'TOKEN/IV_TYPE': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Invalid token type',
  },
};

export default class TokenError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'TokenError',
      serviceName: 'TOKEN',
      ...options,
    });
  }
}
