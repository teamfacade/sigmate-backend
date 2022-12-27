type ErrorCodeMap<T extends string> = sigmate.Error.ErrorCodeMap<T>;

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

export const ERROR_CODES_APP: ErrorCodeMap<sigmate.Error.AppErrorCode> = {
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

export const ERROR_CODES_UNKNOWN: ErrorCodeMap<sigmate.Error.MiscErrorCode> = {
  'UNKNOWN/ER_UNHANDLED': {
    status: 500,
    level: 'error',
    message: 'Unhandled error',
  },
};

export const ERROR_CODES_SERVICE: ErrorCodeMap<sigmate.Error.ServiceErrorCode> =
  {
    'SERVICE/INIT_BEFORE_START': {
      status: 500,
      level: 'warn',
      critical: true,
      message: 'Service initialized before being started',
    },
    'SERVICE/INIT_AFTER_FAIL': {
      status: 500,
      level: 'warn',
      critical: true,
      message: 'Service initialized after failure',
    },
    'SERVICE/NA_CLOSED': {
      status: 500,
      level: 'warn',
      critical: true,
      message: 'Service is not available (closed)',
    },
    'SERVICE/NA_FAILED': {
      status: 500,
      level: 'warn',
      critical: true,
      message: 'Service is not available (failed)',
    },
    'SERVICE/ER_CLOSE': {
      status: 500,
      level: 'warn',
      critical: false,
      message: 'Error encountered during service close',
    },
  };

export const ERROR_CODES_ACTION: ErrorCodeMap<sigmate.Error.ActionErrorCode> = {
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

export const ERROR_CODES_AUTH: ErrorCodeMap<sigmate.Error.AuthErrorCode> = {
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
  'AUTH/NF_USER_GROUP': {
    status: 401,
    level: 'verbose',
    message: 'User group not found',
  },
  'AUTH/NA_USER_GROUP': {
    status: 500,
    level: 'warn',
    message: 'User group not loaded',
  },
  'AUTH/NA_GROUP_PRIV': {
    status: 500,
    level: 'warn',
    message: 'Group privileges not loaded',
  },
  'AUTH/RJ_GROUP_UNAUTHORIZED': {
    status: 403,
    level: 'verbose',
    message: 'Group does not have required privileges',
  },
  'AUTH/RJ_USER_UNAUTHORIZED': {
    status: 403,
    level: 'verbose',
    message: 'User does not have required privileges',
  },
};

export const ERROR_CODES_DB: ErrorCodeMap<sigmate.Error.DatabaseErrorCode> = {
  // SERVICE 'DB'
  'DB/ER_CONN': {
    status: 503,
    level: 'error',
    message: 'DB connection failed',
  },
  'DB/ER_ADD_MODELS': {
    status: 500,
    level: 'error',
    message: 'Failed to import and add models',
  },
  'DB/ER_TEST_ATTEMPT': {
    status: 500,
    level: 'warn',
    message: 'Test attempt failed',
  },
  'DB/ER_TEST': {
    status: 503,
    level: 'error',
    message: 'DB test failed. DB is not available',
  },
  'DB/ER_RUN': {
    level: 'debug',
    message: 'DB run failed',
  },
  'DB/ER_TX_START': {
    status: 500,
    level: 'warn',
    message: 'DB transaction start failed',
  },
  'DB/ER_TX_COMMIT': {
    status: 500,
    level: 'warn',
    message: 'DB transaction commit failed',
  },
  'DB/ER_TX_ROLLBACK': {
    status: 500,
    level: 'warn',
    message: 'DB transaction rollback failed',
  },
  'DB/ER_CLOSE': {
    status: 500,
    level: 'warn',
    critical: false,
    message: 'DB connection close failed',
  },
  'DB/NA_CLOSED': {
    status: 503,
    level: 'debug',
    message: 'DB service unavailable (closed)',
  },
  'DB/NA_FAILED': {
    status: 503,
    level: 'debug',
    message: 'DB service unavailable (failed)',
  },
};

export const ERROR_CODES_GOOGLE: ErrorCodeMap<sigmate.Error.GoogleErrorCode> = {
  'GOOGLE/NA_AUTH_URL': {
    status: 503,
    level: 'warn',
    message: 'Google OAuth url not available.',
  },
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

export const ERROR_CODES_LOGGER: ErrorCodeMap<sigmate.Error.LoggerErrorCode> = {
  // SERVICE 'LOGGER'
  'LOGGER/ER_INIT_AWS_CLOUDWATCH': {
    status: 503,
    level: 'error',
    critical: false,
    message: 'AWS CloudWatchLogs client initialization failed',
  },
  'LOGGER/ER_INIT_AWS_DYNAMO': {
    status: 503,
    level: 'error',
    critical: false,
    message: 'AWS DynamoDB client initialization failed',
  },
  'LOGGER/ER_INIT_NO_TRANSPORT': {
    status: 500,
    level: 'error',
    critical: true, // Fail server
    message: 'No transport specified',
  },
};

export const ERROR_CODES_METAMASK: ErrorCodeMap<sigmate.Error.MetamaskErrorCode> =
  {
    'METAMASK/ER_NONCE_GEN': {
      status: 500,
      level: 'warn',
      message: 'Metamask random nonce generation failed',
    },
    'METAMASK/NF_NONCE': {
      status: 409,
      level: 'verbose',
      message: 'Metamask nonce has not been generated for this user.',
    },
    'METAMASK/NF_NONCE_GEN_AT': {
      status: 500,
      level: 'warn',
      message: 'Metamask nonce generated time not present',
    },
    'METAMASK/RJ_NONCE_EXPIRED': {
      status: 403,
      level: 'verbose',
      message:
        'Metamask nonce has expired. Nonce must be verified within 5 minutes of generation.',
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

export const ERROR_CODES_TOKEN: ErrorCodeMap<sigmate.Error.TokenErrorCode> = {
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

export const ERROR_CODES_USER: ErrorCodeMap<sigmate.Error.UserErrorCode> = {
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

export const ERROR_CODES_MISSION: ErrorCodeMap<sigmate.Error.MissionErrorCode> =
  {
    'MISSION/NF': {
      status: 404,
      level: 'warn',
      message: 'Mission not found',
    },
    'MISSION/IV_FIND_DTO': {
      status: 500,
      level: 'warn',
      message: 'Invalid mission find DTO',
    },
    'MISSION/NA_METRIC': {
      status: 500,
      level: 'warn',
      message: 'Action metric undefined',
    },
    'MISSION/NA_USER_MISSION': {
      status: 500,
      level: 'warn',
      message: 'UserMission entry not found',
    },
    'MISSION/RJ_PROGRESS_METRIC_THRESHOLD': {
      status: 409,
      level: 'verbose',
      message: 'Mission progres rejected (metric below threshold)',
    },
    'MISSION/RJ_PROGRESS_CLOSED': {
      status: 409,
      level: 'verbose',
      message: 'Mission progress rejected (already closed)',
    },
    'MISSION/RJ_PROGRESS_BEFORE_REPEATABLE': {
      status: 409,
      level: 'verbose',
      message: 'Cannot retry this mission yet',
    },
    'MISSION/CF_END_NOT_CLOSED': {
      status: 409,
      level: 'warn',
      message: 'Tried to call endClosed() on a mission that is not closed yet',
    },
  };
