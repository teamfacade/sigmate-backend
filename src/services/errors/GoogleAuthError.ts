import { ErrorCodeMap } from '.';
import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

type GoogleErrorCode =
  | 'GOOGLE/ER_TOKEN'
  | 'GOOGLE/IV_DTO'
  | 'GOOGLE/IV_TOKEN'
  | 'GOOGLE/IV_PROFILE';

export const ERROR_CODES_GOOGLE: ErrorCodeMap<GoogleErrorCode> = {
  'GOOGLE/ER_TOKEN': {
    status: 503,
    level: 'warn',
    message: 'Google OAuth request failed',
  },
  'GOOGLE/IV_DTO': {
    status: 400,
    level: 'warn',
    message: 'Google OAuth code missing',
  },
  'GOOGLE/IV_TOKEN': {
    status: 500,
    level: 'warn',
    message: 'Unexpected Google OAuth token response',
  },
  'GOOGLE/IV_PROFILE': {
    status: 500,
    level: 'warn',
    message: 'Unexpected Google OAuth People API response',
  },
};

export class GoogleAuthError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'GoogleAuthError',
      serviceName: 'AUTH_GOOGLE',
      ...options,
    });
  }
}
