import { ErrorCodeMap } from '.';
import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

type AuthErrorCode = 'AUTH/NF' | 'AUTH/IV_UPDATE_DTO';

export const ERROR_CODES_AUTH: ErrorCodeMap<AuthErrorCode> = {
  'AUTH/NF': {
    status: 500,
    level: 'warn',
    message: 'User auth data not found',
  },
  'AUTH/IV_UPDATE_DTO': {
    status: 500,
    level: 'warn',
    message: 'Invalid auth update DTO',
  },
};

export class AuthError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'AuthError',
      serviceName: 'AUTH',
      ...options,
    });
  }
}
