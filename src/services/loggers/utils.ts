import { ActionTypes } from '../Action';
import ServerError from '../errors/ServerError';
import { printStatus } from '../status';

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

export const formatMessage = (info: sigmate.Logger.Info) => {
  const {
    duration,
    server,
    service,
    request,
    response,
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
    const { method, endpoint, query, params } = request;
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
    const { type, name, status, info } = action;
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
    if (server || service || request || action || response) {
      fMessage += '\n\t';
    }

    if (error instanceof ServerError) {
      fMessage += `${error.name}: ${error.message}`;
      if (error.cause) {
        if (error.cause instanceof Error) {
          fMessage += `\n\t${error.cause.stack}`;
        } else {
          fMessage += `\n\t${error.cause.toString()}`;
        }
      }
    } else if (error instanceof Error) {
      fMessage += `\n\t${error.stack}`;
    }
  }

  if (Object.keys(data).length > 0) {
    fMessage += `\n\t${JSON.stringify(data)}`;
  }

  return fMessage;
};
