import { ValidationError } from 'express-validator';
import ServerError from '.';

type ErrorCode =
  | 'REQ/IV'
  | 'REQ/ER_UNCAUGHT'
  | 'REQ/ER_OTHER'
  | 'REQ/RJ_UNAUTHENTICATED'
  | 'REQ/IL_AUTHENTICATED';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'REQ/IV': {
    message: 'Invalid request',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'REQ/RJ_UNAUTHENTICATED': {
    message: 'Unauthenticated',
    httpCode: 401,
    logLevel: 'verbose',
  },
  'REQ/IL_AUTHENTICATED': {
    message: 'Already logged in.',
    httpCode: 403,
    logLevel: 'verbose',
  },
  'REQ/ER_UNCAUGHT': {
    message: 'Uncaught error from request',
    httpCode: 500,
    logLevel: 'warn',
    secure: true,
  },
  'REQ/ER_OTHER': {
    message: 'Unexpected internal server error',
    logLevel: 'verbose',
    secure: true,
  },
};

export default class RequestError extends ServerError<ErrorCode> {
  validationErrors?: ValidationError[];

  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('RequestError', options, defaultsMap));
  }
}
