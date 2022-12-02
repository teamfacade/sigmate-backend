import { ActionTypes } from '../Action';
import ServerError from '../errors/ServerError';
import { printStatus } from '../../utils/status';
import RequestError from '../errors/RequestError';

// File sizes
const MB = 1024 * 1024;
const KB = 1024;

// Time
const MILLISECOND = 1000;

/**
 * Format size for logging
 * @param size Size in bytes
 * @returns Formatted size string
 */
const formatSize = (size: number) => {
  if (size < KB) {
    return `${size}B`;
  } else if (size < MB) {
    return `${(size / KB).toFixed(2)}KB`;
  } else {
    return `${(size / MB).toFixed(2)}MB`;
  }
};

/**
 * Format duration for logging
 * @param duration Elapsed time in milliseconds
 * @returns Formatted duration string
 */
const formatDuration = (duration: number): string => {
  if (duration < MILLISECOND) {
    return `${duration}ms`;
  } else {
    return `${(duration / MILLISECOND).toFixed(2)}s`;
  }
};

const formatErrorMessage = (error: unknown) => {
  let fMessage = '';
  if (error instanceof ServerError) {
    if (error.cause) {
      fMessage += `${error.name}: ${error.message}`;
      fMessage += '\n';
      fMessage += formatErrorMessage(error.cause);
    } else {
      fMessage += `${error.stack}`;
    }
  } else if (error instanceof Error) {
    fMessage += `${error.stack}`;
  }
  return fMessage;
};

export const formatMessage = (info: sigmate.Logger.Info) => {
  const {
    level,
    duration,
    server,
    service,
    request,
    action,
    message,
    id,
    error,
  } = info;
  const data: Record<string, any> = {}; // Additional info to stringify

  let fMessage = ''; // Return value
  if (server) {
    // SERVER 'APP' starting...
    fMessage += 'SERVER';
    const { name, status } = server;
    fMessage += ` '${name}' ${printStatus(status, {
      lower: true,
      dots: true,
    })}`;
  } else if (service) {
    // SERVICE 'LOGGER' started (108ms)
    fMessage += 'SERVICE';
    const { name, status } = service;
    fMessage += ` '${name}' ${printStatus(status, {
      lower: true,
      dots: true,
    })}`;
  } else if (request) {
    const { method, endpoint, query, params, response } = request;
    if (!response) {
      // REQUEST GET /auth/google 180B    dd701b16-177b-478a-a8c3-512cf6d7b496
      fMessage += 'REQUEST';
      fMessage += ` ${method} ${endpoint} ${formatSize(request.size || 0)}`;
    } else {
      // RESPONSE 401 /auth/google 362B: USER_NOT_EXIST (300ms)    dd701b16-177b-478a-a8c3-512cf6d7b496
      fMessage += 'RESPONSE';
      const { status } = response;
      fMessage += ` ${status} ${endpoint} ${formatSize(response.size || 0)}`;
      if (status === 500) {
        // Log all the data on unexpected failures
        data.request = { query, params, body: request.body };
        data.response = { status, body: response.body };
      }
    }
  } else if (action) {
    // ACTION 'AUTH_GOOGLE' failed: USER_NOT_EXIST (159ms)    dd701b16-177b-478a-a8c3-512cf6d7b496
    fMessage += 'ACTION';
    const { type, name, status, data: info } = action;
    switch (type) {
      case ActionTypes.DATABASE:
        fMessage += '(DB)';
        break;
      case ActionTypes.HTTP:
        fMessage += '(HTTP)';
        break;
    }

    fMessage += ` '${name}' ${printStatus(status, { lower: true })}`;
    if (info) {
      for (const key in info) {
        data[key] = info[key];
      }
    }
  }

  if (message) {
    if (fMessage) fMessage += ': ';
    fMessage += `${message}`;
  }

  if (duration) {
    fMessage += ` (${formatDuration(duration)})`;
  }

  if (id) {
    fMessage += `    ${id.default}`;
    if (id.user) fMessage += ' u' + id.user.toString();
    if (id.device) fMessage += ' d' + id.device.toString();
  }

  if (error) {
    if (server || service || request || action) {
      fMessage += '\n\t';
    }
    fMessage += formatErrorMessage(error);
    if (level === 'silly' || level === 'debug') {
      if (error instanceof RequestError) {
        if (error.validationErrors) {
          data.validationErrors = error.validationErrors;
        }
        if (error.fields) {
          data.fields = error.fields;
        }
      }
    }
  }

  if (Object.keys(data).length > 0) {
    fMessage += `\n\t${JSON.stringify(data)}`;
  }

  return fMessage;
};

export const padLevels = (level: string, padLength: number) => {
  const length = level.length > 7 ? 7 : level.length;
  return level + ' '.repeat(padLength - length);
};

export const printActionType = (
  type: sigmate.Logger.ActionType | undefined,
  options: { lower?: boolean } = {}
) => {
  let fType = '';
  switch (type) {
    case ActionTypes.SERVICE:
      fType = 'SERVICE';
      break;
    case ActionTypes.DATABASE:
      fType = 'DATABASE';
      break;
    case ActionTypes.HTTP:
      fType = 'HTTP';
      break;
    default:
      return undefined;
  }
  if (options.lower) {
    fType = fType.toLowerCase();
  }
  return fType;
};

export const createDynamoInfo = (
  info: sigmate.Logger.Info
): sigmate.Logger.DynamoInfo => {
  const {
    timestamp: date,
    level,
    message,
    duration,
    id,
    error,
    server,
    service,
    request,
    action,
  } = info;
  const timestamp = date ? new Date(date).getTime() : new Date().getTime();
  let err = '';
  if (error instanceof Error) {
    err += `${error.name}: ${error.message}`;
    if (error instanceof ServerError) {
      if (error.cause instanceof Error) {
        err += ` (${error.cause.name}: ${error.cause.message})`;
      }
    }
  } else {
    err = `UNEXPECTED ERROR TYPE (${typeof error})`;
  }

  return {
    timestamp,
    level,
    message: message || '',
    duration,
    id: id?.default,
    user: `u${id?.user || '-'}d${id?.device || '-'}`,
    err: err || undefined,
    serverName: server?.name,
    serverStatus: printStatus(server?.status),
    serviceName: service?.name,
    serviceStatus: printStatus(service?.status),
    reqMtd: request?.method,
    reqEpt: request?.endpoint,
    reqSize: request?.size,
    reqData: {
      query: request?.query,
      params: request?.params,
      body: request?.body,
    },
    resStatus: request?.response?.status,
    resBody: request?.response?.body,
    resSize: request?.response?.size,
    actType: printActionType(action?.type),
    actName: action?.name,
    actStatus: printStatus(action?.status),
    actTModel: action?.target?.model,
    actTId: action?.target?.id,
    actSModel: action?.source?.model,
    actSId: action?.source?.id,
    actData: action?.data,
  };
};
