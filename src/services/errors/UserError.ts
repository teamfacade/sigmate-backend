import { ErrorCodeMap } from '.';
import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

type UserErrorCode =
  | 'USER/NF'
  | 'USER/NF_AUTH'
  | 'USER/IV_CREATE_DTO'
  | 'USER/IV_UPDATE_AUTH_DTO'
  | 'USER/RJ_UNAME_TAKEN'
  | 'USER/NF_REF_CODE'
  | 'USER/RJ_REF_CODE_SET';

export const ERROR_CODES_USER: ErrorCodeMap<UserErrorCode> = {
  'USER/NF': {
    status: 401,
    level: 'debug',
    message: 'User not found/set',
  },
  'USER/NF_AUTH': {
    status: 500,
    level: 'warn',
    message: 'User auth data not found',
  },
  'USER/IV_CREATE_DTO': {
    status: 500,
    level: 'warn',
    message: 'User create DTO is invalid',
  },
  'USER/IV_UPDATE_AUTH_DTO': {
    status: 500,
    level: 'warn',
    message: 'Update user auth DTO is invalid',
  },
  'USER/RJ_UNAME_TAKEN': {
    status: 422,
    level: 'debug',
    message: 'Username already taken',
  },
  'USER/NF_REF_CODE': {
    status: 409,
    level: 'debug',
    message: 'Referral code not found',
  },
  'USER/RJ_REF_CODE_SET': {
    status: 422,
    level: 'debug',
    message: 'Referral code already set',
  },
};

export default class UserError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'UserError',
      serviceName: 'USER',
      ...options,
    });
  }
}
