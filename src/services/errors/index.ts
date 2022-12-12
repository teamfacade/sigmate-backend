import { ERROR_CODES_ACTION } from './ActionError';
import { ERROR_CODES_AUTH } from './AuthError';
import { ERROR_CODES_DB } from './DatabaseError';
import { ERROR_CODES_GOOGLE } from './GoogleAuthError';
import { ERROR_CODES_LOGGER } from './LoggerError';
import { ERROR_CODES_METAMASK } from './MetamaskAuthError';
import { ERROR_CODES_SERVICE } from './ServiceError';
import { ERROR_CODES_TOKEN } from './TokenError';
import { ERROR_CODES_USER } from './UserError';

type ErrorSource = 'SERVER' | 'SERVICE' | 'REQUEST' | 'ACTION' | 'UNKNOWN';
type AppErrorCode = 'APP/ER_ENV' | 'APP/ER_START';
type MiscErrorCode = 'UNKNOWN/ER_UNHANDLED';

export type ErrorLabel = {
  source: ErrorSource;
  name: string;
};

export type ErrorDefaults = {
  status?: number;
  level?: sigmate.Logger.Level;
  critical?: boolean;
  message?: string;
};

export type ErrorCodeMap<T extends string> = Record<T, ErrorDefaults>;
export type ErrorCode = keyof typeof ERROR_CODES;

/*
{
  ER: 'ERROR',
  CF: 'CONFLICT',
  NA: 'NOT AVAILABLE',
  NF: 'NOT FOUND',
  IV: 'INVALID',
  RJ: 'REJECTED',
}
*/

const ERROR_CODES_APP: ErrorCodeMap<AppErrorCode> = {
  // SERVER 'APP'
  'APP/ER_ENV': {
    status: 500,
    level: 'error',
    critical: true,
    message: 'Environment variables not set',
  },
  'APP/ER_START': {
    status: 500,
    level: 'error',
    critical: true,
    message: 'App server failed to start',
  },
};

const ERROR_CODES_UNKNOWN: ErrorCodeMap<MiscErrorCode> = {
  'UNKNOWN/ER_UNHANDLED': {
    status: 500,
    level: 'error',
    message: 'Unhandled error',
  },
};

export const ERROR_CODES = Object.freeze({
  ...ERROR_CODES_UNKNOWN,
  ...ERROR_CODES_APP,
  ...ERROR_CODES_SERVICE,
  ...ERROR_CODES_ACTION,
  ...ERROR_CODES_DB,
  ...ERROR_CODES_LOGGER,
  ...ERROR_CODES_TOKEN,
  ...ERROR_CODES_USER,
  ...ERROR_CODES_AUTH,
  ...ERROR_CODES_GOOGLE,
  ...ERROR_CODES_METAMASK,
});
