import { ValidationError } from 'express-validator';
import ServerError from '.';

type ErrorCode =
  | 'REQ/IV'
  | 'REQ/NF'
  | 'REQ/RJ_UNAUTHENTICATED'
  | 'REQ/IL_AUTHENTICATED'
  | 'REQ/IV_MIMETYPE'
  | 'REQ/NF_IMG_FILE_EXT'
  | 'REQ/RJ_IMG_MIMETYPE_FILE_EXT_MISMATCH'
  | 'REQ/ER_UNCAUGHT'
  | 'REQ/ER_OTHER';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'REQ/IV': {
    message: 'Invalid request',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'REQ/NF': {
    message: 'Not found',
    httpCode: 404,
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
  'REQ/IV_MIMETYPE': {
    message: 'Unexpected file mimetype',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'REQ/NF_IMG_FILE_EXT': {
    message: 'Uploaded image files must have a extension',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'REQ/RJ_IMG_MIMETYPE_FILE_EXT_MISMATCH': {
    message:
      'Uploaded file does not match expected file extension from the request MIME type.',
    httpCode: 400,
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
