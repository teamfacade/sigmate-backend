import { ErrorCodeMap } from '.';
import ServiceError, { ServiceErrorHelperOptions } from './ServiceError';

export type ActionErrorCode =
  | 'ACTION/ER_TX_START'
  | 'ACTION/ER_TX_COMMIT'
  | 'ACTION/ER_TX_ROLLBACK'
  | 'ACTION/CF_SET_TARGET'
  | 'ACTION/CF_SET_SOURCE'
  | 'ACTION/ER_RUN_FAILED'
  | 'ACTION/RJ_UNAUTHORIZED'
  | 'ACTION/NA_PARENT_ENDED'
  | 'ACTION/NA_ENDED';

export const ERROR_CODES_ACTION: ErrorCodeMap<ActionErrorCode> = {
  'ACTION/ER_TX_START': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Transaction failed to start',
  },
  'ACTION/ER_TX_COMMIT': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Transaction failed to commit',
  },
  'ACTION/ER_TX_ROLLBACK': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Transaction failed to rollback',
  },
  'ACTION/CF_SET_TARGET': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Failed to set target',
  },
  'ACTION/CF_SET_SOURCE': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Failed to set target',
  },
  'ACTION/RJ_UNAUTHORIZED': {
    status: 403,
    level: 'verbose',
    critical: true,
    message: 'Not authorized',
  },
  'ACTION/ER_RUN_FAILED': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Action unexpectedly failed',
  },
  'ACTION/NA_PARENT_ENDED': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Action failed to run due to parent failure',
  },
  'ACTION/NA_ENDED': {
    status: 500,
    level: 'warn',
    critical: true,
    message: 'Failed to run an already ended action',
  },
};

export default class ActionError extends ServiceError {
  constructor(options: ServiceErrorHelperOptions) {
    super({
      name: 'ActionError',
      serviceName: 'ACTION',
      ...options,
    });
  }
}
