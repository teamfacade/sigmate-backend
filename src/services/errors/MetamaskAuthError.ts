import { ErrorCodeMap } from '.';
import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

type MetamaskErrorCode =
  | 'METAMASK/ER_NONCE_GEN'
  | 'METAMASK/IV_DTO'
  | 'METAMASK/ER_VERIFY'
  | 'METAMASK/IV_SIGNATURE';

export const ERROR_CODES_METAMASK: ErrorCodeMap<MetamaskErrorCode> = {
  'METAMASK/ER_NONCE_GEN': {
    status: 500,
    level: 'warn',
    message: 'Metamask random nonce generation failed',
  },
  'METAMASK/IV_DTO': {
    status: 400,
    level: 'warn',
    message: 'Unexpected Metamask authenticate DTO',
  },
  'METAMASK/ER_VERIFY': {
    status: 500,
    level: 'warn',
    message: 'Error while verifying signature',
  },
  'METAMASK/IV_SIGNATURE': {
    status: 401,
    level: 'debug',
    message: 'Invalid signature',
  },
};

export default class MetamaskAuthError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'MetamaskAuthError',
      serviceName: 'AUTH_METAMASK',
      ...options,
    });
  }
}
