import { RequestHandler } from 'express';
import ServerError from '../errors';
import RequestError from '../errors/request';

type RequestErrorGuardOptions = {
  secure?: boolean;
};

const __CatchRequestError = (options: RequestErrorGuardOptions = {}) => {
  const { secure } = options;
  return (target: any, key: string, desc?: PropertyDescriptor) => {
    const method = desc?.value || target[key];
    const wrapped: RequestHandler = async function (req, res, next) {
      try {
        const result = method(req, res, next);
        if (result instanceof Promise) return await result;
        else return result;
      } catch (error) {
        let err: unknown;
        if (error instanceof ServerError) {
          if (secure) error.secure = secure;
          err = error;
        } else if (error instanceof Error) {
          err = new RequestError({
            code: 'REQ/ER_UNCAUGHT',
            error,
            secure: true,
          });
        }
        next(err);
      }
    };
    desc?.value ? (desc.value = wrapped) : (target[key] = wrapped);
  };
};

/**
 * A decorator that wraps an Express controller in a try-catch block to
 * pass over a thrown error to a error handler middleware
 * @param options Options for error handling. Set `secure` to true to turn on `secure` flags for ServerErrors (see `ServerError.secure`)
 */
export function CatchRequestError(
  options: RequestErrorGuardOptions
): void | any;
/**
 * A decorator that wraps an Express controller in a try-catch block to
 * pass over a thrown error to a error handler middleware
 */
export function CatchRequestError(
  target: any,
  key: string,
  desc?: PropertyDescriptor
): void | any;
/**
 * A decorator that wraps an Express controller in a try-catch block to
 * pass over a thrown error to a error handler middleware
 */
export function CatchRequestError(...args: any[]): void | any {
  if (args.length >= 2) {
    __CatchRequestError()(args[0], args[1], args[2]);
    return;
  }
  return (target: any, key: string, desc?: PropertyDescriptor) => {
    __CatchRequestError(args[0])(target, key, desc);
  };
}
