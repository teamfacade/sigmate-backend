export type ServerErrorCode = 'SERVER/OTHER';

export type AppServerErrorCode = 'SERVER/APP/ER_CTOR' | 'SERVER/APP/NF_ENV';

export type ServiceErrorCode =
  | 'SERVICE/CF_ALREADY_INIT'
  | 'SERVICE/CF_NOT_INIT'
  | 'SERVICE/IL_CTOR'
  | 'SERVICE/ER_NOT_IMPL'
  | 'SERVICE/UA_NOT_STARTED'
  | 'SERVICE/UA_FAILED'
  | 'SERVICE/UA'
  | 'SERVICE/ER_START'
  | 'SERVICE/ER_CLOSE'
  | 'SERVICE/WR_NF_NODE_ENV'
  | 'SERVICE/IL_GETINST'
  | 'SERVICE/OTHER';

export type AuthErrorCode = 'AUTH/NF_AUTH';

export type CacheErrorCode =
  | 'CACHE/NF_KEYORDER'
  | 'CACHE/NF_KEY'
  | 'CACHE/IV_KEY'
  | 'CACHE/WR_KEY_TYPE';

export type DatabaseErrorCode =
  | 'DB/SEQ/ACCESS_DENIED'
  | 'DB/SEQ/INVALID_CONN'
  | 'DB/SEQ/CONN_TIMEOUT'
  | 'DB/SEQ/CONN'
  | 'DB/SEQ/UNIQUE_CSTR'
  | 'DB/SEQ/VALIDATION'
  | 'DB/SEQ/FK_CSTR'
  | 'DB/SEQ/TIMEOUT'
  | 'DB/SEQ/EMPTY_RESULT'
  | 'DB/SEQ/OTHER';

export type LoggerErrorCode =
  | 'LOGGER/AWS/ER_CLOUDWATCH'
  | 'LOGGER/AWS/ER_DYNAMO'
  | 'LOGGER/NF_TRANSPORT';

export type RestrictionErrorCode = 'RESTRICTION/IV_IP' | 'RESTRICTION/IV_KEY';

export type TokenErrorCode =
  | 'TOKEN/NF_PUBLIC_KEY'
  | 'TOKEN/NF_SECRET_KEY'
  | 'TOKEN/IV_TYPE'
  | 'TOKEN/IV_DVC_TOK_DTO'
  | 'TOKEN/RJ_UID'
  | 'TOKEN/NF_AUTH'
  | 'TOKEN/RJ_VERIFY';

export type GoogleAuthErrorCode =
  | 'GOOGLE/NF_CODE'
  | 'GOOGLE/ER_TOKEN_FETCH'
  | 'GOOGLE/NF_ACCESS_TOKEN'
  | 'GOOGLE/ER_PROFILE_FETCH'
  | 'GOOGLE/IV_PROFILE';

export type AccountErrorCode = 'ACCOUNT/IV_CREATE_DTO';

export type ActionErrorCode =
  | 'ACTION/UA_DB'
  | 'ACTION/ER_TX_START'
  | 'ACTION/ER_TX_COMMIT'
  | 'ACTION/ER_TX_ROLLBACK'
  | 'ACTION/CF_TX_NF'
  | 'ACTION/IL_ALREDY_FIN'
  | 'ACTION/CF_TARGET_ID'
  | 'ACTION/CF_SOURCE_ID'
  | 'ACTION/NF_MODEL_ID'
  | 'ACTION/ER_OTHER';

export type AllErrorCode =
  | ServerErrorCode
  | AppServerErrorCode
  | ServiceErrorCode
  | AuthErrorCode
  | CacheErrorCode
  | DatabaseErrorCode
  | LoggerErrorCode
  | RestrictionErrorCode
  | TokenErrorCode
  | ActionErrorCode
  | GoogleAuthErrorCode
  | AccountErrorCode;

type ErrorDefaultsMap<Code> = sigmate.Error.ErrorDefaultsMap<Code>;

const ACTION_EDM: ErrorDefaultsMap<ActionErrorCode> = {
  'ACTION/UA_DB': {
    message: 'Database unavailable',
    httpCode: 503,
  },
  'ACTION/ER_TX_START': {
    message: 'Managed transaction error. Failed to start',
  },
  'ACTION/ER_TX_COMMIT': {
    message: 'Managed transaction error. Failed to commit',
  },
  'ACTION/ER_TX_ROLLBACK': {
    message: 'Managed transaction error. Failed to rollback',
  },
  'ACTION/CF_TX_NF': {
    message: 'Managed transaction error. Transaction undefined',
  },
  'ACTION/IL_ALREDY_FIN': {
    message: 'Cannot run actions that are already finished',
  },
  'ACTION/CF_TARGET_ID': {
    message:
      'Cannot set target primary key of unknown model. Set target.model first',
  },
  'ACTION/CF_SOURCE_ID': {
    message:
      'Cannot set source primary key of unknown model. Set target.model first',
  },
  'ACTION/NF_MODEL_ID': {
    message:
      'Cannot find id attribute on given model. Make sure to include the id(primary key) attribute in your model scope',
  },
  'ACTION/ER_OTHER': {
    message: 'Unexpected error while executing action',
  },
};

const APP_SERVER_EDM: ErrorDefaultsMap<AppServerErrorCode> = {
  'SERVER/APP/ER_CTOR': {
    message: 'Unexpected error in AppServer constructor',
  },
  'SERVER/APP/NF_ENV': {
    message: 'Required environment variables not set',
  },
};

const AUTH_EDM: ErrorDefaultsMap<AuthErrorCode> = {
  'AUTH/NF_AUTH': {
    httpCode: 401,
    logLevel: 'error',
    message: 'Auth not found',
  },
};

const CACHE_EDM: ErrorDefaultsMap<CacheErrorCode> = {
  'CACHE/NF_KEY': {
    message: 'Key is required',
  },
  'CACHE/IV_KEY': {
    message: 'Key must be a string, an array of strings or an object',
  },
  'CACHE/NF_KEYORDER': {
    message: 'Composite key was given, but key order not specified',
  },
  'CACHE/WR_KEY_TYPE': {
    logLevel: 'warn',
    critical: false,
    message:
      'Some attributes of the supplied key was not used to assemble the final key',
  },
};

const DATABASE_EDM: ErrorDefaultsMap<DatabaseErrorCode> = {
  'DB/SEQ/ACCESS_DENIED': {
    httpCode: 403,
    message: 'Database connection access denied',
    critical: true,
  },
  'DB/SEQ/INVALID_CONN': {
    message: 'Database connection invalid',
    critical: true,
  },
  'DB/SEQ/CONN_TIMEOUT': {
    logLevel: 'warn',
    httpCode: 408,
    message: 'Database connection timed out',
  },
  // Connection failed due to other reasons:
  // ConnectionAcquireTimeOut, ConnectionRefused, HostNotFound, HostNotReachable
  'DB/SEQ/CONN': {
    logLevel: 'warn',
    httpCode: 503,
    message: 'Database connection failed',
    critical: true,
  },
  'DB/SEQ/UNIQUE_CSTR': {
    logLevel: 'debug',
    httpCode: 409,
    message: 'SQL Unique constraint violation',
  },
  'DB/SEQ/VALIDATION': {
    logLevel: 'debug',
    httpCode: 400,
    message: 'Invalid value',
  },
  'DB/SEQ/FK_CSTR': {
    logLevel: 'debug',
    httpCode: 409,
    message: 'SQL Foreign key constraint violation',
  },
  'DB/SEQ/TIMEOUT': {
    logLevel: 'warn',
    httpCode: 408,
    message: 'Database timed out',
  },
  'DB/SEQ/EMPTY_RESULT': {
    logLevel: 'debug',
    httpCode: 404,
    message: 'Query result empty',
  },
  'DB/SEQ/OTHER': {
    message: 'Unexpected error',
  },
};

const LOGGER_EDM: ErrorDefaultsMap<LoggerErrorCode> = {
  'LOGGER/AWS/ER_CLOUDWATCH': {
    message: 'AWS CloudWatchLogs error',
  },
  'LOGGER/AWS/ER_DYNAMO': {
    message: 'AWS DynamoDB error',
  },
  'LOGGER/NF_TRANSPORT': {
    message: 'A logger must enable at least 1 transport',
  },
};

const RESTRICTION_EDM: ErrorDefaultsMap<RestrictionErrorCode> = {
  'RESTRICTION/IV_IP': {
    logLevel: 'warn',
    message: 'Invalid IP address',
  },
  'RESTRICTION/IV_KEY': {
    logLevel: 'warn',
    message: 'Invalid restriction key',
  },
};

const SERVICE_EDM: ErrorDefaultsMap<ServiceErrorCode> = {
  'SERVICE/CF_NOT_INIT': {
    message: 'Service is not instantiated. Call setInstance() first',
  },
  'SERVICE/CF_ALREADY_INIT': {
    message: 'Service is already instantiated. Use getInstace() instead',
  },
  'SERVICE/IL_CTOR': {
    message:
      'Do not call the service constructor directly. Use getInstance() instead',
  },
  'SERVICE/ER_NOT_IMPL': {
    message: 'getInstance() is not implemented for this service',
  },
  'SERVICE/UA_NOT_STARTED': {
    message: 'Service not started. Start service first',
  },
  'SERVICE/UA_FAILED': {
    logLevel: 'error',
    message: 'Service has failed',
    httpCode: 503,
    critical: true,
  },
  'SERVICE/UA': {
    logLevel: 'warn',
    message: 'Service is not available',
    httpCode: 503,
  },
  'SERVICE/ER_START': {
    message: 'Service failed to start',
  },
  'SERVICE/ER_CLOSE': {
    message: 'Service failed to close',
  },
  'SERVICE/WR_NF_NODE_ENV': {
    logLevel: 'debug',
    message: 'NODE_ENV not set -- assuming "development"',
  },
  'SERVICE/IL_GETINST': {
    message: 'Service not singleton. Use the constructor directly',
  },
  'SERVICE/OTHER': {},
};

const SERVER_EDM: ErrorDefaultsMap<ServerErrorCode> = {
  'SERVER/OTHER': {
    message: 'Unexpected server error',
  },
};

const TOKEN_EDM: ErrorDefaultsMap<TokenErrorCode> = {
  'TOKEN/IV_TYPE': {
    message: 'Invalid token type',
  },
  'TOKEN/NF_PUBLIC_KEY': {
    message: 'Public key not found',
  },
  'TOKEN/NF_SECRET_KEY': {
    message: 'Secret key not found',
  },
  'TOKEN/IV_DVC_TOK_DTO': {
    message: 'Attributes iat and uaText are required',
  },
  'TOKEN/NF_AUTH': {
    httpCode: 401,
    logLevel: 'verbose',
    message: 'Auth not found',
  },
  'TOKEN/RJ_UID': {
    httpCode: 401,
    logLevel: 'verbose',
    message: 'User.id not found',
  },
  'TOKEN/RJ_VERIFY': {
    httpCode: 401,
    logLevel: 'verbose',
    message: 'Token verification failed.',
  },
};

const GOOGLE_EDM: ErrorDefaultsMap<GoogleAuthErrorCode> = {
  'GOOGLE/NF_CODE': {
    httpCode: 401,
    logLevel: 'verbose',
    message: 'Google OAuth code not found',
  },
  'GOOGLE/ER_TOKEN_FETCH': {
    httpCode: 503,
    logLevel: 'warn',
    message: 'Google OAuth not available',
  },
  'GOOGLE/NF_ACCESS_TOKEN': {
    httpCode: 500,
    logLevel: 'error',
    message: 'Google access token not found',
  },
  'GOOGLE/ER_PROFILE_FETCH': {
    httpCode: 503,
    logLevel: 'warn',
    message: 'Google profile fetch failed',
  },
  'GOOGLE/IV_PROFILE': {
    httpCode: 500,
    logLevel: 'error',
    message: 'Google profile missing key attributes',
  },
};

const ACCOUNT_EDM: ErrorDefaultsMap<AccountErrorCode> = {
  'ACCOUNT/IV_CREATE_DTO': {
    message: 'Invalid account creation data',
  },
};

export const ERROR_DEFAULTS_MAP = {
  ...ACTION_EDM,
  ...APP_SERVER_EDM,
  ...AUTH_EDM,
  ...CACHE_EDM,
  ...DATABASE_EDM,
  ...LOGGER_EDM,
  ...RESTRICTION_EDM,
  ...SERVICE_EDM,
  ...SERVER_EDM,
  ...TOKEN_EDM,
  ...GOOGLE_EDM,
  ...ACCOUNT_EDM,
};
